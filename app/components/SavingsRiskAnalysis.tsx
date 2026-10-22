
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/supabase";

type Goal = {
  id: string;
  goal_name: string;
  target_amount: number;
  current_amount: number;
  target_date: string;
};

type RiskItem = {
  goal_id: string;
  goal_name: string;
  remaining_amount: number;
  months_remaining: number;
  current_monthly_pace: number;
  required_monthly_savings: number;
  additional_monthly_needed: number;
  estimated_savings_gap: number;
  risk_level:
    | "low"
    | "medium"
    | "high"
    | "overdue"
    | "completed";
  recommendation: string;
};

type RiskResponse = {
  status: string;
  analysis_method: string;
  goals_analyzed: number;
  risk_analysis: RiskItem[];
  disclaimer: string;
};

type Props = {
  userId: string;
  goals: Goal[];
  refreshKey: number;
};

function money(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function riskStyle(level: RiskItem["risk_level"]) {
  switch (level) {
    case "low":
      return {
        label: "Low Risk",
        className: "text-green-400 bg-green-500/10",
      };
    case "medium":
      return {
        label: "Medium Risk",
        className: "text-yellow-400 bg-yellow-500/10",
      };
    case "high":
      return {
        label: "High Risk",
        className: "text-red-400 bg-red-500/10",
      };
    case "overdue":
      return {
        label: "Overdue",
        className: "text-orange-400 bg-orange-500/10",
      };
    default:
      return {
        label: "Completed",
        className: "text-blue-400 bg-blue-500/10",
      };
  }
}

export default function SavingsRiskAnalysis({
  userId,
  goals,
  refreshKey,
}: Props) {
  const [data, setData] = useState<RiskResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadRisk() {
      setLoading(true);
      setError("");

      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (controller.signal.aborted) return;

        if (authError || !user || user.id !== userId) {
          throw new Error("Please log in again.");
        }

        const { data: rows, error: fetchError } =
          await supabase
            .from("savings_contributions")
            .select("goal_id, amount, contribution_date")
            .eq("user_id", userId);

        if (controller.signal.aborted) return;

        if (fetchError) {
          throw new Error(fetchError.message);
        }

        const response = await fetch(
          "http://127.0.0.1:8000/savings-risk",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              goals: goals.map((goal) => ({
                id: goal.id,
                goal_name: goal.goal_name,
                target_amount: Number(goal.target_amount),
                current_amount: Number(goal.current_amount),
                target_date: goal.target_date,
              })),
              contributions: (rows ?? []).map((row) => ({
                goal_id: row.goal_id,
                amount: Number(row.amount),
                contribution_date: row.contribution_date,
              })),
            }),
            signal: controller.signal,
          }
        );

        if (!response.ok) {
          throw new Error(
            `Risk analysis API returned ${response.status}`
          );
        }

        const result: RiskResponse = await response.json();

        if (!controller.signal.aborted) {
          setData(result);
        }
      } catch (err) {
        if (controller.signal.aborted) return;

        setError(
          err instanceof Error
            ? err.message
            : "Unable to calculate savings risk."
        );
        setData(null);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadRisk();

    return () => controller.abort();
  }, [userId, goals, refreshKey]);

  return (
    <section className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8">
      <p className="text-green-400 text-sm font-medium">
        FINANCIAL PLANNING
      </p>

      <h2 className="text-2xl font-bold mt-2">
        Savings Goal Risk Analysis
      </h2>

      <p className="text-gray-400 text-sm mt-2 mb-6">
        Understand your savings shortfall and how much
        extra you may need to save each month.
      </p>

      {loading ? (
        <p className="text-gray-400">
          Analyzing savings goals...
        </p>
      ) : error ? (
        <p className="text-red-400">{error}</p>
      ) : !data || data.risk_analysis.length === 0 ? (
        <p className="text-gray-400">
          Create a savings goal to see risk analysis.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {data.risk_analysis.map((item) => {
              const style = riskStyle(item.risk_level);

              return (
                <div
                  key={item.goal_id}
                  className="bg-gray-950 border border-gray-800 rounded-xl p-5"
                >
                  <div className="flex justify-between items-start gap-3 mb-5">
                    <h3 className="text-lg font-semibold">
                      {item.goal_name}
                    </h3>

                    <span
                      className={`text-xs rounded-full px-3 py-1 ${style.className}`}
                    >
                      {style.label}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Metric
                      label="Remaining Amount"
                      value={money(item.remaining_amount)}
                    />

                    <Metric
                      label="Months Remaining"
                      value={String(item.months_remaining)}
                    />

                    <Metric
                      label="Current Monthly Pace"
                      value={money(item.current_monthly_pace)}
                    />

                    <Metric
                      label="Required Monthly Savings"
                      value={money(item.required_monthly_savings)}
                    />

                    <Metric
                      label="Extra Needed Monthly"
                      value={money(item.additional_monthly_needed)}
                    />

                    <Metric
                      label="Estimated Savings Gap"
                      value={money(item.estimated_savings_gap)}
                    />
                  </div>

                  <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mt-5">
                    <p className="text-green-400 text-sm font-semibold mb-2">
                      Recommendation
                    </p>

                    <p className="text-gray-300 text-sm leading-relaxed">
                      {item.recommendation}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-gray-500 text-xs mt-6">
            {data.disclaimer}
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
    <div className="bg-gray-900 rounded-lg p-3">
      <p className="text-gray-500 text-xs">{label}</p>
      <p className="text-white font-semibold mt-2 break-words">
        {value}
      </p>
    </div>
  );
}
