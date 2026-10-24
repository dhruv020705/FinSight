"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { supabase } from "@/supabase";

import SpendingForecastChart from "../components/SpendingForecastChart";

import FinancialCharts from "../components/FinancialCharts";

import SpendingAnomalyAlerts from "../components/SpendingAnomalyAlerts";
import FinSightNavbar from "../components/FinSightNavbar";

// ============================================================

// TYPES

// ============================================================

type Profile = {

  full_name: string | null;

  email: string | null;

};

type Transaction = {

  id: number;

  amount: number;

  type: "income" | "expense";

  category: string;

  description: string | null;

  transaction_date: string;

};

type MonthlyExpense = {

  month: number;

  total_expense: number;

};

type Forecast = {

  current_month: number;

  current_expense: number;

  predicted_expense: number;

  difference: number;

  percentage_change: number;

  trend:

    | "increase"

    | "decrease"

    | "stable";

  insight: string;

  months_used: number;

  history_quality:

    | "good"

    | "limited"

    | "very_limited";

  model_details?: {

    general_model_prediction: number;

    personal_trend_prediction: number;

    average_monthly_change: number;

  };

};

type BudgetRecommendation = {

  category: string;

  category_type: string;

  average_monthly_spending: number;

  latest_month_spending: number;

  recommended_budget: number;

  potential_monthly_saving: number;

  reduction_percentage: number;

  trend: string;

  insight: string;

};

type BudgetRecommendationResponse = {

  status: string;

  message?: string;

  months_analyzed: number;

  history_quality: string;

  period?: {

    from: string;

    to: string;

  };

  total_average_spending: number;

  total_recommended_budget: number;

  potential_monthly_saving: number;

  recommendations: BudgetRecommendation[];

};

type SpendingAnomaly = {

  id: number | null;

  amount: number;

  category: string;

  description: string | null;

  transaction_date: string;

  severity: "high" | "medium" | "low";

  anomaly_score: number;

  times_typical_spending: number;

  insight: string;

};

type AnomalyDetectionResponse = {

  status: string;

  message?: string;

  model?: string;

  transactions_analyzed: number;

  anomalies_detected: number;

  typical_transaction_amount?: number;

  anomalies: SpendingAnomaly[];

  category_typical_amounts?: Record<string, number>;

};

// ============================================================

// DASHBOARD PAGE

// ============================================================

export default function DashboardPage() {

  const router = useRouter();

  // ==========================================================

  // PROFILE STATE

  // ==========================================================

  const [profile, setProfile] =

    useState<Profile | null>(null);

  // ==========================================================

  // TRANSACTION STATE

  // ==========================================================

  const [transactions, setTransactions] =

    useState<Transaction[]>([]);

  // ==========================================================

  // PAGE STATE

  // ==========================================================

  const [loading, setLoading] =

    useState(true);

  const [

    errorMessage,

    setErrorMessage,

  ] = useState("");

  // ==========================================================

  // FORECAST STATE

  // ==========================================================

  const [forecast, setForecast] =

    useState<Forecast | null>(null);

  const [

    forecastLoading,

    setForecastLoading,

  ] = useState(false);

  const [

    forecastError,

    setForecastError,

  ] = useState("");

  // ==========================================================

  // BUDGET RECOMMENDATION STATE

  // ==========================================================

  const [budgetRecommendations, setBudgetRecommendations] =

  useState<BudgetRecommendationResponse | null>(null);

  const [budgetLoading, setBudgetLoading] = useState(false);

  const [budgetError, setBudgetError] = useState("");

  // ============================================================

  // ANOMALY DETECTION STATE

  // ============================================================

  const [anomalyResults, setAnomalyResults] =

    useState<AnomalyDetectionResponse | null>(null);

  const [anomalyLoading, setAnomalyLoading] = useState(false);

  const [anomalyError, setAnomalyError] = useState("");

  // ==========================================================

  // FORMAT CURRENCY

  // ==========================================================

  const formatCurrency = (

    value: number

  ) => {

    return new Intl.NumberFormat(

      "en-IN",

      {

        style: "currency",

        currency: "INR",

        maximumFractionDigits: 2,

      }

    ).format(

      Number(value)

    );

  };

  // ==========================================================

  // FORMAT DATE

  // ==========================================================

  const formatDate = (

    date: string

  ) => {

    return new Date(

      `${date}T00:00:00`

    ).toLocaleDateString(

      "en-IN",

      {

        day: "numeric",

        month: "short",

        year: "numeric",

      }

    );

  };

  // ==========================================================

  // FORMAT FORECAST MONTH

  //

  // Example:

  // 202609 -> September 2026

  // ==========================================================

  const formatForecastMonth = (

    monthCode: number

  ) => {

    const monthString =

      String(monthCode);

    if (

      monthString.length !== 6

    ) {

      return monthString;

    }

    const year = Number(

      monthString.slice(

        0,

        4

      )

    );

    const month = Number(

      monthString.slice(

        4,

        6

      )

    );

    if (

      month < 1 ||

      month > 12

    ) {

      return monthString;

    }

    return new Date(

      year,

      month - 1,

      1

    ).toLocaleDateString(

      "en-IN",

      {

        month: "long",

        year: "numeric",

      }

    );

  };

  // ==========================================================

  // GROUP EXPENSES BY MONTH

  // ==========================================================

  const buildMonthlyExpenses = (

    transactionData: Transaction[]

  ): MonthlyExpense[] => {

    const monthlyMap =

      new Map<

        number,

        number

      >();

    transactionData

      .filter(

        (transaction) =>

          transaction.type ===

          "expense"

      )

      .forEach(

        (transaction) => {

          const date =

            new Date(

              `${transaction.transaction_date}T00:00:00`

            );

          if (

            Number.isNaN(

              date.getTime()

            )

          ) {

            return;

          }

          const year =

            date.getFullYear();

          const month =

            date.getMonth() + 1;

          // Example:

          // September 2026

          // becomes 202609

          const monthCode =

            year * 100 +

            month;

          const currentTotal =

            monthlyMap.get(

              monthCode

            ) || 0;

          monthlyMap.set(

            monthCode,

            currentTotal +

              Number(

                transaction.amount

              )

          );

        }

      );

    return Array.from(

      monthlyMap.entries()

    )

      .map(

        ([

          month,

          totalExpense,

        ]) => ({

          month,

          total_expense:

            Number(

              totalExpense.toFixed(

                2

              )

            ),

        })

      )

      .sort(

        (a, b) =>

          a.month -

          b.month

      );

  };

  // ==========================================================

  // LOAD PERSONALIZED FORECAST

  // ==========================================================

  const loadForecast = async (

    transactionData: Transaction[]

  ) => {

    try {

      setForecastLoading(

        true

      );

      setForecastError("");

      setForecast(null);

      // ------------------------------------------------------

      // CREATE MONTHLY HISTORY

      // ------------------------------------------------------

      const monthlyExpenses =

        buildMonthlyExpenses(

          transactionData

        );

      console.log(

        "Monthly expense history:",

        monthlyExpenses

      );

      // ------------------------------------------------------

      // REQUIRE AT LEAST 2 MONTHS

      // ------------------------------------------------------

      if (

        monthlyExpenses.length <

        2

      ) {

        setForecastError(

          "Add expense transactions across at least 2 different months to generate your personalized spending forecast."

        );

        return;

      }

      // ------------------------------------------------------

      // CALL FASTAPI

      // ------------------------------------------------------

      const response =

        await fetch(

          "https://finsight-ml-api.onrender.com/forecast",

          {

            method:

              "POST",

            headers: {

              "Content-Type":

                "application/json",

            },

            body:

              JSON.stringify(

                {

                  monthly_expenses:

                    monthlyExpenses,

                }

              ),

          }

        );

      if (!response.ok) {

        throw new Error(

          `Forecast API returned ${response.status}`

        );

      }

      const data =

        await response.json();

      // ------------------------------------------------------

      // API ERROR

      // ------------------------------------------------------

      if (data.error) {

        setForecastError(

          data.error

        );

        return;

      }

      // ------------------------------------------------------

      // SUCCESS

      // ------------------------------------------------------

      setForecast(

        data as Forecast

      );

    } catch (error) {

      console.error(

        "Forecast error:",

        error

      );

      setForecastError(

        "Could not connect to the FinSight ML API. Make sure FastAPI is running on port 8000."

      );

    } finally {

      setForecastLoading(

        false

      );

    }

  };

  // ==========================================================

  // LOAD DASHBOARD

  // ==========================================================

  const loadDashboard =

    async () => {

      try {

        setLoading(true);

        setErrorMessage("");

        // ----------------------------------------------------

        // GET LOGGED-IN USER

        // ----------------------------------------------------

        const {

          data: {

            user,

          },

          error:

            userError,

        } =

          await supabase.auth.getUser();

        if (

          userError

        ) {

          console.error(

            "User error:",

            userError

          );

        }

        if (!user) {

          router.push(

            "/login"

          );

          return;

        }

        // ----------------------------------------------------

        // LOAD PROFILE

        // ----------------------------------------------------

        const {

          data:

            profileData,

          error:

            profileError,

        } =

          await supabase

            .from(

              "profiles"

            )

            .select(

              "full_name, email"

            )

            .eq(

              "id",

              user.id

            )

            .single();

        if (

          profileError

        ) {

          console.error(

            "Profile error:",

            profileError

          );

        } else {

          setProfile(

            profileData as Profile

          );

        }

        // ----------------------------------------------------

        // LOAD USER TRANSACTIONS

        // ----------------------------------------------------

        const {

          data:

            transactionData,

          error:

            transactionError,

        } =

          await supabase

            .from(

              "transactions"

            )

            .select(

              `

                id,

                amount,

                type,

                category,

                description,

                transaction_date

              `

            )

            .eq(

              "user_id",

              user.id

            )

            .order(

              "transaction_date",

              {

                ascending:

                  false,

              }

            )

            .order(

              "id",

              {

                ascending:

                  false,

              }

            );

        if (

          transactionError

        ) {

          console.error(

            "Transaction error:",

            transactionError

          );

          setErrorMessage(

            "Could not load your transactions."

          );

          return;

        }

        const userTransactions =

          (

            transactionData ||

            []

          ) as Transaction[];

        // ----------------------------------------------------

        // STORE TRANSACTIONS

        // ----------------------------------------------------

        setTransactions(

          userTransactions

        );

        
// Run ML features independently without blocking
// the main dashboard from displaying.

void Promise.allSettled([
  fetchBudgetRecommendations(userTransactions),
  fetchSpendingAnomalies(userTransactions),
  loadForecast(userTransactions),
]).then((results) => {
  results.forEach((result, index) => {
    if (result.status === "rejected") {
      console.error(
        `Dashboard ML task ${index + 1} failed:`,
        result.reason
      );
    }
  });
});


      } catch (error) {

        console.error(

          "Dashboard error:",

          error

        );

        setErrorMessage(

          "Something went wrong while loading your dashboard."

        );

      } finally {

        setLoading(

          false

        );

      }

    };

  // ==========================================================

  // BUDGET RECOMMENDATION

  // ==========================================================

  async function fetchBudgetRecommendations(

  userTransactions: Transaction[]

) {

  try {

    setBudgetLoading(true);

    setBudgetError("");

    const response = await fetch(

      "https://finsight-ml-api.onrender.com/budget-recommendations",

      {

        method: "POST",

        headers: {

          "Content-Type": "application/json",

        },

        body: JSON.stringify({

          transactions: userTransactions.map((transaction) => ({

            type: transaction.type,

            amount: Number(transaction.amount),

            category: transaction.category,

            transaction_date: transaction.transaction_date,

          })),

        }),

      }

    );

    if (!response.ok) {

      throw new Error(

        `Budget API returned ${response.status}`

      );

    }

    const data: BudgetRecommendationResponse =

      await response.json();

    if (data.status !== "success") {

      setBudgetRecommendations(null);

      setBudgetError(

        data.message ||

          "More transaction history is required."

      );

      return;

    }

    setBudgetRecommendations(data);

  } catch (error) {

    console.error(

      "Budget recommendation error:",

      error

    );

    setBudgetRecommendations(null);

    setBudgetError(

      "Unable to generate budget recommendations."

    );

  } finally {

    setBudgetLoading(false);

  }

}

// ============================================================

// DETECT UNUSUAL SPENDING

// ============================================================

async function fetchSpendingAnomalies(

  userTransactions: Transaction[]

) {

  try {

    setAnomalyLoading(true);

    setAnomalyError("");

    setAnomalyResults(null);

    const response = await fetch(

      "https://finsight-ml-api.onrender.com/detect-anomalies",

      {

        method: "POST",

        headers: {

          "Content-Type": "application/json",

        },

        body: JSON.stringify({

          transactions: userTransactions.map((transaction) => ({

            id: transaction.id,

            type: transaction.type,

            amount: Number(transaction.amount),

            category: transaction.category,

            description: transaction.description,

            transaction_date: transaction.transaction_date,

          })),

        }),

      }

    );

    if (!response.ok) {

      throw new Error(

        `Anomaly API returned ${response.status}`

      );

    }

    const data: AnomalyDetectionResponse =

      await response.json();

    if (data.status === "insufficient_data") {

      setAnomalyError(

        data.message ||

          "Add at least 10 expense transactions to detect unusual spending."

      );

      return;

    }

    if (data.status !== "success") {

      throw new Error(

        data.message || "Anomaly detection failed."

      );

    }

    setAnomalyResults(data);

  } catch (error) {

    console.error("Anomaly detection error:", error);

    setAnomalyError(

      "Unable to analyze unusual spending. Make sure the FinSight ML API is running."

    );

  } finally {

    setAnomalyLoading(false);

  }

}

  // ==========================================================

  // INITIAL LOAD

  // ==========================================================

  useEffect(() => {

    loadDashboard();

  }, []);

  // ==========================================================

  // LOGOUT

  // ==========================================================

  const handleLogout =

    async () => {

      try {

        await supabase.auth.signOut();

        router.push(

          "/login"

        );

      } catch (error) {

        console.error(

          "Logout error:",

          error

        );

      }

    };

  // ==========================================================

  // TOTAL INCOME

  // ==========================================================

  const totalIncome =

    transactions

      .filter(

        (transaction) =>

          transaction.type ===

          "income"

      )

      .reduce(

        (

          total,

          transaction

        ) =>

          total +

          Number(

            transaction.amount

          ),

        0

      );

  // ==========================================================

  // TOTAL EXPENSES

  // ==========================================================

  const totalExpenses =

    transactions

      .filter(

        (transaction) =>

          transaction.type ===

          "expense"

      )

      .reduce(

        (

          total,

          transaction

        ) =>

          total +

          Number(

            transaction.amount

          ),

        0

      );

  // ==========================================================

  // BALANCE

  // ==========================================================

  const totalBalance =

    totalIncome -

    totalExpenses;

  // ==========================================================

  // CURRENT MONTH

  // ==========================================================

  const now =

    new Date();

  const currentMonth =

    now.getMonth();

  const currentYear =

    now.getFullYear();

  // ==========================================================

  // CURRENT MONTH TRANSACTIONS

  // ==========================================================

  const monthlyTransactions =

    transactions.filter(

      (transaction) => {

        const date =

          new Date(

            `${transaction.transaction_date}T00:00:00`

          );

        return (

          date.getMonth() ===

            currentMonth &&

          date.getFullYear() ===

            currentYear

        );

      }

    );

  // ==========================================================

  // MONTHLY INCOME

  // ==========================================================

  const monthlyIncome =

    monthlyTransactions

      .filter(

        (transaction) =>

          transaction.type ===

          "income"

      )

      .reduce(

        (

          total,

          transaction

        ) =>

          total +

          Number(

            transaction.amount

          ),

        0

      );

  // ==========================================================

  // MONTHLY EXPENSE

  // ==========================================================

  const monthlyExpenses =

    monthlyTransactions

      .filter(

        (transaction) =>

          transaction.type ===

          "expense"

      )

      .reduce(

        (

          total,

          transaction

        ) =>

          total +

          Number(

            transaction.amount

          ),

        0

      );

  // ==========================================================

  // RECENT TRANSACTIONS

  // ==========================================================

  const recentTransactions =

    transactions.slice(

      0,

      5

    );

  // ==========================================================

  // LOADING PAGE

  // ==========================================================

  if (loading) {

    return (

      <main className="min-h-screen bg-[#070d19] text-white flex items-center justify-center">

        <div className="text-center">

          <div className="text-5xl mb-4">

            📊

          </div>

          <h1 className="text-2xl font-bold">

            FinSight

          </h1>

          <p className="text-slate-400 mt-2">

            Loading your financial dashboard...

          </p>

        </div>

      </main>

    );

  }

  // ==========================================================

  // PAGE

  // ==========================================================

  return (

    <main className="min-h-screen bg-[#070d19] text-white">
      <FinSightNavbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-10">

        {/* ==================================================

            HEADER

        ================================================== */}

        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 mb-10">

          <div>

            <p className="text-emerald-400 text-xs font-semibold uppercase tracking-[0.2em]">

              FinSight

            </p>

            <h1 className="text-3xl md:text-4xl font-bold mt-3 tracking-tight">

              Welcome

              {profile?.full_name

                ? `, ${profile.full_name}`

                : ""}

            </h1>

            <p className="text-slate-400 mt-2">

              Track your finances and get

              personalized AI-powered insights.

            </p>

          </div>

          <div className="flex flex-wrap gap-3">

            <button

              onClick={() =>

                router.push(

                  "/transactions"

                )

              }

              className="bg-emerald-500 hover:bg-emerald-400 text-[#07111a] px-5 py-3 rounded-xl font-semibold transition"

            >

              + Add Transaction

            </button>

            <button

              onClick={

                handleLogout

              }

              className="bg-[#111c2e] border border-white/10 hover:bg-[#18263a] px-5 py-3 rounded-lg transition"

            >

              Logout

            </button>

          </div>

        </header>

        {/* ==================================================

            PAGE ERROR

        ================================================== */}

        {errorMessage && (

          <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-2xl p-4 mb-8">

            {errorMessage}

          </div>

        )}

        {/* ==================================================

            FINANCIAL OVERVIEW

        ================================================== */}

        <section className="mb-10">

          <div className="mb-5">

            <p className="text-slate-500 text-sm uppercase tracking-wider">

              Financial Overview

            </p>

            <h2 className="text-2xl font-semibold mt-1">

              Your Finances

            </h2>

          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

            {/* BALANCE */}

            <div className="bg-[#111c2e] border border-white/10 rounded-2xl p-5 sm:p-7 shadow-xl shadow-black/10">

              <p className="text-slate-400">

                Total Balance

              </p>

              <p

                className={`text-2xl font-bold mt-3 ${

                  totalBalance >=

                  0

                    ? "text-white"

                    : "text-red-400"

                }`}

              >

                {formatCurrency(

                  totalBalance

                )}

              </p>

              <p className="text-xs text-slate-500 mt-2">

                Income minus expenses

              </p>

            </div>

            {/* TOTAL INCOME */}

            <div className="bg-[#111c2e] border border-white/10 rounded-2xl p-5 sm:p-7 shadow-xl shadow-black/10">

              <p className="text-slate-400">

                Total Income

              </p>

              <p className="text-2xl font-bold text-emerald-400 mt-3 break-words tabular-nums">

                {formatCurrency(

                  totalIncome

                )}

              </p>

              <p className="text-xs text-slate-500 mt-2">

                All recorded income

              </p>

            </div>

            {/* MONTHLY INCOME */}

            <div className="bg-[#111c2e] border border-white/10 rounded-2xl p-5 sm:p-7 shadow-xl shadow-black/10">

              <p className="text-slate-400">

                Monthly Income

              </p>

              <p className="text-2xl font-bold text-emerald-400 mt-3 break-words tabular-nums">

                {formatCurrency(

                  monthlyIncome

                )}

              </p>

              <p className="text-xs text-slate-500 mt-2">

                Income this month

              </p>

            </div>

            {/* MONTHLY EXPENSES */}

            <div className="bg-[#111c2e] border border-white/10 rounded-2xl p-5 sm:p-7 shadow-xl shadow-black/10">

              <p className="text-slate-400">

                Monthly Expenses

              </p>

              <p className="text-2xl font-bold text-red-400 mt-3 break-words tabular-nums">

                {formatCurrency(

                  monthlyExpenses

                )}

              </p>

              <p className="text-xs text-slate-500 mt-2">

                Expenses this month

              </p>

            </div>

          </div>

        </section>

        {/* ==================================================

            PERSONALIZED AI FORECAST

        ================================================== */}

        <section className="bg-[#111c2e] border border-white/10 rounded-2xl p-5 sm:p-7 mb-8 shadow-xl shadow-black/10">

          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">

            <div>

              <p className="text-purple-400 text-sm font-medium uppercase tracking-wider">

                Personalized AI Analysis

              </p>

              <h2 className="text-2xl font-semibold mt-1">

                🤖 Spending Forecast

              </h2>

              <p className="text-slate-400 text-sm mt-2">

                Forecast generated from your own

                Supabase expense history.

              </p>

            </div>

            {forecast && (

              <span className="bg-purple-500/10 border border-purple-500/30 text-purple-300 px-4 py-2 rounded-full text-sm">

                Personalized ML

              </span>

            )}

          </div>

          {/* FORECAST LOADING */}

          {forecastLoading && (

            <div className="py-10 text-center">

              <div className="text-4xl mb-3">

                🤖

              </div>

              <p className="text-slate-400">

                Analyzing your spending history...

              </p>

            </div>

          )}

          {/* FORECAST ERROR / INSUFFICIENT DATA */}

          {!forecastLoading &&

            forecastError && (

              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-5">

                <p className="text-yellow-400 font-medium">

                  More spending history needed

                </p>

                <p className="text-slate-300 mt-2">

                  {forecastError}

                </p>

                <p className="text-slate-500 text-sm mt-3">

                  Try adding expenses with transaction

                  dates from multiple months.

                </p>

              </div>

            )}

          {/* FORECAST SUCCESS */}

          {!forecastLoading &&

            forecast &&

            !forecastError && (

              <div>

                {/* SPENDING FORECAST CHART */}

                    <div className="mb-6">

                      <SpendingForecastChart

                        monthlyExpenses={buildMonthlyExpenses(transactions).map(

                          (item) => ({

                            month: String(item.month),

                            total_expense: item.total_expense,

                          })

                        )}

                        predictedExpense={forecast.predicted_expense}

                      />

                    </div>

                {/* MAIN FORECAST CARDS */}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

                  {/* CURRENT */}

                  <div className="bg-[#070d19] border border-white/10 rounded-2xl p-5">

                    <p className="text-slate-400 text-sm">

                      Latest Month Spending

                    </p>

                    <p className="text-2xl font-bold mt-3 break-words tabular-nums">

                      {formatCurrency(

                        forecast.current_expense

                      )}

                    </p>

                    <p className="text-slate-500 text-xs mt-2">

                      {formatForecastMonth(

                        forecast.current_month

                      )}

                    </p>

                  </div>

                  {/* PREDICTION */}

                  <div className="bg-[#070d19] border border-purple-500/30 rounded-2xl p-5">

                    <p className="text-purple-300 text-sm">

                      Predicted Next Month

                    </p>

                    <p className="text-3xl font-bold mt-3">

                      {formatCurrency(

                        forecast.predicted_expense

                      )}

                    </p>

                    <p className="text-purple-400/70 text-xs mt-2">

                      Personalized ML estimate

                    </p>

                  </div>

                  {/* CHANGE */}

                  <div className="bg-[#070d19] border border-white/10 rounded-2xl p-5">

                    <p className="text-slate-400 text-sm">

                      Expected Change

                    </p>

                    <p

                      className={`text-2xl font-bold mt-3 ${

                        forecast.trend ===

                        "increase"

                          ? "text-red-400"

                          : forecast.trend ===

                            "decrease"

                          ? "text-emerald-400"

                          : "text-slate-300"

                      }`}

                    >

                      {forecast.percentage_change >

                        0 &&

                        "+"}

                      {forecast.percentage_change.toFixed(

                        1

                      )}

                      %

                    </p>

                    <p className="text-slate-500 text-xs mt-2 capitalize">

                      Expected{" "}

                      {forecast.trend}

                    </p>

                  </div>

                </div>

                {/* SECOND ROW */}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-5">

                  {/* DIFFERENCE */}

                  <div className="bg-[#070d19] border border-white/10 rounded-2xl p-5">

                    <p className="text-slate-400 text-sm">

                      Estimated Difference

                    </p>

                    <p

                      className={`text-xl font-semibold mt-2 ${

                        forecast.difference >

                        0

                          ? "text-red-400"

                          : forecast.difference <

                            0

                          ? "text-emerald-400"

                          : "text-slate-300"

                      }`}

                    >

                      {forecast.difference >

                        0 &&

                        "+"}

                      {formatCurrency(

                        forecast.difference

                      )}

                    </p>

                  </div>

                  {/* MONTHS USED */}

                  <div className="bg-[#070d19] border border-white/10 rounded-2xl p-5">

                    <p className="text-slate-400 text-sm">

                      History Used

                    </p>

                    <p className="text-xl font-semibold mt-2">

                      {forecast.months_used}{" "}

                      {forecast.months_used ===

                      1

                        ? "month"

                        : "months"}

                    </p>

                    <p className="text-slate-500 text-xs mt-2">

                      Expense history analyzed

                    </p>

                  </div>

                  {/* DATA QUALITY */}

                  <div className="bg-[#070d19] border border-white/10 rounded-2xl p-5">

                    <p className="text-slate-400 text-sm">

                      History Quality

                    </p>

                    <p

                      className={`text-xl font-semibold mt-2 capitalize ${

                        forecast.history_quality ===

                        "good"

                          ? "text-emerald-400"

                          : forecast.history_quality ===

                            "limited"

                          ? "text-yellow-400"

                          : "text-orange-400"

                      }`}

                    >

                      {forecast.history_quality.replace(

                        "_",

                        " "

                      )}

                    </p>

                    <p className="text-slate-500 text-xs mt-2">

                      More months improve personalization

                    </p>

                  </div>

                </div>

                {/* INSIGHT */}

                <div className="mt-5 bg-purple-500/10 border border-purple-500/20 rounded-2xl p-5">

                  <p className="text-purple-300 text-sm font-medium">

                    FinSight AI Insight

                  </p>

                  <p className="text-slate-200 mt-2">

                    {forecast.insight}

                  </p>

                </div>

                {/* MODEL INFORMATION */}

                {forecast.model_details && (

                  <div className="mt-5">

                    <p className="text-slate-500 text-xs uppercase tracking-wider mb-3">

                      Prediction Details

                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

                      <div className="bg-[#070d19] border border-white/10 rounded-lg p-4">

                        <p className="text-xs text-slate-500">

                          General ML Model

                        </p>

                        <p className="font-medium mt-1">

                          {formatCurrency(

                            forecast.model_details

                              .general_model_prediction

                          )}

                        </p>

                      </div>

                      <div className="bg-[#070d19] border border-white/10 rounded-lg p-4">

                        <p className="text-xs text-slate-500">

                          Personal Trend

                        </p>

                        <p className="font-medium mt-1">

                          {formatCurrency(

                            forecast.model_details

                              .personal_trend_prediction

                          )}

                        </p>

                      </div>

                      <div className="bg-[#070d19] border border-white/10 rounded-lg p-4">

                        <p className="text-xs text-slate-500">

                          Avg. Monthly Change

                        </p>

                        <p className="font-medium mt-1">

                          {formatCurrency(

                            forecast.model_details

                              .average_monthly_change

                          )}

                        </p>

                      </div>

                    </div>

                  </div>

                )}

                {/* DISCLAIMER */}

                <p className="text-xs text-slate-500 mt-5">

                  Forecasts are estimates based on your

                  historical spending patterns and should

                  not be treated as guaranteed future

                  expenses.

                </p>

              </div>

            )}

        </section>

        {/* ==================================================

                AI ANOMALY DETECTION

            ================================================== */}

            <SpendingAnomalyAlerts

              data={anomalyResults}

              loading={anomalyLoading}

              error={anomalyError}

            />

        {/* ==================================================

            FINANCIAL ANALYTICS

        ================================================== */}

        <section className="mb-10">

          <div className="mb-5">

            <p className="text-slate-500 text-sm uppercase tracking-wider">

              Analytics

            </p>

            <h2 className="text-2xl font-semibold mt-1">

              Financial Analytics

            </h2>

          </div>

          <FinancialCharts

            transactions={

              transactions

            }

          />

        </section>

        {/* ==================================================

                AI BUDGET RECOMMENDATIONS

            ================================================== */}

            <section className="bg-[#111c2e] border border-white/10 rounded-2xl p-5 sm:p-7 mb-8 shadow-xl shadow-black/10">

              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">

                <div>

                  <p className="text-emerald-400 text-xs font-semibold uppercase tracking-[0.2em]">

                    AI Budget Planning

                  </p>

                  <h2 className="text-2xl font-semibold mt-1">

                    💰 Budget Recommendations

                  </h2>

                  <p className="text-slate-400 text-sm mt-2">

                    Personalized category budgets generated from your historical

                    spending patterns.

                  </p>

                </div>

                {budgetRecommendations && (

                  <span className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 px-4 py-2 rounded-full text-sm">

                    AI Recommended

                  </span>

                )}

              </div>

              {/* BUDGET LOADING */}

              {budgetLoading && (

                <div className="py-10 text-center">

                  <div className="text-4xl mb-3">

                    💰

                  </div>

                  <p className="text-slate-400">

                    Analyzing your spending and generating budgets...

                  </p>

                </div>

              )}

              {/* BUDGET ERROR */}

              {!budgetLoading && budgetError && (

                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-5">

                  <p className="text-yellow-400 font-medium">

                    More spending history needed

                  </p>

                  <p className="text-slate-300 mt-2">

                    {budgetError}

                  </p>

                  <p className="text-slate-500 text-sm mt-3">

                    Add expense transactions across multiple months and categories

                    to improve your budget recommendations.

                  </p>

                </div>

              )}

              {/* BUDGET SUCCESS */}

              {!budgetLoading &&

                budgetRecommendations &&

                !budgetError && (

                  <div>

                    {/* SUMMARY CARDS */}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

                      {/* AVERAGE SPENDING */}

                      <div className="bg-[#070d19] border border-white/10 rounded-2xl p-5">

                        <p className="text-slate-400 text-sm">

                          Average Monthly Spending

                        </p>

                        <p className="text-2xl font-bold mt-3 break-words tabular-nums">

                          {formatCurrency(

                            budgetRecommendations.total_average_spending

                          )}

                        </p>

                        <p className="text-slate-500 text-xs mt-2">

                          Based on your spending history

                        </p>

                      </div>

                      {/* RECOMMENDED BUDGET */}

                      <div className="bg-[#070d19] border border-blue-500/30 rounded-2xl p-5">

                        <p className="text-emerald-300 text-sm">

                          Recommended Monthly Budget

                        </p>

                        <p className="text-2xl font-bold text-emerald-400 mt-3 break-words tabular-nums">

                          {formatCurrency(

                            budgetRecommendations.total_recommended_budget

                          )}

                        </p>

                        <p className="text-emerald-400/70 text-xs mt-2">

                          AI optimized spending target

                        </p>

                      </div>

                      {/* POTENTIAL SAVING */}

                      <div className="bg-[#070d19] border border-emerald-500/30 rounded-2xl p-5">

                        <p className="text-emerald-300 text-sm">

                          Potential Monthly Saving

                        </p>

                        <p className="text-2xl font-bold text-emerald-400 mt-3 break-words tabular-nums">

                          {formatCurrency(

                            budgetRecommendations.potential_monthly_saving

                          )}

                        </p>

                        <p className="text-emerald-400/70 text-xs mt-2">

                          Possible savings per month

                        </p>

                      </div>

                    </div>

                    {/* ANALYSIS INFORMATION */}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">

                      <div className="bg-[#070d19] border border-white/10 rounded-2xl p-4">

                        <p className="text-slate-500 text-xs uppercase tracking-wider">

                          History Analyzed

                        </p>

                        <p className="font-semibold mt-2">

                          {budgetRecommendations.months_analyzed}{" "}

                          {budgetRecommendations.months_analyzed === 1

                            ? "month"

                            : "months"}

                        </p>

                      </div>

                      <div className="bg-[#070d19] border border-white/10 rounded-2xl p-4">

                        <p className="text-slate-500 text-xs uppercase tracking-wider">

                          History Quality

                        </p>

                        <p className="font-semibold mt-2 capitalize">

                          {budgetRecommendations.history_quality.replace(

                            "_",

                            " "

                          )}

                        </p>

                      </div>

                    </div>

                    {/* CATEGORY RECOMMENDATIONS */}

                    <div className="mt-8">

                      <div className="mb-5">

                        <p className="text-slate-500 text-xs uppercase tracking-wider">

                          Category Analysis

                        </p>

                        <h3 className="text-xl font-semibold mt-1">

                          Recommended Category Budgets

                        </h3>

                      </div>

                      {budgetRecommendations.recommendations.length === 0 ? (

                        <div className="bg-[#070d19] border border-white/10 rounded-2xl p-5">

                          <p className="text-slate-400">

                            No category recommendations are available yet.

                          </p>

                        </div>

                      ) : (

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                          {budgetRecommendations.recommendations.map(

                            (recommendation) => (

                              <div

                                key={recommendation.category}

                                className="bg-[#070d19] border border-white/10 rounded-2xl p-5"

                              >

                                {/* CATEGORY HEADER */}

                                <div className="flex items-start justify-between gap-4">

                                  <div>

                                    <h4 className="text-lg font-semibold">

                                      {recommendation.category}

                                    </h4>

                                    <p className="text-slate-500 text-xs mt-1 capitalize">

                                      {recommendation.category_type}

                                    </p>

                                  </div>

                                  <span

                                    className={`text-xs px-3 py-1 rounded-full border ${

                                      recommendation.trend === "increasing"

                                        ? "bg-red-500/10 border-red-500/30 text-red-400"

                                        : recommendation.trend === "decreasing"

                                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"

                                        : "bg-[#18263a] border-gray-700 text-slate-300"

                                    }`}

                                  >

                                    {recommendation.trend}

                                  </span>

                                </div>

                                {/* CATEGORY VALUES */}

                                <div className="grid grid-cols-2 gap-4 mt-5">

                                  <div>

                                    <p className="text-slate-500 text-xs">

                                      Average Spending

                                    </p>

                                    <p className="font-semibold mt-1">

                                      {formatCurrency(

                                        recommendation.average_monthly_spending

                                      )}

                                    </p>

                                  </div>

                                  <div>

                                    <p className="text-slate-500 text-xs">

                                      Latest Spending

                                    </p>

                                    <p className="font-semibold mt-1">

                                      {formatCurrency(

                                        recommendation.latest_month_spending

                                      )}

                                    </p>

                                  </div>

                                  <div>

                                    <p className="text-slate-500 text-xs">

                                      Recommended Budget

                                    </p>

                                    <p className="font-semibold text-emerald-400 mt-1">

                                      {formatCurrency(

                                        recommendation.recommended_budget

                                      )}

                                    </p>

                                  </div>

                                  <div>

                                    <p className="text-slate-500 text-xs">

                                      Potential Saving

                                    </p>

                                    <p className="font-semibold text-emerald-400 mt-1">

                                      {formatCurrency(

                                        recommendation.potential_monthly_saving

                                      )}

                                    </p>

                                  </div>

                                </div>

                                {/* REDUCTION */}

                                {recommendation.reduction_percentage > 0 && (

                                  <div className="mt-5">

                                    <div className="flex justify-between text-xs mb-2">

                                      <span className="text-slate-500">

                                        Suggested reduction

                                      </span>

                                      <span className="text-emerald-400">

                                        {recommendation.reduction_percentage.toFixed(

                                          1

                                        )}

                                        %

                                      </span>

                                    </div>

                                    <div className="w-full h-2 bg-[#18263a] rounded-full overflow-hidden">

                                      <div

                                        className="h-full bg-emerald-500 rounded-full"

                                        style={{

                                          width: `${Math.min(

                                            recommendation.reduction_percentage,

                                            100

                                          )}%`,

                                        }}

                                      />

                                    </div>

                                  </div>

                                )}

                                {/* AI INSIGHT */}

                                <div className="mt-5 bg-emerald-500/5 border border-emerald-500/10 rounded-lg p-4">

                                  <p className="text-emerald-300 text-xs font-medium">

                                    FinSight AI

                                  </p>

                                  <p className="text-slate-300 text-sm mt-2">

                                    {recommendation.insight}

                                  </p>

                                </div>

                              </div>

                            )

                          )}

                        </div>

                      )}

                    </div>

                    {/* PERIOD */}

                    {budgetRecommendations.period && (

                      <div className="mt-6 bg-[#070d19] border border-white/10 rounded-2xl p-4">

                        <p className="text-slate-500 text-xs uppercase tracking-wider">

                          Analysis Period

                        </p>

                        <p className="text-sm text-slate-300 mt-2">

                          {formatDate(

                            budgetRecommendations.period.from

                          )}{" "}

                          →{" "}

                          {formatDate(

                            budgetRecommendations.period.to

                          )}

                        </p>

                      </div>

                    )}

                    {/* DISCLAIMER */}

                    <p className="text-xs text-slate-500 mt-5">

                      Budget recommendations are estimates based on your historical

                      spending patterns. They are intended to help with financial

                      planning and are not guaranteed savings.

                    </p>

                  </div>

                )}

            </section>

        {/* ==================================================

            FINANCIAL INSIGHTS

        ================================================== */}

        <section className="bg-[#111c2e] border border-white/10 rounded-2xl p-5 sm:p-7 mb-8 shadow-xl shadow-black/10">

          <div className="mb-5">

            <p className="text-emerald-400 text-xs font-semibold uppercase tracking-[0.2em]">

              Insights

            </p>

            <h2 className="text-xl font-semibold mt-1">

              Financial Insights

            </h2>

          </div>

          {transactions.length ===

          0 ? (

            <p className="text-slate-400">

              Add transactions to start generating

              financial insights.

            </p>

          ) : (

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

              {/* SAVINGS */}

              <div className="bg-[#070d19] border border-white/10 rounded-2xl p-5">

                <p className="text-slate-400 text-sm">

                  Net Savings

                </p>

                <p

                  className={`text-xl font-semibold mt-2 ${

                    totalBalance >=

                    0

                      ? "text-emerald-400"

                      : "text-red-400"

                  }`}

                >

                  {formatCurrency(

                    totalBalance

                  )}

                </p>

              </div>

              {/* TRANSACTIONS */}

              <div className="bg-[#070d19] border border-white/10 rounded-2xl p-5">

                <p className="text-slate-400 text-sm">

                  Transactions

                </p>

                <p className="text-xl font-semibold mt-2">

                  {transactions.length}

                </p>

              </div>

              {/* EXPENSES */}

              <div className="bg-[#070d19] border border-white/10 rounded-2xl p-5">

                <p className="text-slate-400 text-sm">

                  Total Expenses

                </p>

                <p className="text-xl font-semibold text-red-400 mt-2">

                  {formatCurrency(

                    totalExpenses

                  )}

                </p>

              </div>

            </div>

          )}

        </section>

        {/* ==================================================

            RECENT TRANSACTIONS

        ================================================== */}

        <section className="bg-[#111c2e] border border-white/10 rounded-2xl p-5 sm:p-7 shadow-xl shadow-black/10">

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">

            <div>

              <p className="text-slate-500 text-sm uppercase tracking-wider">

                Activity

              </p>

              <h2 className="text-xl font-semibold mt-1">

                Recent Transactions

              </h2>

            </div>

            <button

              onClick={() =>

                router.push(

                  "/transactions"

                )

              }

              className="text-emerald-400 hover:text-emerald-300 text-sm transition"

            >

              View all transactions →

            </button>

          </div>

          {/* EMPTY */}

          {recentTransactions.length ===

          0 ? (

            <div className="text-center py-12">

              <div className="text-5xl mb-4">

                💳

              </div>

              <h3 className="font-medium">

                No transactions yet

              </h3>

              <p className="text-slate-400 text-sm mt-2">

                Add your first transaction to start

                tracking your finances.

              </p>

              <button

                onClick={() =>

                  router.push(

                    "/transactions"

                  )

                }

                className="mt-5 bg-emerald-500 hover:bg-emerald-400 px-5 py-2 rounded-lg transition"

              >

                Add Transaction

              </button>

            </div>

          ) : (

            <div className="space-y-3">

              {recentTransactions.map(

                (

                  transaction

                ) => (

                  <div

                    key={

                      transaction.id

                    }

                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-[#070d19] border border-white/10 rounded-2xl p-4"

                  >

                    <div className="flex items-center gap-4">

                      {/* ICON */}

                      <div

                        className={`w-11 h-11 rounded-full flex items-center justify-center ${

                          transaction.type ===

                          "income"

                            ? "bg-emerald-500/10 text-emerald-400"

                            : "bg-red-500/10 text-red-400"

                        }`}

                      >

                        {transaction.type ===

                        "income"

                          ? "↑"

                          : "↓"}

                      </div>

                      {/* INFORMATION */}

                      <div>

                        <p className="font-medium">

                          {

                            transaction.category

                          }

                        </p>

                        <p className="text-slate-400 text-sm">

                          {transaction.description ||

                            "No description"}

                        </p>

                        <p className="text-slate-500 text-xs mt-1">

                          {formatDate(

                            transaction.transaction_date

                          )}

                        </p>

                      </div>

                    </div>

                    {/* AMOUNT */}

                    <p

                      className={`font-semibold ${

                        transaction.type ===

                        "income"

                          ? "text-emerald-400"

                          : "text-red-400"

                      }`}

                    >

                      {transaction.type ===

                      "income"

                        ? "+"

                        : "-"}

                      {formatCurrency(

                        Number(

                          transaction.amount

                        )

                      )}

                    </p>

                  </div>

                )

              )}

            </div>

          )}

        </section>

        {/* ==================================================

            FOOTER

        ================================================== */}

        <footer className="border-t border-white/10 pt-7 text-center text-slate-500 text-sm mt-10 pb-4">

          FinSight — AI-powered personal finance insights

        </footer>

      </div>

    </main>

  );

}