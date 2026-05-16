"use client";

import { useState, useEffect, useCallback } from "react";
import {
  type Budget,
  type BudgetCategory,
  type BudgetCategorySummary,
  getBudget,
  createBudget,
  updateBudget,
  deleteBudget,
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/services/budget.service";
import {
  FiDollarSign,
  FiEdit3,
  FiTrash2,
  FiPlus,
  FiSave,
  FiX,
  FiPieChart,
  FiZap,
  FiStar,
  FiMapPin,
  FiChevronDown,
  FiChevronUp,
  FiSend,
  FiCheck,
} from "react-icons/fi";
import CategoryWizard from "@/components/budget/category-wizard";
import ContactVendorsModal from "@/components/budget/contact-vendors-modal";
import ExpenseTracker from "@/components/budget/expense-tracker";
import BudgetReport from "@/components/budget/budget-report";
import VendorDetailPanel from "@/components/ai/vendor-detail-panel";

export default function BudgetPage() {
  const [budget, setBudget] = useState<Budget | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formName, setFormName] = useState("My Wedding Budget");
  const [formAmount, setFormAmount] = useState("");
  const [formCurrency, setFormCurrency] = useState("ETB");
  const [formNotes, setFormNotes] = useState("");

  // Category state
  const [categorySummary, setCategorySummary] = useState<BudgetCategorySummary | null>(null);
  const [catLoading, setCatLoading] = useState(false);
  const [addingCategory, setAddingCategory] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [catFormName, setCatFormName] = useState("");
  const [catFormAmount, setCatFormAmount] = useState("");
  const [wizardOpen, setWizardOpen] = useState(false);
  const [expandedCatId, setExpandedCatId] = useState<string | null>(null);
  const [contactingCategory, setContactingCategory] = useState<{ id: string; name: string } | null>(null);
  const [panelVendorId, setPanelVendorId] = useState<string | null>(null);

  const fetchBudget = useCallback(async () => {
    try {
      setLoading(true);
      const b = await getBudget();
      setBudget(b);
    } catch {
      setError("Failed to load budget");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      setCatLoading(true);
      const summary = await listCategories();
      setCategorySummary(summary);
    } catch {
      // Categories may not exist if no budget yet
    } finally {
      setCatLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBudget();
  }, [fetchBudget]);

  useEffect(() => {
    if (budget) fetchCategories();
  }, [budget, fetchCategories]);

  function startCreate() {
    setFormName("My Wedding Budget");
    setFormAmount("");
    setFormCurrency("ETB");
    setFormNotes("");
    setCreating(true);
    setEditing(false);
    setError(null);
  }

  function startEdit() {
    if (!budget) return;
    setFormName(budget.name);
    setFormAmount(budget.totalAmount.toString());
    setFormCurrency(budget.currency);
    setFormNotes(budget.notes ?? "");
    setEditing(true);
    setCreating(false);
    setError(null);
  }

  function cancelForm() {
    setEditing(false);
    setCreating(false);
    setError(null);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const amount = parseFloat(formAmount);
    if (isNaN(amount) || amount < 0) {
      setError("Please enter a valid budget amount");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const b = await createBudget({
        totalAmount: amount,
        name: formName || undefined,
        currency: formCurrency || undefined,
        notes: formNotes || undefined,
      });
      setBudget(b);
      setCreating(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create budget");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    const amount = parseFloat(formAmount);
    if (isNaN(amount) || amount < 0) {
      setError("Please enter a valid budget amount");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const b = await updateBudget({
        totalAmount: amount,
        name: formName,
        currency: formCurrency,
        notes: formNotes || null,
      });
      setBudget(b);
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update budget");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete your budget? This cannot be undone.")) return;
    setSubmitting(true);
    setError(null);
    try {
      await deleteBudget();
      setBudget(null);
      setCategorySummary(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete budget");
    } finally {
      setSubmitting(false);
    }
  }

  // Category handlers
  function startAddCategory() {
    setCatFormName("");
    setCatFormAmount("");
    setAddingCategory(true);
    setEditingCategoryId(null);
  }

  function startEditCategory(cat: BudgetCategory) {
    setCatFormName(cat.name);
    setCatFormAmount(cat.allocatedAmount.toString());
    setEditingCategoryId(cat.id);
    setAddingCategory(false);
  }

  function cancelCategoryForm() {
    setAddingCategory(false);
    setEditingCategoryId(null);
  }

  async function handleCreateCategory(e: React.FormEvent) {
    e.preventDefault();
    const amount = parseFloat(catFormAmount);
    if (!catFormName.trim()) return;
    if (isNaN(amount) || amount < 0) return;

    try {
      await createCategory({ name: catFormName.trim(), allocatedAmount: amount });
      setAddingCategory(false);
      fetchCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create category");
    }
  }

  async function handleUpdateCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!editingCategoryId) return;
    const amount = parseFloat(catFormAmount);
    if (!catFormName.trim()) return;
    if (isNaN(amount) || amount < 0) return;

    try {
      await updateCategory(editingCategoryId, {
        name: catFormName.trim(),
        allocatedAmount: amount,
      });
      setEditingCategoryId(null);
      fetchCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update category");
    }
  }

  async function handleDeleteCategory(id: string) {
    if (!confirm("Delete this category?")) return;
    try {
      await deleteCategory(id);
      fetchCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete category");
    }
  }

  function formatCurrency(amount: number, currency: string) {
    return new Intl.NumberFormat("en-US", {
      style: "decimal",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount) + " " + currency;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-pink-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Wedding Budget</h1>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Empty State */}
      {!budget && !creating && (
        <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="mx-auto w-16 h-16 rounded-full bg-pink-50 flex items-center justify-center mb-4">
            <FiDollarSign className="w-8 h-8 text-pink-500" />
          </div>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">
            No budget set yet
          </h2>
          <p className="text-gray-500 mb-6 max-w-sm mx-auto">
            Set your total wedding budget to start tracking expenses and stay on top of your spending.
          </p>
          <button
            onClick={startCreate}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors font-medium cursor-pointer"
          >
            <FiPlus className="w-4 h-4" />
            Set My Budget
          </button>
        </div>
      )}

      {/* Create Form */}
      {creating && (
        <form onSubmit={handleCreate} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
          <h2 className="text-lg font-semibold text-gray-800">Create Your Budget</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Budget Name</label>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none"
              placeholder="My Wedding Budget"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Amount *</label>
              <input
                type="number"
                value={formAmount}
                onChange={(e) => setFormAmount(e.target.value)}
                min="0"
                step="0.01"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none"
                placeholder="500000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
              <select
                value={formCurrency}
                onChange={(e) => setFormCurrency(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none"
              >
                <option value="ETB">ETB</option>
                <option value="USD">USD</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
            <textarea
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none resize-none"
              placeholder="Any notes about your budget..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors font-medium disabled:opacity-50 cursor-pointer"
            >
              <FiSave className="w-4 h-4" />
              {submitting ? "Creating..." : "Create Budget"}
            </button>
            <button
              type="button"
              onClick={cancelForm}
              className="inline-flex items-center gap-2 px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium cursor-pointer"
            >
              <FiX className="w-4 h-4" />
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Budget Display */}
      {budget && !editing && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-800">{budget.name}</h2>
            <div className="flex gap-2">
              <button
                onClick={startEdit}
                className="p-2 text-gray-500 hover:text-pink-600 hover:bg-pink-50 rounded-lg transition-colors cursor-pointer"
                title="Edit budget"
              >
                <FiEdit3 className="w-4 h-4" />
              </button>
              <button
                onClick={handleDelete}
                disabled={submitting}
                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                title="Delete budget"
              >
                <FiTrash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl p-6 text-center">
            <p className="text-sm text-gray-500 mb-1">Total Budget</p>
            <p className="text-3xl font-bold text-gray-900">
              {formatCurrency(budget.totalAmount, budget.currency)}
            </p>
          </div>

          {budget.notes && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 font-medium mb-1">Notes</p>
              <p className="text-sm text-gray-700">{budget.notes}</p>
            </div>
          )}

          <p className="text-xs text-gray-400 mt-4">
            Last updated: {new Date(budget.updatedAt).toLocaleDateString()}
          </p>
        </div>
      )}

      {/* Edit Form */}
      {editing && (
        <form onSubmit={handleUpdate} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
          <h2 className="text-lg font-semibold text-gray-800">Edit Budget</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Budget Name</label>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Amount *</label>
              <input
                type="number"
                value={formAmount}
                onChange={(e) => setFormAmount(e.target.value)}
                min="0"
                step="0.01"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
              <select
                value={formCurrency}
                onChange={(e) => setFormCurrency(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none"
              >
                <option value="ETB">ETB</option>
                <option value="USD">USD</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
            <textarea
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors font-medium disabled:opacity-50 cursor-pointer"
            >
              <FiSave className="w-4 h-4" />
              {submitting ? "Saving..." : "Save Changes"}
            </button>
            <button
              type="button"
              onClick={cancelForm}
              className="inline-flex items-center gap-2 px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium cursor-pointer"
            >
              <FiX className="w-4 h-4" />
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* ──────────────── Budget Breakdown (Categories) ──────────────── */}
      {budget && !editing && !creating && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <FiPieChart className="w-5 h-5 text-pink-500" />
              <h2 className="text-lg font-semibold text-gray-800">Budget Breakdown</h2>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setWizardOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors font-medium cursor-pointer"
              >
                <FiZap className="w-3.5 h-3.5" />
                Smart Reconfigure
              </button>
              <button
                onClick={startAddCategory}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-pink-50 text-pink-600 rounded-lg hover:bg-pink-100 transition-colors font-medium cursor-pointer"
              >
                <FiPlus className="w-3.5 h-3.5" />
                Add Category
              </button>
            </div>
          </div>

          {/* Allocation & spending summary */}
          {categorySummary && budget.totalAmount > 0 && (
            <div className="mb-5">
              <div className="flex flex-wrap justify-between text-sm mb-1.5 gap-x-4">
                <span className="text-gray-600">
                  Allocated: <span className="font-semibold">{formatCurrency(categorySummary.totalAllocated, budget.currency)}</span>
                </span>
                <span className="text-gray-600">
                  Spent: <span className="font-semibold">{formatCurrency(categorySummary.totalSpent, budget.currency)}</span>
                </span>
                <span className="text-gray-500">
                  Unallocated: {formatCurrency(categorySummary.unallocated, budget.currency)}
                </span>
              </div>
              <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-pink-500 to-purple-500 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min((categorySummary.totalAllocated / budget.totalAmount) * 100, 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Add category form */}
          {addingCategory && (
            <form onSubmit={handleCreateCategory} className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Category Name *</label>
                  <input
                    type="text"
                    value={catFormName}
                    onChange={(e) => setCatFormName(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none"
                    placeholder="e.g., Flowers"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Allocated Amount ({budget.currency}) *</label>
                  <input
                    type="number"
                    value={catFormAmount}
                    onChange={(e) => setCatFormAmount(e.target.value)}
                    min="0"
                    step="0.01"
                    required
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none"
                    placeholder="50000"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors font-medium cursor-pointer"
                >
                  <FiSave className="w-3.5 h-3.5" />
                  Add
                </button>
                <button
                  type="button"
                  onClick={cancelCategoryForm}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Categories list */}
          {catLoading && !categorySummary && (
            <div className="text-center py-8 text-gray-400 text-sm">Loading categories...</div>
          )}

          {categorySummary && categorySummary.categories.length === 0 && !addingCategory && (
            <div className="text-center py-8 text-gray-400 text-sm">
              No categories yet. Add one to start breaking down your budget.
            </div>
          )}

          {categorySummary && categorySummary.categories.length > 0 && (
            <div className="space-y-2">
              {categorySummary.categories.map((cat) => {
                const spentPercent = cat.allocatedAmount > 0
                  ? (cat.spentAmount / cat.allocatedAmount) * 100
                  : 0;
                const isOverCategory = spentPercent > 100;
                const isEditing = editingCategoryId === cat.id;

                if (isEditing) {
                  return (
                    <form
                      key={cat.id}
                      onSubmit={handleUpdateCategory}
                      className="p-3 bg-gray-50 rounded-lg border border-pink-200 space-y-2"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={catFormName}
                          onChange={(e) => setCatFormName(e.target.value)}
                          required
                          className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none"
                          autoFocus
                        />
                        <input
                          type="number"
                          value={catFormAmount}
                          onChange={(e) => setCatFormAmount(e.target.value)}
                          min="0"
                          step="0.01"
                          required
                          className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-pink-600 text-white rounded-lg hover:bg-pink-700 font-medium cursor-pointer"
                        >
                          <FiSave className="w-3.5 h-3.5" />
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={cancelCategoryForm}
                          className="px-3 py-1.5 text-sm border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-100 cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  );
                }

                const hasVendors = cat.vendors && cat.vendors.length > 0;
                const isExpanded = expandedCatId === cat.id;

                return (
                  <div key={cat.id} className="border border-gray-100 rounded-lg overflow-hidden">
                    <div className="group flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors">
                      {hasVendors ? (
                        <button
                          onClick={() => setExpandedCatId(isExpanded ? null : cat.id)}
                          className="p-0.5 text-gray-400 hover:text-gray-600 cursor-pointer"
                        >
                          {isExpanded ? <FiChevronUp className="w-3.5 h-3.5" /> : <FiChevronDown className="w-3.5 h-3.5" />}
                        </button>
                      ) : (
                        <div className="w-[18px]" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className="text-sm font-medium text-gray-800 truncate">{cat.name}</span>
                          <span className={`text-xs ${isOverCategory ? "text-red-500 font-medium" : "text-gray-400"}`}>
                            {spentPercent.toFixed(0)}% used
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              isOverCategory
                                ? "bg-red-400"
                                : spentPercent > 80
                                  ? "bg-amber-400"
                                  : "bg-green-400"
                            }`}
                            style={{ width: `${Math.min(spentPercent, 100)}%` }}
                          />
                        </div>
                        {hasVendors && (
                          <button
                            onClick={() => setExpandedCatId(isExpanded ? null : cat.id)}
                            className="text-[10px] text-pink-500 font-medium mt-1 cursor-pointer hover:text-pink-700"
                          >
                            {cat.vendors.length} vendor{cat.vendors.length > 1 ? "s" : ""} recommended
                          </button>
                        )}
                      </div>
                      <div className="text-right whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-700">
                          {formatCurrency(cat.spentAmount, budget.currency)}
                        </div>
                        <div className="text-[10px] text-gray-400">
                          of {formatCurrency(cat.allocatedAmount, budget.currency)}
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => startEditCategory(cat)}
                          className="p-1.5 text-gray-400 hover:text-pink-600 rounded cursor-pointer"
                          title="Edit"
                        >
                          <FiEdit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(cat.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 rounded cursor-pointer"
                          title="Delete"
                        >
                          <FiTrash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {isExpanded && hasVendors && (
                      <div className="px-3 pb-3 pt-1 bg-gray-50 border-t border-gray-100 space-y-2">
                        {cat.vendors.map((vendor) => (
                          <div key={vendor.id} className="flex items-start gap-2.5 p-2 bg-white rounded-lg border border-gray-100">
                            <div className="w-8 h-8 rounded-lg bg-pink-50 flex items-center justify-center shrink-0 mt-0.5">
                              <span className="text-xs font-bold text-pink-500">
                                {vendor.businessName.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <button
                                onClick={() => setPanelVendorId(vendor.id)}
                                className="text-sm font-medium text-gray-800 hover:text-pink-600 truncate block text-left cursor-pointer"
                              >
                                {vendor.businessName}
                              </button>
                              <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
                                <span className="flex items-center gap-0.5">
                                  <FiStar className="w-3 h-3 text-amber-400" />
                                  {vendor.rating.toFixed(1)} ({vendor.reviewCount})
                                </span>
                                {vendor.location && (
                                  <span className="flex items-center gap-0.5 truncate">
                                    <FiMapPin className="w-3 h-3" />
                                    {vendor.location}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-pink-600 mt-1 italic">
                                &ldquo;{vendor.reason}&rdquo;
                              </p>
                            </div>
                          </div>
                        ))}
                        {cat.contactedAt ? (
                          <div className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-sm text-green-700 bg-green-50 rounded-lg font-medium">
                            <FiCheck className="w-3.5 h-3.5" />
                            Messages sent to vendor{cat.vendors.length > 1 ? "s" : ""}
                          </div>
                        ) : (
                          <button
                            onClick={() => setContactingCategory({ id: cat.id, name: cat.name })}
                            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors font-medium cursor-pointer"
                          >
                            <FiSend className="w-3.5 h-3.5" />
                            Message All {cat.vendors.length} Vendor{cat.vendors.length > 1 ? "s" : ""}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ──────────────── Expense Tracker ──────────────── */}
      {budget && !editing && !creating && categorySummary && (
        <ExpenseTracker
          currency={budget.currency}
          categories={categorySummary.categories}
          onExpenseChange={fetchBudget}
        />
      )}

      {/* ──────────────── Budget Report ──────────────── */}
      {budget && !editing && !creating && categorySummary && (
        <BudgetReport currency={budget.currency} />
      )}

      {/* AI Category Wizard Modal */}
      {wizardOpen && budget && (
        <CategoryWizard
          totalAmount={budget.totalAmount}
          currency={budget.currency}
          onComplete={() => {
            setWizardOpen(false);
            fetchCategories();
          }}
          onCancel={() => setWizardOpen(false)}
        />
      )}

      {/* Contact Vendors Modal */}
      {contactingCategory && (
        <ContactVendorsModal
          categoryId={contactingCategory.id}
          categoryName={contactingCategory.name}
          onClose={() => setContactingCategory(null)}
          onSent={() => {
            setContactingCategory(null);
            fetchCategories();
          }}
        />
      )}

      {/* Vendor Detail Side Panel */}
      <VendorDetailPanel
        vendorId={panelVendorId}
        onClose={() => setPanelVendorId(null)}
      />
    </div>
  );
}
