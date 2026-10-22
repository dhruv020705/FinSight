
"use client";

// ============================================================
// TYPES
// ============================================================

type SpendingAnomaly = {
  id: number | string | null;
  amount: number;
  category: string;
  description: string | null;
  transaction_date: string;
  severity: "high" | "medium" | "low";
  anomaly_score: number;
  times_typical_spending: number;
  category_median?: number;
  insight: string;
  detection_method?: "Hybrid" | "Isolation Forest" | "Statistical Rule";
};

type AnomalyDetectionResponse = {
  status: string;
  message?: string;
  model?: string;
  transactions_analyzed: number;
  anomalies_detected: number;
  typical_transaction_amount?: number;
  category_typical_amounts?: Record<string, number>;
  categories_analyzed?: string[];
  categories_skipped?: string[];
  anomalies: SpendingAnomaly[];
};

type Props = {
  data: AnomalyDetectionResponse | null;
  loading: boolean;
  error: string;
};

// ============================================================
// FORMAT CURRENCY
// ============================================================

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);

// ============================================================
// FORMAT DATE
// ============================================================

const formatDate = (date: string) => {
  if (!date) return "Date unavailable";

  const parsedDate = new Date(
    date.includes("T") ? date : `${date}T00:00:00`
  );

  if (Number.isNaN(parsedDate.getTime())) {
    return "Date unavailable";
  }

  return parsedDate.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

// ============================================================
// SEVERITY STYLES
// ============================================================

const severityStyles = {
  high: "bg-red-500/10 text-red-400 border-red-500/30",
  medium: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
  low: "bg-blue-500/10 text-blue-400 border-blue-500/30",
};

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function SpendingAnomalyAlerts({
  data,
  loading,
  error,
}: Props) {
  const categoryTypicalAmounts = Object.entries(
    data?.category_typical_amounts ?? {}
  );

  return (
    <section className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-10 text-white">

      {/* ==================================================
          SECTION HEADER
      ================================================== */}

      <div className="mb-6">
        <p className="text-orange-400 text-sm font-medium uppercase tracking-wider">
          Smart Spending Monitoring
        </p>

        <h2 className="text-2xl font-semibold mt-1">
          ⚠️ Unusual Spending Alerts
        </h2>

        <p className="text-gray-400 text-sm mt-2">
          Identify unusual expenses and compare transactions
          with your personal spending patterns.
        </p>
      </div>

      {/* ==================================================
          LOADING
      ================================================== */}

      {loading && (
        <div className="text-center py-10 text-gray-400">
          Analyzing your spending patterns...
        </div>
      )}

      {/* ==================================================
          ERROR
      ================================================== */}

      {!loading && error && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-5">
          <p className="text-yellow-400 font-medium">
            Analysis unavailable
          </p>

          <p className="text-gray-300 text-sm mt-2">
            {error}
          </p>
        </div>
      )}

      {/* ==================================================
          NO DATA
      ================================================== */}

      {!loading && !error && !data && (
        <p className="text-gray-400">
          No spending analysis is available yet.
        </p>
      )}

      {/* ==================================================
          ANALYSIS RESULTS
      ================================================== */}

      {!loading && !error && data && (
        <div>

          {/* ================================================
              SUMMARY CARDS
          ================================================ */}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">

            {/* TRANSACTIONS ANALYZED */}

            <div className="bg-gray-950 border border-gray-800 rounded-xl p-5">
              <p className="text-gray-400 text-sm">
                Transactions Analyzed
              </p>

              <p className="text-2xl font-bold mt-2">
                {data.transactions_analyzed}
              </p>
            </div>

            {/* UNUSUAL EXPENSES */}

            <div className="bg-gray-950 border border-gray-800 rounded-xl p-5">
              <p className="text-gray-400 text-sm">
                Unusual Expenses
              </p>

              <p className="text-2xl font-bold text-orange-400 mt-2">
                {data.anomalies_detected}
              </p>
            </div>

            {/* OVERALL TYPICAL TRANSACTION */}

            <div className="bg-gray-950 border border-gray-800 rounded-xl p-5">
              <p className="text-gray-400 text-sm">
                Overall Typical Transaction
              </p>

              <p className="text-2xl font-bold mt-2">
                {data.typical_transaction_amount !== undefined
                  ? formatCurrency(
                      data.typical_transaction_amount
                    )
                  : "N/A"}
              </p>

              <p className="text-xs text-gray-500 mt-2">
                Median across all valid expenses
              </p>
            </div>

          </div>

          {/* ================================================
              CATEGORY-WISE TYPICAL TRANSACTIONS
          ================================================ */}

          {categoryTypicalAmounts.length > 0 && (
            <div className="mb-8">

              <h3 className="text-lg font-semibold mb-2">
                Category-wise Typical Transactions
              </h3>

              <p className="text-gray-400 text-sm mb-4">
                The median transaction amount for each
                analyzed spending category.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

                {categoryTypicalAmounts.map(
                  ([category, typicalAmount]) => (
                    <div
                      key={category}
                      className="bg-gray-950 border border-gray-800 rounded-xl p-5"
                    >
                      <p className="text-gray-400 text-sm">
                        {category}
                      </p>

                      <p className="text-xl font-bold text-blue-400 mt-2">
                        {formatCurrency(typicalAmount)}
                      </p>

                      <p className="text-xs text-gray-500 mt-2">
                        Typical {category} expense
                      </p>
                    </div>
                  )
                )}

              </div>
            </div>
          )}

          {/* ================================================
              CATEGORIES WITH INSUFFICIENT HISTORY
          ================================================ */}

          {(data.categories_skipped?.length ?? 0) > 0 && (
            <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4 mb-6">

              <p className="text-yellow-400 text-sm font-medium">
                Categories with insufficient history
              </p>

              <p className="text-gray-400 text-sm mt-2">
                The following categories have fewer than
                eight valid expense transactions and were
                skipped by the anomaly detection model:
              </p>

              <p className="text-gray-300 text-sm mt-2">
                {data.categories_skipped?.join(", ")}
              </p>

            </div>
          )}

          {/* ================================================
              NO ANOMALIES
          ================================================ */}

          {data.anomalies.length === 0 ? (
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-5">

              <p className="text-green-400 font-medium">
                ✓ No unusually high spending detected
              </p>

              <p className="text-gray-300 text-sm mt-2">
                No transactions were flagged in the
                categories analyzed by the current model.
              </p>

            </div>
          ) : (

            /* ==============================================
                ANOMALY ALERT CARDS
            ============================================== */

            <div className="space-y-4">

              <h3 className="text-lg font-semibold mb-4">
                Flagged Transactions
              </h3>

              {data.anomalies.map((anomaly, index) => (

                <div
                  key={`${anomaly.id ?? "unknown"}-${index}`}
                  className="bg-gray-950 border border-gray-800 rounded-xl p-5"
                >

                  {/* TRANSACTION INFORMATION */}

                  <div className="flex flex-wrap items-start justify-between gap-4">

                    <div>
                      <h3 className="font-semibold text-lg">
                        {anomaly.category}
                      </h3>

                      <p className="text-gray-400 text-sm mt-1">
                        {anomaly.description ||
                          "No description"}
                      </p>

                      <p className="text-gray-500 text-xs mt-2">
                        {formatDate(
                          anomaly.transaction_date
                        )}
                      </p>
                    </div>

                    <div className="text-right">

                      <p className="text-xl font-bold text-orange-400">
                        {formatCurrency(anomaly.amount)}
                      </p>

                      <span
                        className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium border ${
                          severityStyles[anomaly.severity]
                        }`}
                      >
                        {anomaly.severity.toUpperCase()} PRIORITY
                      </span>

                    </div>
                  </div>

                  {/* DETECTION METHOD */}

                        {anomaly.detection_method && (
                        <div className="mt-4 flex flex-wrap items-center gap-3">
                            <span className="text-gray-400 text-sm">
                            Detection Method:
                            </span>

                            <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                                anomaly.detection_method === "Hybrid"
                                ? "bg-purple-500/10 text-purple-400 border-purple-500/30"
                                : anomaly.detection_method === "Isolation Forest"
                                ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
                                : "bg-green-500/10 text-green-400 border-green-500/30"
                            }`}
                            >
                            {anomaly.detection_method}
                            </span>
                        </div>
                        )}

                  {/* CATEGORY COMPARISON */}

                  <div className="mt-4 bg-orange-500/5 border border-orange-500/10 rounded-lg p-4">

                    <p className="text-gray-300 text-sm">
                      {anomaly.insight}
                    </p>

                    <div className="mt-4 space-y-2">

                      {anomaly.category_median !== undefined && (
                        <div className="flex flex-wrap justify-between gap-2">

                          <p className="text-gray-400 text-sm">
                            Typical {anomaly.category} Transaction
                          </p>

                          <p className="text-white font-semibold text-sm">
                            {formatCurrency(
                              anomaly.category_median
                            )}
                          </p>

                        </div>
                      )}

                      <div className="flex flex-wrap justify-between gap-2">

                        <p className="text-gray-400 text-sm">
                          Current Transaction
                        </p>

                        <p className="text-white font-semibold text-sm">
                          {formatCurrency(anomaly.amount)}
                        </p>

                      </div>

                      <div className="border-t border-gray-800 pt-3">

                        <p className="text-orange-300 text-sm">
                          This transaction is{" "}
                          <span className="font-bold">
                            {anomaly.times_typical_spending.toFixed(1)}×
                          </span>{" "}
                          the typical {anomaly.category} expense.
                        </p>

                      </div>

                    </div>
                  </div>

                </div>
              ))}

            </div>
          )}

          {/* ================================================
              MODEL INFORMATION
          ================================================ */}

          <div className="mt-6 pt-4 border-t border-gray-800">

           <p className="text-gray-500 text-xs">
                Detection System:{" "}
                {data.model ?? "Hybrid Category-Aware Anomaly Detection"}
           </p>

            <p className="text-gray-500 text-xs mt-2">
              Anomaly detection identifies unusual spending
              patterns, not confirmed fraud. Review flagged
              transactions before taking action.
            </p>

          </div>

        </div>
      )}

    </section>
  );
}
