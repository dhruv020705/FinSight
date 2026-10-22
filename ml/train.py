import os
import joblib
import pandas as pd

from sklearn.model_selection import (
    train_test_split,
    cross_val_score,
)

from sklearn.feature_extraction.text import TfidfVectorizer

from sklearn.linear_model import LogisticRegression

from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
)

from sklearn.pipeline import Pipeline


# ==========================================================
# PATHS
# ==========================================================

BASE_DIR = os.path.dirname(
    os.path.abspath(__file__)
)

DATA_PATH = os.path.join(
    BASE_DIR,
    "data",
    "transactions.csv",
)

MODEL_DIR = os.path.join(
    BASE_DIR,
    "models",
)

MODEL_PATH = os.path.join(
    MODEL_DIR,
    "category_model.pkl",
)

VECTORIZER_PATH = os.path.join(
    MODEL_DIR,
    "tfidf_vectorizer.pkl",
)


# ==========================================================
# LOAD DATASET
# ==========================================================

print("\n========================================")
print("LOADING DATASET")
print("========================================")

data = pd.read_csv(DATA_PATH)

print("\nDataset loaded successfully.")
print(f"Total rows before cleaning: {len(data)}")


# ==========================================================
# CHECK REQUIRED COLUMNS
# ==========================================================

required_columns = {
    "description",
    "category",
}

missing_columns = (
    required_columns - set(data.columns)
)

if missing_columns:
    raise ValueError(
        f"Missing required columns: {missing_columns}"
    )


# ==========================================================
# CLEAN DATASET
# ==========================================================

print("\n========================================")
print("CLEANING DATA")
print("========================================")

# Remove rows where description/category is missing

data = data.dropna(
    subset=[
        "description",
        "category",
    ]
).copy()


# Convert description to lowercase

data["description"] = (
    data["description"]
    .astype(str)
    .str.strip()
    .str.lower()
)


# Clean category names

data["category"] = (
    data["category"]
    .astype(str)
    .str.strip()
)


# Remove empty descriptions/categories

data = data[
    (data["description"] != "")
    & (data["category"] != "")
]


# Remove duplicate examples

data = data.drop_duplicates(
    subset=[
        "description",
        "category",
    ]
)


print(
    f"Total rows after cleaning: {len(data)}"
)


# ==========================================================
# CATEGORY DISTRIBUTION
# ==========================================================

print("\n========================================")
print("CATEGORY DISTRIBUTION")
print("========================================")

category_counts = (
    data["category"]
    .value_counts()
    .sort_index()
)

print()

print(category_counts)


# ==========================================================
# FEATURES AND LABELS
# ==========================================================

# X = transaction description
# y = transaction category

X = data["description"]

y = data["category"]


print("\n========================================")
print("FEATURES AND LABELS")
print("========================================")

print(
    f"\nTotal examples: {len(X)}"
)

print(
    f"Total categories: {y.nunique()}"
)


# ==========================================================
# TRAIN / TEST SPLIT
# ==========================================================

X_train, X_test, y_train, y_test = (
    train_test_split(
        X,
        y,
        test_size=0.20,
        random_state=42,

        # Ensures category proportions are
        # represented in train and test sets.
        stratify=y,
    )
)


print("\n========================================")
print("TRAIN / TEST SPLIT")
print("========================================")

print(
    f"\nTraining samples: {len(X_train)}"
)

print(
    f"Testing samples: {len(X_test)}"
)


# ==========================================================
# TF-IDF VECTORIZER
# ==========================================================

print("\n========================================")
print("TF-IDF VECTORIZATION")
print("========================================")


vectorizer = TfidfVectorizer(

    # Convert text to lowercase
    lowercase=True,

    # Use individual words + two-word phrases
    ngram_range=(1, 2),

    # Maximum vocabulary size
    max_features=5000,
)


# IMPORTANT:
# fit_transform only on TRAINING data.

X_train_vectorized = (
    vectorizer.fit_transform(
        X_train
    )
)


# Test data only gets transformed.
# We do NOT fit the vectorizer again.

X_test_vectorized = (
    vectorizer.transform(
        X_test
    )
)


print(
    "\nNumber of TF-IDF features:",
    len(
        vectorizer.get_feature_names_out()
    ),
)


# ==========================================================
# CREATE LOGISTIC REGRESSION MODEL
# ==========================================================

model = LogisticRegression(
    max_iter=1000,
    random_state=42,
)


# ==========================================================
# TRAIN MODEL
# ==========================================================

print("\n========================================")
print("TRAINING MODEL")
print("========================================")

print(
    "\nTraining Logistic Regression..."
)


model.fit(
    X_train_vectorized,
    y_train,
)


print(
    "Model training completed."
)


# ==========================================================
# MAKE TEST PREDICTIONS
# ==========================================================

predictions = model.predict(
    X_test_vectorized
)


# ==========================================================
# ACCURACY
# ==========================================================

accuracy = accuracy_score(
    y_test,
    predictions,
)


print("\n========================================")
print("MODEL EVALUATION")
print("========================================")


print(
    f"\nAccuracy: {accuracy * 100:.2f}%"
)


# ==========================================================
# CLASSIFICATION REPORT
# ==========================================================

print("\nClassification Report:\n")


print(
    classification_report(
        y_test,
        predictions,
        zero_division=0,
    )
)


# ==========================================================
# CONFUSION MATRIX
# ==========================================================

print("\n========================================")
print("CONFUSION MATRIX")
print("========================================")


labels = sorted(
    y.unique()
)


matrix = confusion_matrix(
    y_test,
    predictions,
    labels=labels,
)


matrix_df = pd.DataFrame(
    matrix,
    index=labels,
    columns=labels,
)


print(
    "\nRows    = Actual Category"
)

print(
    "Columns = Predicted Category\n"
)


print(matrix_df)


# ==========================================================
# SHOW TEST PREDICTIONS
# ==========================================================

print("\n========================================")
print("TEST SET PREDICTIONS")
print("========================================\n")


prediction_results = pd.DataFrame(
    {
        "Description":
            X_test.values,

        "Actual":
            y_test.values,

        "Predicted":
            predictions,
    }
)


print(
    prediction_results.to_string(
        index=False
    )
)


# ==========================================================
# COUNT WRONG PREDICTIONS
# ==========================================================

wrong_predictions = (
    prediction_results[
        prediction_results["Actual"]
        !=
        prediction_results["Predicted"]
    ]
)


print("\n========================================")
print("MISCLASSIFIED TRANSACTIONS")
print("========================================")


if len(wrong_predictions) == 0:

    print(
        "\nNo misclassified transactions "
        "in this test split."
    )

else:

    print()

    print(
        wrong_predictions.to_string(
            index=False
        )
    )


print(
    f"\nTotal mistakes: "
    f"{len(wrong_predictions)}"
)


# ==========================================================
# 5-FOLD CROSS VALIDATION
# ==========================================================

print("\n========================================")
print("5-FOLD CROSS VALIDATION")
print("========================================")


# IMPORTANT:
#
# We use Pipeline here because each fold must
# train its OWN TF-IDF vectorizer.
#
# This prevents information from the validation
# fold leaking into the training process.

cv_pipeline = Pipeline(
    [
        (
            "tfidf",

            TfidfVectorizer(
                lowercase=True,
                ngram_range=(1, 2),
                max_features=5000,
            ),
        ),

        (
            "model",

            LogisticRegression(
                max_iter=1000,
                random_state=42,
            ),
        ),
    ]
)


cv_scores = cross_val_score(
    cv_pipeline,
    X,
    y,
    cv=5,
    scoring="accuracy",
)


print("\nFold Accuracies:\n")


for index, score in enumerate(
    cv_scores,
    start=1,
):

    print(
        f"Fold {index}: "
        f"{score * 100:.2f}%"
    )


# ==========================================================
# CROSS VALIDATION SUMMARY
# ==========================================================

average_cv_accuracy = (
    cv_scores.mean()
)

cv_standard_deviation = (
    cv_scores.std()
)


print(
    "\nAverage CV Accuracy: "
    f"{average_cv_accuracy * 100:.2f}%"
)


print(
    "CV Standard Deviation: "
    f"{cv_standard_deviation * 100:.2f}%"
)


# ==========================================================
# CREATE MODEL DIRECTORY
# ==========================================================

os.makedirs(
    MODEL_DIR,
    exist_ok=True,
)


# ==========================================================
# SAVE TRAINED MODEL
# ==========================================================

joblib.dump(
    model,
    MODEL_PATH,
)


# ==========================================================
# SAVE TF-IDF VECTORIZER
# ==========================================================

joblib.dump(
    vectorizer,
    VECTORIZER_PATH,
)


print("\n========================================")
print("MODEL SAVED")
print("========================================")


print(
    "\nModel saved to:"
)

print(
    MODEL_PATH
)


print(
    "\nVectorizer saved to:"
)

print(
    VECTORIZER_PATH
)


# ==========================================================
# CUSTOM TEST DESCRIPTIONS
# ==========================================================

test_descriptions = [

    "Ordered pizza for dinner",

    "Uber ride to airport",

    "Monthly salary received",

    "Bought shoes from Amazon",

    "Paid electricity bill",

    "Netflix monthly subscription",

    "Purchased medicine from pharmacy",
]


# ==========================================================
# VECTORIZE CUSTOM DESCRIPTIONS
# ==========================================================

test_vectors = (
    vectorizer.transform(
        test_descriptions
    )
)


# ==========================================================
# PREDICT CUSTOM DESCRIPTIONS
# ==========================================================

test_predictions = (
    model.predict(
        test_vectors
    )
)


# ==========================================================
# PREDICTION PROBABILITIES
# ==========================================================

test_probabilities = (
    model.predict_proba(
        test_vectors
    )
)


# ==========================================================
# DISPLAY SAMPLE PREDICTIONS
# ==========================================================

print("\n========================================")
print("SAMPLE PREDICTIONS")
print("========================================\n")


for (
    description,
    category,
    probabilities,
) in zip(
    test_descriptions,
    test_predictions,
    test_probabilities,
):

    confidence = max(
        probabilities
    )

    print(
        f"{description}"
    )

    print(
        f"→ Category: {category}"
    )

    print(
        f"→ Confidence: "
        f"{confidence * 100:.2f}%"
    )

    print()


# ==========================================================
# FINAL SUMMARY
# ==========================================================

print("========================================")
print("TRAINING SUMMARY")
print("========================================")


print(
    f"\nDataset Size: {len(data)}"
)


print(
    f"Categories: {y.nunique()}"
)


print(
    f"Train Samples: {len(X_train)}"
)


print(
    f"Test Samples: {len(X_test)}"
)


print(
    f"Test Accuracy: "
    f"{accuracy * 100:.2f}%"
)


print(
    f"Average CV Accuracy: "
    f"{average_cv_accuracy * 100:.2f}%"
)


print(
    f"CV Standard Deviation: "
    f"{cv_standard_deviation * 100:.2f}%"
)


print(
    "\nTraining and evaluation completed successfully."
)