# ============================================================
# 05_Diabetes_Model.py
#
# PURPOSE:
#   This file trains a Logistic Regression model to estimate
#   the probability that a person has diabetes, based on
#   a publicly available health indicators dataset.
#
# DATASET:
#   Behavioral Risk Factor Surveillance System (BRFSS) 2015
#   File: archive/diabetes_binary_health_indicators_BRFSS2015.csv
#   Target column: Diabetes_binary (0 = No, 1 = Yes)
#
# FEATURES USED (4 features selected for simplicity):
#   Age, Sex, BMI, HighBP
#
# WHY CALIBRATION?
#   A standard Logistic Regression model produces raw scores
#   that may not accurately represent true probabilities.
#   CalibratedClassifierCV (with Platt scaling / sigmoid method)
#   adjusts the output so that a 70% probability truly means
#   approximately 70% of such patients actually have diabetes.
#   This makes the percentage shown to the user more meaningful.
#
# OUTPUT:
#   diabetes_model.pkl  — the final calibrated model saved to disk
#   This file is loaded by ml_service/app.py when predictions
#   are requested from the healthcare frontend.
#
# IMPORTANT:
#   This script is run ONCE to train and save the model.
#   The saved .pkl file is used for all future predictions.
#   Do NOT retrain the model unless intentionally.
# ============================================================

import pandas as pd
import joblib

from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.calibration import CalibratedClassifierCV, calibration_curve

from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    roc_auc_score
)


# ============================================================
# Step 1: Load Diabetes Dataset
# Read the CSV file into a pandas DataFrame.
# The dataset has hundreds of thousands of rows from a
# US national health survey conducted in 2015.
# ============================================================

file_path = "archive/diabetes_binary_health_indicators_BRFSS2015.csv"

diabetes_df = pd.read_csv(file_path)

print("Dataset shape:", diabetes_df.shape)
print("Dataset columns:")
print(diabetes_df.columns)


# ============================================================
# Step 2: Basic Data Inspection
# Check what values exist in the important columns.
# This confirms the data loaded correctly before training.
# ============================================================

print("\nUnique values in important columns:")

print("Diabetes_binary:", diabetes_df["Diabetes_binary"].unique())
print("HighBP:", diabetes_df["HighBP"].unique())
print("BMI range:", diabetes_df["BMI"].min(), "to", diabetes_df["BMI"].max())
print("Sex:", diabetes_df["Sex"].unique())
print("Age:", diabetes_df["Age"].unique())

print("\nMissing values:")
print(diabetes_df.isnull().sum())


# ============================================================
# Step 3: Select Features and Target
# X = input features (what the model learns from)
# y = target variable (what the model tries to predict)
#
# Only 4 features are used to keep the model simple and
# to match the 4 input fields available in the frontend form.
# The feature ORDER here must match the order used in
# ml_service/app.py when predictions are made.
# ============================================================

features = ["Age", "Sex", "BMI", "HighBP"]

X = diabetes_df[features]

y = diabetes_df["Diabetes_binary"]

print("\nSelected features:")
print(features)

print("\nFeature shape:", X.shape)
print("Target shape:", y.shape)


# ============================================================
# Step 4: Split Data into Training and Testing Sets
# 80% of data is used to train the model (X_train, y_train).
# 20% is kept separate for testing (X_test, y_test).
# random_state=42 ensures the same split every time this runs.
# stratify=y ensures both halves have the same ratio of
# diabetic vs non-diabetic patients (important for imbalanced data).
# ============================================================

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42,
    stratify=y
)

print("\nTraining data shape:", X_train.shape)
print("Testing data shape:", X_test.shape)

print("\nTraining target distribution:")
print(y_train.value_counts())

print("\nTesting target distribution:")
print(y_test.value_counts())


# ============================================================
# Step 5: Train Diabetes Logistic Regression Model
# LogisticRegression is a binary classification algorithm.
# It learns the probability that an input belongs to class 1.
# max_iter=1000 gives the algorithm enough steps to converge.
# class_weight="balanced" adjusts for the fact that there are
# more non-diabetic than diabetic patients in the dataset.
# ============================================================

diabetes_model = LogisticRegression(
    max_iter=1000,
    class_weight="balanced"
)

diabetes_model.fit(X_train, y_train)

print("\nDiabetes model trained successfully!")


# ============================================================
# Step 6: Calibrate the Model
# CalibratedClassifierCV wraps the trained model and applies
# probability calibration using cross-validation.
# method="sigmoid" uses Platt scaling (logistic regression
# fit on top of the raw scores).
# cv=5 uses 5-fold cross-validation for calibration.
# The result is a model whose predict_proba() output more
# accurately reflects real-world probabilities.
# ============================================================

calibrated_diabetes_model = CalibratedClassifierCV(
    diabetes_model,
    method="sigmoid",
    cv=5
)

calibrated_diabetes_model.fit(X_train, y_train)

print("Calibrated diabetes model trained successfully!")


# ============================================================
# Step 7: Evaluate Original Model
# accuracy_score measures how often the model predicts correctly.
# classification_report shows precision, recall, and F1-score
# for each class (0=no diabetes, 1=diabetes).
# confusion_matrix shows a table of correct vs incorrect predictions.
# ============================================================

y_pred = diabetes_model.predict(X_test)

accuracy = accuracy_score(y_test, y_pred)

print("\n========== ORIGINAL MODEL ==========")

print("\nAccuracy:", accuracy)

print("\nClassification Report:")
print(classification_report(y_test, y_pred))

print("\nConfusion Matrix:")
print(confusion_matrix(y_test, y_pred))


# ============================================================
# Step 8: Original Model ROC-AUC
# predict_proba returns two columns: [prob of class 0, prob of class 1]
# [:, 1] selects the probability of having diabetes (class 1).
# ROC-AUC measures how well the model distinguishes between
# diabetic and non-diabetic patients. 1.0 = perfect, 0.5 = random.
# ============================================================

y_probability = diabetes_model.predict_proba(X_test)[:, 1]

roc_auc = roc_auc_score(
    y_test,
    y_probability
)

print("\nOriginal ROC-AUC:", roc_auc)


# ============================================================
# Step 9: Original Model Calibration Results
# calibration_curve compares predicted probabilities to actual outcomes.
# A well-calibrated model should have predicted ~= actual.
# n_bins=10 divides predictions into 10 buckets for comparison.
# ============================================================

prob_true, prob_pred = calibration_curve(
    y_test,
    y_probability,
    n_bins=10
)

print("\nOriginal Calibration Results:")

for i in range(len(prob_true)):
    print(
        f"Predicted probability: {prob_pred[i]:.3f} "
        f"| Actual frequency: {prob_true[i]:.3f}"
    )


# ============================================================
# Step 10: Generate Calibrated Probabilities
# Now using the calibrated model to generate probabilities.
# These should be closer to the actual observed frequencies
# than the uncalibrated model's probabilities.
# Multiplying by 100 converts probability (0.23) to percentage (23%).
# ============================================================

calibrated_y_probability = (
    calibrated_diabetes_model.predict_proba(X_test)[:, 1]
)

print("\n========== CALIBRATED MODEL ==========")

print("\nFirst 10 calibrated class-1 probabilities:")

print(calibrated_y_probability[:10])

print("\nFirst 10 calibrated estimated probabilities (%):")

calibrated_percentage = calibrated_y_probability * 100

for i in range(10):
    print(
        f"Patient {i + 1}: "
        f"{calibrated_percentage[i]:.2f}%"
    )


# ============================================================
# Step 11: Calibrated Model ROC-AUC
# The calibrated model should have a similar or slightly
# different ROC-AUC compared to the original model.
# Calibration changes the probability scale but not the ranking.
# ============================================================

calibrated_roc_auc = roc_auc_score(
    y_test,
    calibrated_y_probability
)

print("\nCalibrated ROC-AUC:", calibrated_roc_auc)


# ============================================================
# Step 12: Calibration Results After Calibration
# Checking if calibration improved alignment between
# predicted probabilities and actual outcome frequencies.
# ============================================================

calibrated_prob_true, calibrated_prob_pred = calibration_curve(
    y_test,
    calibrated_y_probability,
    n_bins=10
)

print("\nCalibrated Calibration Results:")

for i in range(len(calibrated_prob_true)):
    print(
        f"Predicted probability: "
        f"{calibrated_prob_pred[i]:.3f} "
        f"| Actual frequency: "
        f"{calibrated_prob_true[i]:.3f}"
    )


# ============================================================
# Step 13: Final Before vs After Comparison
# Side-by-side comparison of ROC-AUC scores and probability
# values before and after calibration for the same test patients.
# ============================================================

print("\n========== BEFORE vs AFTER CALIBRATION ==========")

print(f"Original ROC-AUC:   {roc_auc:.6f}")
print(f"Calibrated ROC-AUC: {calibrated_roc_auc:.6f}")

print("\nFirst 10 probability comparison:")

original_percentage = y_probability * 100

for i in range(10):
    print(
        f"Patient {i + 1}: "
        f"Before = {original_percentage[i]:.2f}% "
        f"| After = {calibrated_percentage[i]:.2f}%"
    )


# ============================================================
# Step 14: Save Calibrated Diabetes Model
# joblib.dump saves the trained model object to a .pkl file.
# The file diabetes_model.pkl is then loaded by ml_service/app.py
# to serve predictions without retraining.
# This is the final output of this entire training pipeline.
# ============================================================

joblib.dump(
    calibrated_diabetes_model,
    "diabetes_model.pkl"
)

print("\nDiabetes model saved successfully!")
print("Saved file: diabetes_model.pkl")

print("\nDiabetes ML pipeline completed successfully!")
