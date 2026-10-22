
"use client";

import { useState } from "react";

type SavingsGoal = {
  id: string;
  goal_name: string;
  target_amount: number;
  current_amount: number;
  target_date: string;
};

type Props = {
  goals: SavingsGoal[];
};

function currency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function addMonths(start: Date, months: number) {
  const year = start.getFullYear();
  const month = start.getMonth() + months;

  const firstDay = new Date(year, month, 1);

  const lastDay = new Date(
    firstDay.getFullYear(),
    firstDay.getMonth() + 1,
    0
  ).getDate();

  return new Date(
    firstDay.getFullYear(),
    firstDay.getMonth(),
    Math.min(start.getDate(), lastDay)
  );
}

function formatDate(date: Date) {
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function monthsUntilDeadline(deadline: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(`${deadline}T00:00:00`);

  const days = Math.ceil(
    (target.getTime() - today.getTime()) /
      (1000 * 60 * 60 * 24)
  );

  return days > 0
    ? Math.max(1, Math.ceil(days / 30.44))
    : 0;
}

export default function SavingsSimulator({ goals }: Props) {
  const [selectedGoalId, setSelectedGoalId] = useState("");
  const [monthlySavings, setMonthlySavings] = useState(2000);

  const selectedGoal =
    goals.find((goal) => goal.id === selectedGoalId) ??
    goals[0];

  if (goals.length === 0) {
    return (
      <section className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8">
        <h2 className="text-xl font-bold">
          What-If Savings Simulator
        </h2>

        <p className="text-gray-400 mt-3">
          Create a savings goal to start simulating.
        </p>
      </section>
    );
  }

  const target = Number(selectedGoal.target_amount);
  const saved = Number(selectedGoal.current_amount);

  const remaining = Math.max(0, target - saved);

  const monthsNeeded =
    remaining === 0
      ? 0
      : Math.ceil(remaining / monthlySavings);

  const projectedDate = addMonths(
    new Date(),
    monthsNeeded
  );

  const deadlineMonths = monthsUntilDeadline(
    selectedGoal.target_date
  );

  const requiredMonthly =
    remaining === 0
      ? 0
      : deadlineMonths > 0
      ? remaining / deadlineMonths
      : null;

  const deadline = new Date(
    `${selectedGoal.target_date}T00:00:00`
  );

  const onTrack =
    remaining === 0 ||
    projectedDate.getTime() <= deadline.getTime();

  return (
    <section className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8">
      <p className="text-green-400 text-sm font-medium">
        INTERACTIVE FINANCIAL PLANNING
      </p>

      <h2 className="text-2xl font-bold mt-2">
        What-If Savings Simulator
      </h2>

      <p className="text-gray-400 text-sm mt-2 mb-6">
        Experiment with monthly savings amounts to see
        how quickly you could achieve your goals.
      </p>

      {/* GOAL SELECTION */}

      <label className="block text-sm text-gray-300 mb-2">
        Select Savings Goal
      </label>

      <select
        value={selectedGoal.id}
        onChange={(e) => {
          setSelectedGoalId(e.target.value);
          setMonthlySavings(2000);
        }}
        className="w-full bg-gray-950 border border-gray-700 rounded-lg p-3 mb-6"
      >
        {goals.map((goal) => (
          <option key={goal.id} value={goal.id}>
            {goal.goal_name}
          </option>
        ))}
      </select>

      {/* SUMMARY */}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Metric
          label="Target Amount"
          value={currency(target)}
        />

        <Metric
          label="Already Saved"
          value={currency(saved)}
        />

        <Metric
          label="Remaining Amount"
          value={currency(remaining)}
        />
      </div>

      {/* MONTHLY SAVINGS CONTROL */}

      <div className="bg-gray-950 border border-gray-800 rounded-xl p-5 mb-6">
        <div className="flex justify-between items-center gap-3 mb-4">
          <label
            htmlFor="monthly-savings-slider"
            className="text-gray-300 font-medium"
          >
            Planned Monthly Savings
          </label>

          <span className="text-green-400 text-xl font-bold">
            {currency(monthlySavings)}
          </span>
        </div>

        <input
          id="monthly-savings-slider"
          type="range"
          min="500"
          max="50000"
          step="500"
          value={monthlySavings}
          onChange={(e) =>
            setMonthlySavings(Number(e.target.value))
          }
          className="w-full accent-green-500"
        />

        <div className="flex justify-between text-gray-500 text-xs mt-2">
          <span>₹500</span>
          <span>₹50,000</span>
        </div>

        <div className="flex items-center gap-3 mt-5">
          <label
            htmlFor="monthly-savings-input"
            className="text-gray-400 text-sm"
          >
            Or enter amount:
          </label>

          <input
            id="monthly-savings-input"
            type="number"
            min="1"
            step="100"
            value={monthlySavings}
            onChange={(e) => {
              const value = Number(e.target.value);

              if (Number.isFinite(value) && value > 0) {
                setMonthlySavings(value);
              }
            }}
            className="w-36 bg-gray-900 border border-gray-700 rounded-lg p-2"
          />
        </div>
      </div>

      {/* SIMULATION RESULTS */}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <Metric
          label="Estimated Time to Goal"
          value={`${monthsNeeded} ${
            monthsNeeded === 1 ? "month" : "months"
          }`}
        />

        <Metric
          label="Projected Completion"
          value={
            remaining === 0
              ? "Already achieved"
              : formatDate(projectedDate)
          }
        />

        <Metric
          label="Required Monthly Savings"
          value={
            requiredMonthly === null
              ? "Deadline passed"
              : currency(requiredMonthly)
          }
        />

        <Metric
          label="Target Deadline"
          value={formatDate(deadline)}
        />
      </div>

      {/* SIMULATION INSIGHT */}

      <div
        className={`rounded-xl border p-5 ${
          remaining === 0 || onTrack
            ? "bg-green-500/10 border-green-500/30"
            : "bg-orange-500/10 border-orange-500/30"
        }`}
      >
        <h3
          className={`font-semibold mb-2 ${
            remaining === 0 || onTrack
              ? "text-green-400"
              : "text-orange-400"
          }`}
        >
          {remaining === 0
            ? "Goal Achieved"
            : onTrack
            ? "Your Plan Appears On Track"
            : "Your Plan May Miss the Deadline"}
        </h3>

        <p className="text-gray-300 text-sm leading-relaxed">
          {remaining === 0
            ? "You have already saved enough to complete this goal."
            : onTrack
            ? `Saving ${currency(
                monthlySavings
              )} per month could help you reach this goal by ${formatDate(
                projectedDate
              )}.`
            : `At ${currency(
                monthlySavings
              )} per month, your estimated completion date is ${formatDate(
                projectedDate
              )}, which is later than your target deadline.`}
        </p>
      </div>

      <p className="text-gray-500 text-xs mt-5">
        This is a hypothetical scenario, not a prediction
        of actual deposits. It assumes you consistently
        contribute the selected amount every month.
      </p>
    </section>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="bg-gray-950 border border-gray-800 rounded-lg p-4">
      <p className="text-gray-400 text-xs">
        {label}
      </p>

      <p className="text-white font-semibold text-lg mt-2">
        {value}
      </p>
    </div>
  );
}
