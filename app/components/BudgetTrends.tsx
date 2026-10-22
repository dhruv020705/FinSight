
"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/supabase";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

type Props = {
  month: number;
  year: number;
};

type BudgetRow = {
  category: string;
  monthly_limit: number;
  month: number;
  year: number;
};

type TransactionRow = {
  category: string | null;
  amount: number;
  type: string;
  transaction_date: string;
};

type MonthlyTrend = {
  key: string;
  month: string;
  totalBudget: number;
  budgetedSpending: number;
  totalExpenses: number;
  unbudgetedSpending: number;
  utilization: number;
  hasBudget: boolean;
};

function money(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

function normalizeCategory(value: string | null) {
  return (value ?? "").trim().toLowerCase();
}

function getMonthRange(month: number, year: number) {
  const end = new Date(year, month - 1, 1);
  const start = new Date(year, month - 6, 1);

  function formatDate(date: Date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}-01`;
  }

  return {
    startDate: formatDate(start),
    endDate: formatDate(
      new Date(end.getFullYear(), end.getMonth() + 1, 1)
    ),
    startYear: start.getFullYear(),
    endYear: end.getFullYear(),
  };
}

export default function BudgetTrends({
  month,
  year,
}: Props) {
  const [data, setData] = useState<MonthlyTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadTrends() {
      setLoading(true);
      setError("");
      setData([]);

      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          throw new Error("Please log in to view budget trends.");
        }

        const range = getMonthRange(month, year);

        const [budgetResponse, transactionResponse] =
          await Promise.all([
            supabase
              .from("budgets")
              .select("category, monthly_limit, month, year")
              .eq("user_id", user.id)
              .gte("year", range.startYear)
              .lte("year", range.endYear),

            supabase
              .from("transactions")
              .select(
                "category, amount, type, transaction_date"
              )
              .eq("user_id", user.id)
              .eq("type", "expense")
              .gte("transaction_date", range.startDate)
              .lt("transaction_date", range.endDate),
          ]);

        if (budgetResponse.error) {
          throw new Error(budgetResponse.error.message);
        }

        if (transactionResponse.error) {
          throw new Error(transactionResponse.error.message);
        }

        const budgets =
          (budgetResponse.data ?? []) as BudgetRow[];

        const transactions =
          (transactionResponse.data ?? []) as TransactionRow[];

        const months: MonthlyTrend[] = [];

        for (let offset = 5; offset >= 0; offset--) {
          const date = new Date(year, month - 1 - offset, 1);

          const currentMonth = date.getMonth() + 1;
          const currentYear = date.getFullYear();

          const monthKey = `${currentYear}-${String(
            currentMonth
          ).padStart(2, "0")}`;

          const monthBudgets = budgets.filter(
            (budget) =>
              budget.month === currentMonth &&
              budget.year === currentYear
          );

          const monthTransactions = transactions.filter(
            (transaction) =>
              transaction.transaction_date.slice(0, 7) ===
              monthKey
          );

          const budgetCategories = new Set(
            monthBudgets.map((budget) =>
              normalizeCategory(budget.category)
            )
          );

          const totalBudget = monthBudgets.reduce(
            (sum, budget) =>
              sum + Number(budget.monthly_limit),
            0
          );

          let totalExpenses = 0;
          let budgetedSpending = 0;

          for (const transaction of monthTransactions) {
            const amount = Number(transaction.amount);

            if (
              !Number.isFinite(amount) ||
              amount <= 0
            ) {
              continue;
            }

            totalExpenses += amount;

            if (
              budgetCategories.has(
                normalizeCategory(transaction.category)
              )
            ) {
              budgetedSpending += amount;
            }
          }

          const utilization =
            totalBudget > 0
              ? (budgetedSpending / totalBudget) * 100
              : 0;

          months.push({
            key: monthKey,
            month: date.toLocaleString("en-IN", {
              month: "short",
              year: "2-digit",
            }),
            totalBudget,
            budgetedSpending,
            totalExpenses,
            unbudgetedSpending: Math.max(
              0,
              totalExpenses - budgetedSpending
            ),
            utilization,
            hasBudget: monthBudgets.length > 0,
          });
        }

        if (!cancelled) {
          setData(months);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load budget trends."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadTrends();

    return () => {
      cancelled = true;
    };
  }, [month, year]);

  const insights = useMemo(() => {
    const monthsWithBudgets = data.filter(
      (item) => item.hasBudget
    );

    const overBudgetMonths = monthsWithBudgets.filter(
      (item) => item.utilization > 100
    );

    const totalBudget = monthsWithBudgets.reduce(
      (sum, item) => sum + item.totalBudget,
      0
    );

    const totalBudgetedSpending = monthsWithBudgets.reduce(
      (sum, item) => sum + item.budgetedSpending,
      0
    );

    const overallUtilization =
      totalBudget > 0
        ? (totalBudgetedSpending / totalBudget) * 100
        : 0;

    const latest = data[data.length - 1];
    const previous = data[data.length - 2];

    const spendingChange =
      latest && previous
        ? latest.totalExpenses - previous.totalExpenses
        : 0;

    const highestSpendingMonth = data.reduce<
      MonthlyTrend | undefined
    >(
      (highest, item) =>
        !highest || item.totalExpenses > highest.totalExpenses
          ? item
          : highest,
      undefined
    );

    return {
      overBudgetMonths: overBudgetMonths.length,
      monthsWithBudgets: monthsWithBudgets.length,
      overallUtilization,
      spendingChange,
      highestSpendingMonth,
    };
  }, [data]);

  if (loading) {
    return (
      <section className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8">
        <p className="text-gray-400">
          Loading historical budget trends...
        </p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8">
        <h2 className="text-xl font-semibold text-white mb-3">
          Monthly Budget Trends
        </h2>

        <p className="text-red-400">{error}</p>
      </section>
    );
  }

  return (
    <section className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8 text-white">
      {/* HEADER */}

      <div className="mb-7">
        <p className="text-green-400 text-sm font-semibold">
          HISTORICAL ANALYTICS
        </p>

        <h2 className="text-2xl font-bold mt-2">
          Monthly Budget Trends
        </h2>

        <p className="text-gray-400 text-sm mt-2">
          Explore your financial performance over the
          six months ending in the selected month.
        </p>
      </div>

      {/* SUMMARY CARDS */}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <TrendCard
          label="Overall Budget Utilization"
          value={`${insights.overallUtilization.toFixed(1)}%`}
        />

        <TrendCard
          label="Months Over Budget"
          value={`${insights.overBudgetMonths} / ${insights.monthsWithBudgets}`}
        />

        <TrendCard
          label="Change in Monthly Expenses"
          value={
            insights.spendingChange > 0
              ? `+${money(insights.spendingChange)}`
              : money(insights.spendingChange)
          }
          color={
            insights.spendingChange > 0
              ? "text-red-400"
              : "text-green-400"
          }
        />

        <TrendCard
          label="Highest Spending Month"
          value={
            insights.highestSpendingMonth
              ? insights.highestSpendingMonth.month
              : "N/A"
          }
        />
      </div>

      {/* BUDGET VS SPENDING CHART */}

      <div className="bg-gray-950 border border-gray-800 rounded-xl p-5 mb-7">
        <h3 className="text-lg font-semibold mb-2">
          Monthly Budget vs Spending
        </h3>

        <p className="text-gray-400 text-sm mb-6">
          Compare your monthly budget limits against
          spending in budgeted categories.
        </p>

        <div className="w-full h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{
                top: 10,
                right: 15,
                left: 5,
                bottom: 5,
              }}
            >
              <CartesianGrid
                stroke="#374151"
                strokeDasharray="3 3"
              />

              <XAxis
                dataKey="month"
                stroke="#9ca3af"
                fontSize={12}
              />

              <YAxis
                stroke="#9ca3af"
                fontSize={12}
                tickFormatter={(value: number) =>
                  `₹${(value / 1000).toFixed(0)}k`
                }
              />

              <Tooltip
                contentStyle={{
                  backgroundColor: "#111827",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                }}
                formatter={(value) =>
                  money(Number(value ?? 0))
                }
              />

              <Legend />

              <Line
                type="monotone"
                dataKey="totalBudget"
                name="Monthly Budget"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ r: 4 }}
                connectNulls={false}
              />

              <Line
                type="monotone"
                dataKey="budgetedSpending"
                name="Budgeted Spending"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* TOTAL EXPENSES CHART */}

      <div className="bg-gray-950 border border-gray-800 rounded-xl p-5 mb-7">
        <h3 className="text-lg font-semibold mb-2">
          Total Monthly Expenses
        </h3>

        <p className="text-gray-400 text-sm mb-6">
          Includes expenses from both budgeted and
          unbudgeted categories.
        </p>

        <div className="w-full h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid
                stroke="#374151"
                strokeDasharray="3 3"
              />

              <XAxis
                dataKey="month"
                stroke="#9ca3af"
                fontSize={12}
              />

              <YAxis
                stroke="#9ca3af"
                fontSize={12}
                tickFormatter={(value: number) =>
                  `₹${(value / 1000).toFixed(0)}k`
                }
              />

              <Tooltip
                contentStyle={{
                  backgroundColor: "#111827",
                  border: "1px solid #374151",
                }}
                formatter={(value) =>
                  money(Number(value ?? 0))
                }
              />

              <Legend />

              <Line
                type="monotone"
                dataKey="totalExpenses"
                name="Total Expenses"
                stroke="#f59e0b"
                strokeWidth={3}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* BUDGET UTILIZATION CHART */}

      <div className="bg-gray-950 border border-gray-800 rounded-xl p-5 mb-7">
        <h3 className="text-lg font-semibold mb-2">
          Budget Utilization Trend
        </h3>

        <p className="text-gray-400 text-sm mb-6">
          Track the percentage of your budget used
          each month. Months without a budget are
          excluded from the utilization line.
        </p>

        <div className="w-full h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data.map((item) => ({
                ...item,
                chartUtilization: item.hasBudget
                  ? item.utilization
                  : null,
              }))}
            >
              <CartesianGrid
                stroke="#374151"
                strokeDasharray="3 3"
              />

              <XAxis
                dataKey="month"
                stroke="#9ca3af"
                fontSize={12}
              />

              <YAxis
                stroke="#9ca3af"
                fontSize={12}
                tickFormatter={(value: number) =>
                  `${value}%`
                }
              />

              <Tooltip
                contentStyle={{
                  backgroundColor: "#111827",
                  border: "1px solid #374151",
                }}
                formatter={(value) =>
                  `${Number(value ?? 0).toFixed(1)}%`
                }
              />

              <Legend />

              <Line
                type="monotone"
                dataKey="chartUtilization"
                name="Budget Utilization"
                stroke="#a78bfa"
                strokeWidth={3}
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* MONTHLY SUMMARY TABLE */}

      <div className="bg-gray-950 border border-gray-800 rounded-xl p-5 mb-7">
        <h3 className="text-lg font-semibold mb-5">
          Monthly Performance Summary
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400">
                <th className="text-left p-3">Month</th>
                <th className="text-right p-3">Budget</th>
                <th className="text-right p-3">
                  Budgeted Spending
                </th>
                <th className="text-right p-3">
                  Total Expenses
                </th>
                <th className="text-right p-3">
                  Utilization
                </th>
              </tr>
            </thead>

            <tbody>
              {data.map((item) => (
                <tr
                  key={item.key}
                  className="border-b border-gray-800/60"
                >
                  <td className="p-3 font-medium">
                    {item.month}
                  </td>

                  <td className="p-3 text-right">
                    {money(item.totalBudget)}
                  </td>

                  <td className="p-3 text-right">
                    {money(item.budgetedSpending)}
                  </td>

                  <td className="p-3 text-right">
                    {money(item.totalExpenses)}
                  </td>

                  <td
                    className={`p-3 text-right font-semibold ${
                      !item.hasBudget
                        ? "text-gray-500"
                        : item.utilization > 100
                        ? "text-red-400"
                        : item.utilization >= 80
                        ? "text-yellow-400"
                        : "text-green-400"
                    }`}
                  >
                    {item.hasBudget
                      ? `${item.utilization.toFixed(1)}%`
                      : "N/A"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FINANCIAL INSIGHTS */}

      <div className="bg-gray-950 border border-gray-800 rounded-xl p-5">
        <h3 className="text-lg font-semibold mb-5">
          Historical Spending Insights
        </h3>

        <div className="space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <p className="text-gray-400 text-xs">
              Highest Spending Month
            </p>

            <p className="text-white font-semibold mt-2">
              {insights.highestSpendingMonth
                ? `${insights.highestSpendingMonth.month} — ${money(
                    insights.highestSpendingMonth.totalExpenses
                  )}`
                : "No data"}
            </p>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <p className="text-gray-400 text-xs">
              Month-over-Month Expense Change
            </p>

            <p
              className={`font-semibold mt-2 ${
                insights.spendingChange > 0
                  ? "text-red-400"
                  : "text-green-400"
              }`}
            >
              {insights.spendingChange > 0
                ? "Increased by "
                : insights.spendingChange < 0
                ? "Decreased by "
                : "No change — "}
              {money(Math.abs(insights.spendingChange))}
            </p>
          </div>

          {insights.overBudgetMonths > 0 && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <p className="text-red-400 font-semibold text-sm">
                Historical Overspending
              </p>

              <p className="text-gray-300 text-sm mt-2">
                You exceeded the combined limits for
                budgeted categories in{" "}
                {insights.overBudgetMonths} of the{" "}
                {insights.monthsWithBudgets} months
                with budgets.
              </p>
            </div>
          )}

          <p className="text-gray-500 text-xs leading-relaxed">
            These insights are calculated from recorded
            transactions and budgets. They are descriptive
            analytics, not predictive financial advice.
          </p>
        </div>
      </div>
    </section>
  );
}

function TrendCard({
  label,
  value,
  color = "text-white",
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="bg-gray-950 border border-gray-800 rounded-xl p-5">
      <p className="text-gray-400 text-xs">
        {label}
      </p>

      <p
        className={`text-lg font-bold mt-3 break-words ${color}`}
      >
        {value}
      </p>
    </div>
  );
}
