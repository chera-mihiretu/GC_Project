"use client";

import { useState, useEffect, useCallback } from "react";
import {
  type Expense,
  type ExpenseSummary,
  type BudgetCategory,
  listExpenses,
  getExpenseSummary,
  createExpense,
  updateExpense,
  deleteExpense,
} from "@/services/budget.service";
import { listBookings } from "@/services/booking.service";
import {
  FiPlus,
  FiTrash2,
  FiEdit3,
  FiSave,
  FiX,
  FiTrendingUp,
  FiAlertTriangle,
  FiFilter,
} from "react-icons/fi";

interface ExpenseTrackerProps {
  currency: string;
  categories: BudgetCategory[];
  onExpenseChange?: () => void;
}

export default function ExpenseTracker({
  currency,
  categories,
  onExpenseChange,
}: ExpenseTrackerProps) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState<ExpenseSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<string>("");
  const [bookedVendors, setBookedVendors] = useState<{ id: string; name: string }[]>([]);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formDescription, setFormDescription] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formVendor, setFormVendor] = useState("");
  const [vendorSelectMode, setVendorSelectMode] = useState<"list" | "custom">("list");
  const [formDate, setFormDate] = useState(new Date().toISOString().slice(0, 10));
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [expResult, summaryResult] = await Promise.all([
        listExpenses({ categoryId: filterCategory || undefined, limit: 100 }),
        getExpenseSummary(),
      ]);
      setExpenses(expResult.expenses);
      setTotal(expResult.total);
      setSummary(summaryResult);
    } catch {
      // Silently fail, user will see empty state
    } finally {
      setLoading(false);
    }
  }, [filterCategory]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    listBookings({ status: "accepted", limit: 100 })
      .then((res) => {
        const unique = new Map<string, string>();
        for (const b of res.data) {
          if (b.businessName && !unique.has(b.vendorProfileId)) {
            unique.set(b.vendorProfileId, b.businessName);
          }
        }
        setBookedVendors(
          Array.from(unique.entries()).map(([id, name]) => ({ id, name })),
        );
      })
      .catch(() => {});
  }, []);

  function resetForm() {
    setFormDescription("");
    setFormAmount("");
    setFormCategory("");
    setFormVendor("");
    setVendorSelectMode("list");
    setFormDate(new Date().toISOString().slice(0, 10));
    setEditingId(null);
    setShowForm(false);
  }

  function startAdd() {
    resetForm();
    setShowForm(true);
  }

  function startEdit(exp: Expense) {
    setFormDescription(exp.description);
    setFormAmount(exp.amount.toString());
    setFormCategory(exp.categoryId ?? "");
    const vendorName = exp.vendorName ?? "";
    const isInList = bookedVendors.some((v) => v.name === vendorName);
    setFormVendor(vendorName);
    setVendorSelectMode(vendorName && !isInList ? "custom" : "list");
    setFormDate(exp.expenseDate);
    setEditingId(exp.id);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amount = parseFloat(formAmount);
    if (!formDescription.trim() || isNaN(amount) || amount <= 0) return;

    const vendorValue = formVendor.trim();
    setSubmitting(true);
    try {
      if (editingId) {
        await updateExpense(editingId, {
          description: formDescription.trim(),
          amount,
          categoryId: formCategory || null,
          vendorName: vendorValue || null,
          expenseDate: formDate,
        });
      } else {
        await createExpense({
          description: formDescription.trim(),
          amount,
          categoryId: formCategory || null,
          vendorName: vendorValue || null,
          expenseDate: formDate,
        });
      }
      resetForm();
      fetchData();
      onExpenseChange?.();
    } catch {
      // error handled silently
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this expense?")) return;
    try {
      await deleteExpense(id);
      fetchData();
      onExpenseChange?.();
    } catch {
      // error handled silently
    }
  }

  function fmt(amount: number) {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount) + " " + currency;
  }

  function getCategoryName(id: string | null): string {
    if (!id) return "Uncategorized";
    const cat = categories.find((c) => c.id === id);
    return cat?.name ?? "Unknown";
  }

  const spentPercent = summary && summary.totalBudget > 0
    ? (summary.totalSpent / summary.totalBudget) * 100
    : 0;
  const isOverBudget = summary ? summary.remaining < 0 : false;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <FiTrendingUp className="w-5 h-5 text-pink-500" />
          <h2 className="text-lg font-semibold text-gray-800">Expenses</h2>
          {total > 0 && (
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
              {total} total
            </span>
          )}
        </div>
        <button
          onClick={startAdd}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors font-medium cursor-pointer"
        >
          <FiPlus className="w-3.5 h-3.5" />
          Add Expense
        </button>
      </div>

      {/* Summary stats */}
      {summary && (
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500 mb-0.5">Total Spent</p>
            <p className="text-sm font-bold text-gray-800">{fmt(summary.totalSpent)}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500 mb-0.5">Remaining</p>
            <p className={`text-sm font-bold ${isOverBudget ? "text-red-600" : "text-green-600"}`}>
              {fmt(Math.abs(summary.remaining))}
              {isOverBudget && " over"}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500 mb-0.5">Used</p>
            <p className="text-sm font-bold text-gray-800">{spentPercent.toFixed(1)}%</p>
          </div>
        </div>
      )}

      {/* Spent progress bar */}
      {summary && summary.totalBudget > 0 && (
        <div className="mb-5">
          <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                isOverBudget
                  ? "bg-red-500"
                  : spentPercent > 80
                    ? "bg-amber-500"
                    : "bg-green-500"
              }`}
              style={{ width: `${Math.min(spentPercent, 100)}%` }}
            />
          </div>
          {spentPercent > 80 && !isOverBudget && (
            <div className="flex items-center gap-1.5 mt-2 text-xs text-amber-600">
              <FiAlertTriangle className="w-3 h-3" />
              You&apos;ve used over 80% of your budget
            </div>
          )}
          {isOverBudget && (
            <div className="flex items-center gap-1.5 mt-2 text-xs text-red-600">
              <FiAlertTriangle className="w-3 h-3" />
              You&apos;ve exceeded your budget!
            </div>
          )}
        </div>
      )}

      {/* Filter by category */}
      {categories.length > 0 && (
        <div className="flex items-center gap-2 mb-4">
          <FiFilter className="w-3.5 h-3.5 text-gray-400" />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 text-gray-600 focus:ring-2 focus:ring-pink-500 outline-none"
          >
            <option value="">All categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Add/Edit form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Description *</label>
              <input
                type="text"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none"
                placeholder="e.g., Deposit for photographer"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Amount ({currency}) *</label>
              <input
                type="number"
                value={formAmount}
                onChange={(e) => setFormAmount(e.target.value)}
                min="0.01"
                step="0.01"
                required
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none"
                placeholder="15000"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none"
              >
                <option value="">Uncategorized</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Vendor (optional)</label>
              {bookedVendors.length > 0 && vendorSelectMode === "list" ? (
                <select
                  value={formVendor}
                  onChange={(e) => {
                    if (e.target.value === "__custom__") {
                      setVendorSelectMode("custom");
                      setFormVendor("");
                    } else {
                      setFormVendor(e.target.value);
                    }
                  }}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none"
                >
                  <option value="">— Select vendor —</option>
                  {bookedVendors.map((v) => (
                    <option key={v.id} value={v.name}>
                      {v.name}
                    </option>
                  ))}
                  <option value="__custom__">Other (type manually)</option>
                </select>
              ) : (
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={formVendor}
                    onChange={(e) => setFormVendor(e.target.value)}
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none"
                    placeholder="Vendor name"
                    autoFocus={vendorSelectMode === "custom"}
                  />
                  {bookedVendors.length > 0 && (
                    <button
                      type="button"
                      onClick={() => { setVendorSelectMode("list"); setFormVendor(""); }}
                      className="px-2 py-1 text-xs text-pink-600 border border-pink-200 rounded-lg hover:bg-pink-50 cursor-pointer whitespace-nowrap"
                    >
                      Pick vendor
                    </button>
                  )}
                </div>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
              <input
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none"
              />
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors font-medium disabled:opacity-50 cursor-pointer"
            >
              <FiSave className="w-3.5 h-3.5" />
              {submitting ? "Saving..." : editingId ? "Update" : "Add Expense"}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <FiX className="w-3.5 h-3.5" />
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Expense list */}
      {loading && expenses.length === 0 && (
        <div className="text-center py-8 text-gray-400 text-sm">Loading expenses...</div>
      )}

      {!loading && expenses.length === 0 && !showForm && (
        <div className="text-center py-8 text-gray-400 text-sm">
          No expenses recorded yet. Add your first expense to start tracking.
        </div>
      )}

      {expenses.length > 0 && (
        <div className="space-y-1.5">
          {expenses.map((exp) => (
            <div
              key={exp.id}
              className="group flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-medium text-gray-800 truncate">
                    {exp.description}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 whitespace-nowrap">
                    {getCategoryName(exp.categoryId)}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400">
                  <span>{new Date(exp.expenseDate).toLocaleDateString()}</span>
                  {exp.vendorName && <span>{exp.vendorName}</span>}
                </div>
              </div>
              <span className="text-sm font-semibold text-gray-700 whitespace-nowrap">
                {fmt(exp.amount)}
              </span>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => startEdit(exp)}
                  className="p-1.5 text-gray-400 hover:text-pink-600 rounded cursor-pointer"
                  title="Edit"
                >
                  <FiEdit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(exp.id)}
                  className="p-1.5 text-gray-400 hover:text-red-600 rounded cursor-pointer"
                  title="Delete"
                >
                  <FiTrash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Per-category breakdown */}
      {summary && summary.byCategory.length > 0 && (
        <div className="mt-5 pt-5 border-t border-gray-100">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Spending by Category</h3>
          <div className="space-y-2">
            {summary.byCategory.map((item) => {
              const cat = categories.find((c) => c.id === item.categoryId);
              if (!cat) return null;
              const catPercent = cat.allocatedAmount > 0
                ? (item.totalSpent / cat.allocatedAmount) * 100
                : 0;
              const overCat = catPercent > 100;
              return (
                <div key={item.categoryId} className="flex items-center gap-3">
                  <span className="text-xs text-gray-600 w-28 truncate">{cat.name}</span>
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${overCat ? "bg-red-400" : "bg-pink-400"}`}
                      style={{ width: `${Math.min(catPercent, 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 whitespace-nowrap">
                    {fmt(item.totalSpent)} / {fmt(cat.allocatedAmount)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
