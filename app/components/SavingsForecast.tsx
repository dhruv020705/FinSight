
"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/supabase";

// ============================================================
// TYPES
// ============================================================

type SavingsGoal = {
  id: string;
  goal_name: string;
  target_amount: number;
  current_amount: number;
  target_date: string;
};

type SavingsContribution = {
  goal_id: string;
  amount: number;
  contribution_date: string;
};

type GoalForecast = {
  goal_id: string;
  goal_name: string;
  target_amount: number;
  current_amount: number;
  remaining_amount: number;
  target_date: string;
  average_monthly_savings: number;
  months_to_goal: number | null;
  projected_completion_date: string | null;
  status:
    | "completed"
    | "on_track"
    | "behind_schedule"
    | "insufficient_data";
  insight: string;
  months_remaining: number;
  required_monthly_savings: number;
};

type ForecastResponse = {
  status: string;
  model: string;
  analysis_months: string[];
  goals_analyzed: number;
  forecasts: GoalForecast[];
  disclaimer: string;
};

type Props = {
  userId: string;
  goals: SavingsGoal[];
  refreshKey: number;
};

// ============================================================
// HELPERS
// ============================================================

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string | null) {
  if (!value) return "Not available";

  const parsed = new Date(`${value}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) {
    return "Not available";
  }

  return parsed.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getStatusStyle(status: GoalForecast["status"]) {
  switch (status) {
    case "completed":
      return {
        label: "Completed",
        badge: "bg-green-500/10 text-green-400",
        border: "border-green-500/30",
      };

    case "on_track":
      return {
        label: "On Track",
        badge: "bg-emerald-500/10 text-emerald-400",
        border: "border-emerald-500/30",
      };

    case "behind_schedule":
      return {
        label: "Behind Schedule",
        badge: "bg-orange-500/10 text-orange-400",
        border: "border-orange-500/30",
      };

    default:
      return {
        label: "Insufficient Data",
        badge: "bg-gray-700 text-gray-300",
        border: "border-gray-700",
      };
  }
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function SavingsForecast({
  userId,
  goals,
  refreshKey,
}: Props) {
  const [data, setData] = useState<ForecastResponse | null>(
    null
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ==========================================================
  // FETCH FORECAST DATA
  // ==========================================================

  const fetchForecast = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      setError("");

      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (signal?.aborted) return;

        if (authError || !user || user.id !== userId) {
          throw new Error(
            "Please log in to view savings forecasts."
          );
        }

        // ----------------------------------------------------
        // FETCH CONTRIBUTIONS FROM SUPABASE
        // ----------------------------------------------------

        const {
          data: contributionRows,
          error: contributionError,
        } = await supabase
          .from("savings_contributions")
          .select(
            "goal_id, amount, contribution_date"
          )
          .eq("user_id", userId);

        if (signal?.aborted) return;

        if (contributionError) {
          throw new Error(contributionError.message);
        }

        const contributions: SavingsContribution[] = (
          contributionRows ?? []
        ).map((item) => ({
          goal_id: String(item.goal_id),
          amount: Number(item.amount),
          contribution_date: item.contribution_date,
        }));

        // ----------------------------------------------------
        // PREPARE FASTAPI PAYLOAD
        // ----------------------------------------------------

        const payload = {
          goals: goals.map((goal) => ({
            id: goal.id,
            goal_name: goal.goal_name,
            target_amount: Number(goal.target_amount),
            current_amount: Number(goal.current_amount),
            target_date: goal.target_date,
          })),

          contributions,
        };

        // ----------------------------------------------------
        // CALL FORECAST API
        // ----------------------------------------------------

        const response = await fetch(
          "http://127.0.0.1:8000/savings-forecast",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
            signal,
          }
        );

        if (!response.ok) {
          throw new Error(
            `Savings forecast API error: ${response.status}`
          );
        }

        const result: ForecastResponse =
          await response.json();

        if (!signal?.aborted) {
          setData(result);
        }
      } catch (err) {
        if (signal?.aborted) return;

        setData(null);

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load savings forecasts."
        );
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [userId, goals]
  );

  // ==========================================================
  // AUTO REFRESH WHEN GOALS OR CONTRIBUTIONS CHANGE
  // ==========================================================

  useEffect(() => {
    const controller = new AbortController();

    void fetchForecast(controller.signal);

    return () => {
      controller.abort();
    };
  }, [fetchForecast, refreshKey]);

  // ==========================================================
  // SUMMARY CALCULATIONS
  // ==========================================================

  const forecasts = data?.forecasts ?? [];

  const onTrackCount = forecasts.filter(
    (item) => item.status === "on_track"
  ).length;

  const behindCount = forecasts.filter(
    (item) => item.status === "behind_schedule"
  ).length;

  const completedCount = forecasts.filter(
    (item) => item.status === "completed"
  ).length;

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <section className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8">
      <p className="text-green-400 text-sm font-medium">
        SAVINGS INTELLIGENCE
      </p>

      <h2 className="text-2xl font-bold mt-2">
        Savings Goal Achievement Forecast
      </h2>

      <p className="text-gray-400 text-sm mt-2 mb-6">
        Estimate when you may reach each savings goal based
        on your recent contribution history.
      </p>

      {loading ? (
        <p className="text-gray-400">
          Calculating savings forecasts...
        </p>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <p className="text-red-300 text-sm">
            {error}
          </p>

          <button
            type="button"
            onClick={() => void fetchForecast()}
            className="text-sm text-white underline mt-3"
          >
            Try Again
          </button>
        </div>
      ) : forecasts.length === 0 ? (
        <div className="bg-gray-950 rounded-lg p-5">
          <p className="text-gray-400">
            Create a savings goal to see your forecast.
          </p>
        </div>
      ) : (
        <>
          {/* =============================================== */}
          {/* FORECAST SUMMARY */}
          {/* =============================================== */}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-7">
            <SummaryCard
              label="On Track"
              value={onTrackCount}
              color="text-green-400"
            />

            <SummaryCard
              label="Behind Schedule"
              value={behindCount}
              color="text-orange-400"
            />

            <SummaryCard
              label="Completed Goals"
              value={completedCount}
              color="text-blue-400"
            />
          </div>

          {/* =============================================== */}
          {/* GOAL FORECAST CARDS */}
          {/* =============================================== */}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {forecasts.map((forecast) => {
              const style = getStatusStyle(
                forecast.status
              );

              const progress =
                forecast.target_amount > 0
                  ? Math.min(
                      100,
                      Math.max(
                        0,
                        (forecast.current_amount /
                          forecast.target_amount) *
                          100
                      )
                    )
                  : 0;

              return (
                <div
                  key={forecast.goal_id}
                  className={`bg-gray-950 border ${style.border} rounded-xl p-5`}
                >
                  {/* HEADER */}

                  <div className="flex items-start justify-between gap-3 mb-5">
                    <div>
                      <h3 className="text-lg font-semibold">
                        {forecast.goal_name}
                      </h3>

                      <p className="text-gray-500 text-sm mt-1">
                        Target:{" "}
                        {formatCurrency(
                          forecast.target_amount
                        )}
                      </p>
                    </div>

                    <span
                      className={`text-xs px-3 py-1 rounded-full whitespace-nowrap ${style.badge}`}
                    >
                      {style.label}
                    </span>
                  </div>

                  {/* PROGRESS */}

                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">
                      Current Savings
                    </span>

                    <span className="text-green-400 font-semibold">
                      {formatCurrency(
                        forecast.current_amount
                      )}
                    </span>
                  </div>

                  <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full transition-all"
                      style={{
                        width: `${progress}%`,
                      }}
                    />
                  </div>

                  <p className="text-gray-500 text-xs mt-2 text-right">
                    {progress.toFixed(1)}% complete
                  </p>

                  {/* FORECAST METRICS */}

                  <div className="grid grid-cols-2 gap-3 mt-5">
                    <Metric
                      label="Remaining Amount"
                      value={formatCurrency(
                        forecast.remaining_amount
                      )}
                    />

                    <Metric
                      label="Monthly Savings Pace"
                      value={formatCurrency(
                        forecast.average_monthly_savings
                      )}
                    />

                    <Metric
                    label="Required Monthly Savings"
                    value={
                        forecast.remaining_amount === 0
                        ? formatCurrency(0)
                        : forecast.months_remaining === 0
                        ? "Deadline passed"
                        : formatCurrency(
                            forecast.required_monthly_savings
                            )
                    }
                    />

                    <Metric
                      label="Estimated Time"
                      value={
                        forecast.months_to_goal === null
                          ? "Not available"
                          : `${forecast.months_to_goal} months`
                      }
                    />

                    <Metric
                      label="Projected Completion"
                      value={formatDate(
                        forecast.projected_completion_date
                      )}
                    />
                  </div>

                  {/* TARGET DEADLINE */}

                  <p className="text-gray-400 text-sm mt-5">
                    Target Deadline:{" "}
                    <span className="text-white">
                      {formatDate(
                        forecast.target_date
                      )}
                    </span>
                  </p>

                  {/* INSIGHT */}

                  <div className="bg-gray-900 rounded-lg p-4 mt-4">
                    <p className="text-gray-300 text-sm leading-relaxed">
                      {forecast.insight}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* =============================================== */}
          {/* MODEL INFORMATION */}
          {/* =============================================== */}

          <div className="border-t border-gray-800 mt-7 pt-5">
            <p className="text-gray-500 text-xs">
              Forecasting Method:{" "}
              {data?.model}
            </p>

            <p className="text-gray-500 text-xs mt-2">
              Analysis Months:{" "}
              {data?.analysis_months.join(", ")}
            </p>

            <p className="text-gray-500 text-xs mt-2">
              {data?.disclaimer}
            </p>
          </div>
        </>
      )}
    </section>
  );
}

// ============================================================
// REUSABLE SUMMARY CARD
// ============================================================

function SummaryCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="bg-gray-950 border border-gray-800 rounded-xl p-4">
      <p className="text-gray-400 text-sm">
        {label}
      </p>

      <p className={`text-3xl font-bold mt-2 ${color}`}>
        {value}
      </p>
    </div>
  );
}

// ============================================================
// REUSABLE METRIC CARD
// ============================================================

function Metric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="bg-gray-900 rounded-lg p-3">
      <p className="text-gray-500 text-xs">
        {label}
      </p>

      <p className="text-white font-semibold mt-2 break-words">
        {value}
      </p>
    </div>
  );
}
