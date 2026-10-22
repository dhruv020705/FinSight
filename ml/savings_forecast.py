
from collections import defaultdict
from datetime import date
from calendar import monthrange
from math import ceil, isfinite
from typing import Any


def parse_date(value: Any):
    try:
        return date.fromisoformat(str(value)[:10])
    except (TypeError, ValueError):
        return None


def add_months(start: date, months: int) -> date:
    month_index = start.year * 12 + start.month - 1 + months
    year, month_zero = divmod(month_index, 12)
    month = month_zero + 1
    day = min(start.day, monthrange(year, month)[1])
    return date(year, month, day)


def forecast_savings_goals(
    goals: list[dict[str, Any]],
    contributions: list[dict[str, Any]],
) -> dict[str, Any]:

    today = date.today()
    contributions_by_goal = defaultdict(list)

    for contribution in contributions:
        goal_id = str(contribution.get("goal_id", ""))
        contribution_date = parse_date(
            contribution.get("contribution_date")
        )

        try:
            amount = float(contribution.get("amount", 0))
        except (TypeError, ValueError):
            continue

        if (
            not goal_id
            or contribution_date is None
            or contribution_date > today
            or not isfinite(amount)
            or amount <= 0
        ):
            continue

        contributions_by_goal[goal_id].append({
            "amount": amount,
            "date": contribution_date,
        })

    # Last three complete calendar months
    analysis_months = []

    for offset in range(1, 4):
        month_date = add_months(
            today.replace(day=1),
            -offset
        )

        analysis_months.append(
            month_date.strftime("%Y-%m")
        )

    results = []

    for goal in goals:
        goal_id = str(goal.get("id", ""))

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

        # Calculate required savings independently of contribution history
        days_remaining = (deadline - today).days

        months_remaining = (
            max(1, ceil(days_remaining / 30.44))
            if days_remaining > 0
            else 0
        )

        required_monthly_savings = (
            remaining / months_remaining
            if months_remaining > 0
            else 0.0
        )

        monthly_totals = defaultdict(float)

        for contribution in contributions_by_goal[goal_id]:
            month = contribution["date"].strftime("%Y-%m")
            monthly_totals[month] += contribution["amount"]

        recent_monthly_savings = [
            monthly_totals[month]
            for month in analysis_months
        ]

        average_monthly_savings = (
            sum(recent_monthly_savings) / 3
        )

        # Completed goals
        if remaining == 0:
            status = "completed"
            months_to_goal = 0
            projected_date = today.isoformat()

            insight = (
                "Congratulations! Your savings goal "
                "has already been achieved."
            )

        # No recent contribution activity
        elif average_monthly_savings <= 0:
            status = "insufficient_data"
            months_to_goal = None
            projected_date = None

            insight = (
                "No contributions were recorded in the "
                "last three complete months. Add regular "
                "contributions to estimate a completion date."
            )

        else:
            months_to_goal = ceil(
                remaining / average_monthly_savings
            )

            projected = add_months(
                today,
                months_to_goal
            )

            projected_date = projected.isoformat()

            if projected <= deadline:
                status = "on_track"

                insight = (
                    f"At your recent average savings pace "
                    f"of ₹{average_monthly_savings:,.2f} "
                    f"per month, you may reach this goal "
                    f"by {projected_date}."
                )
            else:
                status = "behind_schedule"

                insight = (
                    f"At your recent average savings pace "
                    f"of ₹{average_monthly_savings:,.2f} "
                    f"per month, you may reach this goal "
                    f"around {projected_date}, which is "
                    "later than your target deadline."
                )

        results.append({
            "goal_id": goal_id,
            "goal_name": goal.get(
                "goal_name", "Savings Goal"
            ),
            "target_amount": round(target, 2),
            "current_amount": round(saved, 2),
            "remaining_amount": round(remaining, 2),
            "target_date": deadline.isoformat(),
            "average_monthly_savings": round(
                average_monthly_savings, 2
            ),
            "months_to_goal": months_to_goal,
            "projected_completion_date": projected_date,
            "status": status,
            "insight": insight,
            "months_remaining": months_remaining,
            "required_monthly_savings": round(required_monthly_savings, 2),
        })

    return {
        "status": "success",
        "model": "Historical Savings Pace Forecast",
        "analysis_months": analysis_months,
        "goals_analyzed": len(results),
        "forecasts": results,
        "disclaimer": (
            "Forecasts assume your recent savings pace "
            "continues. Actual completion dates may vary."
        ),
    }


if __name__ == "__main__":
    from pprint import pprint

    today = date.today()

    test_goals = [{
        "id": "goal-1",
        "goal_name": "MacBook",
        "target_amount": 60000,
        "current_amount": 24000,
        "target_date": add_months(
            today, 8
        ).isoformat(),
    }]

    test_contributions = []

    for offset in range(1, 4):
        month_date = add_months(
            today.replace(day=1),
            -offset
        )

        test_contributions.append({
            "goal_id": "goal-1",
            "amount": 6000,
            "contribution_date": month_date.isoformat(),
        })

    pprint(
        forecast_savings_goals(
            test_goals,
            test_contributions
        )
    )
