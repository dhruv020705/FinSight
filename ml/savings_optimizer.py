
from datetime import date, timedelta
from math import ceil, isfinite
from typing import Any


PRIORITY_RANK = {
    "high": 0,
    "medium": 1,
    "low": 2,
}

VALID_STRATEGIES = {
    "deadline_first",
    "priority_first",
    "balanced",
}


def parse_date(value: Any):
    try:
        return date.fromisoformat(str(value)[:10])
    except (TypeError, ValueError):
        return None


def to_paise(value: float) -> int:
    return round(value * 100)


def allocate_balanced(
    goals: list[dict[str, Any]],
    budget_paise: int,
) -> None:
    """
    Proportional allocation using integer paise.

    No goal receives more than its monthly requirement.
    Any rounding remainder is assigned deterministically.
    """

    total_required = sum(
        goal["required_paise"] for goal in goals
    )

    if total_required == 0:
        return

    available = min(budget_paise, total_required)

    # Initial proportional allocations.
    for goal in goals:
        numerator = (
            available * goal["required_paise"]
        )

        goal["allocated_paise"] = (
            numerator // total_required
        )

        goal["_remainder"] = (
            numerator % total_required
        )

    leftover = available - sum(
        goal["allocated_paise"] for goal in goals
    )

    # Assign leftover paise to largest fractional shares.
    ranked = sorted(
        goals,
        key=lambda goal: (
            -goal["_remainder"],
            goal["months_remaining"],
            goal["goal_id"],
        ),
    )

    for goal in ranked:
        if leftover <= 0:
            break

        if (
            goal["allocated_paise"]
            < goal["required_paise"]
        ):
            goal["allocated_paise"] += 1
            leftover -= 1

    for goal in goals:
        goal.pop("_remainder", None)


def optimize_savings_allocation(
    goals: list[dict[str, Any]],
    monthly_budget: float,
    strategy: str = "deadline_first",
) -> dict[str, Any]:

    today = date.today()

    if strategy not in VALID_STRATEGIES:
        raise ValueError(
            "Invalid allocation strategy."
        )

    if (
        not isfinite(monthly_budget)
        or monthly_budget < 0
    ):
        raise ValueError(
            "Monthly budget must be non-negative."
        )

    budget_paise = to_paise(monthly_budget)

    active_goals = []

    for goal in goals:
        try:
            target = float(
                goal.get("target_amount", 0)
            )
            saved = float(
                goal.get("current_amount", 0)
            )
        except (TypeError, ValueError):
            continue

        deadline = parse_date(
            goal.get("target_date")
        )

        if (
            deadline is None
            or not isfinite(target)
            or not isfinite(saved)
            or target <= 0
            or saved < 0
        ):
            continue

        remaining_paise = max(
            0,
            to_paise(target - saved)
        )

        if remaining_paise == 0:
            continue

        days_remaining = (
            deadline - today
        ).days

        months_remaining = (
            max(1, ceil(days_remaining / 30.44))
            if days_remaining > 0
            else 0
        )

        planning_months = max(
            1, months_remaining
        )

        required_paise = ceil(
            remaining_paise / planning_months
        )

        priority = str(
            goal.get("priority", "medium")
        ).lower()

        if priority not in PRIORITY_RANK:
            priority = "medium"

        active_goals.append({
            "goal_id": str(goal.get("id", "")),
            "goal_name": str(
                goal.get("goal_name", "Savings Goal")
            ),
            "priority_level": priority,
            "remaining_paise": remaining_paise,
            "target_date": deadline.isoformat(),
            "months_remaining": months_remaining,
            "required_paise": required_paise,
            "allocated_paise": 0,
        })

    # ========================================================
    # STRATEGY SELECTION
    # ========================================================

    if strategy == "deadline_first":
        active_goals.sort(
            key=lambda goal: (
                goal["months_remaining"],
                goal["target_date"],
                goal["goal_id"],
            )
        )

    elif strategy == "priority_first":
        active_goals.sort(
            key=lambda goal: (
                PRIORITY_RANK[
                    goal["priority_level"]
                ],
                goal["months_remaining"],
                goal["target_date"],
                goal["goal_id"],
            )
        )

    else:
        # Balanced allocations use requirements as weights.
        active_goals.sort(
            key=lambda goal: (
                goal["months_remaining"],
                goal["goal_id"],
            )
        )

    total_required_paise = sum(
        goal["required_paise"]
        for goal in active_goals
    )

    # ========================================================
    # ALLOCATION
    # ========================================================

    if strategy == "balanced":
        allocate_balanced(
            active_goals,
            budget_paise
        )

    else:
        remaining_budget = budget_paise

        for goal in active_goals:
            allocation = min(
                goal["required_paise"],
                goal["remaining_paise"],
                remaining_budget,
            )

            goal["allocated_paise"] = allocation
            remaining_budget -= allocation

    total_allocated_paise = sum(
        goal["allocated_paise"]
        for goal in active_goals
    )

    allocations = []

    for rank, goal in enumerate(
        active_goals,
        start=1
    ):
        required = goal["required_paise"]
        allocated = goal["allocated_paise"]

        shortfall = max(
            0,
            required - allocated
        )

        if allocated >= required:
            status = "fully_funded"
        elif allocated > 0:
            status = "partially_funded"
        else:
            status = "unfunded"

        allocations.append({
            "goal_id": goal["goal_id"],
            "goal_name": goal["goal_name"],
            "priority": rank,
            "priority_level": goal["priority_level"],
            "target_date": goal["target_date"],
            "months_remaining": goal["months_remaining"],
            "remaining_amount": round(
                goal["remaining_paise"] / 100, 2
            ),
            "required_monthly": round(
                required / 100, 2
            ),
            "recommended_allocation": round(
                allocated / 100, 2
            ),
            "monthly_shortfall": round(
                shortfall / 100, 2
            ),
            "status": status,
        })

    return {
        "status": "success",
        "method": strategy,
        "monthly_budget": round(
            budget_paise / 100, 2
        ),
        "total_required_monthly": round(
            total_required_paise / 100, 2
        ),
        "total_allocated": round(
            total_allocated_paise / 100, 2
        ),
        "unallocated_budget": round(
            (
                budget_paise - total_allocated_paise
            ) / 100, 2
        ),
        "total_monthly_shortfall": round(
            (
                total_required_paise -
                total_allocated_paise
            ) / 100, 2
        ),
        "all_goals_funded": (
            total_allocated_paise
            >= total_required_paise
        ),
        "allocations": allocations,
        "disclaimer": (
            "Allocations are planning recommendations. "
            "No money is transferred. "
            "Overdue goals use a one-month planning horizon. "
            "Future savings performance may differ."
        ),
    }


if __name__ == "__main__":
    from pprint import pprint

    today = date.today()

    sample_goals = [
        {
            "id": "vacation",
            "goal_name": "Vacation",
            "target_amount": 10000,
            "current_amount": 2000,
            "target_date": (
                today + timedelta(days=60)
            ).isoformat(),
            "priority": "low",
        },
        {
            "id": "laptop",
            "goal_name": "Laptop",
            "target_amount": 60000,
            "current_amount": 24000,
            "target_date": (
                today + timedelta(days=180)
            ).isoformat(),
            "priority": "medium",
        },
        {
            "id": "emergency",
            "goal_name": "Emergency Fund",
            "target_amount": 30000,
            "current_amount": 10000,
            "target_date": (
                today + timedelta(days=300)
            ).isoformat(),
            "priority": "high",
        },
    ]

    for strategy in [
        "deadline_first",
        "priority_first",
        "balanced",
    ]:
        print(f"\nSTRATEGY: {strategy}")

        pprint(
            optimize_savings_allocation(
                goals=sample_goals,
                monthly_budget=10000,
                strategy=strategy,
            )
        )
