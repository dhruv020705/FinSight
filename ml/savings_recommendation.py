
# ============================================================
# FINSIGHT - PERSONALIZED SAVINGS RECOMMENDATIONS
# ============================================================

from collections import defaultdict
from datetime import date, datetime
from math import ceil, isfinite
from typing import Any


# ============================================================
# HELPERS
# ============================================================

def money(value: float) -> float:
    return round(float(value), 2)


def parse_date(value: Any):
    try:
        return date.fromisoformat(str(value)[:10])
    except (TypeError, ValueError):
        return None


def months_until(target_date: date, today: date) -> int:
    days = (target_date - today).days

    if days <= 0:
        return 0

    return max(1, ceil(days / 30.44))


# ============================================================
# MAIN RECOMMENDATION ENGINE
# ============================================================

def generate_savings_recommendations(
    transactions: list[dict[str, Any]],
    goals: list[dict[str, Any]],
) -> dict[str, Any]:

    today = date.today()

    monthly_income = defaultdict(float)
    monthly_expenses = defaultdict(float)

    # --------------------------------------------------------
    # 1. ANALYZE TRANSACTIONS
    # --------------------------------------------------------

    for transaction in transactions:

        transaction_date = parse_date(
            transaction.get("transaction_date")
        )

        if transaction_date is None:
            continue

        if transaction_date > today:
            continue

        try:
            amount = float(transaction.get("amount", 0))
        except (TypeError, ValueError):
            continue

        if not isfinite(amount) or amount <= 0:
            continue

        month = transaction_date.strftime("%Y-%m")
        transaction_type = str(
            transaction.get("type", "")
        ).strip().lower()

        if transaction_type == "income":
            monthly_income[month] += amount

        elif transaction_type == "expense":
            monthly_expenses[month] += amount

    # --------------------------------------------------------
    # 2. CALCULATE MONTHLY AVERAGES
    # --------------------------------------------------------

    # Analyze the latest 3 complete calendar months.
    months = []

    for offset in range(1, 4):
        year = today.year
        month = today.month - offset

        while month <= 0:
            month += 12
            year -= 1

        months.append(f"{year:04d}-{month:02d}")

    total_income = sum(
        monthly_income[month] for month in months
    )

    total_expenses = sum(
        monthly_expenses[month] for month in months
    )

    average_income = total_income / len(months)
    average_expenses = total_expenses / len(months)

    monthly_surplus = max(
        0.0,
        average_income - average_expenses
    )

    # --------------------------------------------------------
    # 3. ANALYZE SAVINGS GOALS
    # --------------------------------------------------------

    recommendations = []
    total_required_monthly = 0.0

    for goal in goals:

        try:
            target = float(goal.get("target_amount", 0))
            saved = float(goal.get("current_amount", 0))
        except (TypeError, ValueError):
            continue

        if (
            not isfinite(target)
            or not isfinite(saved)
            or target <= 0
            or saved < 0
        ):
            continue

        deadline = parse_date(goal.get("target_date"))

        if deadline is None:
            continue

        remaining = max(0.0, target - saved)
        months_remaining = months_until(
            deadline, today
        )

        completed = remaining == 0

        if completed:
            required_monthly = 0.0
            status = "completed"

        elif months_remaining == 0:
            required_monthly = 0.0
            status = "overdue"

        else:
            required_monthly = (
                remaining / months_remaining
            )
            status = "pending"

            total_required_monthly += required_monthly

        recommendations.append({
            "goal_id": goal.get("id"),
            "goal_name": goal.get("goal_name", "Savings Goal"),
            "target_amount": money(target),
            "current_amount": money(saved),
            "remaining_amount": money(remaining),
            "target_date": deadline.isoformat(),
            "months_remaining": months_remaining,
            "required_monthly_savings": money(
                required_monthly
            ),
            "status": status,
        })

    # --------------------------------------------------------
    # 4. EVALUATE COMBINED GOAL AFFORDABILITY
    # --------------------------------------------------------

    total_required_monthly = money(
        total_required_monthly
    )

    available_surplus = money(monthly_surplus)

    combined_goals_achievable = (
        total_required_monthly <= available_surplus
    )

    # --------------------------------------------------------
    # 5. GENERATE PERSONALIZED INSIGHTS
    # --------------------------------------------------------

    for recommendation in recommendations:

        status = recommendation["status"]
        required = recommendation[
            "required_monthly_savings"
        ]

        if status == "completed":
            insight = (
                "Congratulations! You have reached "
                "your savings target."
            )

        elif status == "overdue":
            insight = (
                "Your target date has passed. "
                "Consider extending the deadline."
            )

        elif average_income == 0:
            insight = (
                "Not enough recorded income to assess "
                "this goal reliably. Add income transactions."
            )

        elif total_required_monthly > available_surplus:
            shortfall = (
                total_required_monthly -
                available_surplus
            )

            insight = (
                f"Your active goals require "
                f"₹{total_required_monthly:,.2f} per month, "
                f"which exceeds your estimated available "
                f"surplus by ₹{shortfall:,.2f}. "
                "Consider reducing expenses, increasing "
                "income, or extending goal deadlines."
            )

        else:
            insight = (
                f"Set aside approximately ₹{required:,.2f} "
                "per month toward this goal. "
                "Your estimated surplus can support "
                "your combined active savings targets."
            )

        recommendation["insight"] = insight

    # --------------------------------------------------------
    # 6. RETURN RESULTS
    # --------------------------------------------------------

    return {
        "status": "success",
        "analysis_months": months,
        "average_monthly_income": money(average_income),
        "average_monthly_expenses": money(average_expenses),
        "estimated_monthly_surplus": available_surplus,
        "total_required_monthly_savings": (
            total_required_monthly
        ),
        "combined_goals_achievable": (
            combined_goals_achievable
        ),
        "recommendations": recommendations,
        "disclaimer": (
            "Estimates are based on recorded transactions "
            "from the last three complete months. "
            "They do not represent guaranteed savings."
        ),
    }


# ============================================================
# LOCAL TEST
# ============================================================

if __name__ == "__main__":

    from pprint import pprint

    today = date.today()

    test_transactions = []

    for offset in range(1, 4):
        year = today.year
        month = today.month - offset

        while month <= 0:
            month += 12
            year -= 1

        transaction_date = (
            f"{year:04d}-{month:02d}-15"
        )

        test_transactions.extend([
            {
                "type": "income",
                "amount": 50000,
                "transaction_date": transaction_date,
            },
            {
                "type": "expense",
                "amount": 30000,
                "transaction_date": transaction_date,
            },
        ])

    future_year = today.year + 1

    test_goals = [
        {
            "id": "test-goal-1",
            "goal_name": "MacBook",
            "target_amount": 60000,
            "current_amount": 12000,
            "target_date": f"{future_year}-04-10",
        }
    ]

    pprint(
        generate_savings_recommendations(
            test_transactions,
            test_goals,
        )
    )
