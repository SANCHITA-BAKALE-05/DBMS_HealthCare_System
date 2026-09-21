import pandas as pd

# ============================================================
# CARDIOVASCULAR DISEASE ML PIPELINE
# Dataset: UCI Heart Disease - Cleveland
# ============================================================


# ============================================================
# Step 1: Load & Inspect Dataset
# ============================================================

heart_file = "archive/heart+disease/processed.cleveland.data"

heart_data = pd.read_csv(
    heart_file,
    header=None
)

print("\nDataset loaded from:")
print(heart_file)

print("\nDataset shape:")
print(heart_data.shape)

print("\nFirst 5 rows:")
print(heart_data.head())


# ============================================================
# Step 2: Assign Columns & Identify Target
# ============================================================

heart_columns = [
    "age",
    "sex",
    "cp",
    "trestbps",
    "chol",
    "fbs",
    "restecg",
    "thalach",
    "exang",
    "oldpeak",
    "slope",
    "ca",
    "thal",
    "target"
]

heart_data.columns = heart_columns

# Replace '?' with missing values
heart_data = heart_data.replace("?", pd.NA)

# Convert all columns to numeric
heart_data = heart_data.apply(
    pd.to_numeric,
    errors="coerce"
)

print("\nColumn names:")
print(heart_data.columns.tolist())

print("\nData types:")
print(heart_data.dtypes)

print("\nTarget column:")
print("target")

print("\nOriginal target distribution:")
print(
    heart_data["target"].value_counts(
        dropna=False
    ).sort_index()
)


# ============================================================
# Step 3: Select Features & Handle Missing Values
# ============================================================

X_cardiovascular = heart_data.drop(
    columns=["target"]
)

# Cleveland target:
# 0 = No cardiovascular disease
# 1,2,3,4 = Cardiovascular disease
y_cardiovascular = (
    heart_data["target"] > 0
).astype(int)

print("\nMissing values before handling:")
print(X_cardiovascular.isnull().sum())

# Median imputation
X_cardiovascular = X_cardiovascular.fillna(
    X_cardiovascular.median(numeric_only=True)
)

print("\nMissing values after handling:")
print(X_cardiovascular.isnull().sum())

print("\nSelected features:")
print(X_cardiovascular.columns.tolist())

print("\nFeature shape:")
print(X_cardiovascular.shape)

print("\nTarget shape:")
print(y_cardiovascular.shape)

print("\nFinal target distribution:")
print(
    y_cardiovascular.value_counts().sort_index()
)

print("\nFinal target distribution (%):")
print(
    y_cardiovascular.value_counts(
        normalize=True
    ).sort_index() * 100
)


# ============================================================
# Cardiovascular - Step 4: Train/Test Split
# ============================================================

from sklearn.model_selection import train_test_split

X_cardio_train, X_cardio_test, y_cardio_train, y_cardio_test = train_test_split(
    X_cardiovascular,
    y_cardiovascular,
    test_size=0.20,
    random_state=42,
    stratify=y_cardiovascular
)

print("\nTraining data shape:")
print(X_cardio_train.shape)

print("\nTesting data shape:")
print(X_cardio_test.shape)

print("\nTraining target distribution:")
print(y_cardio_train.value_counts().sort_index())

print("\nTesting target distribution:")
print(y_cardio_test.value_counts().sort_index())

print("\nTraining target distribution (%):")
print(
    y_cardio_train.value_counts(
        normalize=True
    ).sort_index() * 100
)

print("\nTesting target distribution (%):")
print(
    y_cardio_test.value_counts(
        normalize=True
    ).sort_index() * 100
)


# ============================================================
# Cardiovascular - Step 5: Scale Features & Train Model
# ============================================================

from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression

# Scale features
cardio_scaler = StandardScaler()

X_cardio_train_scaled = cardio_scaler.fit_transform(
    X_cardio_train
)

X_cardio_test_scaled = cardio_scaler.transform(
    X_cardio_test
)

# Train Logistic Regression
cardiovascular_model = LogisticRegression(
    max_iter=1000,
    class_weight="balanced"
)

cardiovascular_model.fit(
    X_cardio_train_scaled,
    y_cardio_train
)

print("\nCardiovascular model trained successfully!")


# ============================================================
# Cardiovascular - Step 6: Evaluate Model
# ============================================================

from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    roc_auc_score
)

# Make predictions
y_cardio_pred = cardiovascular_model.predict(
    X_cardio_test_scaled
)

# Accuracy
cardio_accuracy = accuracy_score(
    y_cardio_test,
    y_cardio_pred
)

print("\nCardiovascular Model Accuracy:")
print(cardio_accuracy)

# Classification Report
print("\nCardiovascular Classification Report:")
print(
    classification_report(
        y_cardio_test,
        y_cardio_pred
    )
)

# Confusion Matrix
print("\nCardiovascular Confusion Matrix:")
print(
    confusion_matrix(
        y_cardio_test,
        y_cardio_pred
    )
)

# Probability predictions
y_cardio_prob = cardiovascular_model.predict_proba(
    X_cardio_test_scaled
)[:, 1]

# ROC-AUC
cardio_roc_auc = roc_auc_score(
    y_cardio_test,
    y_cardio_prob
)

print("\nCardiovascular ROC-AUC Score:")
print(cardio_roc_auc)

# ============================================================
# Cardiovascular - Step 7: Probability Prediction & Calibration
# ============================================================

from sklearn.calibration import CalibratedClassifierCV

# Raw probability predictions
cardio_probabilities = cardiovascular_model.predict_proba(
    X_cardio_test_scaled
)[:, 1]

print("\nFirst 10 Cardiovascular Probability Predictions:")
print(cardio_probabilities[:10])

print("\nFirst 10 Cardiovascular Estimated Percentages:")
print(
    (cardio_probabilities[:10] * 100).round(2)
)


# ============================================================
# Calibrate Cardiovascular Model
# ============================================================

calibrated_cardiovascular_model = CalibratedClassifierCV(
    cardiovascular_model,
    method="sigmoid",
    cv=5
)

calibrated_cardiovascular_model.fit(
    X_cardio_train_scaled,
    y_cardio_train
)

# Calibrated probabilities
cardio_calibrated_probabilities = (
    calibrated_cardiovascular_model
    .predict_proba(X_cardio_test_scaled)[:, 1]
)

print("\nFirst 10 Calibrated Cardiovascular Probabilities:")
print(
    cardio_calibrated_probabilities[:10]
)

print("\nFirst 10 Calibrated Cardiovascular Estimated Percentages:")
print(
    (cardio_calibrated_probabilities[:10] * 100).round(2)
)

# ============================================================
# Cardiovascular - Step 8: Evaluate Calibrated Model
# ============================================================

# Calibrated predictions
y_cardio_calibrated_pred = (
    calibrated_cardiovascular_model.predict(
        X_cardio_test_scaled
    )
)

# Accuracy
cardio_calibrated_accuracy = accuracy_score(
    y_cardio_test,
    y_cardio_calibrated_pred
)

print("\nCalibrated Cardiovascular Model Accuracy:")
print(cardio_calibrated_accuracy)

# Classification Report
print("\nCalibrated Cardiovascular Classification Report:")
print(
    classification_report(
        y_cardio_test,
        y_cardio_calibrated_pred
    )
)

# Confusion Matrix
print("\nCalibrated Cardiovascular Confusion Matrix:")
print(
    confusion_matrix(
        y_cardio_test,
        y_cardio_calibrated_pred
    )
)

# ROC-AUC using calibrated probabilities
cardio_calibrated_roc_auc = roc_auc_score(
    y_cardio_test,
    cardio_calibrated_probabilities
)

print("\nCalibrated Cardiovascular ROC-AUC Score:")
print(cardio_calibrated_roc_auc)

# ============================================================
# Cardiovascular - Step 9: Save Final Model and Scaler
# ============================================================

import joblib

joblib.dump(
    calibrated_cardiovascular_model,
    "cardiovascular_model.pkl"
)

joblib.dump(
    cardio_scaler,
    "cardiovascular_scaler.pkl"
)

print("\nCardiovascular model saved successfully!")
print("Cardiovascular scaler saved successfully!")