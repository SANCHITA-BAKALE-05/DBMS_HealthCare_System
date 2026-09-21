// ============================================================
// mlController.js
//
// PURPOSE:
//   This file is a "proxy" — it sits between the React
//   frontend and the Python ML service, forwarding requests
//   and returning responses.
//
// WHY A PROXY INSTEAD OF CALLING PYTHON DIRECTLY?
//   The React frontend cannot call the Python service directly
//   because:
//     1. The Python ML service is not exposed to the internet.
//     2. Authentication (JWT checking) only happens in Node.
//     3. The frontend only needs to know one backend URL.
//
// CALL CHAIN:
//   Patient fills form in browser
//       ↓
//   React sends POST to /api/ml/diabetes  (Node backend)
//       ↓   (this file forwards it)
//   Python Flask at http://localhost:5001/predict/diabetes
//       ↓   (Python loads the .pkl model and computes)
//   Probability score returned to Node
//       ↓
//   Node returns it to the React frontend
//       ↓
//   Frontend displays the risk bar chart
//
// The 4 models supported:
//   diabetes       — CalibratedClassifierCV (no scaler needed)
//   hypertension   — LogisticRegression + StandardScaler
//   cardiovascular — RandomForest + StandardScaler
//   obesity        — sklearn Pipeline (handles its own scaling)
// ============================================================

const axios = require('axios');

// Read the Python service URL from the .env file.
// Falls back to localhost:5001 if the env variable is missing.
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5001';

// ============================================================
// Helper function: callMLService
//
// Sends an HTTP POST request to the Python Flask service
// and returns the parsed JSON response.
//
// timeout: 15000 ms (15 seconds) — ML predictions can be slow
// if the Python server is cold-starting on a free hosting tier.
// ============================================================
const callMLService = async (endpoint, body) => {
  const response = await axios.post(`${ML_SERVICE_URL}${endpoint}`, body, {
    timeout: 15000,
    headers: { 'Content-Type': 'application/json' }
  });
  return response.data;
};

// ============================================================
// POST /api/ml/diabetes
//
// Estimates a patient's risk of having diabetes.
//
// Required fields in request body:
//   Age   — patient's age in years (e.g. 45)
//   Sex   — 0 for Female, 1 for Male
//   BMI   — Body Mass Index (weight in kg / height in m²)
//   HighBP — does the patient have high blood pressure? 0 or 1
//
// The diabetes model was trained on these 4 features only,
// so no scaler (StandardScaler) is needed — the model
// uses raw values directly.
//
// Response includes:
//   estimated_percentage — risk as a % (e.g. 23.5)
//   risk_level           — "Low", "Moderate", or "High"
//   disclaimer           — text reminding this is not a diagnosis
// ============================================================
const predictDiabetes = async (req, res) => {
  try {
    const { Age, Sex, BMI, HighBP } = req.body;

    // Validate that all 4 required fields are present
    if (Age === undefined || Sex === undefined || BMI === undefined || HighBP === undefined) {
      return res.status(400).json({
        status:  'error',
        message: 'Required fields: Age (number), Sex (0=female/1=male), BMI (number), HighBP (0 or 1).'
      });
    }

    // Forward to Python and pass the result straight back to the frontend
    const result = await callMLService('/predict/diabetes', { Age, Sex, BMI, HighBP });
    return res.status(200).json({ status: 'success', data: result });

  } catch (error) {
    console.error('predictDiabetes error:', error.message);
    // ECONNREFUSED = Python service is not running
    // ETIMEDOUT    = Python service took too long to respond
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      return res.status(503).json({
        status:  'error',
        message: 'ML service is currently unavailable. Please try again later.'
      });
    }
    return res.status(500).json({ status: 'error', message: 'Prediction failed.' });
  }
};

// ============================================================
// POST /api/ml/hypertension
//
// Estimates risk of developing hypertension (high blood pressure)
// using cardiovascular risk factors from the Framingham dataset.
//
// Required fields: male, age, currentSmoker, cigsPerDay, BPMeds,
//   diabetes, totChol, sysBP, diaBP, BMI, heartRate, glucose
//
// The Python service applies hypertension_scaler.pkl to
// normalise the values before passing them to the model.
// We just forward the raw numbers — scaling happens in Python.
// ============================================================
const predictHypertension = async (req, res) => {
  try {
    // req.body already contains all the fields from the form —
    // we pass the whole body directly to Python
    const result = await callMLService('/predict/hypertension', req.body);
    return res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    console.error('predictHypertension error:', error.message);
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      return res.status(503).json({ status: 'error', message: 'ML service is currently unavailable.' });
    }
    // If Python returned a 400 error (bad input), forward the message
    if (error.response && error.response.data) {
      return res.status(400).json({
        status:  'error',
        message: error.response.data.error || 'Prediction failed.'
      });
    }
    return res.status(500).json({ status: 'error', message: 'Prediction failed.' });
  }
};

// ============================================================
// POST /api/ml/cardiovascular
//
// Estimates risk of cardiovascular disease using clinical
// indicators from the Cleveland Heart Disease dataset.
//
// Required fields: age, sex, cp (chest pain type 0-3),
//   trestbps (resting blood pressure), chol (cholesterol),
//   fbs (fasting blood sugar > 120 mg/dl?), restecg,
//   thalach (max heart rate achieved), exang (exercise angina),
//   oldpeak (ST depression), slope, ca (vessels coloured),
//   thal (3=normal, 6=fixed defect, 7=reversable defect)
//
// cardiovascular_scaler.pkl is applied by the Python service.
// ============================================================
const predictCardiovascular = async (req, res) => {
  try {
    const result = await callMLService('/predict/cardiovascular', req.body);
    return res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    console.error('predictCardiovascular error:', error.message);
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      return res.status(503).json({ status: 'error', message: 'ML service is currently unavailable.' });
    }
    if (error.response && error.response.data) {
      return res.status(400).json({
        status:  'error',
        message: error.response.data.error || 'Prediction failed.'
      });
    }
    return res.status(500).json({ status: 'error', message: 'Prediction failed.' });
  }
};

// ============================================================
// POST /api/ml/obesity
//
// Predicts the patient's obesity category — not just yes/no,
// but a full classification:
//   Insufficient_Weight, Normal_Weight, Overweight_Level_I,
//   Overweight_Level_II, Obesity_Type_I, Obesity_Type_II,
//   Obesity_Type_III
//
// Required fields (mix of numbers and text):
//   Numbers: Age, Height (m), Weight (kg), FCVC, NCP, CH2O, FAF, TUE
//   Text:    Gender, family_history_with_overweight, FAVC, CAEC,
//            SMOKE, SCC, CALC, MTRANS
//
// The obesity model is a full sklearn Pipeline that handles
// its own one-hot encoding and scaling internally.
// We just pass the raw values — no pre-processing needed here.
//
// Response includes both the predicted category AND the
// probability of each possible category (used for the bar chart).
// ============================================================
const predictObesity = async (req, res) => {
  try {
    const result = await callMLService('/predict/obesity', req.body);
    return res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    console.error('predictObesity error:', error.message);
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      return res.status(503).json({ status: 'error', message: 'ML service is currently unavailable.' });
    }
    if (error.response && error.response.data) {
      return res.status(400).json({
        status:  'error',
        message: error.response.data.error || 'Prediction failed.'
      });
    }
    return res.status(500).json({ status: 'error', message: 'Prediction failed.' });
  }
};

// Export so mlRoutes.js can attach these to URL paths
module.exports = { predictDiabetes, predictHypertension, predictCardiovascular, predictObesity };
