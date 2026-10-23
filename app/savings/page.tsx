

"use client";



import { useCallback, useEffect, useState } from "react";

import type { FormEvent } from "react";

import { useRouter } from "next/navigation";



import { supabase } from "@/supabase";



import SavingsRecommendations from "../components/SavingsRecommendations";
import FinSightNavbar from "../components/FinSightNavbar";

import SavingsContributions from "../components/SavingsContributions";

import SavingsAnalytics from "../components/SavingsAnalytics";

import SavingsForecast from "../components/SavingsForecast";

import SavingsRiskAnalysis from "../components/SavingsRiskAnalysis";

import SavingsSimulator from "../components/SavingsSimulator";

import SavingsAllocationOptimizer from "../components/SavingsAllocationOptimizer";

import SavingsAllocationComparison from "../components/SavingsAllocationComparison";



// ============================================================

// TYPES

// ============================================================



type SavingsGoal = {

  id: string;

  user_id: string;

  goal_name: string;

  target_amount: number;

  current_amount: number;

  target_date: string;

  created_at: string;

  priority: "high" | "medium" | "low";

};



type SavingsRecommendation = {

  goal_id: string;

  goal_name: string;

  target_amount: number;

  current_amount: number;

  remaining_amount: number;

  target_date: string;

  months_remaining: number;

  required_monthly_savings: number;

  status: "completed" | "overdue" | "pending";

  insight: string;

};



type SavingsRecommendationResponse = {

  status: string;

  analysis_months: string[];

  average_monthly_income: number;

  average_monthly_expenses: number;

  estimated_monthly_surplus: number;

  total_required_monthly_savings: number;

  combined_goals_achievable: boolean;

  recommendations: SavingsRecommendation[];

  disclaimer: string;

};



// ============================================================

// HELPERS

// ============================================================



function formatCurrency(amount: number) {

  return new Intl.NumberFormat("en-IN", {

    style: "currency",

    currency: "INR",

    maximumFractionDigits: 0,

  }).format(amount);

}



function getToday() {

  const now = new Date();



  const local = new Date(

    now.getTime() - now.getTimezoneOffset() * 60000

  );



  return local.toISOString().split("T")[0];

}



function getMonthsRemaining(targetDate: string) {

  const today = new Date(`${getToday()}T00:00:00`);

  const deadline = new Date(`${targetDate}T00:00:00`);



  const days = Math.max(

    0,

    Math.ceil(

      (deadline.getTime() - today.getTime()) /

        (1000 * 60 * 60 * 24)

    )

  );



  return Math.max(1, Math.ceil(days / 30.44));

}



// ============================================================

// MAIN PAGE

// ============================================================



export default function SavingsPage() {

  const router = useRouter();

  const [goalPriority, setGoalPriority] = useState<

  "high" | "medium" | "low"

>("medium");



  // ==========================================================

  // AUTHENTICATED USER

  // ==========================================================



  const [userId, setUserId] = useState<string | null>(null);



  // ==========================================================

  // SAVINGS GOALS STATE

  // ==========================================================



  const [goals, setGoals] = useState<SavingsGoal[]>([]);



  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);



  const [deletingId, setDeletingId] = useState<string | null>(

    null

  );



  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");



  // ==========================================================

  // FORM STATE

  // ==========================================================



  const [goalName, setGoalName] = useState("");

  const [targetAmount, setTargetAmount] = useState("");

  const [currentAmount, setCurrentAmount] = useState("0");

  const [targetDate, setTargetDate] = useState("");



  const [editingGoal, setEditingGoal] =

    useState<SavingsGoal | null>(null);



  // ==========================================================

  // RECOMMENDATION STATE

  // ==========================================================



  const [

    recommendationData,

    setRecommendationData,

  ] = useState<SavingsRecommendationResponse | null>(null);



  const [

    recommendationLoading,

    setRecommendationLoading,

  ] = useState(false);



  const [

    recommendationError,

    setRecommendationError,

  ] = useState("");



  // ==========================================================

  // ANALYTICS REFRESH STATE

  // ==========================================================



  const [analyticsRefreshKey, setAnalyticsRefreshKey] =

    useState(0);



  // ==========================================================

  // FETCH PERSONALIZED SAVINGS RECOMMENDATIONS

  // ==========================================================



  const fetchSavingsRecommendations = useCallback(

    async (userGoals: SavingsGoal[]) => {

      setRecommendationLoading(true);

      setRecommendationError("");



      try {

        const {

          data: { user },

          error: authError,

        } = await supabase.auth.getUser();



        if (authError || !user) {

          throw new Error(

            "Please log in to view recommendations."

          );

        }



        const {

          data: transactions,

          error: transactionError,

        } = await supabase

          .from("transactions")

          .select("type, amount, transaction_date")

          .eq("user_id", user.id);



        if (transactionError) {

          throw new Error(transactionError.message);

        }



        const payload = {

          transactions: (transactions ?? []).map(

            (transaction) => ({

              type: transaction.type,

              amount: Number(transaction.amount),

              transaction_date: transaction.transaction_date,

            })

          ),



          goals: userGoals.map((goal) => ({

            id: goal.id,

            goal_name: goal.goal_name,

            target_amount: Number(goal.target_amount),

            current_amount: Number(goal.current_amount),

            target_date: goal.target_date,

          })),

        };



        const response = await fetch(

          "https://finsight-ml-api.onrender.com/savings-recommendations",

          {

            method: "POST",

            headers: {

              "Content-Type": "application/json",

            },

            body: JSON.stringify(payload),

          }

        );



        if (!response.ok) {

          throw new Error(

            `Savings recommendation API failed: ${response.status}`

          );

        }



        const result: SavingsRecommendationResponse =

          await response.json();



        setRecommendationData(result);

      } catch (err) {

        setRecommendationData(null);



        setRecommendationError(

          err instanceof Error

            ? err.message

            : "Unable to load savings recommendations."

        );

      } finally {

        setRecommendationLoading(false);

      }

    },

    []

  );



  // ==========================================================

  // LOAD SAVINGS GOALS

  // ==========================================================



  useEffect(() => {

    let cancelled = false;



    async function loadGoals() {

      try {

        setLoading(true);

        setError("");



        const {

          data: { user },

          error: authError,

        } = await supabase.auth.getUser();



        if (cancelled) return;



        if (authError || !user) {

          router.replace("/login");

          return;

        }



        setUserId(user.id);



        const {

          data,

          error: fetchError,

        } = await supabase

          .from("savings_goals")

          .select("*")

          .eq("user_id", user.id)

          .order("created_at", {

            ascending: false,

          });



        if (cancelled) return;



        if (fetchError) {

          throw new Error(fetchError.message);

        }



        const loadedGoals = (data ?? []) as SavingsGoal[];



        setGoals(loadedGoals);



        await fetchSavingsRecommendations(loadedGoals);

      } catch (err) {

        if (!cancelled) {

          setError(

            err instanceof Error

              ? err.message

              : "Unable to load savings goals."

          );

        }

      } finally {

        if (!cancelled) {

          setLoading(false);

        }

      }

    }



    void loadGoals();



    return () => {

      cancelled = true;

    };

  }, [router, fetchSavingsRecommendations]);



  // ==========================================================

  // REFRESH SAVINGS GOALS

  // ==========================================================



  const refreshGoals = useCallback(async () => {

    const {

      data: { user },

      error: authError,

    } = await supabase.auth.getUser();



    if (authError || !user) {

      router.replace("/login");

      return;

    }



    const {

      data,

      error: fetchError,

    } = await supabase

      .from("savings_goals")

      .select("*")

      .eq("user_id", user.id)

      .order("created_at", {

        ascending: false,

      });



    if (fetchError) {

      setError(fetchError.message);

      return;

    }



    const refreshedGoals = (data ?? []) as SavingsGoal[];



    setGoals(refreshedGoals);



    await fetchSavingsRecommendations(refreshedGoals);

  }, [router, fetchSavingsRecommendations]);



  // ==========================================================

  // REFRESH AFTER CONTRIBUTION CHANGES

  // ==========================================================



  async function handleContributionChange() {

    await refreshGoals();



    setAnalyticsRefreshKey((previous) => previous + 1);

  }



  // ==========================================================

  // RESET FORM

  // ==========================================================



  function resetForm() {

    setGoalName("");

    setTargetAmount("");

    setCurrentAmount("0");

    setTargetDate("");

    setEditingGoal(null);

    setGoalPriority("medium");

  }



  // ==========================================================

  // CREATE OR UPDATE SAVINGS GOAL

  // ==========================================================



  async function handleSubmit(e: FormEvent<HTMLFormElement>) {

    e.preventDefault();



    setError("");

    setSuccess("");



    const target = Number(targetAmount);

    const current = Number(currentAmount);



    if (!goalName.trim()) {

      setError("Please enter a goal name.");

      return;

    }



    if (

      targetAmount.trim() === "" ||

      !Number.isFinite(target) ||

      target <= 0

    ) {

      setError(

        "Target amount must be greater than zero."

      );

      return;

    }



    if (

      currentAmount.trim() === "" ||

      !Number.isFinite(current) ||

      current < 0

    ) {

      setError(

        "Current savings cannot be negative."

      );

      return;

    }



    if (!targetDate) {

      setError("Please select a target date.");

      return;

    }



    if (targetDate < getToday()) {

      setError(

        "Please select today or a future date."

      );

      return;

    }



    try {

      setSaving(true);



      const {

        data: { user },

        error: authError,

      } = await supabase.auth.getUser();



      if (authError || !user) {

        router.replace("/login");

        return;

      }



    // ------------------------------------------------------

      // UPDATE EXISTING GOAL

      // ------------------------------------------------------



      if (editingGoal) {

        const { error: updateError } = await supabase

          .from("savings_goals")

          .update({

            goal_name: goalName.trim(),

            target_amount: target,

            current_amount: current,

            target_date: targetDate,

            priority: goalPriority,

          })

          .eq("id", editingGoal.id)

          .eq("user_id", user.id);



        if (updateError) {

          throw updateError;

        }



        setSuccess(

          "Savings goal updated successfully."

        );

      }



      // ------------------------------------------------------

      // CREATE NEW GOAL

      // ------------------------------------------------------



      else {

        const { error: insertError } = await supabase

          .from("savings_goals")

          .insert({

            user_id: user.id,

            goal_name: goalName.trim(),

            target_amount: target,

            current_amount: current,

            target_date: targetDate,

            priority: goalPriority,

          });



        if (insertError) {

          throw insertError;

        }



        setSuccess(

          "Savings goal created successfully."

        );

      }



      resetForm();



      await refreshGoals();

    } catch (err) {

      setError(

        err instanceof Error

          ? err.message

          : "Something went wrong while saving."

      );

    } finally {

      setSaving(false);

    }

  }



  // ==========================================================

  // EDIT SAVINGS GOAL

  // ==========================================================



  function handleEdit(goal: SavingsGoal) {

    setEditingGoal(goal);



    setGoalName(goal.goal_name);

    setTargetAmount(String(goal.target_amount));

    setCurrentAmount(String(goal.current_amount));

    setTargetDate(goal.target_date);

    setGoalPriority(goal.priority ?? "medium");



    setError("");

    setSuccess("");



    window.scrollTo({

      top: 0,

      behavior: "smooth",

    });

  }



  // ==========================================================

  // DELETE SAVINGS GOAL

  // ==========================================================



  async function handleDelete(goal: SavingsGoal) {

    const confirmed = window.confirm(

      `Are you sure you want to delete "${goal.goal_name}"?`

    );



    if (!confirmed) return;



    setError("");

    setSuccess("");



    try {

      setDeletingId(goal.id);



      const {

        data: { user },

        error: authError,

      } = await supabase.auth.getUser();



      if (authError || !user) {

        router.replace("/login");

        return;

      }



      const { error: deleteError } = await supabase

        .from("savings_goals")

        .delete()

        .eq("id", goal.id)

        .eq("user_id", user.id);



      if (deleteError) {

        throw deleteError;

      }



      if (editingGoal?.id === goal.id) {

        resetForm();

      }



      setSuccess(

        "Savings goal deleted successfully."

      );



      await refreshGoals();



      // Refresh analytics because deleting a goal

      // also deletes its contributions.

      setAnalyticsRefreshKey((previous) => previous + 1);

    } catch (err) {

      setError(

        err instanceof Error

          ? err.message

          : "Unable to delete savings goal."

      );

    } finally {

      setDeletingId(null);

    }

  }



  // ==========================================================

  // SUMMARY CALCULATIONS

  // ==========================================================



  const totalTarget = goals.reduce(

    (sum, goal) =>

      sum + Number(goal.target_amount),

    0

  );



  const totalSaved = goals.reduce(

    (sum, goal) =>

      sum + Number(goal.current_amount),

    0

  );



  const activeGoals = goals.filter(

    (goal) =>

      Number(goal.current_amount) <

      Number(goal.target_amount)

  ).length;



  // ==========================================================

  // PAGE UI

  // ==========================================================



  return (

    <>
      <FinSightNavbar />
      <main className="min-h-screen bg-[#070d19] text-white">

      <div className="mx-auto max-w-7xl px-4 pb-16 pt-9 sm:px-6 lg:px-8">



        {/* ================================================= */}

        {/* HEADER */}

        {/* ================================================= */}



        <div className="relative mb-8 flex flex-wrap items-center justify-between gap-5 overflow-hidden rounded-3xl border border-emerald-400/10 bg-gradient-to-br from-[#142b32] via-[#101e30] to-[#0b1425] p-7 sm:p-9">

          <div>

            <p className="text-emerald-400 text-xs font-semibold uppercase tracking-[0.18em]">

              FINSIGHT FINANCIAL PLANNING

            </p>



            <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">

              Savings Goals

            </h1>



            <p className="mt-3 max-w-2xl text-slate-400">

              Create goals, track contributions, analyze savings,

              and receive personalized recommendations.

            </p>

          </div>



          <button

            type="button"

            onClick={() => router.push("/dashboard")}

            className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium transition hover:border-emerald-400/40 hover:bg-white/10"

          >

            Back to Dashboard

          </button>

        </div>



        {/* ================================================= */}

        {/* ERROR AND SUCCESS MESSAGES */}

        {/* ================================================= */}



        {error && (

          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">

            {error}

          </div>

        )}



        {success && (

          <div className="mb-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-300">

            {success}

          </div>

        )}



        {/* ================================================= */}

        {/* SUMMARY CARDS */}

        {/* ================================================= */}



        <div className="grid grid-cols-1 gap-4 mb-8 md:grid-cols-3">



          <div className="rounded-2xl border border-white/10 bg-[#111c2e] p-6 shadow-[0_14px_42px_rgba(0,0,0,0.14)]">

            <p className="text-slate-400 text-sm">

              Active Goals

            </p>



            <p className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">

              {activeGoals}

            </p>

          </div>



          <div className="rounded-2xl border border-white/10 bg-[#111c2e] p-6 shadow-[0_14px_42px_rgba(0,0,0,0.14)]">

            <p className="text-slate-400 text-sm">

              Total Savings Targets

            </p>



            <p className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">

              {formatCurrency(totalTarget)}

            </p>

          </div>



          <div className="rounded-2xl border border-white/10 bg-[#111c2e] p-6 shadow-[0_14px_42px_rgba(0,0,0,0.14)]">

            <p className="text-slate-400 text-sm">

              Total Amount Saved

            </p>



            <p className="text-3xl font-bold text-emerald-400 mt-2">

              {formatCurrency(totalSaved)}

            </p>

          </div>

        </div>



        {/* ================================================= */}

        {/* CREATE / EDIT SAVINGS GOAL */}

        {/* ================================================= */}



        <section className="rounded-2xl border border-white/10 bg-[#111c2e] p-6 mb-8 shadow-[0_14px_42px_rgba(0,0,0,0.14)] sm:p-7">



          <h2 className="text-xl font-semibold tracking-tight tracking-tight mb-5">

            {editingGoal

              ? "Edit Savings Goal"

              : "Create New Savings Goal"}

          </h2>



          <form

            onSubmit={handleSubmit}

            className="space-y-5"

          >



            {/* GOAL NAME */}



            <div>

              <label className="block text-sm text-slate-300 mb-2">

                Goal Name

              </label>



              <input

                type="text"

                value={goalName}

                onChange={(e) =>

                  setGoalName(e.target.value)

                }

                placeholder="e.g. Laptop, Emergency Fund, Vacation"

                required

                className="w-full rounded-xl border border-white/10 bg-[#0a1322] px-4 py-3 outline-none transition focus:border-emerald-400/70"

              />

            </div>



            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">



              {/* TARGET AMOUNT */}



              <div>

                <label className="block text-sm text-slate-300 mb-2">

                  Target Amount (₹)

                </label>



                <input

                  type="number"

                  min="0.01"

                  step="0.01"

                  value={targetAmount}

                  onChange={(e) =>

                    setTargetAmount(e.target.value)

                  }

                  required

                  className="w-full rounded-xl border border-white/10 bg-[#0a1322] px-4 py-3 outline-none transition focus:border-emerald-400/70"

                />

              </div>



              {/* CURRENT SAVINGS */}



              <div>

                <label className="block text-sm text-slate-300 mb-2">

                  {editingGoal

                    ? "Current Savings (₹)"

                    : "Starting Savings (₹)"}

                </label>



                <input

                  type="number"

                  min="0"

                  step="0.01"

                  value={currentAmount}

                  onChange={(e) =>

                    setCurrentAmount(e.target.value)

                  }

                  disabled={editingGoal !== null}

                  required

                  className="w-full w-full rounded-xl border border-white/10 bg-[#0a1322] px-4 py-3 outline-none transition focus:border-emerald-400/70 disabled:opacity-50 disabled:cursor-not-allowed"

                />



                {editingGoal && (

                  <p className="text-slate-500 text-xs mt-2">

                    Savings balances are updated through

                    contributions. To add or remove savings,

                    use the contribution section below.

                  </p>

                )}

              </div>



              {/* TARGET DATE */}



              <div>

                <label className="block text-sm text-slate-300 mb-2">

                  Target Date

                </label>



                <input

                  type="date"

                  min={editingGoal ? undefined : getToday()}

                  value={targetDate}

                  onChange={(e) =>

                    setTargetDate(e.target.value)

                  }

                  required

                  className="w-full rounded-xl border border-white/10 bg-[#0a1322] px-4 py-3 outline-none transition focus:border-emerald-400/70"

                />

              </div>

            </div>



                      {/* GOAL PRIORITY */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Goal Priority
            </label>
            <select
              value={goalPriority}
              onChange={(e) =>
                setGoalPriority(e.target.value as "high" | "medium" | "low")
              }
              className="w-full rounded-xl border border-white/10 bg-[#0a1322] px-4 py-3 text-white outline-none transition focus:border-emerald-400/70"
            >
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>
          </div>

{/* FORM ACTIONS */}



            <div className="flex flex-wrap gap-3">



              <button

                type="submit"

                disabled={saving}

                className="rounded-xl bg-emerald-500 px-6 py-3 font-semibold text-[#061510] transition hover:bg-emerald-400 disabled:opacity-50"

              >

                {saving

                  ? "Saving..."

                  : editingGoal

                  ? "Update Goal"

                  : "Create Goal"}

              </button>



              {editingGoal && (

                <button

                  type="button"

                  onClick={resetForm}

                  className="rounded-xl border border-white/10 bg-white/5 px-6 py-3 transition hover:bg-white/10"

                >

                  Cancel Edit

                </button>

              )}

            </div>

          </form>

        </section>



        {/* ================================================= */}

        {/* SAVINGS CONTRIBUTION ANALYTICS */}

        {/* ================================================= */}



        {userId && (

          <SavingsAnalytics

            userId={userId}

            refreshKey={analyticsRefreshKey}

          />

        )}



        {/* ================================================= */}

        {/* SAVINGS GOAL ACHIEVEMENT FORECAST */}

        {/* ================================================= */}



        {userId && !loading && (

        <SavingsForecast

            userId={userId}

            goals={goals}

            refreshKey={analyticsRefreshKey}

        />

        )}



        {/* ================================================= */}

        {/* SAVINGS Risk FORECAST */}

        {/* ================================================= */}



        {userId && !loading && (

          <SavingsRiskAnalysis

            userId={userId}

            goals={goals}

            refreshKey={analyticsRefreshKey}

          />

        )}



        {/* ================================================= */}

        {/* WHAT-IF SAVINGS SIMULATOR */}

        {/* ================================================= */}



        {!loading && (

        <SavingsSimulator goals={goals} />

        )}



        {/* ================================================= */}

        {/* Saving Allocation Optimizer */}

        {/* ================================================= */}



        {!loading && (

        <SavingsAllocationOptimizer goals={goals} />

        )}



        {/* ================================================= */}

        {/* Saving Allocation Comparison */}

        {/* ================================================= */}



        {!loading && (

        <SavingsAllocationComparison goals={goals} />

        )}



        {/* ================================================= */}

        {/* AI SAVINGS RECOMMENDATIONS */}

        {/* ================================================= */}



        <SavingsRecommendations

          data={recommendationData}

          loading={recommendationLoading}

          error={recommendationError}

        />



        {/* ================================================= */}

        {/* SAVINGS GOALS LIST */}

        {/* ================================================= */}



        <section>



          <h2 className="text-xl font-semibold tracking-tight tracking-tight mb-5">

            Your Savings Goals

          </h2>



          {loading ? (

            <p className="text-slate-400">

              Loading savings goals...

            </p>

          ) : goals.length === 0 ? (

            <div className="rounded-2xl border border-dashed border-white/15 bg-[#111c2e] p-10 text-center">

              <p className="text-slate-400">

                You have not created any savings goals yet.

              </p>



              <p className="text-slate-500 text-sm mt-2">

                Create your first goal using the form above.

              </p>

            </div>

          ) : (

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">



              {goals.map((goal) => {

                const target = Number(goal.target_amount);

                const saved = Number(goal.current_amount);



                const remaining = Math.max(

                  0,

                  target - saved

                );



                const progress = Math.min(

                  100,

                  (saved / target) * 100

                );



                const months = getMonthsRemaining(

                  goal.target_date

                );



                const monthlyTarget = remaining / months;



                const completed = saved >= target;



                const overdue =

                  !completed &&

                  goal.target_date < getToday();



                return (

                  <div

                    key={goal.id}

                    className="rounded-2xl border border-white/10 bg-[#111c2e] p-6 shadow-[0_14px_42px_rgba(0,0,0,0.14)]"

                  >



                    {/* GOAL HEADER */}



                    <div className="flex justify-between items-start gap-4 mb-5">



                      <div>

                        <h3 className="text-xl font-semibold tracking-tight">

                          {goal.goal_name}

                        </h3>



                        <p className="text-slate-400 text-sm mt-1">

                          Target: {formatCurrency(target)}

                        </p>

                      </div>



                      <span

                        className={`text-xs px-3 py-1 rounded-full ${

                          completed

                            ? "bg-emerald-500/10 text-emerald-400"

                            : overdue

                            ? "bg-red-500/10 text-red-400"

                            : "bg-sky-500/10 text-sky-400"

                        }`}

                      >

                        {completed

                          ? "Completed"

                          : overdue

                          ? "Overdue"

                          : "In Progress"}

                      </span>

                    </div>



                    {/*Priority Badge*/}



                    <p className="text-slate-400 text-sm mt-2">

                        Priority:{" "}

                        <span

                            className={

                            goal.priority === "high"

                                ? "text-red-400"

                                : goal.priority === "medium"

                                ? "text-yellow-400"

                                : "text-emerald-400"

                            }

                        >

                            {goal.priority.toUpperCase()}

                        </span>

                    </p>



                    {/* SAVINGS PROGRESS */}



                    <div className="flex justify-between text-sm mb-2">

                      <span className="text-slate-400">

                        Amount Saved

                      </span>



                      <span className="text-emerald-400 font-semibold">

                        {formatCurrency(saved)}

                      </span>

                    </div>



                    <div className="h-2.5 overflow-hidden rounded-full bg-white/10">

                      <div

                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-300 transition-all"

                        style={{

                          width: `${progress}%`,

                        }}

                      />

                    </div>



                    <p className="text-right text-slate-400 text-xs mt-2">

                      {progress.toFixed(1)}% completed

                    </p>



                    {/* SAVINGS DETAILS */}



                    <div className="grid grid-cols-2 gap-4 mt-5">



                      <div className="rounded-xl border border-white/5 bg-[#0a1322] p-4">

                        <p className="text-slate-400 text-xs">

                          Remaining

                        </p>



                        <p className="font-bold mt-1">

                          {formatCurrency(remaining)}

                        </p>

                      </div>



                      <div className="rounded-xl border border-white/5 bg-[#0a1322] p-4">

                        <p className="text-slate-400 text-xs">

                          Monthly Savings Needed

                        </p>



                        <p className="font-bold text-emerald-400 mt-1">

                          {completed

                            ? formatCurrency(0)

                            : overdue

                            ? "Deadline passed"

                            : formatCurrency(

                                Math.ceil(monthlyTarget)

                              )}

                        </p>

                      </div>

                    </div>



                    {/* TARGET DATE */}



                    <p className="text-slate-400 text-sm mt-4">

                      Target Date:{" "}

                      {new Date(

                        `${goal.target_date}T00:00:00`

                      ).toLocaleDateString("en-IN", {

                        day: "numeric",

                        month: "short",

                        year: "numeric",

                      })}

                    </p>



                    {/* GOAL ACTIONS */}



                    <div className="flex gap-3 mt-5">



                      <button

                        type="button"

                        onClick={() => handleEdit(goal)}

                        className="flex-1 rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm font-semibold transition hover:border-emerald-400/40 hover:bg-white/10"

                      >

                        Edit

                      </button>



                      <button

                        type="button"

                        onClick={() => handleDelete(goal)}

                        disabled={deletingId === goal.id}

                        className="flex-1 rounded-xl border border-red-400/20 bg-red-500/10 py-2.5 text-sm font-semibold text-red-400 transition hover:bg-red-500/20 disabled:opacity-50"

                      >

                        {deletingId === goal.id

                          ? "Deleting..."

                          : "Delete"}

                      </button>

                    </div>



                    {/* ================================================= */}

                    {/* SAVINGS CONTRIBUTION TRACKING */}

                    {/* ================================================= */}



                    {userId && (

                      <SavingsContributions

                        goalId={goal.id}

                        userId={userId}

                        onContributionChange={

                          handleContributionChange

                        }

                      />

                    )}

                  </div>

                );

              })}

            </div>

          )}

        </section>

      </div>

    </main>
    </>
  );
}
