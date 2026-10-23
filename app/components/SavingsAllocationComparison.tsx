
"use client";

import { useEffect, useRef, useState } from "react";

type Strategy =
  | "deadline_first"
  | "priority_first"
  | "balanced";

type GoalPriority = "high" | "medium" | "low";

type Goal = {
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
  method: Strategy;
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
  goals: Goal[];
};

const API_URL =
  process.env.NEXT_PUBLIC_ML_API_URL ??
  "https://finsight-ml-api.onrender.com";

const strategies: {
  id: Strategy;
  name: string;
  description: string;
}[] = [
  {
    id: "deadline_first",
    name: "Deadline First",
    description:
      "Funds goals with the nearest deadlines first.",
  },
  {
    id: "priority_first",
    name: "Priority First",
    description:
      "Funds high-priority goals before lower-priority goals.",
  },
  {
    id: "balanced",
    name: "Balanced Allocation",
    description:
      "Distributes savings proportionally across goals.",
  },
];

const chartColors = [
  "#10b981",
  "#3b82f6",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#ef4444",
  "#84cc16",
];

function money(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

function getPriorityStyle(priority: GoalPriority) {
  switch (priority) {
    case "high":
      return "text-red-400";
    case "medium":
      return "text-yellow-400";
    case "low":
      return "text-green-400";
  }
}

function getAllocation(
  result: OptimizerResponse,
  goalId: string
): Allocation | undefined {
  return result.allocations.find(
    (item) => item.goal_id === goalId
  );
}

function getFundingStatus(
  status: Allocation["status"]
) {
  switch (status) {
    case "fully_funded":
      return {
        label: "Fully Funded",
        className:
          "text-green-400 bg-green-500/10 border-green-500/30",
      };

    case "partially_funded":
      return {
        label: "Partially Funded",
        className:
          "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
      };

    default:
      return {
        label: "Unfunded",
        className:
          "text-red-400 bg-red-500/10 border-red-500/30",
      };
  }
}

export default function SavingsAllocationComparison({
  goals,
}: Props) {
  const [budget, setBudget] = useState("10000");

  const [results, setResults] = useState<
    OptimizerResponse[]
  >([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Stores the budget used for the displayed results.
  const [calculatedBudget, setCalculatedBudget] =
    useState(0);

  // Prevents older requests from overwriting newer data.
  const controllerRef =
    useRef<AbortController | null>(null);

  const requestIdRef = useRef(0);

  function invalidateResults() {
    requestIdRef.current += 1;
    controllerRef.current?.abort();
    controllerRef.current = null;

    setResults([]);
    setError("");
    setLoading(false);
  }

  useEffect(() => {
    requestIdRef.current += 1;
    controllerRef.current?.abort();
    controllerRef.current = null;

    return () => {
      requestIdRef.current += 1;
      controllerRef.current?.abort();
    };
  }, [goals]);

  async function compareStrategies() {
    const monthlyBudget = Number(budget);

    if (
      budget.trim() === "" ||
      !Number.isFinite(monthlyBudget) ||
      monthlyBudget < 0
    ) {
      invalidateResults();
      setError(
        "Please enter a valid non-negative monthly budget."
      );
      return;
    }

    if (goals.length === 0) {
      invalidateResults();
      setError(
        "Create at least one savings goal before comparing."
      );
      return;
    }

    controllerRef.current?.abort();

    const controller = new AbortController();
    controllerRef.current = controller;

    const requestId = ++requestIdRef.current;

    setLoading(true);
    setError("");
    setResults([]);

    try {
      const responses = await Promise.all(
        strategies.map(async (strategy) => {
          const response = await fetch(
            `${API_URL}/savings-optimize`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              signal: controller.signal,
              body: JSON.stringify({
                monthly_budget: monthlyBudget,
                strategy: strategy.id,
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
              `${strategy.name} failed with HTTP ${response.status}`;

            try {
              const errorData = await response.json();

              if (
                typeof errorData.detail === "string"
              ) {
                message = errorData.detail;
              }
            } catch {
              // Keep the HTTP error message.
            }

            throw new Error(message);
          }

          const data: OptimizerResponse =
            await response.json();

          if (
            data.status !== "success" ||
            data.method !== strategy.id ||
            !Array.isArray(data.allocations)
          ) {
            throw new Error(
              `Invalid response for ${strategy.name}.`
            );
          }

          return data;
        })
      );

      if (
        controller.signal.aborted ||
        requestId !== requestIdRef.current
      ) {
        return;
      }

      setResults(responses);
      setCalculatedBudget(monthlyBudget);
    } catch (err) {
      if (
        controller.signal.aborted ||
        requestId !== requestIdRef.current
      ) {
        return;
      }

      setError(
        err instanceof Error
          ? err.message
          : "Unable to compare savings strategies."
      );

      setResults([]);
    } finally {
      if (
        !controller.signal.aborted &&
        requestId === requestIdRef.current
      ) {
        setLoading(false);
        controllerRef.current = null;
      }
    }
  }

  const hasResults = results.length === 3;

  return (
    <section className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8 text-white">
      {/* HEADER */}

      <div className="mb-7">
        <p className="text-green-400 text-sm font-semibold tracking-wide">
          STRATEGY COMPARISON
        </p>

        <h2 className="text-2xl font-bold mt-2">
          Savings Allocation Comparison
        </h2>

        <p className="text-gray-400 text-sm mt-3 leading-relaxed">
          Compare Deadline First, Priority First, and
          Balanced Allocation side by side to understand
          how each strategy distributes your savings.
        </p>
      </div>

      {/* BUDGET INPUT */}

      <div className="bg-gray-950 border border-gray-800 rounded-xl p-5 mb-7">
        <label
          htmlFor="comparison-budget"
          className="block text-sm font-medium text-gray-300 mb-3"
        >
          Available Monthly Savings Budget (₹)
        </label>

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            id="comparison-budget"
            type="number"
            min="0"
            step="100"
            value={budget}
            onChange={(e) => {
              invalidateResults();
              setBudget(e.target.value);
            }}
            placeholder="Enter monthly budget"
            className="flex-1 min-w-0 bg-gray-900 border border-gray-700 rounded-lg p-3 outline-none focus:border-green-500"
          />

          <button
            type="button"
            onClick={compareStrategies}
            disabled={loading || goals.length === 0}
            className="bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg px-6 py-3 font-semibold transition"
          >
            {loading
              ? "Comparing..."
              : "Compare Strategies"}
          </button>
        </div>

        <p className="text-gray-500 text-xs mt-3">
          All three strategies use the same monthly
          budget and savings goals.
        </p>
      </div>

      {/* ERROR */}

      {error && (
        <div
          role="alert"
          className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6"
        >
          <p className="text-red-300 text-sm">
            {error}
          </p>
        </div>
      )}

      {/* EMPTY STATE */}

      {goals.length === 0 && (
        <div className="bg-gray-950 border border-gray-800 rounded-xl p-6 text-center">
          <p className="text-gray-400">
            Create at least one savings goal to compare
            allocation strategies.
          </p>
        </div>
      )}

      {/* LOADING */}

      {loading && (
        <div
          role="status"
          className="bg-gray-950 border border-gray-800 rounded-xl p-6 mb-6"
        >
          <p className="text-gray-300">
            Calculating all three allocation strategies...
          </p>
        </div>
      )}

      {/* COMPARISON RESULTS */}

      {hasResults && (
        <>
          {/* SUMMARY */}

          <div className="mb-7">
            <h3 className="text-xl font-semibold mb-2">
              Strategy Comparison Results
            </h3>

            <p className="text-gray-400 text-sm">
              Monthly Savings Budget:{" "}
              <span className="text-green-400 font-semibold">
                {money(calculatedBudget)}
              </span>
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-7">
            {strategies.map((strategy) => {
              const result = results.find(
                (item) =>
                  item.method === strategy.id
              );

              if (!result) return null;

              const fullyFunded =
                result.allocations.filter(
                  (item) =>
                    item.status === "fully_funded"
                ).length;

              const partiallyFunded =
                result.allocations.filter(
                  (item) =>
                    item.status === "partially_funded"
                ).length;

              const unfunded =
                result.allocations.filter(
                  (item) =>
                    item.status === "unfunded"
                ).length;

              return (
                <div
                  key={strategy.id}
                  className="bg-gray-950 border border-gray-800 rounded-xl p-5"
                >
                  <h4 className="text-lg font-semibold">
                    {strategy.name}
                  </h4>

                  <p className="text-gray-500 text-xs mt-2 mb-5">
                    {strategy.description}
                  </p>

                  <Metric
                    label="Total Allocated"
                    value={money(
                      result.total_allocated
                    )}
                    valueClassName="text-green-400"
                  />

                  <Metric
                    label="Monthly Shortfall"
                    value={money(
                      result.total_monthly_shortfall
                    )}
                    valueClassName="text-orange-400"
                  />

                  <Metric
                    label="Unallocated Budget"
                    value={money(
                      result.unallocated_budget
                    )}
                  />

                  <div className="border-t border-gray-800 mt-5 pt-4 space-y-2">
                    <SummaryRow
                      label="Fully Funded Goals"
                      value={fullyFunded}
                      color="text-green-400"
                    />

                    <SummaryRow
                      label="Partially Funded"
                      value={partiallyFunded}
                      color="text-yellow-400"
                    />

                    <SummaryRow
                      label="Unfunded Goals"
                      value={unfunded}
                      color="text-red-400"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* VISUAL ALLOCATION COMPARISON */}

          <div className="bg-gray-950 border border-gray-800 rounded-xl p-5 mb-7">
            <h3 className="text-lg font-semibold mb-2">
              Visual Allocation Comparison
            </h3>

            <p className="text-gray-400 text-sm mb-6">
              Each bar shows how the monthly savings
              budget is distributed among your goals.
              Gray space represents unallocated money.
            </p>

            <div className="space-y-7">
              {strategies.map((strategy) => {
                const result = results.find(
                  (item) =>
                    item.method === strategy.id
                );

                if (!result) return null;

                return (
                  <div key={strategy.id}>
                    <div className="flex flex-wrap justify-between items-center gap-3 mb-3">
                      <h4 className="font-semibold text-sm">
                        {strategy.name}
                      </h4>

                      <span className="text-gray-400 text-xs">
                        {money(result.total_allocated)}
                        {" / "}
                        {money(calculatedBudget)}
                      </span>
                    </div>

                    {/* STACKED ALLOCATION BAR */}

                    <div
                      className="flex w-full h-7 bg-gray-800 rounded-lg overflow-hidden"
                      role="img"
                      aria-label={`${strategy.name}: ${money(
                        result.total_allocated
                      )} allocated from ${money(
                        calculatedBudget
                      )}`}
                    >
                      {goals.map((goal, index) => {
                        const allocation =
                          getAllocation(
                            result,
                            goal.id
                          );

                        const amount =
                          allocation
                            ?.recommended_allocation ?? 0;

                        const percentage =
                          calculatedBudget > 0
                            ? Math.max(
                                0,
                                Math.min(
                                  100,
                                  (amount /
                                    calculatedBudget) *
                                    100
                                )
                              )
                            : 0;

                        if (percentage <= 0) {
                          return null;
                        }

                        return (
                          <div
                            key={goal.id}
                            title={`${goal.goal_name}: ${money(
                              amount
                            )}`}
                            className="h-full shrink-0 transition-all duration-300"
                            style={{
                              width: `${percentage}%`,
                              backgroundColor:
                                chartColors[
                                  index %
                                    chartColors.length
                                ],
                            }}
                          />
                        );
                      })}
                    </div>

                    <p className="text-gray-500 text-xs mt-2">
                      Unallocated:{" "}
                      {money(
                        result.unallocated_budget
                      )}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* CHART LEGEND */}

            <div className="border-t border-gray-800 mt-7 pt-5">
              <p className="text-gray-400 text-xs font-medium mb-3">
                GOAL LEGEND
              </p>

              <div className="flex flex-wrap gap-x-5 gap-y-3">
                {goals.map((goal, index) => (
                  <div
                    key={goal.id}
                    className="flex items-center gap-2"
                  >
                    <span
                      className="w-3 h-3 rounded-sm shrink-0"
                      style={{
                        backgroundColor:
                          chartColors[
                            index %
                              chartColors.length
                          ],
                      }}
                    />

                    <span className="text-gray-400 text-xs">
                      {goal.goal_name}
                    </span>
                  </div>
                ))}

                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm shrink-0 bg-gray-800 border border-gray-600" />

                  <span className="text-gray-400 text-xs">
                    Unallocated Budget
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* GOAL-LEVEL COMPARISON TABLE */}

          <div className="mb-7">
            <h3 className="text-lg font-semibold mb-2">
              Goal-Level Allocation Comparison
            </h3>

            <p className="text-gray-400 text-sm mb-5">
              Compare the recommended monthly amount
              for each goal under all three strategies.
            </p>

            <div className="overflow-x-auto rounded-xl border border-gray-800">
              <table className="w-full text-sm">
                <thead className="bg-gray-950 text-gray-300">
                  <tr>
                    <th className="p-4 text-left">
                      Savings Goal
                    </th>

                    <th className="p-4 text-left">
                      Priority
                    </th>

                    {strategies.map((strategy) => (
                      <th
                        key={strategy.id}
                        className="p-4 text-right whitespace-nowrap"
                      >
                        {strategy.name}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {goals.map((goal) => (
                    <tr
                      key={goal.id}
                      className="border-t border-gray-800 hover:bg-gray-800/30"
                    >
                      <td className="p-4 font-medium whitespace-nowrap">
                        {goal.goal_name}
                      </td>

                      <td className="p-4">
                        <span
                          className={`font-medium capitalize ${getPriorityStyle(
                            goal.priority ?? "medium"
                          )}`}
                        >
                          {goal.priority ?? "medium"}
                        </span>
                      </td>

                      {strategies.map((strategy) => {
                        const result = results.find(
                          (item) =>
                            item.method ===
                            strategy.id
                        );

                        const allocation = result
                          ? getAllocation(
                              result,
                              goal.id
                            )
                          : undefined;

                        return (
                          <td
                            key={strategy.id}
                            className="p-4 text-right whitespace-nowrap"
                          >
                            {money(
                              allocation
                                ?.recommended_allocation ??
                                0
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* GOAL FUNDING STATUS COMPARISON */}

          <div className="bg-gray-950 border border-gray-800 rounded-xl p-5 mb-7">
            <h3 className="text-lg font-semibold mb-5">
              Goal Funding Status
            </h3>

            <div className="space-y-5">
              {goals.map((goal) => {
                const remaining = Math.max(
                  0,
                  Number(goal.target_amount) -
                    Number(goal.current_amount)
                );

                return (
                  <div
                    key={goal.id}
                    className="bg-gray-900 border border-gray-800 rounded-lg p-4"
                  >
                    <div className="flex flex-wrap justify-between gap-3 mb-4">
                      <h4 className="font-semibold">
                        {goal.goal_name}
                      </h4>

                      <span className="text-gray-400 text-xs">
                        Remaining: {money(remaining)}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {strategies.map((strategy) => {
                        const result = results.find(
                          (item) =>
                            item.method ===
                            strategy.id
                        );

                        const allocation = result
                          ? getAllocation(
                              result,
                              goal.id
                            )
                          : undefined;

                        const status = allocation
                          ? getFundingStatus(
                              allocation.status
                            )
                          : null;

                        return (
                          <div
                            key={strategy.id}
                            className="bg-gray-950 border border-gray-800 rounded-lg p-3"
                          >
                            <p className="text-gray-500 text-xs mb-2">
                              {strategy.name}
                            </p>

                            <p className="font-semibold text-white">
                              {money(
                                allocation
                                  ?.recommended_allocation ??
                                  0
                              )}
                            </p>

                            {status ? (
                              <span
                                className={`inline-block border rounded-full px-2 py-1 text-xs mt-3 ${status.className}`}
                              >
                                {status.label}
                              </span>
                            ) : (
                              <span className="inline-block text-blue-400 text-xs mt-3">
                                No Active Allocation
                              </span>
                            )}

                            {allocation && (
                              <p className="text-gray-500 text-xs mt-3">
                                Shortfall:{" "}
                                {money(
                                  allocation.monthly_shortfall
                                )}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* STRATEGY RECOMMENDATIONS */}

          <div className="bg-gray-950 border border-gray-800 rounded-xl p-5 mb-7">
            <h3 className="text-lg font-semibold mb-2">
              Which Strategy Should You Choose?
            </h3>

            <p className="text-gray-400 text-sm mb-6">
              Each strategy solves a different planning
              problem. Choose based on what matters most
              to you.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <h4 className="text-green-400 font-semibold mb-3">
                  Deadline First
                </h4>

                <p className="text-gray-400 text-sm leading-relaxed">
                  Useful when meeting upcoming deadlines
                  is your main concern. Earlier deadlines
                  receive funding before later goals.
                </p>

                <p className="text-gray-500 text-xs mt-4">
                  Trade-off: Important goals with later
                  deadlines may receive little or no
                  funding.
                </p>
              </div>

              <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <h4 className="text-blue-400 font-semibold mb-3">
                  Priority First
                </h4>

                <p className="text-gray-400 text-sm leading-relaxed">
                  Useful when certain goals matter more
                  than others. High-priority goals receive
                  funding before medium- and low-priority
                  goals.
                </p>

                <p className="text-gray-500 text-xs mt-4">
                  Trade-off: Lower-priority goals with
                  urgent deadlines may be underfunded.
                </p>
              </div>

              <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <h4 className="text-purple-400 font-semibold mb-3">
                  Balanced Allocation
                </h4>

                <p className="text-gray-400 text-sm leading-relaxed">
                  Useful when you want progress across
                  multiple goals simultaneously. Funding
                  is distributed proportionally to each
                  goal's monthly requirement.
                </p>

                <p className="text-gray-500 text-xs mt-4">
                  Trade-off: If the budget is insufficient,
                  several goals may remain partially
                  funded.
                </p>
              </div>
            </div>

            <p className="text-gray-500 text-xs mt-5">
              These explanations describe allocation
              strategies rather than personalized
              investment or financial advice.
            </p>
          </div>

          {/* COMPARISON INSIGHT */}

          <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-5">
            <h3 className="text-green-400 font-semibold mb-3">
              Comparison Insight
            </h3>

            <p className="text-gray-300 text-sm leading-relaxed">
              The three strategies use the same monthly
              budget and goal requirements. They may
              produce identical total funding shortfalls,
              but distribute the available money
              differently.
            </p>

            <p className="text-gray-400 text-sm mt-3 leading-relaxed">
              Review which goals are fully funded,
              partially funded, or unfunded before
              choosing a strategy.
            </p>

            <p className="text-gray-500 text-xs mt-4">
              {results[0]?.disclaimer ??
                "Allocations are planning suggestions only. No funds are transferred."}
            </p>
          </div>
        </>
      )}
    </section>
  );
}

/* REUSABLE COMPONENTS */

function Metric({
  label,
  value,
  valueClassName = "text-white",
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="mb-4">
      <p className="text-gray-400 text-xs">
        {label}
      </p>

      <p
        className={`text-lg font-semibold mt-1 break-words ${valueClassName}`}
      >
        {value}
      </p>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="flex justify-between items-center gap-3">
      <span className="text-gray-400 text-xs">
        {label}
      </span>

      <span className={`font-semibold text-sm ${color}`}>
        {value}
      </span>
    </div>
  );
}
