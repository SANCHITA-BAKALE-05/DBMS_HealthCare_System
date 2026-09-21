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
# ============================================================

file_path = "archive/diabetes_binary_health_indicators_BRFSS2015.csv"

diabetes_df = pd.read_csv(file_path)

print("Dataset shape:", diabetes_df.shape)
print("Dataset columns:")
print(diabetes_df.columns)


# ============================================================
# Step 2: Basic Data Inspection
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
# ============================================================

diabetes_model = LogisticRegression(
    max_iter=1000,
    class_weight="balanced"
)

diabetes_model.fit(X_train, y_train)

print("\nDiabetes model trained successfully!")


# ============================================================
# Step 6: Calibrate the Model
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
# ============================================================

y_probability = diabetes_model.predict_proba(X_test)[:, 1]

roc_auc = roc_auc_score(
    y_test,
    y_probability
)

print("\nOriginal ROC-AUC:", roc_auc)


# ============================================================
# Step 9: Original Model Calibration Results
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
# ============================================================

calibrated_roc_auc = roc_auc_score(
    y_test,
    calibrated_y_probability
)

print("\nCalibrated ROC-AUC:", calibrated_roc_auc)


# ============================================================
# Step 12: Calibration Results After Calibration
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
# ============================================================

joblib.dump(
    calibrated_diabetes_model,
    "diabetes_model.pkl"
)

print("\nDiabetes model saved successfully!")
print("Saved file: diabetes_model.pkl")

print("\nDiabetes ML pipeline completed successfully!")