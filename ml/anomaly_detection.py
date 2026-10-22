
# ============================================================
# FINSIGHT - CATEGORY-AWARE ANOMALY DETECTION
# Machine Learning Algorithm: Isolation Forest
# ============================================================

from collections import defaultdict
from typing import Any

import numpy as np
from sklearn.ensemble import IsolationForest


# ============================================================
# MODEL SETTINGS
# ============================================================

MIN_TRANSACTIONS = 10

MIN_CATEGORY_TRANSACTIONS = 5
MIN_ML_TRANSACTIONS = 8

STATISTICAL_THRESHOLD = 3.0

CONTAMINATION = 0.10
RANDOM_STATE = 42

# ============================================================
# HELPER FUNCTIONS
# ============================================================

def round_money(value: float) -> float:
    return round(float(value), 2)


def normalize_category(category: Any) -> str:
    if category is None:
        return "Other"

    category = str(category).strip()

    return category if category else "Other"


# ============================================================
# MAIN ANOMALY DETECTION FUNCTION
# ============================================================

def detect_spending_anomalies(
    transactions: list[dict[str, Any]],
) -> dict[str, Any]:

    # --------------------------------------------------------
    # 1. FILTER VALID EXPENSE TRANSACTIONS
    # --------------------------------------------------------

    expenses = []

    for transaction in transactions:

        if str(transaction.get("type", "")).lower() != "expense":
            continue

        try:
            amount = float(transaction.get("amount", 0))
        except (TypeError, ValueError):
            continue

        if not np.isfinite(amount) or amount <= 0:
            continue

        expenses.append({
            "id": transaction.get("id"),
            "amount": amount,
            "category": normalize_category(
                transaction.get("category")
            ),
            "description": transaction.get("description"),
            "transaction_date": transaction.get(
                "transaction_date"
            ),
        })

    total_transactions = len(expenses)

    # --------------------------------------------------------
    # 2. CHECK MINIMUM TRANSACTION HISTORY
    # --------------------------------------------------------

    if total_transactions < MIN_TRANSACTIONS:

        return {
            "status": "insufficient_data",
            "message": (
                f"At least {MIN_TRANSACTIONS} valid expense "
                "transactions are required for anomaly detection."
            ),
            "transactions_analyzed": total_transactions,
            "anomalies_detected": 0,
            "anomalies": [],
        }

    # --------------------------------------------------------
    # 3. GROUP EXPENSES BY CATEGORY
    # --------------------------------------------------------

    categories = defaultdict(list)

    for expense in expenses:
        categories[expense["category"]].append(expense)

    # --------------------------------------------------------
    # 4. CALCULATE OVERALL TYPICAL TRANSACTION
    # --------------------------------------------------------

    all_amounts = np.array(
        [expense["amount"] for expense in expenses],
        dtype=float,
    )

    global_median = float(np.median(all_amounts))

    # --------------------------------------------------------
    # 5. INITIALIZE RESULTS
    # --------------------------------------------------------

    anomalies = []

    categories_analyzed = []
    categories_skipped = []

    category_typical_amounts = {}

    
    # ========================================================
    # 6. HYBRID CATEGORY-AWARE ANOMALY DETECTION
    # ========================================================

    for category, category_expenses in categories.items():

        if len(category_expenses) < MIN_CATEGORY_TRANSACTIONS:
            categories_skipped.append(category)
            continue

        amounts = np.array(
            [expense["amount"] for expense in category_expenses],
            dtype=float,
        )

        category_median = float(np.median(amounts))

        category_typical_amounts[category] = round_money(
            category_median
        )

        categories_analyzed.append(category)

        # ----------------------------------------------------
        # ISOLATION FOREST
        # ----------------------------------------------------

        predictions = np.ones(len(amounts), dtype=int)
        scores = np.zeros(len(amounts), dtype=float)

        if len(amounts) >= MIN_ML_TRANSACTIONS:

            features = np.log1p(amounts).reshape(-1, 1)

            model = IsolationForest(
                n_estimators=100,
                contamination=CONTAMINATION,
                random_state=RANDOM_STATE,
            )

            predictions = model.fit_predict(features)
            scores = model.decision_function(features)

        # ----------------------------------------------------
        # CHECK EACH TRANSACTION
        # ----------------------------------------------------

        for index, transaction in enumerate(category_expenses):

            amount = transaction["amount"]

            ratio = amount / category_median

            # ML-based detection
            ml_anomaly = (
                len(amounts) >= MIN_ML_TRANSACTIONS
                and predictions[index] == -1
                and amount > category_median
            )

            # Statistical detection
            statistical_anomaly = (
                ratio > STATISTICAL_THRESHOLD
            )

            # Flag when either method detects an anomaly
            if not (ml_anomaly or statistical_anomaly):
                continue

            # Severity
            if ratio >= 5:
                severity = "high"
            elif ratio >= 2:
                severity = "medium"
            else:
                severity = "low"

            if ml_anomaly and statistical_anomaly:
                detection_method = "Hybrid"
            elif ml_anomaly:
                detection_method = "Isolation Forest"
            else:
                detection_method = "Statistical Rule"

            insight = (
                f"This {category} expense of ₹{amount:,.2f} "
                f"is {ratio:.1f} times the typical "
                f"{category} expense of ₹{category_median:,.2f}. "
                f"Detected using {detection_method}."
            )

            anomalies.append({
                "id": transaction["id"],
                "amount": round_money(amount),
                "category": category,
                "description": transaction["description"],
                "transaction_date": transaction["transaction_date"],
                "severity": severity,
                "anomaly_score": round(float(scores[index]), 4)
                    if len(amounts) >= MIN_ML_TRANSACTIONS
                    else None,
                "times_typical_spending": round(ratio, 2),
                "category_median": round_money(category_median),
                "detection_method": detection_method,
                "insight": insight,
            })


    # --------------------------------------------------------
    # 7. SORT ANOMALIES BY AMOUNT (HIGHEST FIRST)
    # --------------------------------------------------------

    anomalies.sort(
        key=lambda item: item["amount"],
        reverse=True,
    )

    # --------------------------------------------------------
    # 8. GENERATE RESPONSE
    # --------------------------------------------------------

    if not categories_analyzed:

        message = (
            "Not enough transactions in individual categories. "
            f"At least {MIN_CATEGORY_TRANSACTIONS} expense "
            "transactions per category are required."
        )

    elif anomalies:

        message = (
            f"{len(anomalies)} unusually high expense "
            "transaction(s) detected."
        )

    else:

        message = (
            "No unusually high spending detected "
            "in the analyzed categories."
        )

    return {
        "status": "success",
        "model": "Category-Aware Isolation Forest",
        "message": message,

        # Overall statistics
        "transactions_analyzed": total_transactions,
        "anomalies_detected": len(anomalies),

        # Overall typical transaction
        "typical_transaction_amount": round_money(
            global_median
        ),

        # Category-wise typical transactions
        "category_typical_amounts": (
            category_typical_amounts
        ),

        # Category analysis details
        "categories_analyzed": categories_analyzed,
        "categories_skipped": categories_skipped,

        # Detected unusual expenses
        "anomalies": anomalies,
    }


# ============================================================
# LOCAL TEST
# ============================================================

if __name__ == "__main__":

    # Normal Food expenses + unusually large Food expense
    food_amounts = [
        250, 320, 450, 500, 600,
        700, 350, 400, 550, 650,
        300, 480, 520, 750, 9000,
    ]

    # Regular Rent expenses
    rent_amounts = [
        15000, 15000, 15200, 15000,
        15100, 15000, 15000, 15100,
    ]

    test_transactions = []

    # Add Food transactions
    for index, amount in enumerate(food_amounts):

        test_transactions.append({
            "id": index + 1,
            "type": "expense",
            "amount": amount,
            "category": "Food",
            "description": "Food expense",
            "transaction_date": "2026-09-15",
        })

    # Add Rent transactions
    for index, amount in enumerate(rent_amounts):

        test_transactions.append({
            "id": len(food_amounts) + index + 1,
            "type": "expense",
            "amount": amount,
            "category": "Rent",
            "description": "Rent payment",
            "transaction_date": "2026-09-15",
        })

    # Run anomaly detection
    result = detect_spending_anomalies(
        test_transactions
    )

    # Display results
    from pprint import pprint

    pprint(result)
