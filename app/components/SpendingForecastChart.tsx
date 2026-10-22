"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type MonthlyExpense = {
  month: string;
  total_expense: number;
};

type SpendingForecastChartProps = {
  monthlyExpenses: MonthlyExpense[];
  predictedExpense: number | null;
};

type ChartRow = {
  month: string;
  actual: number | null;
  predicted: number | null;
};

function formatMonth(month: string) {
  if (!/^\d{6}$/.test(month)) {
    return month;
  }

  const year = Number(month.slice(0, 4));
  const monthIndex = Number(month.slice(4, 6)) - 1;

  return new Intl.DateTimeFormat("en-IN", {
    month: "short",
    year: "2-digit",
  }).format(new Date(year, monthIndex, 1));
}

function getNextMonth(month: string) {
  if (!/^\d{6}$/.test(month)) {
    return "Forecast";
  }

  const year = Number(month.slice(0, 4));
  const monthIndex = Number(month.slice(4, 6)) - 1;

  const date = new Date(year, monthIndex + 1, 1);

  return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}`;
}

function formatMoney(value: number) {
  return `₹${Number(value).toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  })}`;
}

export default function SpendingForecastChart({
  monthlyExpenses,
  predictedExpense,
}: SpendingForecastChartProps) {
  if (monthlyExpenses.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
        <p className="text-sm text-slate-400">
          Add expense transactions to generate spending history.
        </p>
      </div>
    );
  }

  const sortedExpenses = [...monthlyExpenses].sort((a, b) =>
    a.month.localeCompare(b.month)
  );

  const chartData: ChartRow[] = sortedExpenses.map((item) => ({
    month: formatMonth(item.month),
    actual: Number(item.total_expense),
    predicted: null,
  }));

  if (predictedExpense !== null && sortedExpenses.length > 0) {
    const lastExpense = sortedExpenses[sortedExpenses.length - 1];
    const lastChartRow = chartData[chartData.length - 1];

    // Start forecast line from the latest real month.
    lastChartRow.predicted = Number(lastExpense.total_expense);

    chartData.push({
      month: formatMonth(getNextMonth(lastExpense.month)),
      actual: null,
      predicted: Number(predictedExpense),
    });
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Forecast Visualization
        </p>

        <h3 className="mt-2 text-xl font-bold text-white">
          Monthly Spending Trend
        </h3>

        <p className="mt-1 text-sm text-slate-400">
          Historical expenses with your personalized next-month forecast.
        </p>
      </div>

      <div className="h-[340px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{
              top: 10,
              right: 20,
              left: 10,
              bottom: 10,
            }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(148,163,184,0.12)"
            />

            <XAxis
              dataKey="month"
              stroke="#64748b"
              tick={{
                fill: "#94a3b8",
                fontSize: 12,
              }}
              tickLine={false}
              axisLine={false}
            />

            <YAxis
              stroke="#64748b"
              tick={{
                fill: "#94a3b8",
                fontSize: 12,
              }}
              tickFormatter={(value) => `₹${Math.round(value / 1000)}k`}
              tickLine={false}
              axisLine={false}
            />

            <Tooltip
              formatter={(value, name) => [
                formatMoney(Number(value)),
                name === "actual" ? "Actual Spending" : "ML Forecast",
              ]}
              contentStyle={{
                backgroundColor: "#020617",
                border: "1px solid #334155",
                borderRadius: "12px",
              }}
              labelStyle={{
                color: "#e2e8f0",
              }}
            />

            <Line
              type="monotone"
              dataKey="actual"
              name="actual"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={{
                r: 5,
                fill: "#3b82f6",
              }}
              activeDot={{
                r: 7,
              }}
              connectNulls={false}
            />

            <Line
              type="monotone"
              dataKey="predicted"
              name="predicted"
              stroke="#c084fc"
              strokeWidth={3}
              strokeDasharray="7 7"
              dot={{
                r: 6,
                fill: "#c084fc",
              }}
              activeDot={{
                r: 8,
              }}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-5 flex flex-wrap gap-5 text-sm">
        <div className="flex items-center gap-2 text-slate-400">
          <span className="h-3 w-3 rounded-full bg-blue-500" />
          Actual spending
        </div>

        {predictedExpense !== null && (
          <div className="flex items-center gap-2 text-slate-400">
            <span className="h-3 w-3 rounded-full bg-purple-400" />
            Personalized ML forecast
          </div>
        )}
      </div>
    </div>
  );
}