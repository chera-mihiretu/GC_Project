"use client";

import { useState, useEffect, useCallback } from "react";
import { FiDownload, FiFileText, FiTrendingUp, FiTrendingDown } from "react-icons/fi";
import {
  getBudgetReport,
  downloadBudgetCSV,
  type BudgetReportData,
} from "@/services/budget.service";

interface BudgetReportProps {
  currency: string;
}

export default function BudgetReport({ currency }: BudgetReportProps) {
  const [report, setReport] = useState<BudgetReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const fmt = useCallback(
    (n: number) =>
      new Intl.NumberFormat("en-US", { style: "decimal", maximumFractionDigits: 0 }).format(n) +
      ` ${currency}`,
    [currency],
  );

  useEffect(() => {
    getBudgetReport()
      .then(setReport)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleCSV = async () => {
    setExporting(true);
    try {
      await downloadBudgetCSV();
    } catch {
      // silent
    } finally {
      setExporting(false);
    }
  };

  const handlePDF = async () => {
    if (!report) return;
    setExporting(true);
    try {
      const { default: jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");

      const doc = new jsPDF();

      doc.setFontSize(18);
      doc.text(report.budget.name, 14, 22);
      doc.setFontSize(10);
      doc.text(`Generated: ${new Date(report.generatedAt).toLocaleDateString()}`, 14, 30);

      doc.setFontSize(12);
      doc.text("Budget Overview", 14, 42);

      autoTable(doc, {
        startY: 46,
        head: [["Metric", "Value"]],
        body: [
          ["Total Budget", fmt(report.budget.totalAmount)],
          ["Total Spent", fmt(report.budget.totalSpent)],
          ["Remaining", fmt(report.budget.remaining)],
          ["Usage", `${report.budget.percentUsed}%`],
        ],
        theme: "grid",
        headStyles: { fillColor: [219, 39, 119] },
      });

      const catY = (doc as unknown as Record<string, unknown> & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 80;

      doc.setFontSize(12);
      doc.text("Categories", 14, catY + 10);

      autoTable(doc, {
        startY: catY + 14,
        head: [["Category", "Allocated", "Spent", "Remaining", "% Used"]],
        body: report.categories.map((c) => [
          c.name,
          fmt(c.allocated),
          fmt(c.spent),
          fmt(c.remaining),
          `${c.percentUsed}%`,
        ]),
        theme: "grid",
        headStyles: { fillColor: [219, 39, 119] },
      });

      const expY = (doc as unknown as Record<string, unknown> & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 140;

      if (report.expenses.length > 0) {
        doc.setFontSize(12);
        doc.text("Recent Expenses", 14, expY + 10);

        autoTable(doc, {
          startY: expY + 14,
          head: [["Date", "Description", "Amount", "Category", "Vendor"]],
          body: report.expenses.slice(0, 30).map((e) => [
            e.date,
            e.description,
            fmt(e.amount),
            e.category,
            e.vendorName ?? "-",
          ]),
          theme: "grid",
          headStyles: { fillColor: [219, 39, 119] },
        });
      }

      doc.save(`budget-report-${Date.now()}.pdf`);
    } catch (err) {
      console.error("PDF export error:", err);
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="mt-6 p-6 bg-white border border-gray-200 rounded-xl">
        <div className="animate-pulse space-y-4">
          <div className="h-5 w-40 bg-gray-200 rounded" />
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-100 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!report) return null;

  const { budget: b, categories, expenses } = report;

  return (
    <div className="mt-6 p-5 bg-white border border-gray-200 rounded-xl">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <FiFileText className="w-5 h-5 text-pink-500" />
          Budget Report
        </h2>
        <div className="flex gap-2">
          <button
            onClick={handleCSV}
            disabled={exporting}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            <FiDownload className="w-3.5 h-3.5" />
            CSV
          </button>
          <button
            onClick={handlePDF}
            disabled={exporting}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors disabled:opacity-50"
          >
            <FiDownload className="w-3.5 h-3.5" />
            PDF
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <p className="text-[10px] uppercase text-gray-500 mb-0.5">Total Budget</p>
          <p className="text-sm font-bold text-gray-800">{fmt(b.totalAmount)}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <p className="text-[10px] uppercase text-gray-500 mb-0.5">Total Spent</p>
          <p className="text-sm font-bold text-gray-800">{fmt(b.totalSpent)}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <p className="text-[10px] uppercase text-gray-500 mb-0.5">Remaining</p>
          <p className={`text-sm font-bold ${b.remaining >= 0 ? "text-green-600" : "text-red-600"}`}>
            {fmt(Math.abs(b.remaining))}
            {b.remaining < 0 && " over"}
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <p className="text-[10px] uppercase text-gray-500 mb-0.5">Used</p>
          <p className="text-sm font-bold text-gray-800">{b.percentUsed}%</p>
        </div>
      </div>

      {/* Overall progress bar */}
      <div className="mb-6">
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              b.percentUsed > 100 ? "bg-red-500" : b.percentUsed > 80 ? "bg-amber-500" : "bg-green-500"
            }`}
            style={{ width: `${Math.min(b.percentUsed, 100)}%` }}
          />
        </div>
      </div>

      {/* Category table */}
      {categories.length > 0 && (
        <div className="mb-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">By Category</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500 text-left">
                  <th className="py-2 pr-3 font-medium">Category</th>
                  <th className="py-2 pr-3 font-medium text-right">Allocated</th>
                  <th className="py-2 pr-3 font-medium text-right">Spent</th>
                  <th className="py-2 pr-3 font-medium text-right">Remaining</th>
                  <th className="py-2 font-medium text-right">Usage</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat) => (
                  <tr key={cat.name} className="border-b border-gray-50">
                    <td className="py-2 pr-3 text-gray-700 font-medium">{cat.name}</td>
                    <td className="py-2 pr-3 text-right text-gray-600">{fmt(cat.allocated)}</td>
                    <td className="py-2 pr-3 text-right text-gray-600">{fmt(cat.spent)}</td>
                    <td className={`py-2 pr-3 text-right ${cat.remaining >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {fmt(Math.abs(cat.remaining))}
                      {cat.remaining < 0 && " over"}
                    </td>
                    <td className="py-2 text-right">
                      <span className={`inline-flex items-center gap-0.5 ${
                        cat.percentUsed > 100 ? "text-red-600" : cat.percentUsed > 80 ? "text-amber-600" : "text-green-600"
                      }`}>
                        {cat.percentUsed > 80 ? <FiTrendingUp className="w-3 h-3" /> : <FiTrendingDown className="w-3 h-3" />}
                        {cat.percentUsed}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent expenses */}
      {expenses.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Recent Expenses</h3>
          <div className="overflow-x-auto max-h-60 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-white">
                <tr className="border-b border-gray-200 text-gray-500 text-left">
                  <th className="py-2 pr-3 font-medium">Date</th>
                  <th className="py-2 pr-3 font-medium">Description</th>
                  <th className="py-2 pr-3 font-medium text-right">Amount</th>
                  <th className="py-2 pr-3 font-medium">Category</th>
                  <th className="py-2 font-medium">Vendor</th>
                </tr>
              </thead>
              <tbody>
                {expenses.slice(0, 20).map((exp, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="py-1.5 pr-3 text-gray-500 whitespace-nowrap">{exp.date}</td>
                    <td className="py-1.5 pr-3 text-gray-700 truncate max-w-[150px]">{exp.description}</td>
                    <td className="py-1.5 pr-3 text-right text-gray-700 font-medium">{fmt(exp.amount)}</td>
                    <td className="py-1.5 pr-3 text-gray-500">{exp.category}</td>
                    <td className="py-1.5 text-gray-500">{exp.vendorName ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
