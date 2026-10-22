
"use client";

import { useState } from "react";
import { supabase } from "@/supabase";

type Props = {
  month: number;
  year: number;
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

const money = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);

function getDateRange(month: number, year: number) {
  const start = `${year}-${String(month).padStart(2, "0")}-01`;

  const next = new Date(Date.UTC(year, month, 1));
  const end = `${next.getUTCFullYear()}-${String(
    next.getUTCMonth() + 1
  ).padStart(2, "0")}-01`;

  return { start, end };
}

async function fetchAllTransactions(
  month: number,
  year: number
): Promise<Transaction[]> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Please log in to export your reports.");
  }

  const { start, end } = getDateRange(month, year);

  const pageSize = 500;
  const transactions: Transaction[] = [];

  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await supabase
      .from("transactions")
      .select("id, category, amount, type, transaction_date")
      .eq("user_id", user.id)
      .gte("transaction_date", start)
      .lt("transaction_date", end)
      .order("transaction_date", { ascending: true })
      .order("id", { ascending: true })
      .range(offset, offset + pageSize - 1);

    if (error) {
      throw new Error(error.message);
    }

    const rows = (data ?? []) as Transaction[];
    transactions.push(...rows);

    if (rows.length < pageSize) break;
  }

  return transactions;
}

function summarize(transactions: Transaction[]) {
  let income = 0;
  let expenses = 0;

  const categoryMap = new Map<string, number>();

  for (const transaction of transactions) {
    const amount = Number(transaction.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      continue;
    }

    if (transaction.type === "income") {
      income += amount;
    } else if (transaction.type === "expense") {
      expenses += amount;

      const category =
        transaction.category?.trim() || "Uncategorized";

      categoryMap.set(
        category,
        (categoryMap.get(category) ?? 0) + amount
      );
    }
  }

  const netCashFlow = income - expenses;
  const savingsRate =
    income > 0 ? (netCashFlow / income) * 100 : null;

  const categories = Array.from(categoryMap.entries())
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);

  return {
    income,
    expenses,
    netCashFlow,
    savingsRate,
    categories,
  };
}

function downloadBlob(
  content: BlobPart,
  mimeType: string,
  filename: string
) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function csvCell(value: string | number) {
  const text = String(value);

  // Prevent spreadsheet software from evaluating
  // user-provided category text as a formula.
  const safe = /^[\s]*[=+\-@\t\r]/.test(text)
    ? `'${text}`
    : text;

  return `"${safe.replace(/"/g, '""')}"`;
}

export default function FinancialReportExport({
  month,
  year,
}: Props) {
  const [exporting, setExporting] = useState<
    "csv" | "pdf" | null
  >(null);

  const [error, setError] = useState("");

  const filenameBase = `FinSight_Report_${year}_${String(
    month
  ).padStart(2, "0")}`;

  async function handleCSV() {
    setExporting("csv");
    setError("");

    try {
      const transactions = await fetchAllTransactions(
        month,
        year
      );

      const headers = [
        "Date",
        "Type",
        "Category",
        "Amount (INR)",
      ];

      const rows = transactions.map((transaction) => [
        transaction.transaction_date.slice(0, 10),
        transaction.type,
        transaction.category || "Uncategorized",
        Number(transaction.amount).toFixed(2),
      ]);

      const csv = [headers, ...rows]
        .map((row) => row.map(csvCell).join(","))
        .join("\r\n");

      downloadBlob(
        "\uFEFF" + csv,
        "text/csv;charset=utf-8;",
        `${filenameBase}.csv`
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "CSV export failed."
      );
    } finally {
      setExporting(null);
    }
  }

  async function handlePDF() {
    setExporting("pdf");
    setError("");

    try {
      const transactions = await fetchAllTransactions(
        month,
        year
      );

      const summary = summarize(transactions);

      const [{ jsPDF }, autoTableModule] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable"),
      ]);

      const autoTable = autoTableModule.default;

      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = doc.internal.pageSize.getWidth();

      // Standard PDF fonts do not reliably support
      // the rupee symbol, so amounts use "INR".
      const pdfMoney = (value: number) =>
        `INR ${value.toLocaleString("en-IN", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`;

      doc.setFillColor(17, 24, 39);
      doc.rect(0, 0, pageWidth, 42, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.text("FinSight", 14, 19);

      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.text("Personal Financial Statement", 14, 28);
      doc.text(`${MONTHS[month - 1]} ${year}`, 14, 35);

      doc.setTextColor(30, 41, 59);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Financial Summary", 14, 54);

      autoTable(doc, {
        startY: 60,
        head: [["Metric", "Amount"]],
        body: [
          ["Total Income", pdfMoney(summary.income)],
          ["Total Expenses", pdfMoney(summary.expenses)],
          ["Net Cash Flow", pdfMoney(summary.netCashFlow)],
          [
            "Cash-Flow Savings Rate",
            summary.savingsRate === null
              ? "N/A"
              : `${summary.savingsRate.toFixed(1)}%`,
          ],
        ],
        theme: "grid",
        headStyles: { fillColor: [30, 41, 59] },
        styles: { fontSize: 10, cellPadding: 3 },
      });

      let y = (doc as any).lastAutoTable.finalY + 12;

      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Expense Breakdown", 14, y);

      autoTable(doc, {
        startY: y + 6,
        head: [["Category", "Amount"]],
        body: summary.categories.map((item) => [
          item.category,
          pdfMoney(item.amount),
        ]),
        theme: "striped",
        headStyles: { fillColor: [16, 185, 129] },
        styles: { fontSize: 9, cellPadding: 3 },
      });

      y = (doc as any).lastAutoTable.finalY + 12;

      if (y > 265) {
        doc.addPage();
        y = 20;
      }

      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Transaction Details", 14, y);

      autoTable(doc, {
        startY: y + 6,
        head: [["Date", "Type", "Category", "Amount"]],
        body: transactions.map((transaction) => [
          transaction.transaction_date.slice(0, 10),
          transaction.type,
          transaction.category || "Uncategorized",
          pdfMoney(Number(transaction.amount)),
        ]),
        theme: "striped",
        headStyles: { fillColor: [30, 41, 59] },
        styles: { fontSize: 8, cellPadding: 2.5 },
        columnStyles: {
          3: { halign: "right" },
        },
        margin: { left: 14, right: 14, bottom: 18 },
      });

      const pageCount = doc.getNumberOfPages();

      for (let page = 1; page <= pageCount; page++) {
        doc.setPage(page);
        doc.setFontSize(8);
        doc.setTextColor(110, 110, 110);

        doc.text(
          `FinSight | ${MONTHS[month - 1]} ${year}`,
          14,
          287
        );

        doc.text(
          `Page ${page} of ${pageCount}`,
          pageWidth - 14,
          287,
          { align: "right" }
        );
      }

      doc.save(`${filenameBase}.pdf`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "PDF export failed."
      );
    } finally {
      setExporting(null);
    }
  }

  return (
    <section className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8">
      <h2 className="text-xl font-semibold text-white">
        Download Financial Reports
      </h2>

      <p className="text-gray-400 text-sm mt-2 mb-5">
        Export your transactions and financial summary for{" "}
        {MONTHS[month - 1]} {year}.
      </p>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleCSV}
          disabled={exporting !== null}
          className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-medium px-5 py-3 rounded-lg"
        >
          {exporting === "csv"
            ? "Preparing CSV..."
            : "Download CSV"}
        </button>

        <button
          type="button"
          onClick={handlePDF}
          disabled={exporting !== null}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium px-5 py-3 rounded-lg"
        >
          {exporting === "pdf"
            ? "Preparing PDF..."
            : "Download PDF"}
        </button>
      </div>

      {error && (
        <p role="alert" className="text-red-400 text-sm mt-4">
          {error}
        </p>
      )}

      <p className="text-gray-500 text-xs mt-4">
        Exports include all recorded transactions for the
        selected month. The PDF savings rate is based on
        income minus expenses, not savings-goal contributions.
      </p>
    </section>
  );
}
