
"use client";

import { useEffect, useState } from "react";

type GoalPriority = "high" | "medium" | "low";

type AllocationStrategy =
  | "deadline_first"
  | "priority_first"
  | "balanced";

type SavingsGoal = {
  id: string;
  goal_name: string;
  target_amount: number;
  current_amount: number;
  target_date: string;
  priority?: GoalPriority;
};

type Allocation = {
  goal_id: string;
  goal_name: string;
  priority: number;
  priority_level: GoalPriority;
  target_date: string;
  months_remaining: number;
  remaining_amount: number;
  required_monthly: number;
  recommended_allocation: number;
  monthly_shortfall: number;
  status:
    | "fully_funded"
    | "partially_funded"
    | "unfunded";
};

type OptimizerResponse = {
  status: string;
  method: AllocationStrategy;
  monthly_budget: number;
  total_required_monthly: number;
  total_allocated: number;
  unallocated_budget: number;
  total_monthly_shortfall: number;
  all_goals_funded: boolean;
  allocations: Allocation[];
  disclaimer: string;
};

type Props = {
  goals: SavingsGoal[];
};

const API_URL =
  process.env.NEXT_PUBLIC_ML_API_URL ??
  "http://127.0.0.1:8000";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(value: string) {
  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getAllocationStatus(
  status: Allocation["status"]
) {
  switch (status) {
    case "fully_funded":
      return {
        label: "Fully Funded",
        style:
          "text-green-400 bg-green-500/10 border-green-500/30",
      };

    case "partially_funded":
      return {
        label: "Partially Funded",
        style:
          "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
      };

    default:
      return {
        label: "Unfunded",
        style:
          "text-red-400 bg-red-500/10 border-red-500/30",
      };
  }
}

function getPriorityStyle(priority: GoalPriority) {
  switch (priority) {
    case "high":
      return "text-red-400";

    case "medium":
      return "text-yellow-400";

    default:
      return "text-green-400";
  }
}

function getStrategyLabel(
  strategy: AllocationStrategy
) {
  switch (strategy) {
    case "deadline_first":
      return "Deadline First";

    case "priority_first":
      return "Priority First";

    case "balanced":
      return "Balanced Allocation";
  }
}

export default function SavingsAllocationOptimizer({
  goals,
}: Props) {
  const [monthlyBudget, setMonthlyBudget] =
    useState("10000");

  const [strategy, setStrategy] =
    useState<AllocationStrategy>("deadline_first");

  const [result, setResult] =
    useState<OptimizerResponse | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Prevent an old request from replacing newer results.
  const [requestVersion, setRequestVersion] =
    useState(0);

  useEffect(() => {
    setResult(null);
    setError("");
  }, [goals]);

  async function calculateAllocation() {
    const budget = Number(monthlyBudget);

    if (
      monthlyBudget.trim() === "" ||
      !Number.isFinite(budget) ||
      budget < 0
    ) {
      setError(
        "Please enter a valid non-negative monthly budget."
      );
      setResult(null);
      return;
    }

    if (goals.length === 0) {
      setError(
        "Create at least one savings goal before optimizing."
      );
      return;
    }

    const currentVersion = requestVersion + 1;
    setRequestVersion(currentVersion);

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch(
        `${API_URL}/savings-optimize`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            monthly_budget: budget,
            strategy,
            goals: goals.map((goal) => ({
              id: goal.id,
              goal_name: goal.goal_name,
              target_amount: Number(
                goal.target_amount
              ),
              current_amount: Number(
                goal.current_amount
              ),
              target_date: goal.target_date,
              priority: goal.priority ?? "medium",
            })),
          }),
        }
      );

      if (!response.ok) {
        let message =
          `Optimizer API returned ${response.status}`;

        try {
          const errorData = await response.json();

          if (typeof errorData.detail === "string") {
            message = errorData.detail;
          }
        } catch {
          // Use the HTTP error message.
        }

        throw new Error(message);
      }

      const data: OptimizerResponse =
        await response.json();

      if (
        data.status !== "success" ||
        !Array.isArray(data.allocations)
      ) {
        throw new Error(
          "The optimizer returned an invalid response."
        );
      }

      setResult(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to calculate savings allocation."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8 text-white">
      {/* HEADER */}

      <div className="mb-7">
        <p className="text-green-400 text-sm font-semibold tracking-wide">
          SMART FINANCIAL PLANNING
        </p>

        <h2 className="text-2xl font-bold mt-2">
          Savings Allocation Optimizer
        </h2>

        <p className="text-gray-400 text-sm mt-3 leading-relaxed">
          Distribute your monthly savings budget across
          multiple goals using deadlines, personal
          priorities, or balanced allocation.
        </p>
      </div>

      {/* CONFIGURATION */}

      <div className="bg-gray-950 border border-gray-800 rounded-xl p-5 mb-7">
        {/* STRATEGY SELECTOR */}

        <div className="mb-6">
          <label
            htmlFor="allocation-strategy"
            className="block text-sm text-gray-300 mb-2 font-medium"
          >
            Allocation Strategy
          </label>

          <select
            id="allocation-strategy"
            value={strategy}
            onChange={(e) => {
              setStrategy(
                e.target.value as AllocationStrategy
              );
              setResult(null);
              setError("");
            }}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 outline-none focus:border-green-500"
          >
            <option value="deadline_first">
              Deadline First — Prioritize Urgent Goals
            </option>

            <option value="priority_first">
              Priority First — Prioritize Important Goals
            </option>

            <option value="balanced">
              Balanced — Distribute Across All Goals
            </option>
          </select>

          <p className="text-gray-500 text-xs mt-3">
            {strategy === "deadline_first" &&
              "Goals with the nearest deadlines receive funding first."}

            {strategy === "priority_first" &&
              "High-priority goals receive funding before medium- and low-priority goals."}

            {strategy === "balanced" &&
              "Your budget is distributed proportionally according to each goal's monthly requirement."}
          </p>
        </div>

        {/* MONTHLY BUDGET */}

        <div>
          <label
            htmlFor="monthly-budget"
            className="block text-sm text-gray-300 mb-2 font-medium"
          >
            Available Monthly Savings Budget (₹)
          </label>

          <div className="flex flex-col sm:flex-row gap-3">
            <input
              id="monthly-budget"
              type="number"
              min="0"
              step="100"
              value={monthlyBudget}
              onChange={(e) => {
                setMonthlyBudget(e.target.value);
                setResult(null);
                setError("");
              }}
              placeholder="Enter monthly budget"
              className="flex-1 min-w-0 bg-gray-900 border border-gray-700 rounded-lg p-3 outline-none focus:border-green-500"
            />

            <button
              type="button"
              onClick={calculateAllocation}
              disabled={
                loading || goals.length === 0
              }
              className="bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 rounded-lg font-semibold transition"
            >
              {loading
                ? "Optimizing..."
                : "Optimize Allocation"}
            </button>
          </div>
        </div>
      </div>

      {/* ERROR */}

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
          <p className="text-red-300 text-sm">
            {error}
          </p>
        </div>
      )}

      {/* EMPTY STATE */}

      {goals.length === 0 && (
        <div className="bg-gray-950 border border-gray-800 rounded-lg p-6 text-center">
          <p className="text-gray-400">
            Create a savings goal to start optimizing
            your monthly savings budget.
          </p>
        </div>
      )}

      {/* RESULTS */}

      {result && (
        <>
          {/* SELECTED STRATEGY */}

          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <h3 className="text-xl font-semibold">
              Optimization Results
            </h3>

            <span className="text-green-400 bg-green-500/10 border border-green-500/30 rounded-full px-4 py-2 text-xs font-semibold">
              {getStrategyLabel(result.method)}
            </span>
          </div>

          {/* SUMMARY CARDS */}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Metric
              label="Monthly Budget"
              value={formatCurrency(
                result.monthly_budget
              )}
            />

            <Metric
              label="Total Required Monthly"
              value={formatCurrency(
                result.total_required_monthly
              )}
            />

            <Metric
              label="Total Allocated"
              value={formatCurrency(
                result.total_allocated
              )}
            />

            <Metric
              label="Monthly Shortfall"
              value={formatCurrency(
                result.total_monthly_shortfall
              )}
            />
          </div>

          {/* FUNDING STATUS */}

          <div
            className={`rounded-xl border p-5 mb-7 ${
              result.all_goals_funded
                ? "bg-green-500/10 border-green-500/30"
                : "bg-orange-500/10 border-orange-500/30"
            }`}
          >
            <h3
              className={`font-semibold ${
                result.all_goals_funded
                  ? "text-green-400"
                  : "text-orange-400"
              }`}
            >
              {result.all_goals_funded
                ? "All Active Goals Are Fully Funded"
                : "Your Budget Cannot Fully Fund All Goals"}
            </h3>

            <p className="text-gray-300 text-sm mt-2">
              {result.all_goals_funded
                ? "Your available monthly savings budget covers the calculated monthly requirements of all active goals."
                : "Some goals have a monthly funding shortfall. Consider increasing your savings budget or adjusting your goals."}
            </p>

            <p className="text-gray-400 text-sm mt-3">
              Unallocated Monthly Budget:{" "}
              <span className="text-white font-semibold">
                {formatCurrency(
                  result.unallocated_budget
                )}
              </span>
            </p>
          </div>

          {/* ALLOCATION CARDS */}

          {result.allocations.length === 0 ? (
            <div className="bg-gray-950 border border-gray-800 rounded-xl p-6">
              <p className="text-gray-400">
                No active goals require additional
                savings. Your goals may already be
                completed.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {result.allocations.map((item) => {
                const status =
                  getAllocationStatus(item.status);

                const percentage =
                  result.monthly_budget > 0
                    ? Math.min(
                        100,
                        (item.recommended_allocation /
                          result.monthly_budget) *
                          100
                      )
                    : 0;

                const requirementCoverage =
                  item.required_monthly > 0
                    ? Math.min(
                        100,
                        (item.recommended_allocation /
                          item.required_monthly) *
                          100
                      )
                    : 100;

                return (
                  <div
                    key={item.goal_id}
                    className="bg-gray-950 border border-gray-800 rounded-xl p-5"
                  >
                    {/* GOAL HEADER */}

                    <div className="flex flex-wrap justify-between items-start gap-4 mb-5">
                      <div>
                        <h3 className="text-lg font-semibold">
                          {item.goal_name}
                        </h3>

                        <p className="text-gray-500 text-xs mt-2">
                          Allocation Rank #{item.priority}
                        </p>

                        <p className="text-gray-400 text-xs mt-2">
                          Goal Priority:{" "}
                          <span
                            className={`font-semibold ${getPriorityStyle(
                              item.priority_level
                            )}`}
                          >
                            {item.priority_level.toUpperCase()}
                          </span>
                        </p>
                      </div>

                      <span
                        className={`px-3 py-1 rounded-full border text-xs font-medium ${status.style}`}
                      >
                        {status.label}
                      </span>
                    </div>

                    {/* RECOMMENDED ALLOCATION */}

                    <div className="flex flex-wrap justify-between items-center gap-3 mb-3">
                      <p className="text-gray-400 text-sm">
                        Recommended Monthly Allocation
                      </p>

                      <p className="text-green-400 text-xl font-bold">
                        {formatCurrency(
                          item.recommended_allocation
                        )}
                      </p>
                    </div>

                    {/* BUDGET SHARE BAR */}

                    <div className="w-full bg-gray-800 h-3 rounded-full overflow-hidden">
                      <div
                        className="bg-green-500 h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${percentage}%`,
                        }}
                      />
                    </div>

                    <p className="text-gray-500 text-xs mt-2">
                      {percentage.toFixed(1)}% of your
                      monthly savings budget
                    </p>

                    {/* REQUIREMENT COVERAGE */}

                    <div className="mt-5">
                      <div className="flex justify-between text-xs text-gray-400 mb-2">
                        <span>
                          Monthly Requirement Coverage
                        </span>

                        <span>
                          {requirementCoverage.toFixed(1)}%
                        </span>
                      </div>

                      <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            requirementCoverage >= 100
                              ? "bg-green-500"
                              : requirementCoverage > 0
                              ? "bg-yellow-500"
                              : "bg-red-500"
                          }`}
                          style={{
                            width: `${requirementCoverage}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* METRICS */}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                      <Metric
                        label="Required Monthly Savings"
                        value={formatCurrency(
                          item.required_monthly
                        )}
                      />

                      <Metric
                        label="Monthly Shortfall"
                        value={formatCurrency(
                          item.monthly_shortfall
                        )}
                      />

                      <Metric
                        label="Remaining Goal Balance"
                        value={formatCurrency(
                          item.remaining_amount
                        )}
                      />

                      <Metric
                        label="Months Remaining"
                        value={String(
                          item.months_remaining
                        )}
                      />
                    </div>

                    {/* DEADLINE */}

                    <p className="text-gray-500 text-xs mt-5">
                      Target Deadline:{" "}
                      {formatDate(item.target_date)}
                    </p>

                    {/* INSIGHT */}

                    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mt-5">
                      <p className="text-sm text-gray-300">
                        {item.status === "fully_funded"
                          ? "Your recommended monthly allocation meets this goal's calculated monthly savings requirement."
                          : item.status ===
                            "partially_funded"
                          ? `This goal is partially funded. You need approximately ${formatCurrency(
                              item.monthly_shortfall
                            )} more per month to meet its calculated requirement.`
                          : `This goal receives no allocation under the selected strategy. Its calculated monthly requirement is ${formatCurrency(
                              item.required_monthly
                            )}.`}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* DISCLAIMER */}

          <p className="text-gray-500 text-xs mt-6 leading-relaxed">
            {result.disclaimer}
          </p>
        </>
      )}
    </section>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="bg-gray-950 border border-gray-800 rounded-lg p-4">
      <p className="text-gray-400 text-xs">
        {label}
      </p>

      <p className="text-white text-lg font-semibold mt-2 break-words">
        {value}
      </p>
    </div>
  );
}
