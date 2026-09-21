# ============================================================
# ml_service/app.py
# Lightweight Flask API that loads the existing trained .pkl
# artifacts and serves ML prediction endpoints.
#
# This service is called ONLY by the Node.js backend.
# It is never called directly by the React frontend.
#
# Models loaded at startup (not on every request):
#   diabetes_model.pkl
#   hypertension_model.pkl + hypertension_scaler.pkl
#   cardiovascular_model.pkl + cardiovascular_scaler.pkl
#   obesity_model.pkl + obesity_label_encoder.pkl
#
# IMPORTANT: These models are already trained. This service
# only loads and uses them. No retraining happens here.
# ============================================================

import os
import joblib
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
# Only allow the Node backend to call this service
CORS(app, origins=["http://localhost:5000"])

# ============================================================
# Load all models once at startup
# Models are in the project root (one level up from ml_service/)
# ============================================================

BASE_DIR = os.path.join(os.path.dirname(__file__), '..')

def load_model(filename):
    path = os.path.join(BASE_DIR, filename)
    print(f"Loading: {path}")
    return joblib.load(path)

print("Loading ML models...")

diabetes_model         = load_model("diabetes_model.pkl")

hypertension_model     = load_model("hypertension_model.pkl")
hypertension_scaler    = load_model("hypertension_scaler.pkl")

cardiovascular_model   = load_model("cardiovascular_model.pkl")
cardiovascular_scaler  = load_model("cardiovascular_scaler.pkl")

obesity_model          = load_model("obesity_model.pkl")
obesity_label_encoder  = load_model("obesity_label_encoder.pkl")

print("All ML models loaded successfully.")


# ============================================================
# Helper: build standard response with disclaimer
# ============================================================

DISCLAIMER = (
    "This result is an estimate from a machine-learning model "
    "and is NOT a medical diagnosis. Please consult a qualified "
    "healthcare professional for medical advice."
)


# ============================================================
# POST /predict/diabetes
# Input features (no scaler — model trained on raw values):
#   Age (int/float), Sex (0=female,1=male), BMI (float), HighBP (0 or 1)
# ============================================================

@app.route("/predict/diabetes", methods=["POST"])
def predict_diabetes():
    try:
        data = request.get_json()
        required = ["Age", "Sex", "BMI", "HighBP"]
        for field in required:
            if field not in data:
                return jsonify({"error": f"Missing field: {field}"}), 400

        features = np.array([[
            float(data["Age"]),
            float(data["Sex"]),
            float(data["BMI"]),
            float(data["HighBP"])
        ]])

        # diabetes_model is a CalibratedClassifierCV — no scaler needed
        probability = float(diabetes_model.predict_proba(features)[0][1])
        percentage  = round(probability * 100, 2)

        return jsonify({
            "model":                   "Diabetes Risk Estimator",
            "estimated_probability":   probability,
            "estimated_percentage":    percentage,
            "risk_level":              _risk_level(probability),
            "disclaimer":              DISCLAIMER
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ============================================================
# POST /predict/hypertension
# Input features (12 features, scaled with hypertension_scaler):
#   male, age, currentSmoker, cigsPerDay, BPMeds, diabetes,
#   totChol, sysBP, diaBP, BMI, heartRate, glucose
# ============================================================

HYPERTENSION_FEATURES = [
    "male", "age", "currentSmoker", "cigsPerDay", "BPMeds",
    "diabetes", "totChol", "sysBP", "diaBP", "BMI", "heartRate", "glucose"
]

@app.route("/predict/hypertension", methods=["POST"])
def predict_hypertension():
    try:
        data = request.get_json()
        for field in HYPERTENSION_FEATURES:
            if field not in data:
                return jsonify({"error": f"Missing field: {field}"}), 400

        feature_values = [[float(data[f]) for f in HYPERTENSION_FEATURES]]
        scaled = hypertension_scaler.transform(feature_values)
        probability = float(hypertension_model.predict_proba(scaled)[0][1])
        percentage  = round(probability * 100, 2)

        return jsonify({
            "model":                   "Hypertension Risk Estimator",
            "estimated_probability":   probability,
            "estimated_percentage":    percentage,
            "risk_level":              _risk_level(probability),
            "disclaimer":              DISCLAIMER
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ============================================================
# POST /predict/cardiovascular
# Input features (13 features, scaled with cardiovascular_scaler):
#   age, sex, cp, trestbps, chol, fbs, restecg,
#   thalach, exang, oldpeak, slope, ca, thal
# ============================================================

CARDIOVASCULAR_FEATURES = [
    "age", "sex", "cp", "trestbps", "chol", "fbs",
    "restecg", "thalach", "exang", "oldpeak", "slope", "ca", "thal"
]

@app.route("/predict/cardiovascular", methods=["POST"])
def predict_cardiovascular():
    try:
        data = request.get_json()
        for field in CARDIOVASCULAR_FEATURES:
            if field not in data:
                return jsonify({"error": f"Missing field: {field}"}), 400

        feature_values = [[float(data[f]) for f in CARDIOVASCULAR_FEATURES]]
        scaled = cardiovascular_scaler.transform(feature_values)
        probability = float(cardiovascular_model.predict_proba(scaled)[0][1])
        percentage  = round(probability * 100, 2)

        return jsonify({
            "model":                   "Cardiovascular Risk Estimator",
            "estimated_probability":   probability,
            "estimated_percentage":    percentage,
            "risk_level":              _risk_level(probability),
            "disclaimer":              DISCLAIMER
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ============================================================
# POST /predict/obesity
# Input features (16 features — 8 numerical + 8 categorical):
#   Numerical: Age, Height, Weight, FCVC, NCP, CH2O, FAF, TUE
#   Categorical: Gender, family_history_with_overweight, FAVC,
#                CAEC, SMOKE, SCC, CALC, MTRANS
#
# The obesity_model is a sklearn Pipeline that handles
# its own preprocessing (OHE + scaling). Just pass a DataFrame.
# ============================================================

import pandas as pd

OBESITY_NUMERICAL    = ["Age", "Height", "Weight", "FCVC", "NCP", "CH2O", "FAF", "TUE"]
OBESITY_CATEGORICAL  = ["Gender", "family_history_with_overweight", "FAVC", "CAEC", "SMOKE", "SCC", "CALC", "MTRANS"]
OBESITY_ALL_FEATURES = OBESITY_NUMERICAL + OBESITY_CATEGORICAL

@app.route("/predict/obesity", methods=["POST"])
def predict_obesity():
    try:
        data = request.get_json()
        for field in OBESITY_ALL_FEATURES:
            if field not in data:
                return jsonify({"error": f"Missing field: {field}"}), 400

        # Build a DataFrame with the correct column order
        input_df = pd.DataFrame([{
            f: float(data[f]) if f in OBESITY_NUMERICAL else str(data[f])
            for f in OBESITY_ALL_FEATURES
        }])

        # The Pipeline handles preprocessing automatically
        probabilities   = obesity_model.predict_proba(input_df)[0]
        predicted_class = int(np.argmax(probabilities))
        predicted_label = obesity_label_encoder.classes_[predicted_class]
        confidence      = round(float(probabilities[predicted_class]) * 100, 2)

        # Build per-class breakdown
        class_breakdown = {
            obesity_label_encoder.classes_[i]: round(float(probabilities[i]) * 100, 2)
            for i in range(len(obesity_label_encoder.classes_))
        }

        return jsonify({
            "model":               "Obesity Category Estimator",
            "predicted_category":  predicted_label,
            "confidence":          confidence,
            "all_class_probabilities": class_breakdown,
            "disclaimer":          DISCLAIMER
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ============================================================
# GET /health  — quick status check
# ============================================================

@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "models_loaded": [
            "diabetes_model",
            "hypertension_model",
            "cardiovascular_model",
            "obesity_model"
        ]
    })


# ============================================================
# Helper: map probability to a simple risk level label
# ============================================================

def _risk_level(probability):
    if probability < 0.30:
        return "Low"
    elif probability < 0.60:
        return "Moderate"
    else:
        return "High"


if __name__ == "__main__":
    port = int(os.environ.get("ML_PORT", 5001))
    print(f"ML Service running on http://localhost:{port}")
    app.run(host="0.0.0.0", port=port, debug=False)
