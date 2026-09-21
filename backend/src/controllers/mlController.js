// ============================================================
// mlController.js
// Node.js proxy to the Python ML Flask service.
//
// The React frontend calls /api/ml/...
// This controller forwards the request to the Python service.
// The Python service loads the .pkl files and returns predictions.
//
// Architecture:
//   React → Node/Express → Python ML API → .pkl models
// ============================================================

const axios = require('axios');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5001';

// Helper: forward request to Python ML service
const callMLService = async (endpoint, body) => {
  const response = await axios.post(`${ML_SERVICE_URL}${endpoint}`, body, {
    timeout: 15000,
    headers: { 'Content-Type': 'application/json' }
  });
  return response.data;
};

// POST /api/ml/diabetes
// Required body: { Age, Sex, BMI, HighBP }
// No scaler — model trained on raw values
const predictDiabetes = async (req, res) => {
  try {
    const { Age, Sex, BMI, HighBP } = req.body;

    if (Age === undefined || Sex === undefined || BMI === undefined || HighBP === undefined) {
      return res.status(400).json({
        status: 'error',
        message: 'Required fields: Age (number), Sex (0=female/1=male), BMI (number), HighBP (0 or 1).'
      });
    }

    const result = await callMLService('/predict/diabetes', { Age, Sex, BMI, HighBP });
    return res.status(200).json({ status: 'success', data: result });

  } catch (error) {
    console.error('predictDiabetes error:', error.message);
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      return res.status(503).json({ status: 'error', message: 'ML service is currently unavailable. Please try again later.' });
    }
    return res.status(500).json({ status: 'error', message: 'Prediction failed.' });
  }
};

// POST /api/ml/hypertension
// Required body: all hypertension feature fields
// Scaler applied by Python service using hypertension_scaler.pkl
const predictHypertension = async (req, res) => {
  try {
    const result = await callMLService('/predict/hypertension', req.body);
    return res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    console.error('predictHypertension error:', error.message);
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      return res.status(503).json({ status: 'error', message: 'ML service is currently unavailable.' });
    }
    if (error.response && error.response.data) {
      return res.status(400).json({ status: 'error', message: error.response.data.error || 'Prediction failed.' });
    }
    return res.status(500).json({ status: 'error', message: 'Prediction failed.' });
  }
};

// POST /api/ml/cardiovascular
// Required body: { age, sex, cp, trestbps, chol, fbs, restecg, thalach, exang, oldpeak, slope, ca, thal }
// Scaler applied by Python service using cardiovascular_scaler.pkl
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
      return res.status(400).json({ status: 'error', message: error.response.data.error || 'Prediction failed.' });
    }
    return res.status(500).json({ status: 'error', message: 'Prediction failed.' });
  }
};

// POST /api/ml/obesity
// Required body: all obesity feature fields (numerical + categorical)
// Model handles its own preprocessing via sklearn Pipeline
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
      return res.status(400).json({ status: 'error', message: error.response.data.error || 'Prediction failed.' });
    }
    return res.status(500).json({ status: 'error', message: 'Prediction failed.' });
  }
};

module.exports = { predictDiabetes, predictHypertension, predictCardiovascular, predictObesity };
