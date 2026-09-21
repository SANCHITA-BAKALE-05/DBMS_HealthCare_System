# ============================================================
# OBESITY ML PIPELINE
# Dataset: UCI Estimation of Obesity Levels
# ============================================================

import pandas as pd
import joblib

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import (
    StandardScaler,
    OneHotEncoder,
    LabelEncoder
)
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.calibration import CalibratedClassifierCV

from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    roc_auc_score
)


# ============================================================
# Step 1: Load Dataset
# ============================================================

obesity_file = "archive/ObesityDataSet_raw_and_data_sinthetic.csv"

obesity_df = pd.read_csv(obesity_file)

print("\n============================================================")
print("OBESITY DATASET")
print("============================================================")

print("\nDataset loaded from:")
print(obesity_file)

print("\nDataset shape:")
print(obesity_df.shape)

print("\nFirst 5 rows:")
print(obesity_df.head())

print("\nDataset columns:")
print(obesity_df.columns.tolist())

print("\nData types:")
print(obesity_df.dtypes)

print("\nMissing values:")
print(obesity_df.isnull().sum())


# ============================================================
# Step 2: Identify Target
# ============================================================

target = "NObeyesdad"

print("\nTarget column:")
print(target)

print("\nOriginal target distribution:")
print(obesity_df[target].value_counts())

print("\nOriginal target distribution (%):")
print(
    obesity_df[target].value_counts(normalize=True) * 100
)


# ============================================================
# Step 3: Separate Features and Target
# ============================================================

X_obesity = obesity_df.drop(columns=[target])
y_obesity = obesity_df[target]

print("\nFeature columns:")
print(X_obesity.columns.tolist())

print("\nNumber of features:")
print(X_obesity.shape[1])

print("\nFeature shape:")
print(X_obesity.shape)

print("\nTarget shape:")
print(y_obesity.shape)


# ============================================================
# Step 4: Encode Target Labels
# ============================================================

label_encoder = LabelEncoder()

y_obesity_encoded = label_encoder.fit_transform(y_obesity)

print("\nTarget classes:")
print(label_encoder.classes_)

print("\nEncoded target distribution:")
print(
    pd.Series(y_obesity_encoded).value_counts().sort_index()
)


# ============================================================
# Step 5: Identify Numerical and Categorical Features
# ============================================================

categorical_features = [
    "Gender",
    "family_history_with_overweight",
    "FAVC",
    "CAEC",
    "SMOKE",
    "SCC",
    "CALC",
    "MTRANS"
]

numerical_features = [
    "Age",
    "Height",
    "Weight",
    "FCVC",
    "NCP",
    "CH2O",
    "FAF",
    "TUE"
]

print("\nNumerical features:")
print(numerical_features)

print("\nCategorical features:")
print(categorical_features)


# ============================================================
# Step 6: Train/Test Split
# ============================================================

X_obesity_train, X_obesity_test, y_obesity_train, y_obesity_test = (
    train_test_split(
        X_obesity,
        y_obesity_encoded,
        test_size=0.20,
        random_state=42,
        stratify=y_obesity_encoded
    )
)

print("\nTraining data shape:")
print(X_obesity_train.shape)

print("\nTesting data shape:")
print(X_obesity_test.shape)

print("\nTraining target distribution:")
print(
    pd.Series(y_obesity_train).value_counts().sort_index()
)

print("\nTesting target distribution:")
print(
    pd.Series(y_obesity_test).value_counts().sort_index()
)


# ============================================================
# Step 7: Preprocessing
# ============================================================

numeric_transformer = Pipeline(
    steps=[
        ("scaler", StandardScaler())
    ]
)

categorical_transformer = Pipeline(
    steps=[
        (
            "onehot",
            OneHotEncoder(
                handle_unknown="ignore"
            )
        )
    ]
)

preprocessor = ColumnTransformer(
    transformers=[
        (
            "num",
            numeric_transformer,
            numerical_features
        ),
        (
            "cat",
            categorical_transformer,
            categorical_features
        )
    ]
)


# ============================================================
# Step 8: Build Logistic Regression Pipeline
# ============================================================

obesity_pipeline = Pipeline(
    steps=[
        ("preprocessor", preprocessor),
        (
            "classifier",
            LogisticRegression(
                max_iter=2000,
                class_weight="balanced"
            )
        )
    ]
)

obesity_pipeline.fit(
    X_obesity_train,
    y_obesity_train
)

print("\nObesity model trained successfully!")


# ============================================================
# Step 9: Evaluate Original Model
# ============================================================

y_obesity_pred = obesity_pipeline.predict(
    X_obesity_test
)

obesity_accuracy = accuracy_score(
    y_obesity_test,
    y_obesity_pred
)

print("\n============================================================")
print("ORIGINAL OBESITY MODEL")
print("============================================================")

print("\nObesity Model Accuracy:")
print(obesity_accuracy)

print("\nObesity Classification Report:")
print(
    classification_report(
        y_obesity_test,
        y_obesity_pred,
        target_names=label_encoder.classes_
    )
)

print("\nObesity Confusion Matrix:")
print(
    confusion_matrix(
        y_obesity_test,
        y_obesity_pred
    )
)


# ============================================================
# Step 10: Original Probability Predictions
# ============================================================

obesity_probabilities = obesity_pipeline.predict_proba(
    X_obesity_test
)

print("\nFirst 10 Obesity Probability Predictions:")

for i in range(min(10, len(obesity_probabilities))):

    predicted_class = obesity_probabilities[i].argmax()

    print(
        f"Patient {i + 1}: "
        f"{label_encoder.classes_[predicted_class]} "
        f"| Probability = "
        f"{obesity_probabilities[i][predicted_class] * 100:.2f}%"
    )


# ============================================================
# Step 11: Original Multiclass ROC-AUC
# ============================================================

obesity_roc_auc = roc_auc_score(
    y_obesity_test,
    obesity_probabilities,
    multi_class="ovr",
    average="weighted"
)

print("\nOriginal Obesity ROC-AUC Score:")
print(obesity_roc_auc)


# ============================================================
# Step 12: Probability Calibration
# ============================================================

calibrated_obesity_model = CalibratedClassifierCV(
    obesity_pipeline,
    method="sigmoid",
    cv=5
)

calibrated_obesity_model.fit(
    X_obesity_train,
    y_obesity_train
)

print("\nCalibrated obesity model trained successfully!")


# ============================================================
# Step 13: Generate Calibrated Probabilities
# ============================================================

calibrated_obesity_probabilities = (
    calibrated_obesity_model.predict_proba(
        X_obesity_test
    )
)

print("\nFirst 10 Calibrated Obesity Probabilities:")

for i in range(min(10, len(calibrated_obesity_probabilities))):

    predicted_class = (
        calibrated_obesity_probabilities[i].argmax()
    )

    print(
        f"Patient {i + 1}: "
        f"{label_encoder.classes_[predicted_class]} "
        f"| Probability = "
        f"{calibrated_obesity_probabilities[i][predicted_class] * 100:.2f}%"
    )


# ============================================================
# Step 14: Evaluate Calibrated Model
# ============================================================

y_obesity_calibrated_pred = (
    calibrated_obesity_model.predict(
        X_obesity_test
    )
)

calibrated_obesity_accuracy = accuracy_score(
    y_obesity_test,
    y_obesity_calibrated_pred
)

print("\n============================================================")
print("CALIBRATED OBESITY MODEL")
print("============================================================")

print("\nCalibrated Obesity Model Accuracy:")
print(calibrated_obesity_accuracy)

print("\nCalibrated Obesity Classification Report:")
print(
    classification_report(
        y_obesity_test,
        y_obesity_calibrated_pred,
        target_names=label_encoder.classes_
    )
)

print("\nCalibrated Obesity Confusion Matrix:")
print(
    confusion_matrix(
        y_obesity_test,
        y_obesity_calibrated_pred
    )
)


# ============================================================
# Step 15: Calibrated ROC-AUC
# ============================================================

calibrated_obesity_roc_auc = roc_auc_score(
    y_obesity_test,
    calibrated_obesity_probabilities,
    multi_class="ovr",
    average="weighted"
)

print("\nCalibrated Obesity ROC-AUC Score:")
print(calibrated_obesity_roc_auc)


# ============================================================
# Step 16: Save Final Model
# ============================================================

joblib.dump(
    calibrated_obesity_model,
    "obesity_model.pkl"
)

joblib.dump(
    label_encoder,
    "obesity_label_encoder.pkl"
)

print("\n============================================================")
print("OBESITY MODEL SAVED SUCCESSFULLY!")
print("============================================================")

print("\nSaved files:")
print("obesity_model.pkl")
print("obesity_label_encoder.pkl")

print("\nObesity ML pipeline completed successfully!")