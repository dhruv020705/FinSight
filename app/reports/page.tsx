

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useRouter } from "next/navigation";

import { supabase } from "@/supabase";

import FinancialReportExport from "../components/FinancialReportExport";
import FinSightNavbar from "../components/FinSightNavbar";

import {

  ResponsiveContainer,

  BarChart,

  Bar,

  LineChart,

  Line,

  PieChart,

  Pie,

  Cell,

  CartesianGrid,

  XAxis,

  YAxis,

  Tooltip,

  Legend,

} from "recharts";

type Transaction = {

  id: string;

  category: string | null;

  amount: number;

  type: string;

  transaction_date: string;

};

type MonthlyData = {

  key: string;

  month: string;

  income: number;

  expenses: number;

  netCashFlow: number;

};

type CategoryData = {

  name: string;

  value: number;

};

const COLORS = [

  "#10b981",

  "#3b82f6",

  "#f59e0b",

  "#8b5cf6",

  "#ec4899",

  "#06b6d4",

  "#ef4444",

  "#84cc16",

];

const MONTHS = [

  "January", "February", "March", "April",

  "May", "June", "July", "August",

  "September", "October", "November", "December",

];

function money(value: number) {

  return new Intl.NumberFormat("en-IN", {

    style: "currency",

    currency: "INR",

    maximumFractionDigits: 2,

  }).format(value);

}

function dateString(year: number, month: number) {

  return `${year}-${String(month).padStart(2, "0")}-01`;

}

export default function ReportsPage() {

  const router = useRouter();

  const today = new Date();

  const [selectedMonth, setSelectedMonth] = useState(

    today.getMonth() + 1

  );

  const [selectedYear, setSelectedYear] = useState(

    today.getFullYear()

  );

  const [transactions, setTransactions] = useState<

    Transaction[]

  >([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const fetchReports = useCallback(async () => {

    setLoading(true);

    setError("");

    try {

      const {

        data: { user },

        error: authError,

      } = await supabase.auth.getUser();

      if (authError || !user) {

        router.push("/login");

        return;

      }

      // Load the six-month period ending in the

      // selected month.

      const start = new Date(

        selectedYear,

        selectedMonth - 6,

        1

      );

      const end = new Date(

        selectedYear,

        selectedMonth,

        1

      );

      const startDate = dateString(

        start.getFullYear(),

        start.getMonth() + 1

      );

      const endDate = dateString(

        end.getFullYear(),

        end.getMonth() + 1

      );

      const { data, error: queryError } =

        await supabase

          .from("transactions")

          .select(

            "id, category, amount, type, transaction_date"

          )

          .eq("user_id", user.id)

          .gte("transaction_date", startDate)

          .lt("transaction_date", endDate)

          .order("transaction_date", {

            ascending: true,

          });

      if (queryError) {

        throw new Error(queryError.message);

      }

      setTransactions(

        (data ?? []) as Transaction[]

      );

    } catch (err) {

      setError(

        err instanceof Error

          ? err.message

          : "Unable to load financial reports."

      );

    } finally {

      setLoading(false);

    }

  }, [router, selectedMonth, selectedYear]);

  useEffect(() => {

    void fetchReports();

  }, [fetchReports]);

  const report = useMemo(() => {

    const selectedKey = `${selectedYear}-${String(

      selectedMonth

    ).padStart(2, "0")}`;

    let income = 0;

    let expenses = 0;

    const categoryMap = new Map<string, number>();

    const monthlyMap = new Map<

      string,

      { income: number; expenses: number }

    >();

    for (const transaction of transactions) {

      const amount = Number(transaction.amount);

      if (!Number.isFinite(amount) || amount <= 0) {

        continue;

      }

      const monthKey =

        transaction.transaction_date.slice(0, 7);

      const existing = monthlyMap.get(monthKey) ?? {

        income: 0,

        expenses: 0,

      };

      if (transaction.type === "income") {

        existing.income += amount;

        if (monthKey === selectedKey) {

          income += amount;

        }

      } else if (transaction.type === "expense") {

        existing.expenses += amount;

        if (monthKey === selectedKey) {

          expenses += amount;

          const category =

            transaction.category?.trim() ||

            "Uncategorized";

          categoryMap.set(

            category,

            (categoryMap.get(category) ?? 0) +

              amount

          );

        }

      }

      monthlyMap.set(monthKey, existing);

    }

    const monthly: MonthlyData[] = [];

    for (let offset = 5; offset >= 0; offset--) {

      const date = new Date(

        selectedYear,

        selectedMonth - 1 - offset,

        1

      );

      const key = `${date.getFullYear()}-${String(

        date.getMonth() + 1

      ).padStart(2, "0")}`;

      const values = monthlyMap.get(key) ?? {

        income: 0,

        expenses: 0,

      };

      monthly.push({

        key,

        month: date.toLocaleString("en-IN", {

          month: "short",

          year: "2-digit",

        }),

        income: values.income,

        expenses: values.expenses,

        netCashFlow:

          values.income - values.expenses,

      });

    }

    const categories: CategoryData[] =

      Array.from(categoryMap.entries())

        .map(([name, value]) => ({

          name,

          value,

        }))

        .sort((a, b) => b.value - a.value);

    const netCashFlow = income - expenses;

    const savingsRate =

      income > 0

        ? (netCashFlow / income) * 100

        : null;

    const highestExpenseCategory =

      categories.length > 0

        ? categories[0]

        : null;

    return {

      income,

      expenses,

      netCashFlow,

      savingsRate,

      categories,

      monthly,

      highestExpenseCategory,

    };

  }, [transactions, selectedMonth, selectedYear]);

  const hasData =

    report.income > 0 ||

    report.expenses > 0 ||

    report.monthly.some(

      (item) =>

        item.income > 0 || item.expenses > 0

    );

  return (

    <main className="min-h-screen bg-[#070d19] text-white">
      <FinSightNavbar />
      <div className="px-4 py-8 sm:px-6 lg:px-10 lg:py-10">

      <div className="max-w-7xl mx-auto">

        {/* HEADER */}

        <div className="mb-8">

          <p className="text-emerald-400 text-sm font-semibold">

            FINSIGHT FINANCIAL INTELLIGENCE

          </p>

          <h1 className="relative text-3xl font-bold tracking-tight mt-3 sm:text-4xl">

            Financial Reports

          </h1>

          <p className="relative text-slate-300 mt-3 max-w-2xl leading-relaxed">

            Analyze income, expenses, cash flow, and

            spending patterns in one place.

          </p>

        </div>

        {/* DATE FILTERS */}

        <div className="bg-[#111c2e] border border-white/10 rounded-2xl p-5 sm:p-6 mb-7 shadow-xl shadow-black/10">

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            <div>

              <label

                htmlFor="report-month"

                className="block text-sm text-slate-300 mb-2 font-medium"

              >

                Report Month

              </label>

              <select

                id="report-month"

                value={selectedMonth}

                onChange={(event) =>

                  setSelectedMonth(

                    Number(event.target.value)

                  )

                }

                className="w-full bg-[#0a1322] border border-white/10 rounded-xl px-4 py-3 text-slate-100 outline-none focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/10 transition"

              >

                {MONTHS.map((month, index) => (

                  <option

                    key={month}

                    value={index + 1}

                  >

                    {month}

                  </option>

                ))}

              </select>

            </div>

            <div>

              <label

                htmlFor="report-year"

                className="block text-sm text-slate-300 mb-2 font-medium"

              >

                Report Year

              </label>

              <select

                id="report-year"

                value={selectedYear}

                onChange={(event) =>

                  setSelectedYear(

                    Number(event.target.value)

                  )

                }

                className="w-full bg-[#0a1322] border border-white/10 rounded-xl px-4 py-3 text-slate-100 outline-none focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/10 transition"

              >

                {Array.from(

                  { length: 11 },

                  (_, index) =>

                    today.getFullYear() - 5 + index

                ).map((year) => (

                  <option key={year} value={year}>

                    {year}

                  </option>

                ))}

              </select>

            </div>

          </div>

        </div>

        {/* ERROR */}

        {error && (

          <div

            role="alert"

            className="bg-red-500/10 border border-red-500/30 text-red-300 rounded-xl p-4 mb-6"

          >

            {error}

          </div>

        )}

        {loading ? (

          <div className="bg-[#111c2e] border border-white/10 rounded-2xl p-8">

            <p className="text-slate-400">

              Loading financial reports...

            </p>

          </div>

        ) : (

          <>

          {/* Export */}

          <FinancialReportExport

            month={selectedMonth}

            year={selectedYear}

          />

          {/* SUMMARY CARDS */}

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">

              <ReportCard

                label="Total Income"

                value={money(report.income)}

                color="text-emerald-400"

              />

              <ReportCard

                label="Total Expenses"

                value={money(report.expenses)}

                color="text-red-400"

              />

              <ReportCard

                label="Net Cash Flow"

                value={money(report.netCashFlow)}

                color={

                  report.netCashFlow >= 0

                    ? "text-emerald-400"

                    : "text-red-400"

                }

              />

              <ReportCard

                label="Savings Rate"

                value={

                  report.savingsRate === null

                    ? "N/A"

                    : `${report.savingsRate.toFixed(1)}%`

                }

                color={

                  report.savingsRate !== null &&

                  report.savingsRate >= 20

                    ? "text-emerald-400"

                    : "text-amber-400"

                }

              />

            </div>

            {!hasData && (

              <div className="bg-[#111c2e] border border-white/10 rounded-2xl p-6 sm:p-7 mb-8 shadow-lg shadow-black/10">

                <p className="text-slate-400">

                  No income or expense transactions were

                  found for this six-month period.

                </p>

              </div>

            )}

            {/* INCOME VS EXPENSES */}

            <div className="bg-[#111c2e] border border-white/10 rounded-2xl p-6 sm:p-7 mb-8 shadow-lg shadow-black/10">

              <h2 className="text-xl font-semibold tracking-tight mb-2">

                Income vs Expenses

              </h2>

              <p className="text-slate-400 text-sm mb-6">

                Compare monthly income and expenses over

                the last six months.

              </p>

              <div className="w-full h-80 rounded-xl bg-[#0a1322]/50 p-2">

                <ResponsiveContainer

                  width="100%"

                  height="100%"

                >

                  <BarChart data={report.monthly}>

                    <CartesianGrid

                      stroke="#26384c"

                      strokeDasharray="3 3"

                    />

                    <XAxis

                      dataKey="month"

                      stroke="#94a3b8"

                      fontSize={12}

                    />

                    <YAxis

                      stroke="#94a3b8"

                      fontSize={12}

                      tickFormatter={(value: number) =>

                        `₹${(value / 1000).toFixed(0)}k`

                      }

                    />

                    <Tooltip

                      contentStyle={{

                        backgroundColor: "#101d2f",

                        border: "1px solid #304259",

                        borderRadius: "12px",

                      }}

                      formatter={(value) =>

                        money(Number(value ?? 0))

                      }

                    />

                    <Legend />

                    <Bar

                      dataKey="income"

                      name="Income"

                      fill="#10b981"

                      radius={[4, 4, 0, 0]}

                    />

                    <Bar

                      dataKey="expenses"

                      name="Expenses"

                      fill="#ef4444"

                      radius={[4, 4, 0, 0]}

                    />

                  </BarChart>

                </ResponsiveContainer>

              </div>

            </div>

            {/* CASH FLOW TREND */}

            <div className="bg-[#111c2e] border border-white/10 rounded-2xl p-6 sm:p-7 mb-8 shadow-lg shadow-black/10">

              <h2 className="text-xl font-semibold tracking-tight mb-2">

                Net Cash Flow Trend

              </h2>

              <p className="text-slate-400 text-sm mb-6">

                Track how much income remains after

                expenses each month.

              </p>

              <div className="w-full h-72 rounded-xl bg-[#0a1322]/50 p-2">

                <ResponsiveContainer

                  width="100%"

                  height="100%"

                >

                  <LineChart data={report.monthly}>

                    <CartesianGrid

                      stroke="#26384c"

                      strokeDasharray="3 3"

                    />

                    <XAxis

                      dataKey="month"

                      stroke="#94a3b8"

                      fontSize={12}

                    />

                    <YAxis

                      stroke="#94a3b8"

                      fontSize={12}

                      tickFormatter={(value: number) =>

                        `₹${(value / 1000).toFixed(0)}k`

                      }

                    />

                    <Tooltip

                      contentStyle={{

                        backgroundColor: "#101d2f",

                        border: "1px solid #304259",

                      }}

                      formatter={(value) =>

                        money(Number(value ?? 0))

                      }

                    />

                    <Legend />

                    <Line

                      type="monotone"

                      dataKey="netCashFlow"

                      name="Net Cash Flow"

                      stroke="#3b82f6"

                      strokeWidth={3}

                      dot={{ r: 4 }}

                    />

                  </LineChart>

                </ResponsiveContainer>

              </div>

            </div>

            {/* CATEGORY SPENDING */}

            <div className="bg-[#111c2e] border border-white/10 rounded-2xl p-6 sm:p-7 mb-8 shadow-lg shadow-black/10">

              <h2 className="text-xl font-semibold tracking-tight mb-2">

                Expense Distribution

              </h2>

              <p className="text-slate-400 text-sm mb-6">

                Category-wise spending for{" "}

                {MONTHS[selectedMonth - 1]}{" "}

                {selectedYear}.

              </p>

              {report.categories.length === 0 ? (

                <p className="text-slate-500">

                  No expense transactions for the

                  selected month.

                </p>

              ) : (

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">

                  <div className="w-full h-80 rounded-xl bg-[#0a1322]/50 p-2">

                    <ResponsiveContainer

                      width="100%"

                      height="100%"

                    >

                      <PieChart>

                        <Pie

                          data={report.categories}

                          dataKey="value"

                          nameKey="name"

                          cx="50%"

                          cy="50%"

                          outerRadius={110}

                          labelLine={false}

                        >

                          {report.categories.map(

                            (category, index) => (

                              <Cell

                                key={category.name}

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

                          contentStyle={{

                            backgroundColor: "#101d2f",

                            border:

                              "1px solid #304259",

                          }}

                          formatter={(value) =>

                            money(Number(value ?? 0))

                          }

                        />

                      </PieChart>

                    </ResponsiveContainer>

                  </div>

                  <div className="space-y-3">

                    {report.categories.map(

                      (category, index) => (

                        <div

                          key={category.name}

                          className="flex justify-between items-center gap-3 bg-[#0a1322] border border-white/10 rounded-xl p-3"

                        >

                          <div className="flex items-center gap-3 min-w-0">

                            <span

                              className="w-3 h-3 rounded-sm shrink-0"

                              style={{

                                backgroundColor:

                                  COLORS[

                                    index %

                                      COLORS.length

                                  ],

                              }}

                            />

                            <span className="text-sm truncate">

                              {category.name}

                            </span>

                          </div>

                          <span className="text-sm font-semibold whitespace-nowrap">

                            {money(category.value)}

                          </span>

                        </div>

                      )

                    )}

                  </div>

                </div>

              )}

            </div>

            {/* MONTHLY SUMMARY TABLE */}

            <div className="bg-[#111c2e] border border-white/10 rounded-2xl p-6 sm:p-7 mb-8 shadow-lg shadow-black/10">

              <h2 className="text-xl font-semibold tracking-tight mb-5">

                Monthly Financial Summary

              </h2>

              <div className="overflow-x-auto rounded-xl border border-white/5">

                <table className="w-full text-sm">

                  <thead>

                    <tr className="border-b border-white/10 bg-[#0a1322]/60 text-slate-400">

                      <th className="p-4 text-left">

                        Month

                      </th>

                      <th className="p-4 text-right">

                        Income

                      </th>

                      <th className="p-4 text-right">

                        Expenses

                      </th>

                      <th className="p-4 text-right">

                        Net Cash Flow

                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {report.monthly.map((item) => (

                      <tr

                        key={item.key}

                        className="border-b border-white/5 hover:bg-white/[0.03] transition-colors"

                      >

                        <td className="p-4 font-medium">

                          {item.month}

                        </td>

                        <td className="p-4 text-right text-emerald-400">

                          {money(item.income)}

                        </td>

                        <td className="p-4 text-right text-red-400">

                          {money(item.expenses)}

                        </td>

                        <td

                          className={`p-4 text-right font-semibold ${

                            item.netCashFlow >= 0

                              ? "text-emerald-400"

                              : "text-red-400"

                          }`}

                        >

                          {money(item.netCashFlow)}

                        </td>

                      </tr>

                    ))}

                  </tbody>

                </table>

              </div>

            </div>

            {/* FINANCIAL INSIGHTS */}

            <div className="bg-[#111c2e] border border-white/10 rounded-2xl p-6 sm:p-7 shadow-lg shadow-black/10">

              <h2 className="text-xl font-semibold tracking-tight mb-5">

                Financial Insights

              </h2>

              <div className="space-y-4">

                <InsightCard

                  title="Net Cash Flow"

                  text={

                    report.netCashFlow >= 0

                      ? `You recorded ${money(

                          report.netCashFlow

                        )} more income than expenses this month.`

                      : `Your expenses exceeded income by ${money(

                          Math.abs(report.netCashFlow)

                        )} this month.`

                  }

                  color={

                    report.netCashFlow >= 0

                      ? "green"

                      : "red"

                  }

                />

                {report.highestExpenseCategory && (

                  <InsightCard

                    title="Largest Expense Category"

                    text={`Your highest spending category was ${

                      report.highestExpenseCategory.name

                    }, accounting for ${money(

                      report.highestExpenseCategory.value

                    )}.`}

                    color="yellow"

                  />

                )}

                <InsightCard

                  title="Savings Rate"

                  text={

                    report.savingsRate === null

                      ? "No income was recorded for the selected month, so a savings rate cannot be calculated."

                      : `Your estimated cash-flow savings rate was ${report.savingsRate.toFixed(

                          1

                        )}% of recorded income.`

                  }

                  color="blue"

                />

              </div>

              <p className="text-slate-500 text-xs mt-5">

                Reports use recorded transactions.

                Net cash flow is income minus expenses;

                it is not necessarily the amount

                transferred into savings goals.

              </p>

            </div>

          </>

        )}

      </div>

      </div>
    </main>

  );

}

function ReportCard({

  label,

  value,

  color = "text-white",

}: {

  label: string;

  value: string;

  color?: string;

}) {

  return (

    <div className="relative overflow-hidden bg-gradient-to-br from-[#152438] to-[#101a2c] border border-white/10 rounded-2xl p-5 sm:p-6 shadow-lg shadow-black/10 hover:border-emerald-400/20 transition-colors">

      <p className="text-slate-400 text-sm">

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

function InsightCard({

  title,

  text,

  color,

}: {

  title: string;

  text: string;

  color: "green" | "red" | "yellow" | "blue";

}) {

  const styles = {

    green: "bg-emerald-500/10 border-emerald-500/25",

    red: "bg-red-500/10 border-red-500/30",

    yellow: "bg-amber-500/10 border-amber-500/25",

    blue: "bg-sky-500/10 border-sky-500/25",

  };

  return (

    <div

      className={`border rounded-xl p-5 ${styles[color]}`}

    >

      <h3 className="font-semibold text-sm">

        {title}

      </h3>

      <p className="text-gray-300 text-sm mt-2 leading-relaxed">

        {text}

      </p>

    </div>

  );

}
