
"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/supabase";

type SavingsContribution = {
  id: string;
  user_id: string;
  goal_id: string;
  amount: number;
  note: string | null;
  contribution_date: string;
  created_at: string;
};

type Props = {
  goalId: string;
  userId: string;
  onContributionChange: () => Promise<void>;
};

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

export default function SavingsContributions({
  goalId,
  userId,
  onContributionChange,
}: Props) {
  const [contributions, setContributions] = useState<
    SavingsContribution[]
  >([]);

  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [contributionDate, setContributionDate] =
    useState(getToday);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(
    null
  );

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ==========================================================
  // FETCH CONTRIBUTION HISTORY
  // ==========================================================

  const loadContributions = useCallback(async () => {
    setLoading(true);

    const { data, error: fetchError } = await supabase
      .from("savings_contributions")
      .select("*")
      .eq("goal_id", goalId)
      .eq("user_id", userId)
      .order("contribution_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setContributions(
        (data ?? []) as SavingsContribution[]
      );
    }

    setLoading(false);
  }, [goalId, userId]);

  useEffect(() => {
    void loadContributions();
  }, [loadContributions]);

  // ==========================================================
  // ADD CONTRIBUTION
  // ==========================================================

  async function handleAddContribution(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setError("");
    setSuccess("");

    const contributionAmount = Number(amount);

    if (
      amount.trim() === "" ||
      !Number.isFinite(contributionAmount) ||
      contributionAmount <= 0
    ) {
      setError("Enter a valid contribution amount.");
      return;
    }

    if (!contributionDate) {
      setError("Please select a contribution date.");
      return;
    }

    try {
      setSaving(true);

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user || user.id !== userId) {
        throw new Error("Please log in again.");
      }

      const { error: insertError } = await supabase
        .from("savings_contributions")
        .insert({
          user_id: userId,
          goal_id: goalId,
          amount: contributionAmount,
          note: note.trim() || null,
          contribution_date: contributionDate,
        });

      if (insertError) {
        throw insertError;
      }

      setAmount("");
      setNote("");
      setContributionDate(getToday());

      setSuccess("Contribution added successfully.");

      await loadContributions();
      await onContributionChange();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to add contribution."
      );
    } finally {
      setSaving(false);
    }
  }

  // ==========================================================
  // DELETE CONTRIBUTION
  // ==========================================================

  async function handleDeleteContribution(
    contribution: SavingsContribution
  ) {
    const confirmed = window.confirm(
      `Delete contribution of ${formatCurrency(
        Number(contribution.amount)
      )}?`
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      setDeletingId(contribution.id);

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user || user.id !== userId) {
        throw new Error("Please log in again.");
      }

      const { error: deleteError } = await supabase
        .from("savings_contributions")
        .delete()
        .eq("id", contribution.id)
        .eq("goal_id", goalId)
        .eq("user_id", userId);

      if (deleteError) {
        throw deleteError;
      }

      setSuccess("Contribution deleted successfully.");

      await loadContributions();
      await onContributionChange();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete contribution."
      );
    } finally {
      setDeletingId(null);
    }
  }

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <div className="mt-6 border-t border-gray-800 pt-5">
      <h4 className="text-lg font-semibold mb-4">
        Savings Contributions
      </h4>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-300 p-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-500/10 border border-green-500/30 text-green-300 p-3 rounded-lg mb-4 text-sm">
          {success}
        </div>
      )}

      {/* ADD CONTRIBUTION FORM */}

      <form
        onSubmit={handleAddContribution}
        className="space-y-3 mb-6"
      >
        <div>
          <label className="block text-sm text-gray-400 mb-2">
            Contribution Amount (₹)
          </label>

          <input
            type="number"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
            required
            className="w-full bg-gray-950 border border-gray-700 rounded-lg p-3 outline-none focus:border-green-500"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-2">
            Note (Optional)
          </label>

          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Monthly savings"
            className="w-full bg-gray-950 border border-gray-700 rounded-lg p-3 outline-none focus:border-green-500"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-2">
            Contribution Date
          </label>

          <input
            type="date"
            value={contributionDate}
            max={getToday()}
            onChange={(e) =>
              setContributionDate(e.target.value)
            }
            required
            className="w-full bg-gray-950 border border-gray-700 rounded-lg p-3 outline-none focus:border-green-500"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 rounded-lg py-3 font-semibold transition"
        >
          {saving ? "Adding..." : "Add Contribution"}
        </button>
      </form>

      {/* CONTRIBUTION HISTORY */}

      <h5 className="font-semibold mb-3">
        Contribution History
      </h5>

      {loading ? (
        <p className="text-gray-400 text-sm">
          Loading contributions...
        </p>
      ) : contributions.length === 0 ? (
        <p className="text-gray-500 text-sm">
          No contributions recorded yet.
        </p>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {contributions.map((contribution) => (
            <div
              key={contribution.id}
              className="flex items-center justify-between gap-3 bg-gray-950 rounded-lg p-3"
            >
              <div className="min-w-0">
                <p className="text-sm text-gray-200 break-words">
                  {contribution.note || "Savings deposit"}
                </p>

                <p className="text-xs text-gray-500 mt-1">
                  {new Date(
                    `${contribution.contribution_date}T00:00:00`
                  ).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="text-green-400 text-sm font-semibold">
                  +{formatCurrency(
                    Number(contribution.amount)
                  )}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    handleDeleteContribution(contribution)
                  }
                  disabled={deletingId === contribution.id}
                  className="text-red-400 hover:text-red-300 disabled:opacity-50 text-xs"
                >
                  {deletingId === contribution.id
                    ? "Deleting..."
                    : "Delete"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
