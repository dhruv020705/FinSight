"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from "recharts";

type Transaction = {
  id: number;
  amount: number;
  type: "income" | "expense";
  category: string;
  description: string | null;
  transaction_date: string;
};

type FinancialChartsProps = {
  transactions: Transaction[];
};

export default function FinancialCharts({
  transactions,
}: FinancialChartsProps) {
  // =====================================================
  // TOTAL INCOME
  // =====================================================

  const totalIncome = transactions
    .filter((transaction) => transaction.type === "income")
    .reduce(
      (total, transaction) =>
        total + Number(transaction.amount),
      0
    );

  // =====================================================
  // TOTAL EXPENSES
  // =====================================================

  const totalExpenses = transactions
    .filter((transaction) => transaction.type === "expense")
    .reduce(
      (total, transaction) =>
        total + Number(transaction.amount),
      0
    );

  // =====================================================
  // BAR CHART DATA
  // =====================================================

  const incomeExpenseData = [
    {
      name: "Income",
      amount: totalIncome,
    },
    {
      name: "Expenses",
      amount: totalExpenses,
    },
  ];

  // =====================================================
  // EXPENSE CATEGORY DATA
  // =====================================================

  const categoryTotals: Record<string, number> = {};

  transactions
    .filter((transaction) => transaction.type === "expense")
    .forEach((transaction) => {
      const category =
        transaction.category || "Other";

      if (!categoryTotals[category]) {
        categoryTotals[category] = 0;
      }

      categoryTotals[category] += Number(
        transaction.amount
      );
    });

  const expenseCategoryData = Object.entries(
    categoryTotals
  ).map(([name, value]) => ({
    name,
    value,
  }));

  // =====================================================
  // MONTHLY TREND DATA
  // =====================================================

  type MonthlyData = {
    monthKey: string;
    month: string;
    income: number;
    expenses: number;
  };

  const monthlyTotals: Record<
    string,
    MonthlyData
  > = {};

  transactions.forEach((transaction) => {
    const date = new Date(
      `${transaction.transaction_date}T00:00:00`
    );

    if (Number.isNaN(date.getTime())) {
      return;
    }

    const year = date.getFullYear();

    const monthNumber = date.getMonth();

    // Example:
    // 2026-09
    const monthKey = `${year}-${String(
      monthNumber + 1
    ).padStart(2, "0")}`;

    // Example:
    // Sep 2026
    const monthLabel = date.toLocaleDateString(
      "en-IN",
      {
        month: "short",
        year: "numeric",
      }
    );

    if (!monthlyTotals[monthKey]) {
      monthlyTotals[monthKey] = {
        monthKey,
        month: monthLabel,
        income: 0,
        expenses: 0,
      };
    }

    if (transaction.type === "income") {
      monthlyTotals[monthKey].income +=
        Number(transaction.amount);
    }

    if (transaction.type === "expense") {
      monthlyTotals[monthKey].expenses +=
        Number(transaction.amount);
    }
  });

  const monthlyTrendData = Object.values(
    monthlyTotals
  )
    .sort((a, b) =>
      a.monthKey.localeCompare(b.monthKey)
    )
    .slice(-6);

  // =====================================================
  // PIE CHART COLORS
  // =====================================================

  const COLORS = [
    "#22c55e",
    "#3b82f6",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#ec4899",
    "#06b6d4",
    "#84cc16",
  ];

  // =====================================================
  // FORMAT MONEY
  // =====================================================

  function formatMoney(value: number) {
    return `₹${value.toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    })}`;
  }

  // =====================================================
  // COMPONENT
  // =====================================================

  return (
    <section className="mt-8">

      {/* HEADER */}

      <div className="mb-6">

        <h2 className="text-3xl font-bold">
          Financial Analytics
        </h2>

        <p className="text-gray-400 mt-2">
          Visual analysis of your income and
          spending.
        </p>

      </div>

      {/* ================================================= */}
      {/* FIRST ROW */}
      {/* ================================================= */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ============================================= */}
        {/* INCOME VS EXPENSES */}
        {/* ============================================= */}

        <div className="border border-gray-700 rounded-2xl p-6">

          <h3 className="text-xl font-bold mb-2">
            Income vs Expenses
          </h3>

          <p className="text-gray-400 text-sm mb-6">
            Comparison of your total income and
            expenses.
          </p>

          <div className="w-full h-[320px]">

            <ResponsiveContainer
              width="100%"
              height="100%"
            >

              <BarChart data={incomeExpenseData}>

                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#374151"
                />

                <XAxis
                  dataKey="name"
                  stroke="#9ca3af"
                />

                <YAxis
                  stroke="#9ca3af"
                  tickFormatter={(value) =>
                    `₹${Number(
                      value
                    ).toLocaleString("en-IN")}`
                  }
                />

                <Tooltip
                  formatter={(value) => [
                    formatMoney(
                      Number(value)
                    ),
                    "Amount",
                  ]}
                  contentStyle={{
                    backgroundColor: "#111827",
                    border:
                      "1px solid #374151",
                    borderRadius: "8px",
                  }}
                  labelStyle={{
                    color: "#ffffff",
                  }}
                />

                <Bar
                  dataKey="amount"
                  fill="#22c55e"
                  radius={[8, 8, 0, 0]}
                />

              </BarChart>

            </ResponsiveContainer>

          </div>

        </div>

        {/* ============================================= */}
        {/* EXPENSE BREAKDOWN */}
        {/* ============================================= */}

        <div className="border border-gray-700 rounded-2xl p-6">

          <h3 className="text-xl font-bold mb-2">
            Expense Breakdown
          </h3>

          <p className="text-gray-400 text-sm mb-6">
            See where your money is being spent.
          </p>

          {expenseCategoryData.length === 0 ? (

            <div className="h-[320px] flex items-center justify-center">

              <p className="text-gray-400">
                Add some expenses to see your
                breakdown.
              </p>

            </div>

          ) : (

            <div className="w-full h-[320px]">

              <ResponsiveContainer
                width="100%"
                height="100%"
              >

                <PieChart>

                  <Pie
                    data={expenseCategoryData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="45%"
                    outerRadius={95}
                    label={({ name }) =>
                      name
                    }
                  >

                    {expenseCategoryData.map(
                      (_, index) => (

                        <Cell
                          key={`cell-${index}`}
                          fill={
                            COLORS[
                              index %
                                COLORS.length
                            ]
                          }
                        />

                      )
                    )}

                  </Pie>

                  <Tooltip
                    formatter={(value) => [
                      formatMoney(
                        Number(value)
                      ),
                      "Expense",
                    ]}
                    contentStyle={{
                      backgroundColor:
                        "#111827",
                      border:
                        "1px solid #374151",
                      borderRadius: "8px",
                    }}
                  />

                  <Legend />

                </PieChart>

              </ResponsiveContainer>

            </div>

          )}

        </div>

      </div>

      {/* ================================================= */}
      {/* MONTHLY TREND */}
      {/* ================================================= */}

      <div className="border border-gray-700 rounded-2xl p-6 mt-6">

        <h3 className="text-xl font-bold mb-2">
          Monthly Financial Trend
        </h3>

        <p className="text-gray-400 text-sm mb-6">
          Income and expenses across your latest
          six active months.
        </p>

        {monthlyTrendData.length === 0 ? (

          <div className="h-[350px] flex items-center justify-center">

            <p className="text-gray-400">
              Add transactions to see your monthly
              financial trend.
            </p>

          </div>

        ) : (

          <div className="w-full h-[350px]">

            <ResponsiveContainer
              width="100%"
              height="100%"
            >

              <LineChart
                data={monthlyTrendData}
                margin={{
                  top: 10,
                  right: 20,
                  left: 20,
                  bottom: 10,
                }}
              >

                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#374151"
                />

                <XAxis
                  dataKey="month"
                  stroke="#9ca3af"
                />

                <YAxis
                  stroke="#9ca3af"
                  tickFormatter={(value) =>
                    `₹${Number(
                      value
                    ).toLocaleString("en-IN")}`
                  }
                />

                <Tooltip
                  formatter={(
                    value,
                    name
                  ) => [
                    formatMoney(
                      Number(value)
                    ),
                    name === "income"
                      ? "Income"
                      : "Expenses",
                  ]}
                  contentStyle={{
                    backgroundColor: "#111827",
                    border:
                      "1px solid #374151",
                    borderRadius: "8px",
                  }}
                  labelStyle={{
                    color: "#ffffff",
                  }}
                />

                <Legend />

                {/* INCOME LINE */}

                <Line
                  type="monotone"
                  dataKey="income"
                  name="Income"
                  stroke="#22c55e"
                  strokeWidth={3}
                  dot={{
                    r: 5,
                  }}
                  activeDot={{
                    r: 7,
                  }}
                />

                {/* EXPENSE LINE */}

                <Line
                  type="monotone"
                  dataKey="expenses"
                  name="Expenses"
                  stroke="#ef4444"
                  strokeWidth={3}
                  dot={{
                    r: 5,
                  }}
                  activeDot={{
                    r: 7,
                  }}
                />

              </LineChart>

            </ResponsiveContainer>

          </div>

        )}

      </div>

    </section>
  );
}