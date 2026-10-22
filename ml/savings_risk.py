
from datetime import date
from math import ceil, isfinite
from typing import Any

from savings_forecast import (
    forecast_savings_goals,
    parse_date,
)


def analyze_savings_risk(
    goals: list[dict[str, Any]],
    contributions: list[dict[str, Any]],
) -> dict[str, Any]:

    today = date.today()

    forecast_result = forecast_savings_goals(
        goals=goals,
        contributions=contributions,
    )

    results = []

    for forecast in forecast_result["forecasts"]:

        remaining = float(
            forecast["remaining_amount"]
        )

        current_pace = float(
            forecast["average_monthly_savings"]
        )

        deadline = parse_date(
            forecast["target_date"]
        )

        if deadline is None:
            continue

        days_remaining = (
            deadline - today
        ).days

        months_remaining = (
            max(1, ceil(days_remaining / 30.44))
            if days_remaining > 0
            else 0
        )

        # ====================================================
        # COMPLETED GOAL
        # ====================================================

        if remaining <= 0:
            risk_level = "completed"
            required_monthly = 0.0
            additional_monthly = 0.0
            savings_gap = 0.0

            recommendation = (
                "Congratulations! You have achieved "
                "your savings goal."
            )

        # ====================================================
        # OVERDUE GOAL
        # ====================================================

        elif months_remaining == 0:
            risk_level = "overdue"
            required_monthly = 0.0
            additional_monthly = 0.0
            savings_gap = remaining

            recommendation = (
                "Your target deadline has passed. "
                "Consider extending the deadline "
                "or revising your savings target."
            )

        else:
            # =================================================
            # REQUIRED MONTHLY SAVINGS
            # =================================================

            required_monthly = (
                remaining / months_remaining
            )

            additional_monthly = max(
                0.0,
                required_monthly - current_pace
            )

            projected_savings = (
                current_pace * months_remaining
            )

            savings_gap = max(
                0.0,
                remaining - projected_savings
            )

            # =================================================
            # RISK CLASSIFICATION
            # =================================================

            if current_pace >= required_monthly:
                risk_level = "low"

                recommendation = (
                    "You are currently saving enough "
                    "to meet your target deadline. "
                    "Maintain your savings pace."
                )

            elif current_pace <= 0:
                risk_level = "high"

                recommendation = (
                    f"You need to save approximately "
                    f"₹{required_monthly:,.2f} per month "
                    "to reach your goal. No savings "
                    "contributions were recorded in the "
                    "last three complete months."
                )

            else:
                gap_ratio = (
                    additional_monthly /
                    required_monthly
                )

                if gap_ratio <= 0.20:
                    risk_level = "medium"

                else:
                    risk_level = "high"

                recommendation = (
                    f"Increase your monthly savings "
                    f"by approximately "
                    f"₹{additional_monthly:,.2f} "
                    f"to reach the required pace of "
                    f"₹{required_monthly:,.2f} "
                    "per month."
                )

        results.append({
            "goal_id": forecast["goal_id"],
            "goal_name": forecast["goal_name"],
            "target_amount": forecast["target_amount"],
            "current_amount": forecast["current_amount"],
            "remaining_amount": round(
                remaining, 2
            ),
            "target_date": forecast["target_date"],
            "months_remaining": months_remaining,
            "current_monthly_pace": round(
                current_pace, 2
            ),
            "required_monthly_savings": round(
                required_monthly, 2
            ),
            "additional_monthly_needed": round(
                additional_monthly, 2
            ),
            "estimated_savings_gap": round(
                savings_gap, 2
            ),
            "risk_level": risk_level,
            "recommendation": recommendation,
        })

    return {
        "status": "success",
        "analysis_method": (
            "Historical Contribution Pace "
            "and Deadline Gap Analysis"
        ),
        "goals_analyzed": len(results),
        "risk_analysis": results,
        "disclaimer": (
            "Risk levels are rule-based estimates "
            "derived from recent contributions and "
            "target deadlines. They do not account "
            "for future income or unexpected expenses."
        ),
    }


if __name__ == "__main__":
    from pprint import pprint
    from savings_forecast import add_months

    today = date.today()

    test_goals = [{
        "id": "goal-1",
        "goal_name": "Laptop",
        "target_amount": 60000,
        "current_amount": 24000,
        "target_date": add_months(
            today, 6
        ).isoformat(),
    }]

    contributions = []

    for offset in range(1, 4):
        month_date = add_months(
            today.replace(day=1),
            -offset
        )

        contributions.append({
            "goal_id": "goal-1",
            "amount": 3000,
            "contribution_date": month_date.isoformat(),
        })

    pprint(
        analyze_savings_risk(
            goals=test_goals,
            contributions=contributions,
        )
    )
