"use client";

import { useEffect, useRef, useState } from "react";

import { useRouter } from "next/navigation";

import { supabase } from "@/supabase";
import FinSightNavbar from "../components/FinSightNavbar";

type Transaction = {

  id: number;

  amount: number;

  type: "income" | "expense";

  category: string;

  description: string | null;

  transaction_date: string;

};

type FilterType = "all" | "income" | "expense";

export default function TransactionsPage() {

  const router = useRouter();

  // =====================================================

  // FORM STATES

  // =====================================================

  const [type, setType] = useState<"income" | "expense">(

    "expense"

  );

  const [amount, setAmount] = useState("");

  const [category, setCategory] = useState("");

  const [description, setDescription] = useState("");

  const [transactionDate, setTransactionDate] = useState(

    new Date().toISOString().split("T")[0]

  );

  // =====================================================

  // ML STATES

  // =====================================================

  const [predicting, setPredicting] = useState(false);

  const [predictedCategory, setPredictedCategory] =

    useState<string | null>(null);

  const [predictionConfidence, setPredictionConfidence] =

    useState<number | null>(null);

  const predictionTimer =

    useRef<ReturnType<typeof setTimeout> | null>(null);

  // Used to ignore old API responses

  const predictionRequestId = useRef(0);

  // =====================================================

  // TRANSACTION STATES

  // =====================================================

  const [transactions, setTransactions] = useState<Transaction[]>(

    []

  );

  const [filter, setFilter] = useState<FilterType>("all");

  // =====================================================

  // UI STATES

  // =====================================================

  const [loading, setLoading] = useState(false);

  const [pageLoading, setPageLoading] = useState(true);

  const [message, setMessage] = useState("");

  const [errorMessage, setErrorMessage] = useState("");

  // =====================================================

  // LOAD PAGE

  // =====================================================

  useEffect(() => {

    loadTransactions();

    return () => {

      if (predictionTimer.current) {

        clearTimeout(predictionTimer.current);

      }

    };

  }, []);

  // =====================================================

  // LOAD TRANSACTIONS

  // =====================================================

  async function loadTransactions() {

    try {

      setPageLoading(true);

      setErrorMessage("");

      const {

        data: { user },

        error: userError,

      } = await supabase.auth.getUser();

      if (userError) {

        console.error("User error:", userError);

        setErrorMessage(userError.message);

        setPageLoading(false);

        return;

      }

      if (!user) {

        router.push("/login");

        return;

      }

      const { data, error } = await supabase

        .from("transactions")

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

        .eq("user_id", user.id)

        .order("transaction_date", {

          ascending: false,

        })

        .order("id", {

          ascending: false,

        });

      if (error) {

        console.error("Transaction error:", error);

        setErrorMessage(error.message);

        setPageLoading(false);

        return;

      }

      setTransactions((data ?? []) as Transaction[]);

    } catch (error) {

      console.error("Load error:", error);

      setErrorMessage(

        "Unable to load transactions."

      );

    } finally {

      setPageLoading(false);

    }

  }

  // =====================================================

  // ML CATEGORY PREDICTION

  // =====================================================

  async function predictCategory(customDescription?: string) {

    const text = customDescription ?? description;

    if (!text.trim()) {

      setErrorMessage(

        "Enter a description before predicting the category."

      );

      return;

    }

    // Every prediction gets an ID.

    // If an older request finishes later,

    // we ignore that result.

    const requestId = ++predictionRequestId.current;

    try {

      setPredicting(true);

      setErrorMessage("");

      const response = await fetch(

        "http://127.0.0.1:8000/predict",

        {

          method: "POST",

          headers: {

            "Content-Type": "application/json",

          },

          body: JSON.stringify({

            description: text.trim(),

          }),

        }

      );

      if (!response.ok) {

        throw new Error(

          "Prediction request failed."

        );

      }

      const data = await response.json();

      // Ignore outdated prediction responses

      if (requestId !== predictionRequestId.current) {

        return;

      }

      if (data.error) {

        setErrorMessage(data.error);

        return;

      }

      const confidence = Number(data.confidence);

      setPredictedCategory(data.category);

      setPredictionConfidence(confidence);

      // =================================================

      // HIGH CONFIDENCE

      // Automatically fill category

      // =================================================

      if (confidence >= 0.6) {

        setCategory(data.category);

      }

    } catch (error) {

      if (requestId !== predictionRequestId.current) {

        return;

      }

      console.error("Prediction error:", error);

      setErrorMessage(

        "ML server is unavailable. Make sure FastAPI is running on port 8000."

      );

    } finally {

      if (requestId === predictionRequestId.current) {

        setPredicting(false);

      }

    }

  }

  // =====================================================

  // DESCRIPTION CHANGE

  // =====================================================

  function handleDescriptionChange(

    value: string

  ) {

    setDescription(value);

    // Old prediction is no longer valid

    setPredictedCategory(null);

    setPredictionConfidence(null);

    // Invalidate an API request already running

    predictionRequestId.current += 1;

    if (predictionTimer.current) {

      clearTimeout(predictionTimer.current);

    }

    // Don't run ML for very short descriptions

    if (value.trim().length < 4) {

      return;

    }

    // Wait 700ms after user stops typing

    predictionTimer.current = setTimeout(() => {

      predictCategory(value);

    }, 700);

  }

  // =====================================================

  // ACCEPT LOW-CONFIDENCE ML SUGGESTION

  // =====================================================

  function usePrediction() {

    if (!predictedCategory) {

      return;

    }

    setCategory(predictedCategory);

  }

  // =====================================================

  // ADD TRANSACTION

  // =====================================================

  async function handleSubmit(

    e: React.FormEvent<HTMLFormElement>

  ) {

    e.preventDefault();

    setMessage("");

    setErrorMessage("");

    // ===================================================

    // VALIDATION

    // ===================================================

    if (!amount || Number(amount) <= 0) {

      setErrorMessage(

        "Please enter a valid amount."

      );

      return;

    }

    if (!category.trim()) {

      setErrorMessage(

        "Please enter or predict a category."

      );

      return;

    }

    if (!transactionDate) {

      setErrorMessage(

        "Please select a transaction date."

      );

      return;

    }

    try {

      setLoading(true);

      const {

        data: { user },

        error: userError,

      } = await supabase.auth.getUser();

      if (userError || !user) {

        router.push("/login");

        return;

      }

      // =================================================

      // INSERT INTO SUPABASE

      // =================================================

      const { error } = await supabase

        .from("transactions")

        .insert({

          user_id: user.id,

          amount: Number(amount),

          type,

          category: category.trim(),

          description:

            description.trim() || null,

          transaction_date: transactionDate,

        });

      if (error) {

        console.error("Insert error:", error);

        setErrorMessage(error.message);

        return;

      }

      // =================================================

      // SUCCESS

      // =================================================

      setMessage(

        "Transaction added successfully."

      );

      // =================================================

      // RESET FORM

      // =================================================

      setAmount("");

      setCategory("");

      setDescription("");

      setType("expense");

      setPredictedCategory(null);

      setPredictionConfidence(null);

      predictionRequestId.current += 1;

      if (predictionTimer.current) {

        clearTimeout(predictionTimer.current);

      }

      setTransactionDate(

        new Date().toISOString().split("T")[0]

      );

      // =================================================

      // REFRESH TRANSACTIONS

      // =================================================

      await loadTransactions();

    } catch (error) {

      console.error(

        "Add transaction error:",

        error

      );

      setErrorMessage(

        "Something went wrong while adding the transaction."

      );

    } finally {

      setLoading(false);

    }

  }

  // =====================================================

  // DELETE TRANSACTION

  // =====================================================

  async function handleDelete(id: number) {

    const shouldDelete = window.confirm(

      "Are you sure you want to delete this transaction?"

    );

    if (!shouldDelete) {

      return;

    }

    setMessage("");

    setErrorMessage("");

    try {

      const {

        data: { user },

      } = await supabase.auth.getUser();

      if (!user) {

        router.push("/login");

        return;

      }

      const { error } = await supabase

        .from("transactions")

        .delete()

        .eq("id", id)

        .eq("user_id", user.id);

      if (error) {

        console.error("Delete error:", error);

        setErrorMessage(error.message);

        return;

      }

      setTransactions((currentTransactions) =>

        currentTransactions.filter(

          (transaction) => transaction.id !== id

        )

      );

      setMessage(

        "Transaction deleted successfully."

      );

    } catch (error) {

      console.error(

        "Delete transaction error:",

        error

      );

      setErrorMessage(

        "Unable to delete transaction."

      );

    }

  }

  // =====================================================

  // FILTER TRANSACTIONS

  // =====================================================

  const filteredTransactions = transactions.filter(

    (transaction) => {

      if (filter === "all") {

        return true;

      }

      return transaction.type === filter;

    }

  );

  // =====================================================

  // TOTAL INCOME

  // =====================================================

  const totalIncome = transactions

    .filter(

      (transaction) =>

        transaction.type === "income"

    )

    .reduce(

      (total, transaction) =>

        total + Number(transaction.amount),

      0

    );

  // =====================================================

  // TOTAL EXPENSES

  // =====================================================

  const totalExpenses = transactions

    .filter(

      (transaction) =>

        transaction.type === "expense"

    )

    .reduce(

      (total, transaction) =>

        total + Number(transaction.amount),

      0

    );

  // =====================================================

  // BALANCE

  // =====================================================

  const balance = totalIncome - totalExpenses;

  // =====================================================

  // FORMAT MONEY

  // =====================================================

  function formatMoney(amount: number) {

    return amount.toLocaleString("en-IN", {

      maximumFractionDigits: 2,

    });

  }

  // =====================================================

  // FORMAT DATE

  // =====================================================

  function formatDate(date: string) {

    return new Date(

      `${date}T00:00:00`

    ).toLocaleDateString("en-IN", {

      day: "numeric",

      month: "short",

      year: "numeric",

    });

  }

  // =====================================================

  // PAGE LOADING

  // =====================================================

  if (pageLoading) {

    return (

      <main className="min-h-screen bg-[#070d19] text-white flex items-center justify-center">

        <div className="text-center">

          <h1 className="text-3xl font-bold mb-3">

            FinSight

          </h1>

          <p className="text-slate-400">

            Loading transactions...

          </p>

        </div>

      </main>

    );

  }

  // =====================================================

  // PAGE

  // =====================================================

  return (

    <main className="min-h-screen bg-[#070d19] text-white">
      <FinSightNavbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-8 sm:py-10">

        {/* ================================================= */}

        {/* HEADER */}

        {/* ================================================= */}

        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between mb-10">

          <div>

            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">

              Transactions

            </h1>

            <p className="text-slate-400 mt-2">

              Manage your income and expenses with

              ML-powered category prediction.

            </p>

          </div>

          <button

            type="button"

            onClick={() =>

              router.push("/dashboard")

            }

            className="border border-white/10 px-5 py-3 rounded-xl hover:border-emerald-500/40 transition"

          >

            ← Back to Dashboard

          </button>

        </div>

        {/* ================================================= */}

        {/* SUMMARY CARDS */}

        {/* ================================================= */}

        <section className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">

          {/* BALANCE */}

          <div className="border border-white/10 bg-[#111c2e] rounded-2xl p-6 shadow-xl shadow-black/10 hover:border-emerald-500/20 transition-colors">

            <p className="text-slate-400">

              Balance

            </p>

            <h2 className="text-3xl font-bold mt-2">

              ₹{formatMoney(balance)}

            </h2>

          </div>

          {/* INCOME */}

          <div className="border border-white/10 bg-[#111c2e] rounded-2xl p-6 shadow-xl shadow-black/10 hover:border-emerald-500/20 transition-colors">

            <p className="text-slate-400">

              Total Income

            </p>

            <h2 className="text-3xl font-bold text-emerald-400 mt-2">

              ₹{formatMoney(totalIncome)}

            </h2>

          </div>

          {/* EXPENSE */}

          <div className="border border-white/10 bg-[#111c2e] rounded-2xl p-6 shadow-xl shadow-black/10 hover:border-emerald-500/20 transition-colors">

            <p className="text-slate-400">

              Total Expenses

            </p>

            <h2 className="text-3xl font-bold text-rose-400 mt-2">

              ₹{formatMoney(totalExpenses)}

            </h2>

          </div>

        </section>

        {/* ================================================= */}

        {/* ADD TRANSACTION */}

        {/* ================================================= */}

        <section className="border border-white/10 bg-[#111c2e] rounded-2xl p-5 sm:p-7 shadow-xl shadow-black/10 mb-8">

          <div className="mb-7">

            <div className="flex flex-wrap items-center gap-3">

              <h2 className="text-2xl font-bold tracking-tight">

                Add Transaction

              </h2>

              <span className="text-xs border border-white/10 bg-white/5 rounded-full px-3 py-1 text-slate-400">

                ML Enabled

              </span>

            </div>

            <p className="text-slate-400 mt-2">

              Enter a description and FinSight will

              automatically predict its category.

            </p>

          </div>

          <form

            onSubmit={handleSubmit}

            className="space-y-6"

          >

            {/* ================================================= */}

            {/* TYPE */}

            {/* ================================================= */}

            <div>

              <label className="block mb-2 font-medium">

                Transaction Type

              </label>

              <div className="grid grid-cols-2 gap-4">

                <button

                  type="button"

                  onClick={() =>

                    setType("income")

                  }

                  className={`py-3 rounded-xl border transition ${

                    type === "income"

                      ? "bg-emerald-500 text-[#07111a] border-emerald-400"

                      : "border-white/10 text-slate-300 hover:border-emerald-500/40"

                  }`}

                >

                  Income

                </button>

                <button

                  type="button"

                  onClick={() =>

                    setType("expense")

                  }

                  className={`py-3 rounded-xl border transition ${

                    type === "expense"

                      ? "bg-emerald-500 text-[#07111a] border-emerald-400"

                      : "border-white/10 text-slate-300 hover:border-emerald-500/40"

                  }`}

                >

                  Expense

                </button>

              </div>

            </div>

            {/* ================================================= */}

            {/* AMOUNT */}

            {/* ================================================= */}

            <div>

              <label className="block mb-2 font-medium">

                Amount

              </label>

              <input

                type="number"

                min="0.01"

                step="0.01"

                value={amount}

                onChange={(e) =>

                  setAmount(e.target.value)

                }

                placeholder="Enter amount"

                className="w-full bg-[#0a1322] border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/10"

              />

            </div>

            {/* ================================================= */}

            {/* DESCRIPTION */}

            {/* ================================================= */}

            <div>

              <label className="block mb-2 font-medium">

                Description

              </label>

              <textarea

                value={description}

                onChange={(e) =>

                  handleDescriptionChange(

                    e.target.value

                  )

                }

                placeholder="Example: Uber ride to airport"

                rows={3}

                className="w-full bg-[#0a1322] border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/10 resize-none"

              />

              <div className="flex flex-wrap items-center gap-4 mt-3">

                {/* MANUAL ML BUTTON */}

                <button

                  type="button"

                  onClick={() =>

                    predictCategory()

                  }

                  disabled={

                    predicting ||

                    !description.trim()

                  }

                  className="border border-white/15 px-5 py-2 rounded-xl hover:border-emerald-400 transition disabled:opacity-50 disabled:cursor-not-allowed"

                >

                  {predicting

                    ? "🤖 Predicting..."

                    : "🤖 Predict Category"}

                </button>

                {/* AUTO STATUS */}

                {predicting && (

                  <p className="text-sm text-slate-400">

                    Analyzing description...

                  </p>

                )}

              </div>

              <p className="text-xs text-slate-500 mt-3">

                Prediction runs automatically after

                you stop typing.

              </p>

              {/* ================================================= */}

              {/* ML RESULT */}

              {/* ================================================= */}

              {predictionConfidence !== null &&

                predictedCategory && (

                  <div className="mt-5 border border-emerald-500/20 bg-emerald-500/5 rounded-xl p-5">

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                      <div>

                        <p className="text-sm text-slate-400">

                          ML Prediction

                        </p>

                        <p className="text-xl font-bold mt-1">

                          {predictedCategory}

                        </p>

                      </div>

                      <div>

                        <span

                          className={`inline-block text-sm border rounded-full px-3 py-1 ${

                            predictionConfidence >= 0.6

                              ? "border-emerald-500/40 text-emerald-400"

                              : "border-yellow-700 text-yellow-400"

                          }`}

                        >

                          {(

                            predictionConfidence *

                            100

                          ).toFixed(1)}

                          % confidence

                        </span>

                      </div>

                    </div>

                    {/* HIGH CONFIDENCE */}

                    {predictionConfidence >= 0.6 ? (

                      <p className="text-emerald-400 text-sm mt-4">

                        ✓ High-confidence prediction.

                        Category has been filled

                        automatically.

                      </p>

                    ) : (

                      <div className="mt-4">

                        <p className="text-yellow-400 text-sm">

                          ⚠ Low-confidence prediction.

                          Please verify this category

                          before saving.

                        </p>

                        <button

                          type="button"

                          onClick={usePrediction}

                          className="mt-3 border border-white/15 px-4 py-2 rounded-xl text-sm hover:border-emerald-400 transition"

                        >

                          Use {predictedCategory}

                        </button>

                      </div>

                    )}

                  </div>

                )}

            </div>

            {/* ================================================= */}

            {/* CATEGORY */}

            {/* ================================================= */}

            <div>

              <label className="block mb-2 font-medium">

                Category

              </label>

              <input

                type="text"

                value={category}

                onChange={(e) => {

                  setCategory(e.target.value);

                }}

                placeholder="Food, Salary, Transport, Shopping..."

                className="w-full bg-[#0a1322] border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/10"

              />

              <p className="text-slate-500 text-sm mt-2">

                You can always change the ML-predicted

                category manually.

              </p>

            </div>

            {/* ================================================= */}

            {/* DATE */}

            {/* ================================================= */}

            <div>

              <label className="block mb-2 font-medium">

                Transaction Date

              </label>

              <input

                type="date"

                value={transactionDate}

                onChange={(e) =>

                  setTransactionDate(

                    e.target.value

                  )

                }

                className="w-full bg-[#0a1322] border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/10"

              />

            </div>

            {/* ================================================= */}

            {/* ERROR MESSAGE */}

            {/* ================================================= */}

            {errorMessage && (

              <div className="border border-rose-500/40 rounded-xl p-4">

                <p className="text-rose-400">

                  {errorMessage}

                </p>

              </div>

            )}

            {/* ================================================= */}

            {/* SUCCESS MESSAGE */}

            {/* ================================================= */}

            {message && (

              <div className="border border-emerald-500/40 rounded-xl p-4">

                <p className="text-emerald-400">

                  {message}

                </p>

              </div>

            )}

            {/* ================================================= */}

            {/* SUBMIT */}

            {/* ================================================= */}

            <button

              type="submit"

              disabled={loading}

              className="bg-emerald-500 text-[#07111a] px-7 py-3 rounded-xl font-semibold hover:bg-emerald-400 shadow-lg shadow-emerald-950/30 transition disabled:opacity-50 disabled:cursor-not-allowed"

            >

              {loading

                ? "Adding..."

                : "+ Add Transaction"}

            </button>

          </form>

        </section>

        {/* ================================================= */}

        {/* TRANSACTION HISTORY */}

        {/* ================================================= */}

        <section className="border border-white/10 bg-[#111c2e] rounded-2xl p-5 sm:p-7 shadow-xl shadow-black/10">

          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between mb-7">

            <div>

              <h2 className="text-2xl font-bold tracking-tight">

                Transaction History

              </h2>

              <p className="text-slate-400 mt-1">

                {filteredTransactions.length}{" "}

                transaction

                {filteredTransactions.length !== 1

                  ? "s"

                  : ""}

              </p>

            </div>

            {/* ================================================= */}

            {/* FILTERS */}

            {/* ================================================= */}

            <div className="flex flex-wrap gap-2">

              <button

                type="button"

                onClick={() =>

                  setFilter("all")

                }

                className={`px-4 py-2 rounded-xl border transition ${

                  filter === "all"

                    ? "bg-emerald-500 text-[#07111a] border-emerald-400"

                    : "border-white/10 hover:border-emerald-500/40"

                }`}

              >

                All

              </button>

              <button

                type="button"

                onClick={() =>

                  setFilter("income")

                }

                className={`px-4 py-2 rounded-xl border transition ${

                  filter === "income"

                    ? "bg-emerald-500 text-[#07111a] border-emerald-400"

                    : "border-white/10 hover:border-emerald-500/40"

                }`}

              >

                Income

              </button>

              <button

                type="button"

                onClick={() =>

                  setFilter("expense")

                }

                className={`px-4 py-2 rounded-xl border transition ${

                  filter === "expense"

                    ? "bg-emerald-500 text-[#07111a] border-emerald-400"

                    : "border-white/10 hover:border-emerald-500/40"

                }`}

              >

                Expense

              </button>

            </div>

          </div>

          {/* ================================================= */}

          {/* EMPTY STATE */}

          {/* ================================================= */}

          {filteredTransactions.length === 0 ? (

            <div className="text-center py-12">

              <p className="text-slate-400">

                No transactions found.

              </p>

            </div>

          ) : (

            /* ================================================= */

            /* TRANSACTION LIST */

            /* ================================================= */

            <div className="divide-y divide-white/10">

              {filteredTransactions.map(

                (transaction) => (

                  <div

                    key={transaction.id}

                    className="py-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"

                  >

                    {/* LEFT */}

                    <div>

                      <div className="flex flex-wrap items-center gap-3">

                        <h3 className="text-lg font-semibold">

                          {transaction.category}

                        </h3>

                        <span className="text-xs border border-white/10 bg-white/5 rounded-full px-2 py-1 capitalize text-slate-400">

                          {transaction.type}

                        </span>

                      </div>

                      <p className="text-slate-400 text-sm mt-2">

                        {transaction.description ||

                          "No description"}

                      </p>

                      <p className="text-slate-500 text-sm mt-1">

                        {formatDate(

                          transaction.transaction_date

                        )}

                      </p>

                    </div>

                    {/* RIGHT */}

                    <div className="flex items-center gap-5">

                      <p

                        className={`text-xl font-bold ${

                          transaction.type ===

                          "income"

                            ? "text-emerald-400"

                            : "text-rose-400"

                        }`}

                      >

                        {transaction.type ===

                        "income"

                          ? "+"

                          : "-"}

                        ₹

                        {formatMoney(

                          Number(

                            transaction.amount

                          )

                        )}

                      </p>

                      <button

                        type="button"

                        onClick={() =>

                          handleDelete(

                            transaction.id

                          )

                        }

                        className="border border-rose-500/30 text-rose-400 px-4 py-2 rounded-xl hover:border-rose-500/40 transition"

                      >

                        Delete

                      </button>

                    </div>

                  </div>

                )

              )}

            </div>

          )}

        </section>

      </div>

    </main>

  );

}
