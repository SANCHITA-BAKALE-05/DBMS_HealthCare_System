import pandas as pd

# ============================================================
# HYPERTENSION ML PIPELINE
# Step 1: Load and Inspect Dataset
# ============================================================

import pandas as pd

# Load hypertension dataset
hypertension_file = "archive/Hypertension-risk-model-main.csv"

hypertension_df = pd.read_csv(hypertension_file)

print("\n\n============================================================")
print("HYPERTENSION DATASET")
print("============================================================")

# Dataset shape
print("\nDataset shape:")
print(hypertension_df.shape)

# Column names
print("\nDataset columns:")
print(hypertension_df.columns.tolist())

# First 5 rows
print("\nFirst 5 rows:")
print(hypertension_df.head())

# Data types
print("\nData types:")
print(hypertension_df.dtypes)

# Missing values
print("\nMissing values:")
print(hypertension_df.isnull().sum())

# Basic statistics
print("\nBasic statistics:")
print(hypertension_df.describe(include="all"))


# ============================================================
# Hypertension - Step 2: Identify Target and Understand Data
# ============================================================

# Identify the target column
target = "Risk"

print("\nTarget column:")
print(target)

# Check unique values in target
print("\nUnique values in target:")
print(hypertension_df[target].unique())

# Check target distribution
print("\nTarget distribution:")
print(hypertension_df[target].value_counts())

# Check target distribution in percentage
print("\nTarget distribution (%):")
print(
    hypertension_df[target].value_counts(normalize=True) * 100
)

# Display all feature columns
print("\nFeature columns:")
print(
    hypertension_df.drop(columns=[target]).columns.tolist()
)

# Display number of features
print("\nNumber of features:")
print(
    len(hypertension_df.drop(columns=[target]).columns)
)


# ============================================================
# Hypertension - Step 3: Select Features and Handle Missing Values
# ============================================================

# Define target
target = "Risk"

# Separate features and target
X_hypertension = hypertension_df.drop(columns=[target])
y_hypertension = hypertension_df[target]

print("\nTarget column:", target)

print("\nTarget distribution:")
print(y_hypertension.value_counts())

print("\nTarget distribution (%):")
print(
    y_hypertension.value_counts(normalize=True) * 100
)

print("\nMissing values before handling:")
print(X_hypertension.isnull().sum())

# Handle missing numerical values using median
X_hypertension = X_hypertension.fillna(
    X_hypertension.median(numeric_only=True)
)

print("\nMissing values after handling:")
print(X_hypertension.isnull().sum())

print("\nSelected features:")
print(X_hypertension.columns.tolist())

print("\nFeature shape:", X_hypertension.shape)
print("Target shape:", y_hypertension.shape)

# ============================================================
# Hypertension - Step 4: Train/Test Split
# ============================================================

from sklearn.model_selection import train_test_split

X_hyp_train, X_hyp_test, y_hyp_train, y_hyp_test = train_test_split(
    X_hypertension,
    y_hypertension,
    test_size=0.20,
    random_state=42,
    stratify=y_hypertension
)

print("\nTraining data shape:")
print(X_hyp_train.shape)

print("\nTesting data shape:")
print(X_hyp_test.shape)

print("\nTraining target distribution:")
print(y_hyp_train.value_counts())

print("\nTesting target distribution:")
print(y_hyp_test.value_counts())

print("\nTraining target distribution (%):")
print(
    y_hyp_train.value_counts(normalize=True) * 100
)

print("\nTesting target distribution (%):")
print(
    y_hyp_test.value_counts(normalize=True) * 100
)

# ============================================================
# Hypertension - Step 5: Scale Features & Train Logistic Regression
# ============================================================

from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression

# Scale the features
hyp_scaler = StandardScaler()

X_hyp_train_scaled = hyp_scaler.fit_transform(X_hyp_train)
X_hyp_test_scaled = hyp_scaler.transform(X_hyp_test)

# Train Logistic Regression
hypertension_model = LogisticRegression(
    max_iter=1000,
    class_weight="balanced"
)

hypertension_model.fit(
    X_hyp_train_scaled,
    y_hyp_train
)

print("\nHypertension model trained successfully!")

# ============================================================
# Hypertension - Step 6: Evaluate Model
# ============================================================

from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    roc_auc_score
)

# Make predictions
y_hyp_pred = hypertension_model.predict(X_hyp_test_scaled)

# Accuracy
hyp_accuracy = accuracy_score(y_hyp_test, y_hyp_pred)

print("\nHypertension Model Accuracy:")
print(hyp_accuracy)

# Classification Report
print("\nHypertension Classification Report:")
print(classification_report(y_hyp_test, y_hyp_pred))

# Confusion Matrix
print("\nHypertension Confusion Matrix:")
print(confusion_matrix(y_hyp_test, y_hyp_pred))

# ROC-AUC Score
y_hyp_prob = hypertension_model.predict_proba(X_hyp_test_scaled)[:, 1]

hyp_roc_auc = roc_auc_score(y_hyp_test, y_hyp_prob)

print("\nHypertension ROC-AUC Score:")
print(hyp_roc_auc)

# ============================================================
# Hypertension - Step 7: Generate Probability Predictions
# ============================================================

# Generate probability predictions
hyp_probabilities = hypertension_model.predict_proba(
    X_hyp_test_scaled
)[:, 1]

print("\nFirst 10 Hypertension Probability Predictions:")
print(hyp_probabilities[:10])

print("\nFirst 10 Hypertension Estimated Percentages:")
print((hyp_probabilities[:10] * 100).round(2))

# ============================================================
# Hypertension - Step 8: Probability Calibration
# ============================================================

from sklearn.calibration import CalibratedClassifierCV

# Calibrate the hypertension model
calibrated_hypertension_model = CalibratedClassifierCV(
    hypertension_model,
    method="sigmoid",
    cv=5
)

calibrated_hypertension_model.fit(
    X_hyp_train_scaled,
    y_hyp_train
)

# Generate calibrated probabilities
hyp_calibrated_probabilities = (
    calibrated_hypertension_model
    .predict_proba(X_hyp_test_scaled)[:, 1]
)

print("\nFirst 10 Calibrated Hypertension Probabilities:")
print(hyp_calibrated_probabilities[:10])

print("\nFirst 10 Calibrated Hypertension Estimated Percentages:")
print(
    (hyp_calibrated_probabilities[:10] * 100).round(2)
)

# ============================================================
# Hypertension - Step 9: Evaluate Calibrated Model
# ============================================================

# Calibrated class predictions
y_hyp_calibrated_pred = calibrated_hypertension_model.predict(
    X_hyp_test_scaled
)

# Calibrated ROC-AUC
hyp_calibrated_roc_auc = roc_auc_score(
    y_hyp_test,
    hyp_calibrated_probabilities
)

print("\nCalibrated Hypertension Classification Report:")
print(
    classification_report(
        y_hyp_test,
        y_hyp_calibrated_pred
    )
)

print("\nCalibrated Hypertension Confusion Matrix:")
print(
    confusion_matrix(
        y_hyp_test,
        y_hyp_calibrated_pred
    )
)

print("\nCalibrated Hypertension ROC-AUC Score:")
print(hyp_calibrated_roc_auc)

# ============================================================
# Hypertension - Step 10: Save Final Model and Scaler
# ============================================================

import joblib

joblib.dump(
    calibrated_hypertension_model,
    "hypertension_model.pkl"
)

joblib.dump(
    hyp_scaler,
    "hypertension_scaler.pkl"
)

print("\nHypertension model saved successfully!")
print("Hypertension scaler saved successfully!")
