
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/supabase";

type Contribution = {
  id: string;
  goal_id: string;
  amount: number;
  contribution_date: string;
};

type Props = {
  userId: string;
  refreshKey: number;
};

type MonthlySavings = {
  month: string;
  amount: number;
};

function currency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function SavingsAnalytics({
  userId,
  refreshKey,
}: Props) {
  const [contributions, setContributions] = useState<
    Contribution[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadAnalytics() {
      setLoading(true);
      setError("");

      const { data, error: fetchError } = await supabase
        .from("savings_contributions")
        .select("id, goal_id, amount, contribution_date")
        .eq("user_id", userId);

      if (cancelled) return;

      if (fetchError) {
        setError(fetchError.message);
        setContributions([]);
      } else {
        setContributions((data ?? []) as Contribution[]);
      }

      setLoading(false);
    }

    void loadAnalytics();

    return () => {
      cancelled = true;
    };
  }, [userId, refreshKey]);

  // ==========================================================
  // SUMMARY STATISTICS
  // ==========================================================

  const totalContributions = contributions.reduce(
    (sum, item) => sum + Number(item.amount),
    0
  );

  const totalDeposits = contributions.length;

  const now = new Date();

  const currentMonth = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
  ].join("-");

  const thisMonthSavings = contributions
    .filter((item) =>
      item.contribution_date.startsWith(currentMonth)
    )
    .reduce(
      (sum, item) => sum + Number(item.amount),
      0
    );

  // ==========================================================
  // LAST SIX CALENDAR MONTHS
  // ==========================================================

  const monthlyData: MonthlySavings[] = [];

  for (let offset = 5; offset >= 0; offset--) {
    const monthDate = new Date(
      now.getFullYear(),
      now.getMonth() - offset,
      1
    );

    const monthKey = [
      monthDate.getFullYear(),
      String(monthDate.getMonth() + 1).padStart(2, "0"),
    ].join("-");

    const monthlyTotal = contributions
      .filter((item) =>
        item.contribution_date.startsWith(monthKey)
      )
      .reduce(
        (sum, item) => sum + Number(item.amount),
        0
      );

    monthlyData.push({
      month: monthDate.toLocaleDateString("en-IN", {
        month: "short",
      }),
      amount: monthlyTotal,
    });
  }

  const sixMonthTotal = monthlyData.reduce(
    (sum, item) => sum + item.amount,
    0
  );

  const monthlyAverage = sixMonthTotal / 6;

  const highestMonth = monthlyData.reduce(
    (highest, current) =>
      current.amount > highest.amount ? current : highest,
    monthlyData[0]
  );

  const maxAmount = Math.max(
    ...monthlyData.map((item) => item.amount),
    1
  );

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <section className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8">
      <p className="text-green-400 text-sm font-medium">
        SAVINGS PERFORMANCE
      </p>

      <h2 className="text-2xl font-bold mt-2">
        Savings Contribution Analytics
      </h2>

      <p className="text-gray-400 text-sm mt-2 mb-6">
        Track your deposits and understand your monthly
        savings patterns.
      </p>

      {loading ? (
        <p className="text-gray-400">
          Loading savings analytics...
        </p>
      ) : error ? (
        <p className="text-red-400">{error}</p>
      ) : (
        <>
          {/* SUMMARY CARDS */}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              label="Total Contributions"
              value={currency(totalContributions)}
              color="text-green-400"
            />

            <StatCard
              label="This Month"
              value={currency(thisMonthSavings)}
              color="text-blue-400"
            />

            <StatCard
              label="Monthly Average (6 Months)"
              value={currency(monthlyAverage)}
              color="text-purple-400"
            />

            <StatCard
              label="Total Deposits"
              value={String(totalDeposits)}
              color="text-white"
            />
          </div>

          {/* MONTHLY CONTRIBUTION CHART */}

          <div className="bg-gray-950 border border-gray-800 rounded-xl p-5">
            <h3 className="text-lg font-semibold mb-2">
              Monthly Savings Contributions
            </h3>

            <p className="text-gray-500 text-sm mb-6">
              Contributions over the last six calendar months
            </p>

            <div className="flex items-end gap-3 h-56">
              {monthlyData.map((item, index) => {
                const height =
                  (item.amount / maxAmount) * 100;

                return (
                  <div
                    key={index}
                    className="flex-1 flex flex-col items-center justify-end h-full min-w-0"
                  >
                    <p className="text-xs text-gray-400 mb-2">
                      {currency(item.amount)}
                    </p>

                    <div className="w-full h-40 flex items-end justify-center">
                      <div
                        className="w-full max-w-16 bg-green-500 rounded-t-md transition-all"
                        style={{
                          height: `${height}%`,
                          minHeight:
                            item.amount > 0 ? "4px" : "0px",
                        }}
                      />
                    </div>

                    <p className="text-gray-400 text-xs mt-3">
                      {item.month}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SAVINGS INSIGHT */}

          <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-5 mt-6">
            <h3 className="text-green-400 font-semibold mb-2">
              Savings Insight
            </h3>

            {totalDeposits === 0 ? (
              <p className="text-gray-300 text-sm">
                You haven't recorded any savings contributions
                yet. Add your first contribution to start
                tracking your savings habits.
              </p>
            ) : sixMonthTotal === 0 ? (
              <p className="text-gray-300 text-sm">
                No contributions were recorded in the last six
                months. Your older contributions are still
                included in the lifetime total.
              </p>
            ) : (
              <p className="text-gray-300 text-sm">
                You contributed{" "}
                <strong>{currency(sixMonthTotal)}</strong>{" "}
                over the last six months, averaging{" "}
                <strong>{currency(monthlyAverage)}</strong>{" "}
                per month. Your highest contribution month was{" "}
                <strong>{highestMonth.month}</strong> with{" "}
                <strong>
                  {currency(highestMonth.amount)}
                </strong>.
              </p>
            )}
          </div>

          <p className="text-gray-500 text-xs mt-5">
            Analytics include recorded savings contributions
            only. Starting balances entered when goals were
            created are not counted as contributions.
          </p>
        </>
      )}
    </section>
  );
}

// ============================================================
// REUSABLE STAT CARD
// ============================================================

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="bg-gray-950 border border-gray-800 rounded-xl p-4">
      <p className="text-gray-400 text-xs">
        {label}
      </p>

      <p className={`text-xl font-bold mt-2 ${color}`}>
        {value}
      </p>
    </div>
  );
}
