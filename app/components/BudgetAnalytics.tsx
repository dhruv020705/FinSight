
"use client";

import { useMemo } from "react";

type Budget = {
  id: string;
  category: string;
  monthly_limit: number;
};

type Transaction = {
  id: string;
  category: string | null;
  amount: number;
  type: string;
};

type Props = {
  budgets: Budget[];
  transactions: Transaction[];
  month: number;
  year: number;
};

function money(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

function normalize(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

export default function BudgetAnalytics({
  budgets,
  transactions,
  month,
  year,
}: Props) {
  const analytics = useMemo(() => {
    const spending = new Map<string, number>();

    for (const transaction of transactions) {
      if (transaction.type !== "expense") continue;

      const key = normalize(transaction.category);
      const amount = Number(transaction.amount);

      if (
        !key ||
        !Number.isFinite(amount) ||
        amount <= 0
      ) {
        continue;
      }

      spending.set(
        key,
        (spending.get(key) ?? 0) + amount
      );
    }

    const categories = budgets.map((budget) => {
      const limit = Number(budget.monthly_limit);
      const spent =
        spending.get(normalize(budget.category)) ?? 0;

      const utilization =
        limit > 0 ? (spent / limit) * 100 : 0;

      return {
        id: budget.id,
        category: budget.category,
        limit,
        spent,
        remaining: limit - spent,
        utilization,
      };
    });

    const totalBudget = categories.reduce(
      (sum, item) => sum + item.limit,
      0
    );

    const totalSpent = categories.reduce(
      (sum, item) => sum + item.spent,
      0
    );

    const totalExpenses = Array.from(
      spending.values()
    ).reduce((sum, value) => sum + value, 0);

    const overBudget = categories.filter(
      (item) => item.spent > item.limit
    );

    const approaching = categories.filter(
      (item) =>
        item.utilization >= 80 &&
        item.utilization <= 100
    );

    return {
      categories,
      totalBudget,
      totalSpent,
      totalExpenses,
      unbudgeted: Math.max(
        0,
        totalExpenses - totalSpent
      ),
      utilization:
        totalBudget > 0
          ? (totalSpent / totalBudget) * 100
          : 0,
      overBudget,
      approaching,
    };
  }, [budgets, transactions]);

  const maxValue = Math.max(
    1,
    ...analytics.categories.flatMap((item) => [
      item.limit,
      item.spent,
    ])
  );

  const monthName = new Date(
    year,
    month - 1,
    1
  ).toLocaleString("en-IN", {
    month: "long",
  });

  return (
    <section className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8 text-white">
      {/* HEADER */}

      <div className="mb-7">
        <p className="text-green-400 text-sm font-semibold">
          FINANCIAL ANALYTICS
        </p>

        <h2 className="text-2xl font-bold mt-2">
          Budget Analytics
        </h2>

        <p className="text-gray-400 text-sm mt-2">
          Spending performance for {monthName} {year}.
        </p>
      </div>

      {/* SUMMARY */}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <AnalyticsCard
          label="Total Budget"
          value={money(analytics.totalBudget)}
        />

        <AnalyticsCard
          label="Budgeted Spending"
          value={money(analytics.totalSpent)}
        />

        <AnalyticsCard
          label="Budget Utilization"
          value={`${analytics.utilization.toFixed(1)}%`}
          color={
            analytics.utilization > 100
              ? "text-red-400"
              : analytics.utilization >= 80
              ? "text-yellow-400"
              : "text-green-400"
          }
        />

        <AnalyticsCard
          label="Unbudgeted Spending"
          value={money(analytics.unbudgeted)}
          color="text-yellow-400"
        />
      </div>

      {analytics.categories.length === 0 ? (
        <div className="bg-gray-950 border border-gray-800 rounded-xl p-6 text-center">
          <p className="text-gray-400">
            Create a budget to view category analytics.
          </p>
        </div>
      ) : (
        <>
          {/* CATEGORY COMPARISON */}

          <div className="bg-gray-950 border border-gray-800 rounded-xl p-5 mb-7">
            <h3 className="text-lg font-semibold mb-2">
              Budget vs Actual Spending
            </h3>

            <p className="text-gray-400 text-sm mb-6">
              Compare planned and actual spending for
              each budget category.
            </p>

            <div className="flex flex-wrap gap-5 mb-6 text-xs text-gray-400">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-blue-500 rounded-sm" />
                Budget
              </div>

              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-green-500 rounded-sm" />
                Actual Spending
              </div>
            </div>

            <div className="space-y-7">
              {analytics.categories.map((item) => (
                <div key={item.id}>
                  <div className="flex flex-wrap justify-between gap-2 mb-3">
                    <h4 className="font-semibold text-sm">
                      {item.category}
                    </h4>

                    <p className="text-gray-400 text-xs">
                      {money(item.spent)} /{" "}
                      {money(item.limit)}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-blue-500 h-full rounded-full"
                        style={{
                          width: `${
                            (item.limit / maxValue) * 100
                          }%`,
                        }}
                      />
                    </div>

                    <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
                      <div
                        className={
                          item.spent > item.limit
                            ? "bg-red-500 h-full rounded-full"
                            : "bg-green-500 h-full rounded-full"
                        }
                        style={{
                          width: `${
                            (item.spent / maxValue) * 100
                          }%`,
                        }}
                      />
                    </div>
                  </div>

                  <p
                    className={`text-xs mt-3 ${
                      item.remaining < 0
                        ? "text-red-400"
                        : "text-gray-400"
                    }`}
                  >
                    {item.remaining >= 0
                      ? `${money(item.remaining)} remaining`
                      : `${money(
                          Math.abs(item.remaining)
                        )} over budget`}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* CATEGORY UTILIZATION */}

          <div className="bg-gray-950 border border-gray-800 rounded-xl p-5 mb-7">
            <h3 className="text-lg font-semibold mb-5">
              Category Utilization
            </h3>

            <div className="space-y-5">
              {analytics.categories.map((item) => {
                const color =
                  item.utilization > 100
                    ? "bg-red-500"
                    : item.utilization >= 80
                    ? "bg-yellow-500"
                    : "bg-green-500";

                return (
                  <div key={item.id}>
                    <div className="flex justify-between gap-3 mb-2">
                      <span className="text-sm">
                        {item.category}
                      </span>

                      <span className="text-gray-400 text-sm">
                        {item.utilization.toFixed(1)}%
                      </span>
                    </div>

                    <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${color} rounded-full`}
                        style={{
                          width: `${Math.min(
                            100,
                            Math.max(0, item.utilization)
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* INSIGHTS */}

          <div className="bg-gray-950 border border-gray-800 rounded-xl p-5">
            <h3 className="text-lg font-semibold mb-5">
              Spending Insights
            </h3>

            <div className="space-y-3">
              {analytics.overBudget.length > 0 && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                  <p className="text-red-400 font-semibold text-sm">
                    Overspending Detected
                  </p>

                  <p className="text-gray-300 text-sm mt-2">
                    {analytics.overBudget.length}{" "}
                    {analytics.overBudget.length === 1
                      ? "category has"
                      : "categories have"}{" "}
                    exceeded their monthly budget.
                  </p>
                </div>
              )}

              {analytics.approaching.length > 0 && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                  <p className="text-yellow-400 font-semibold text-sm">
                    Approaching Budget Limits
                  </p>

                  <p className="text-gray-300 text-sm mt-2">
                    {analytics.approaching.length}{" "}
                    {analytics.approaching.length === 1
                      ? "category has"
                      : "categories have"}{" "}
                    used at least 80% of its budget.
                  </p>
                </div>
              )}

              {analytics.overBudget.length === 0 &&
                analytics.approaching.length === 0 && (
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                    <p className="text-green-400 text-sm">
                      All budgeted categories are below
                      the warning threshold.
                    </p>
                  </div>
                )}

              {analytics.unbudgeted > 0 && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                  <p className="text-yellow-400 font-semibold text-sm">
                    Unbudgeted Expenses
                  </p>

                  <p className="text-gray-300 text-sm mt-2">
                    {money(analytics.unbudgeted)} was
                    spent in categories without a budget.
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </section>
  );
}

function AnalyticsCard({
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
        className={`text-xl font-bold mt-3 break-words ${color}`}
      >
        {value}
      </p>
    </div>
  );
}
