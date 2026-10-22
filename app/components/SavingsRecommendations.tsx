
"use client";

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

type Props = {
  data: SavingsRecommendationResponse | null;
  loading: boolean;
  error: string;
};

function currency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function SavingsRecommendations({
  data,
  loading,
  error,
}: Props) {
  return (
    <section className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8">
      <div className="mb-6">
        <p className="text-green-400 text-sm font-medium">
          PERSONALIZED FINANCIAL PLANNING
        </p>

        <h2 className="text-2xl font-bold mt-2">
          AI Savings Recommendations
        </h2>

        <p className="text-gray-400 text-sm mt-2">
          Recommendations based on your recent income,
          expenses, and savings goals.
        </p>
      </div>

      {loading && (
        <div className="text-gray-400 py-6">
          Analyzing your financial activity...
        </div>
      )}

      {!loading && error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-300">
          {error}
        </div>
      )}

      {!loading && !error && !data && (
        <p className="text-gray-400">
          No recommendation data available yet.
        </p>
      )}

      {!loading && !error && data && (
        <>
          {/* FINANCIAL SUMMARY */}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <SummaryCard
              label="Average Monthly Income"
              value={currency(data.average_monthly_income)}
              color="text-green-400"
            />

            <SummaryCard
              label="Average Monthly Expenses"
              value={currency(data.average_monthly_expenses)}
              color="text-red-400"
            />

            <SummaryCard
              label="Estimated Monthly Surplus"
              value={currency(data.estimated_monthly_surplus)}
              color="text-blue-400"
            />

            <SummaryCard
              label="Required Monthly Savings"
              value={currency(
                data.total_required_monthly_savings
              )}
              color="text-purple-400"
            />
          </div>

          {/* COMBINED GOAL FEASIBILITY */}

          {data.recommendations.some(
            (goal) => goal.status === "pending"
          ) && (
            <div
              className={`rounded-xl border p-5 mb-6 ${
                data.combined_goals_achievable
                  ? "bg-green-500/10 border-green-500/30"
                  : "bg-orange-500/10 border-orange-500/30"
              }`}
            >
              <h3
                className={`font-semibold text-lg ${
                  data.combined_goals_achievable
                    ? "text-green-400"
                    : "text-orange-400"
                }`}
              >
                {data.combined_goals_achievable
                  ? "Your Savings Goals Appear Achievable"
                  : "Your Savings Goals May Need Adjustment"}
              </h3>

              <p className="text-gray-300 text-sm mt-2">
                {data.combined_goals_achievable
                  ? "Your estimated monthly surplus is sufficient to cover the combined monthly savings targets."
                  : "Your combined monthly savings targets exceed your estimated available surplus. Consider extending deadlines or reducing expenses."}
              </p>
            </div>
          )}

          {/* INDIVIDUAL GOAL RECOMMENDATIONS */}

          {data.recommendations.length === 0 ? (
            <p className="text-gray-400">
              Create a savings goal to receive personalized
              recommendations.
            </p>
          ) : (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">
                Recommendations for Your Goals
              </h3>

              {data.recommendations.map((goal) => (
                <div
                  key={goal.goal_id}
                  className="bg-gray-950 border border-gray-800 rounded-xl p-5"
                >
                  <div className="flex flex-wrap justify-between items-start gap-3">
                    <div>
                      <h4 className="font-semibold text-lg">
                        {goal.goal_name}
                      </h4>

                      <p className="text-gray-400 text-sm mt-1">
                        Remaining: {currency(goal.remaining_amount)}
                      </p>
                    </div>

                    <span
                      className={`text-xs font-medium rounded-full px-3 py-1 ${
                        goal.status === "completed"
                          ? "bg-green-500/10 text-green-400"
                          : goal.status === "overdue"
                          ? "bg-red-500/10 text-red-400"
                          : "bg-blue-500/10 text-blue-400"
                      }`}
                    >
                      {goal.status === "completed"
                        ? "Completed"
                        : goal.status === "overdue"
                        ? "Overdue"
                        : "In Progress"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5">
                    <div className="bg-gray-900 rounded-lg p-4">
                      <p className="text-gray-400 text-xs">
                        Monthly Savings Needed
                      </p>

                      <p className="text-green-400 text-xl font-bold mt-1">
                        {currency(goal.required_monthly_savings)}
                      </p>
                    </div>

                    <div className="bg-gray-900 rounded-lg p-4">
                      <p className="text-gray-400 text-xs">
                        Months Remaining
                      </p>

                      <p className="text-xl font-bold mt-1">
                        {goal.months_remaining}
                      </p>
                    </div>
                  </div>

                  <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-4 mt-4">
                    <p className="text-green-400 text-sm font-semibold mb-2">
                      Savings Insight
                    </p>

                    <p className="text-gray-300 text-sm leading-relaxed">
                      {goal.insight}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <p className="text-gray-500 text-xs mt-6">
            {data.disclaimer}
          </p>
        </>
      )}
    </section>
  );
}

function SummaryCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="bg-gray-950 border border-gray-800 rounded-xl p-4">
      <p className="text-gray-400 text-xs">
        {label}
      </p>

      <p className={`text-xl font-bold mt-2 ${color}`}>
        {value}
      </p>
    </div>
  );
}
