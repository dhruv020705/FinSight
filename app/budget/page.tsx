

"use client";



import { useCallback, useEffect, useMemo, useState } from "react";

import type { FormEvent } from "react";

import { useRouter } from "next/navigation";

import { supabase } from "@/supabase";

import BudgetAnalytics from "../components/BudgetAnalytics";

import BudgetTrends from "../components/BudgetTrends";
import FinSightNavbar from "../components/FinSightNavbar";



type Budget = {

  id: string;

  user_id: string;

  category: string;

  monthly_limit: number;

  month: number;

  year: number;

  created_at: string;

  updated_at: string;

};



type Transaction = {

  id: string;

  category: string | null;

  amount: number;

  type: string;

  transaction_date: string;

};



const MONTHS = [

  "January", "February", "March", "April",

  "May", "June", "July", "August",

  "September", "October", "November", "December",

];



const DEFAULT_CATEGORIES = [

  "Food",

  "Shopping",

  "Transport",

  "Entertainment",

  "Bills",

  "Healthcare",

  "Education",

  "Travel",

  "Groceries",

  "Other",

];



function formatCurrency(value: number) {

  return new Intl.NumberFormat("en-IN", {

    style: "currency",

    currency: "INR",

    minimumFractionDigits: 0,

    maximumFractionDigits: 2,

  }).format(value);

}



function normalizeCategory(value: string | null | undefined) {

  return (value ?? "").trim().toLowerCase();

}



function getBudgetStatus(percentage: number) {

  if (percentage > 100) {

    return {

      label: "Over Budget",

      color: "text-red-400",

      background: "bg-red-500",

      badge: "bg-red-500/10 border-red-500/30",

    };

  }



  if (percentage >= 80) {

    return {

      label: "Approaching Limit",

      color: "text-yellow-400",

      background: "bg-yellow-500",

      badge: "bg-yellow-500/10 border-yellow-500/30",

    };

  }



  return {

    label: "Within Budget",

    color: "text-emerald-400",

    background: "bg-emerald-500",

    badge: "bg-emerald-500/10 border-emerald-500/30",

  };

}



export default function BudgetPage() {

  const router = useRouter();



  const today = new Date();



  const [selectedMonth, setSelectedMonth] = useState(

    today.getMonth() + 1

  );

  const [selectedYear, setSelectedYear] = useState(

    today.getFullYear()

  );



  const [userId, setUserId] = useState("");

  const [budgets, setBudgets] = useState<Budget[]>([]);

  const [transactions, setTransactions] = useState<Transaction[]>([]);



  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [deletingId, setDeletingId] = useState<string | null>(null);



  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");



  const [category, setCategory] = useState("Food");

  const [customCategory, setCustomCategory] = useState("");

  const [monthlyLimit, setMonthlyLimit] = useState("");

  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);



  const [knownCategories, setKnownCategories] =

    useState<string[]>(DEFAULT_CATEGORIES);



  const fetchData = useCallback(async () => {

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



      setUserId(user.id);



      const startDate = `${selectedYear}-${String(

        selectedMonth

      ).padStart(2, "0")}-01`;



      const nextMonth =

        selectedMonth === 12 ? 1 : selectedMonth + 1;



      const nextYear =

        selectedMonth === 12

          ? selectedYear + 1

          : selectedYear;



      const endDate = `${nextYear}-${String(

        nextMonth

      ).padStart(2, "0")}-01`;



      const [budgetResult, transactionResult, categoryResult] =

        await Promise.all([

          supabase

            .from("budgets")

            .select("*")

            .eq("user_id", user.id)

            .eq("month", selectedMonth)

            .eq("year", selectedYear)

            .order("category", { ascending: true }),



          supabase

            .from("transactions")

            .select(

              "id, category, amount, type, transaction_date"

            )

            .eq("user_id", user.id)

            .eq("type", "expense")

            .gte("transaction_date", startDate)

            .lt("transaction_date", endDate),



          supabase

            .from("transactions")

            .select("category")

            .eq("user_id", user.id)

            .eq("type", "expense"),

        ]);



      if (budgetResult.error) {

        throw new Error(budgetResult.error.message);

      }



      if (transactionResult.error) {

        throw new Error(transactionResult.error.message);

      }



      if (categoryResult.error) {

        throw new Error(categoryResult.error.message);

      }



      setBudgets((budgetResult.data ?? []) as Budget[]);

      setTransactions(

        (transactionResult.data ?? []) as Transaction[]

      );



      const categoryMap = new Map<string, string>();



      for (const name of DEFAULT_CATEGORIES) {

        categoryMap.set(normalizeCategory(name), name);

      }



      for (const row of categoryResult.data ?? []) {

        const name = String(row.category ?? "").trim();

        const key = normalizeCategory(name);



        if (key && !categoryMap.has(key)) {

          categoryMap.set(key, name);

        }

      }



      setKnownCategories(

        Array.from(categoryMap.values()).sort()

      );

    } catch (err) {

      setError(

        err instanceof Error

          ? err.message

          : "Unable to load budget data."

      );

    } finally {

      setLoading(false);

    }

  }, [router, selectedMonth, selectedYear]);



  useEffect(() => {

    void fetchData();

  }, [fetchData]);



  const spendingByCategory = useMemo(() => {

    const totals = new Map<string, number>();



    for (const transaction of transactions) {

      const key = normalizeCategory(transaction.category);



      if (!key) continue;



      const amount = Number(transaction.amount);



      if (!Number.isFinite(amount) || amount <= 0) {

        continue;

      }



      totals.set(

        key,

        (totals.get(key) ?? 0) + amount

      );

    }



    return totals;

  }, [transactions]);



  const budgetDetails = useMemo(() => {

    return budgets.map((budget) => {

      const limit = Number(budget.monthly_limit);



      const spent =

        spendingByCategory.get(

          normalizeCategory(budget.category)

        ) ?? 0;



      const percentage =

        limit > 0 ? (spent / limit) * 100 : 0;



      return {

        ...budget,

        limit,

        spent,

        percentage,

        remaining: limit - spent,

        status: getBudgetStatus(percentage),

      };

    });

  }, [budgets, spendingByCategory]);



  const totalBudget = budgetDetails.reduce(

    (sum, item) => sum + item.limit,

    0

  );



  const totalSpentInBudgetedCategories =

    budgetDetails.reduce(

      (sum, item) => sum + item.spent,

      0

    );



  const totalMonthlyExpenses = transactions.reduce(

    (sum, item) => sum + Math.max(0, Number(item.amount) || 0),

    0

  );



  const unbudgetedSpending = Math.max(

    0,

    totalMonthlyExpenses - totalSpentInBudgetedCategories

  );



  const remainingBudget =

    totalBudget - totalSpentInBudgetedCategories;



  const overBudgetCount = budgetDetails.filter(

    (item) => item.percentage > 100

  ).length;



  const warningCount = budgetDetails.filter(

    (item) =>

      item.percentage >= 80 && item.percentage <= 100

  ).length;



  function resetForm() {

    setEditingBudget(null);

    setCategory("Food");

    setCustomCategory("");

    setMonthlyLimit("");

  }



  function handleEdit(budget: Budget) {

    setEditingBudget(budget);

    setMonthlyLimit(String(budget.monthly_limit));



    const matchingCategory = knownCategories.find(

      (name) =>

        normalizeCategory(name) ===

        normalizeCategory(budget.category)

    );



    if (matchingCategory) {

      setCategory(matchingCategory);

      setCustomCategory("");

    } else {

      setCategory("__custom__");

      setCustomCategory(budget.category);

    }



    setError("");

    setSuccess("");



    window.scrollTo({

      top: 0,

      behavior: "smooth",

    });

  }



  async function handleSubmit(event: FormEvent<HTMLFormElement>) {

    event.preventDefault();



    if (!userId) {

      setError("Please log in again.");

      return;

    }



    const chosenCategory =

      category === "__custom__"

        ? customCategory.trim()

        : category.trim();



    const limit = Number(monthlyLimit);



    if (!chosenCategory) {

      setError("Please enter a budget category.");

      return;

    }



    if (

      monthlyLimit.trim() === "" ||

      !Number.isFinite(limit) ||

      limit <= 0

    ) {

      setError("Enter a monthly budget greater than zero.");

      return;

    }



    const duplicate = budgets.some(

      (budget) =>

        normalizeCategory(budget.category) ===

          normalizeCategory(chosenCategory) &&

        budget.id !== editingBudget?.id

    );



    if (duplicate) {

      setError(

        "A budget already exists for this category and month."

      );

      return;

    }



    setSaving(true);

    setError("");

    setSuccess("");



    try {

      const {

        data: { user },

        error: authError,

      } = await supabase.auth.getUser();



      if (authError || !user || user.id !== userId) {

        throw new Error("Please log in again.");

      }



      if (editingBudget) {

        const { error: updateError } = await supabase

          .from("budgets")

          .update({

            category: chosenCategory,

            monthly_limit: limit,

          })

          .eq("id", editingBudget.id)

          .eq("user_id", user.id);



        if (updateError) {

          throw new Error(updateError.message);

        }



        setSuccess("Budget updated successfully.");

      } else {

        const { error: insertError } = await supabase

          .from("budgets")

          .insert({

            user_id: user.id,

            category: chosenCategory,

            monthly_limit: limit,

            month: selectedMonth,

            year: selectedYear,

          });



        if (insertError) {

          throw new Error(insertError.message);

        }



        setSuccess("Budget created successfully.");

      }



      resetForm();

      await fetchData();

    } catch (err) {

      setError(

        err instanceof Error

          ? err.message

          : "Unable to save budget."

      );

    } finally {

      setSaving(false);

    }

  }



  async function handleDelete(budget: Budget) {

    const confirmed = window.confirm(

      `Delete the ${budget.category} budget for ${MONTHS[selectedMonth - 1]} ${selectedYear}?`

    );



    if (!confirmed) return;



    setDeletingId(budget.id);

    setError("");

    setSuccess("");



    try {

      const {

        data: { user },

        error: authError,

      } = await supabase.auth.getUser();



      if (authError || !user || user.id !== userId) {

        throw new Error("Please log in again.");

      }



      const { error: deleteError } = await supabase

        .from("budgets")

        .delete()

        .eq("id", budget.id)

        .eq("user_id", user.id);



      if (deleteError) {

        throw new Error(deleteError.message);

      }



      if (editingBudget?.id === budget.id) {

        resetForm();

      }



      setSuccess("Budget deleted successfully.");

      await fetchData();

    } catch (err) {

      setError(

        err instanceof Error

          ? err.message

          : "Unable to delete budget."

      );

    } finally {

      setDeletingId(null);

    }

  }



  return (

    <main className="min-h-screen bg-[#070d19] text-white">

      <FinSightNavbar />

    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-10">

        {/* HEADER */}



        <div className="mb-8 rounded-3xl border border-white/10 bg-gradient-to-br from-[#13283b] via-[#0c1c2e] to-[#07121e] p-7 sm:p-9">

          <p className="text-emerald-400 text-xs font-bold uppercase tracking-[0.22em]">

            FINSIGHT FINANCIAL PLANNING

          </p>



          <h1 className="text-4xl font-bold tracking-tight mt-2">

            Budget Management

          </h1>



          <p className="text-slate-300 mt-3 max-w-2xl leading-relaxed">

            Set spending limits, monitor expenses, and

            stay in control of your monthly budget.

          </p>

        </div>



        {/* MONTH SELECTION */}



        <div className="bg-[#111c2e] border border-white/10 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.16)] p-5 mb-7">

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            <div>

              <label

                htmlFor="budget-month"

                className="block text-sm text-slate-300 mb-2"

              >

                Select Month

              </label>



              <select

                id="budget-month"

                value={selectedMonth}

                onChange={(event) => {

                  setSelectedMonth(Number(event.target.value));

                  resetForm();

                  setSuccess("");

                }}

                className="w-full bg-[#0a1322] border border-white/10 rounded-xl text-white outline-none focus:border-emerald-400/70 focus:ring-2 focus:ring-emerald-500/10 transition p-3"

              >

                {MONTHS.map((name, index) => (

                  <option key={name} value={index + 1}>

                    {name}

                  </option>

                ))}

              </select>

            </div>



            <div>

              <label

                htmlFor="budget-year"

                className="block text-sm text-slate-300 mb-2"

              >

                Select Year

              </label>



              <select

                id="budget-year"

                value={selectedYear}

                onChange={(event) => {

                  setSelectedYear(Number(event.target.value));

                  resetForm();

                  setSuccess("");

                }}

                className="w-full bg-[#0a1322] border border-white/10 rounded-xl text-white outline-none focus:border-emerald-400/70 focus:ring-2 focus:ring-emerald-500/10 transition p-3"

              >

                {Array.from(

                  { length: 11 },

                  (_, index) => today.getFullYear() - 5 + index

                ).map((year) => (

                  <option key={year} value={year}>

                    {year}

                  </option>

                ))}

              </select>

            </div>

          </div>

        </div>



        {/* ALERTS */}



        {error && (

          <div

            role="alert"

            className="bg-red-500/10 border border-red-500/30 text-red-300 rounded-xl p-4 mb-6"

          >

            {error}

          </div>

        )}



        {success && (

          <div

            role="status"

            className="bg-emerald-500/10 border border-emerald-500/30 text-green-300 rounded-xl p-4 mb-6"

          >

            {success}

          </div>

        )}



        {/* SUMMARY CARDS */}



        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">

          <SummaryCard

            label="Total Budget"

            value={formatCurrency(totalBudget)}

          />



          <SummaryCard

            label="Budgeted Spending"

            value={formatCurrency(

              totalSpentInBudgetedCategories

            )}

          />



          <SummaryCard

            label="Remaining Budget"

            value={formatCurrency(remainingBudget)}

            valueClassName={

              remainingBudget < 0

                ? "text-red-400"

                : "text-emerald-400"

            }

          />



          <SummaryCard

            label="Total Monthly Expenses"

            value={formatCurrency(totalMonthlyExpenses)}

          />

        </div>



        {/* BUDGET FORM */}



        <section className="bg-[#111c2e] border border-white/10 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.16)] p-6 mb-8">

          <h2 className="text-xl font-semibold tracking-tight mb-2">

            {editingBudget ? "Edit Budget" : "Create Budget"}

          </h2>



          <p className="text-slate-400 text-sm mb-6">

            {editingBudget

              ? `Update your ${MONTHS[selectedMonth - 1]} ${selectedYear} spending limit.`

              : `Create a category spending limit for ${MONTHS[selectedMonth - 1]} ${selectedYear}.`}

          </p>



          <form onSubmit={handleSubmit} className="space-y-5">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

              <div>

                <label

                  htmlFor="budget-category"

                  className="block text-sm text-slate-300 mb-2"

                >

                  Expense Category

                </label>



                <select

                  id="budget-category"

                  value={category}

                  onChange={(event) =>

                    setCategory(event.target.value)

                  }

                  className="w-full bg-[#0a1322] border border-white/10 rounded-xl text-white outline-none focus:border-emerald-400/70 focus:ring-2 focus:ring-emerald-500/10 transition p-3"

                >

                  {knownCategories.map((name) => (

                    <option key={name} value={name}>

                      {name}

                    </option>

                  ))}



                  <option value="__custom__">

                    \+ Custom Category

                  </option>

                </select>

              </div>



              <div>

                <label

                  htmlFor="budget-limit"

                  className="block text-sm text-slate-300 mb-2"

                >

                  Monthly Spending Limit (₹)

                </label>



                <input

                  id="budget-limit"

                  type="number"

                  min="0.01"

                  step="0.01"

                  required

                  value={monthlyLimit}

                  onChange={(event) =>

                    setMonthlyLimit(event.target.value)

                  }

                  placeholder="e.g. 5000"

                  className="w-full bg-[#0a1322] border border-white/10 rounded-xl text-white outline-none focus:border-emerald-400/70 focus:ring-2 focus:ring-emerald-500/10 transition p-3"

                />

              </div>

            </div>



            {category === "__custom__" && (

              <div>

                <label

                  htmlFor="custom-category"

                  className="block text-sm text-slate-300 mb-2"

                >

                  Custom Category Name

                </label>



                <input

                  id="custom-category"

                  type="text"

                  required

                  value={customCategory}

                  onChange={(event) =>

                    setCustomCategory(event.target.value)

                  }

                  placeholder="Enter category name"

                  className="w-full bg-[#0a1322] border border-white/10 rounded-xl text-white outline-none focus:border-emerald-400/70 focus:ring-2 focus:ring-emerald-500/10 transition p-3"

                />

              </div>

            )}



            <div className="flex flex-wrap gap-3">

              <button

                type="submit"

                disabled={saving || loading}

                className="bg-emerald-500 hover:bg-emerald-400 text-[#07111a] shadow-lg shadow-emerald-500/10 disabled:opacity-50 px-6 py-3 rounded-lg font-semibold"

              >

                {saving

                  ? "Saving..."

                  : editingBudget

                  ? "Update Budget"

                  : "Create Budget"}

              </button>



              {editingBudget && (

                <button

                  type="button"

                  onClick={resetForm}

                  className="bg-[#1b2b40] hover:bg-[#263c56] border border-white/10 px-6 py-3 rounded-lg font-semibold"

                >

                  Cancel Editing

                </button>

              )}

            </div>

          </form>

        </section>



        {/* MONTHLY BUDGET OVERVIEW */}



        <section className="mb-8">

          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">

            <div>

              <h2 className="text-2xl font-bold tracking-tight">

                Monthly Budget Overview

              </h2>



              <p className="text-slate-400 text-sm mt-2">

                {MONTHS[selectedMonth - 1]} {selectedYear}

              </p>

            </div>



            <span className="text-slate-400 text-sm">

              {budgets.length} categories budgeted

            </span>

          </div>



          {loading ? (

            <div className="bg-[#111c2e] border border-white/10 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.16)] p-6">

              <p className="text-slate-400">

                Loading budgets and expenses...

              </p>

            </div>

          ) : budgetDetails.length === 0 ? (

            <div className="bg-[#111c2e] border border-white/10 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.16)] p-8 text-center">

              <h3 className="text-lg font-semibold">

                No Budgets Created Yet

              </h3>



              <p className="text-slate-400 text-sm mt-3">

                Create your first budget above to start

                tracking monthly spending limits.

              </p>

            </div>

          ) : (

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

              {budgetDetails.map((budget) => (

                <div

                  key={budget.id}

                  className="bg-[#111c2e] border border-white/10 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.16)] p-6"

                >

                  <div className="flex flex-wrap justify-between items-start gap-3 mb-5">

                    <div>

                      <h3 className="text-lg font-semibold">

                        {budget.category}

                      </h3>



                      <p className="text-slate-500 text-xs mt-2">

                        Monthly spending limit

                      </p>

                    </div>



                    <span

                      className={`text-xs font-medium border rounded-full px-3 py-1 ${budget.status.color} ${budget.status.badge}`}

                    >

                      {budget.status.label}

                    </span>

                  </div>



                  <div className="flex justify-between items-end gap-3 mb-3">

                    <div>

                      <p className="text-slate-400 text-xs">

                        Amount Spent

                      </p>



                      <p className="text-xl font-bold mt-1">

                        {formatCurrency(budget.spent)}

                      </p>

                    </div>



                    <p className="text-slate-400 text-sm">

                      of {formatCurrency(budget.limit)}

                    </p>

                  </div>



                  {/* SPENDING PROGRESS */}



                  <div className="w-full h-3 bg-[#0a1322] rounded-full overflow-hidden">

                    <div

                      className={`h-full rounded-full ${budget.status.background}`}

                      style={{

                        width: `${Math.min(

                          100,

                          Math.max(0, budget.percentage)

                        )}%`,

                      }}

                    />

                  </div>



                  <div className="flex justify-between gap-3 mt-3 text-sm">

                    <span className={budget.status.color}>

                      {budget.percentage.toFixed(1)}% used

                    </span>



                    <span

                      className={

                        budget.remaining < 0

                          ? "text-red-400"

                          : "text-slate-400"

                      }

                    >

                      {budget.remaining >= 0

                        ? `${formatCurrency(budget.remaining)} left`

                        : `${formatCurrency(

                            Math.abs(budget.remaining)

                          )} over`}

                    </span>

                  </div>



                  {/* ACTION BUTTONS */}



                  <div className="flex gap-3 mt-6 pt-5 border-t border-white/10">

                    <button

                      type="button"

                      onClick={() => handleEdit(budget)}

                      disabled={saving || deletingId !== null}

                      className="bg-[#1b2b40] hover:bg-[#263c56] border border-white/10 disabled:opacity-50 rounded-lg px-4 py-2 text-sm"

                    >

                      Edit

                    </button>



                    <button

                      type="button"

                      onClick={() => handleDelete(budget)}

                      disabled={saving || deletingId !== null}

                      className="border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 text-red-400 disabled:opacity-50 rounded-xl px-4 py-2 text-sm transition"

                    >

                      {deletingId === budget.id

                        ? "Deleting..."

                        : "Delete"}

                    </button>

                  </div>

                </div>

              ))}

            </div>

          )}

        </section>



        {/* BUDGET ANALYTICS */}



        {!loading && budgets.length > 0 && (

          <BudgetAnalytics

            budgets={budgets}

            transactions={transactions}

            month={selectedMonth}

            year={selectedYear}

          />

        )}



        {/* BUDGET TRENDS */}



        {!loading && (

        <BudgetTrends

            month={selectedMonth}

            year={selectedYear}

        />

        )}



        {/* BUDGET ALERTS */}



        {!loading && budgets.length > 0 && (

          <section className="bg-[#111c2e] border border-white/10 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.16)] p-6 mb-8">

            <h2 className="text-xl font-semibold mb-4">

              Budget Alerts

            </h2>



            {overBudgetCount === 0 &&

            warningCount === 0 ? (

              <p className="text-emerald-400 text-sm">

                All category budgets are currently below

                the warning threshold.

              </p>

            ) : (

              <div className="space-y-3">

                {budgetDetails

                  .filter((item) => item.percentage >= 80)

                  .map((item) => (

                    <div

                      key={item.id}

                      className={`border rounded-lg p-4 ${

                        item.percentage > 100

                          ? "bg-red-500/10 border-red-500/30"

                          : "bg-yellow-500/10 border-yellow-500/30"

                      }`}

                    >

                      <p

                        className={`font-semibold text-sm ${

                          item.percentage > 100

                            ? "text-red-400"

                            : "text-yellow-400"

                        }`}

                      >

                        {item.category}: {item.status.label}

                      </p>



                      <p className="text-slate-300 text-sm mt-2">

                        {formatCurrency(item.spent)} spent

                        out of {formatCurrency(item.limit)}.

                      </p>

                    </div>

                  ))}

              </div>

            )}

          </section>

        )}



        {/* UNBUDGETED SPENDING */}



        {!loading && unbudgetedSpending > 0 && (

          <section className="bg-[#111c2e] border border-white/10 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.16)] p-6 mb-8">

            <h2 className="text-lg font-semibold">

              Spending Without a Budget

            </h2>



            <p className="text-slate-400 text-sm mt-3">

              You spent{" "}

              <span className="text-yellow-400 font-semibold">

                {formatCurrency(unbudgetedSpending)}

              </span>{" "}

              in categories that do not have a budget

              for this month.

            </p>

          </section>

        )}



        {/* FOOTER */}



        <p className="text-slate-500 text-xs leading-relaxed">

          Budget spending is calculated from expense

          transactions recorded for the selected month.

          Category matching ignores capitalization and

          surrounding spaces. Budget limits are planning

          targets and do not restrict actual transactions.

        </p>

      </div>

    </main>

  );

}



function SummaryCard({

  label,

  value,

  valueClassName = "text-white",

}: {

  label: string;

  value: string;

  valueClassName?: string;

}) {

  return (

    <div className="bg-[#111c2e] border border-white/10 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.16)] p-5">

      <p className="text-slate-400 text-sm">

        {label}

      </p>



      <p

        className={`text-2xl font-bold tracking-tight mt-3 break-words ${valueClassName}`}

      >

        {value}

      </p>

    </div>

  );

}
