from collections import defaultdict
from datetime import datetime
from typing import Any


# ============================================================
# SETTINGS
# ============================================================

# Minimum number of months we prefer before considering
# recommendations reasonably personalized.
MIN_HISTORY_MONTHS = 2

# Default reduction applied to categories where spending
# is relatively stable.
DEFAULT_REDUCTION_RATE = 0.10

# Larger reduction for discretionary categories.
DISCRETIONARY_REDUCTION_RATE = 0.15

# Categories where aggressive reductions generally don't make sense.
ESSENTIAL_CATEGORIES = {
    "rent",
    "housing",
    "utilities",
    "electricity",
    "water",
    "insurance",
    "medical",
    "healthcare",
    "education",
}

# Categories where a slightly stronger savings target can be useful.
DISCRETIONARY_CATEGORIES = {
    "shopping",
    "entertainment",
    "food",
    "dining",
    "restaurants",
    "subscriptions",
    "travel",
}


# ============================================================
# HELPERS
# ============================================================

def normalize_category(category: Any) -> str:
    """
    Convert category values into a clean string.
    """

    if category is None:
        return "Other"

    category = str(category).strip()

    if not category:
        return "Other"

    return category


def parse_transaction_month(transaction_date: Any) -> str | None:
    """
    Convert a transaction date into YYYY-MM format.

    Supports values such as:
    2026-09-15
    2026-09-15T10:30:00
    """

    if not transaction_date:
        return None

    try:
        value = str(transaction_date)

        date = datetime.fromisoformat(
            value.replace("Z", "+00:00")
        )

        return date.strftime("%Y-%m")

    except (ValueError, TypeError):
        return None


def round_money(value: float) -> float:
    return round(float(value), 2)


# ============================================================
# MAIN RECOMMENDATION FUNCTION
# ============================================================

def generate_budget_recommendations(
    transactions: list[dict[str, Any]],
) -> dict[str, Any]:

    # --------------------------------------------------------
    # 1. KEEP EXPENSE TRANSACTIONS ONLY
    # --------------------------------------------------------

    expenses = [
        transaction
        for transaction in transactions
        if str(transaction.get("type", "")).lower() == "expense"
    ]

    if not expenses:
        return {
            "status": "insufficient_data",
            "message": "No expense transactions found.",
            "months_analyzed": 0,
            "recommendations": [],
            "total_average_spending": 0,
            "total_recommended_budget": 0,
            "potential_monthly_saving": 0,
        }

    # --------------------------------------------------------
    # 2. GROUP SPENDING BY CATEGORY + MONTH
    # --------------------------------------------------------

    category_monthly_spending: dict[
        str,
        dict[str, float]
    ] = defaultdict(lambda: defaultdict(float))

    months = set()

    for transaction in expenses:

        month = parse_transaction_month(
            transaction.get("transaction_date")
        )

        if month is None:
            continue

        category = normalize_category(
            transaction.get("category")
        )

        try:
            amount = float(transaction.get("amount", 0))
        except (TypeError, ValueError):
            amount = 0

        if amount < 0:
            amount = abs(amount)

        category_monthly_spending[category][month] += amount
        months.add(month)

    sorted_months = sorted(months)

    if not sorted_months:
        return {
            "status": "insufficient_data",
            "message": "No valid transaction dates were found.",
            "months_analyzed": 0,
            "recommendations": [],
            "total_average_spending": 0,
            "total_recommended_budget": 0,
            "potential_monthly_saving": 0,
        }

    # --------------------------------------------------------
    # 3. CALCULATE CATEGORY RECOMMENDATIONS
    # --------------------------------------------------------

    recommendations = []

    for category, monthly_values in category_monthly_spending.items():

        # Include zero-spending months so averages represent
        # the complete analyzed period.
        values = [
            monthly_values.get(month, 0)
            for month in sorted_months
        ]

        average_spending = sum(values) / len(sorted_months)

        latest_spending = monthly_values.get(
            sorted_months[-1],
            0,
        )

        category_lower = category.lower()

        # ----------------------------------------------------
        # Recommendation strategy
        # ----------------------------------------------------

        if category_lower in ESSENTIAL_CATEGORIES:

            reduction_rate = 0.05
            category_type = "essential"

        elif category_lower in DISCRETIONARY_CATEGORIES:

            reduction_rate = DISCRETIONARY_REDUCTION_RATE
            category_type = "discretionary"

        else:

            reduction_rate = DEFAULT_REDUCTION_RATE
            category_type = "standard"

        recommended_budget = average_spending * (
            1 - reduction_rate
        )

        potential_saving = max(
            average_spending - recommended_budget,
            0,
        )

        # ----------------------------------------------------
        # Trend
        # ----------------------------------------------------

        if len(values) >= 2:

            previous = values[-2]

            if latest_spending > previous:
                trend = "increasing"

            elif latest_spending < previous:
                trend = "decreasing"

            else:
                trend = "stable"

        else:
            trend = "unknown"

        # ----------------------------------------------------
        # Human-readable insight
        # ----------------------------------------------------

        if category_type == "essential":

            insight = (
                f"{category} appears to be an essential category. "
                "A conservative budget adjustment is suggested."
            )

        elif category_type == "discretionary":

            insight = (
                f"{category} may offer additional opportunities "
                "to reduce discretionary spending."
            )

        else:

            insight = (
                f"A moderate budget target is suggested for "
                f"{category} based on your historical average."
            )

        recommendations.append(
            {
                "category": category,
                "category_type": category_type,

                "average_monthly_spending": round_money(
                    average_spending
                ),

                "latest_month_spending": round_money(
                    latest_spending
                ),

                "recommended_budget": round_money(
                    recommended_budget
                ),

                "potential_monthly_saving": round_money(
                    potential_saving
                ),

                "reduction_percentage": round(
                    reduction_rate * 100,
                    1,
                ),

                "trend": trend,

                "insight": insight,
            }
        )

    # --------------------------------------------------------
    # 4. SORT BIGGEST SPENDING CATEGORIES FIRST
    # --------------------------------------------------------

    recommendations.sort(
        key=lambda item: item["average_monthly_spending"],
        reverse=True,
    )

    # --------------------------------------------------------
    # 5. TOTALS
    # --------------------------------------------------------

    total_average = sum(
        item["average_monthly_spending"]
        for item in recommendations
    )

    total_budget = sum(
        item["recommended_budget"]
        for item in recommendations
    )

    total_saving = sum(
        item["potential_monthly_saving"]
        for item in recommendations
    )

    # --------------------------------------------------------
    # 6. HISTORY QUALITY
    # --------------------------------------------------------

    months_analyzed = len(sorted_months)

    if months_analyzed >= 6:
        history_quality = "good"

    elif months_analyzed >= MIN_HISTORY_MONTHS:
        history_quality = "limited"

    else:
        history_quality = "very_limited"

    # --------------------------------------------------------
    # FINAL RESPONSE
    # --------------------------------------------------------

    return {
        "status": "success",

        "months_analyzed": months_analyzed,

        "history_quality": history_quality,

        "period": {
            "from": sorted_months[0],
            "to": sorted_months[-1],
        },

        "total_average_spending": round_money(
            total_average
        ),

        "total_recommended_budget": round_money(
            total_budget
        ),

        "potential_monthly_saving": round_money(
            total_saving
        ),

        "recommendations": recommendations,
    }


# ============================================================
# LOCAL TEST
# ============================================================

if __name__ == "__main__":

    test_transactions = [
        {
            "type": "expense",
            "amount": 5000,
            "category": "Food",
            "transaction_date": "2026-06-10",
        },
        {
            "type": "expense",
            "amount": 7000,
            "category": "Food",
            "transaction_date": "2026-07-10",
        },
        {
            "type": "expense",
            "amount": 8000,
            "category": "Food",
            "transaction_date": "2026-08-10",
        },
        {
            "type": "expense",
            "amount": 4000,
            "category": "Transport",
            "transaction_date": "2026-06-15",
        },
        {
            "type": "expense",
            "amount": 4500,
            "category": "Transport",
            "transaction_date": "2026-07-15",
        },
        {
            "type": "expense",
            "amount": 5500,
            "category": "Transport",
            "transaction_date": "2026-08-15",
        },
        {
            "type": "expense",
            "amount": 10000,
            "category": "Shopping",
            "transaction_date": "2026-06-20",
        },
        {
            "type": "expense",
            "amount": 8000,
            "category": "Shopping",
            "transaction_date": "2026-07-20",
        },
        {
            "type": "expense",
            "amount": 6000,
            "category": "Shopping",
            "transaction_date": "2026-08-20",
        },
    ]

    result = generate_budget_recommendations(
        test_transactions
    )

    from pprint import pprint

    pprint(result)