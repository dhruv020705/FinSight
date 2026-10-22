import os
import joblib


# ==========================================================
# PATHS
# ==========================================================

BASE_DIR = os.path.dirname(
    os.path.abspath(__file__)
)

MODEL_PATH = os.path.join(
    BASE_DIR,
    "models",
    "category_model.pkl",
)

VECTORIZER_PATH = os.path.join(
    BASE_DIR,
    "models",
    "tfidf_vectorizer.pkl",
)


# ==========================================================
# LOAD MODEL
# ==========================================================

model = joblib.load(MODEL_PATH)

vectorizer = joblib.load(
    VECTORIZER_PATH
)

print("\nModel loaded successfully!")


# ==========================================================
# REAL-WORLD TEST DATA
# ==========================================================

test_transactions = [
    "Paid 450 to Zomato",
    "Rapido bike to college",
    "Received September pay",
    "Bought a hoodie online",
    "Recharge done for my Airtel number",
    "Medicines for fever",
    "Watched a movie with friends",
    "Paid Swiggy 320",
    "Cab to railway station",
    "Company credited my monthly pay",
    "Purchased a keyboard online",
    "Paid Jio fiber bill",
    "Doctor visit for fever",
    "Booked tickets for Avengers",
]


# ==========================================================
# TRANSFORM DATA
# ==========================================================

vectors = vectorizer.transform(
    test_transactions
)


# ==========================================================
# PREDICTIONS
# ==========================================================

predictions = model.predict(vectors)

probabilities = model.predict_proba(
    vectors
)


# ==========================================================
# DISPLAY RESULTS
# ==========================================================

print("\n========================================")
print("REAL-WORLD MODEL TEST")
print("========================================\n")


for description, prediction, probability in zip(
    test_transactions,
    predictions,
    probabilities,
):

    confidence = max(probability)

    print(f"Transaction : {description}")

    print(f"Prediction  : {prediction}")

    print(
        f"Confidence  : "
        f"{confidence * 100:.2f}%"
    )

    # Confidence analysis

    if confidence >= 0.60:
        print("Status      : HIGH CONFIDENCE")

    elif confidence >= 0.40:
        print("Status      : MEDIUM CONFIDENCE")

    else:
        print("Status      : LOW CONFIDENCE")

    print("-" * 50)