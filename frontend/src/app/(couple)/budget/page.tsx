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
  FiAlertCircle,
} from "react-icons/fi";
import CategoryWizard from "@/components/budget/category-wizard";
import ContactVendorsModal from "@/components/budget/contact-vendors-modal";
import ExpenseTracker from "@/components/budget/expense-tracker";
import BudgetReport from "@/components/budget/budget-report";
import VendorDetailPanel from "@/components/ai/vendor-detail-panel";

const INPUT_CLS =
  "w-full px-4 py-3 rounded-xl bg-warm-50/60 border border-warm-200/40 text-[13px] text-slate-800 placeholder:text-slate-300 outline-none transition-all duration-500 focus:border-gold-400/50 focus:ring-2 focus:ring-gold-400/10";

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

  useEffect(() => { fetchBudget(); }, [fetchBudget]);
  useEffect(() => { if (budget) fetchCategories(); }, [budget, fetchCategories]);

  function startCreate() {
    setFormName("My Wedding Budget"); setFormAmount(""); setFormCurrency("ETB"); setFormNotes("");
    setCreating(true); setEditing(false); setError(null);
  }
  function startEdit() {
    if (!budget) return;
    setFormName(budget.name); setFormAmount(budget.totalAmount.toString());
    setFormCurrency(budget.currency); setFormNotes(budget.notes ?? "");
    setEditing(true); setCreating(false); setError(null);
  }
  function cancelForm() { setEditing(false); setCreating(false); setError(null); }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const amount = parseFloat(formAmount);
    if (isNaN(amount) || amount < 0) { setError("Please enter a valid budget amount"); return; }
    setSubmitting(true); setError(null);
    try {
      const b = await createBudget({ totalAmount: amount, name: formName || undefined, currency: formCurrency || undefined, notes: formNotes || undefined });
      setBudget(b); setCreating(false);
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to create budget"); }
    finally { setSubmitting(false); }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    const amount = parseFloat(formAmount);
    if (isNaN(amount) || amount < 0) { setError("Please enter a valid budget amount"); return; }
    setSubmitting(true); setError(null);
    try {
      const b = await updateBudget({ totalAmount: amount, name: formName, currency: formCurrency, notes: formNotes || null });
      setBudget(b); setEditing(false);
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to update budget"); }
    finally { setSubmitting(false); }
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete your budget? This cannot be undone.")) return;
    setSubmitting(true); setError(null);
    try { await deleteBudget(); setBudget(null); setCategorySummary(null); }
    catch (err) { setError(err instanceof Error ? err.message : "Failed to delete budget"); }
    finally { setSubmitting(false); }
  }

  function startAddCategory() { setCatFormName(""); setCatFormAmount(""); setAddingCategory(true); setEditingCategoryId(null); }
  function startEditCategory(cat: BudgetCategory) { setCatFormName(cat.name); setCatFormAmount(cat.allocatedAmount.toString()); setEditingCategoryId(cat.id); setAddingCategory(false); }
  function cancelCategoryForm() { setAddingCategory(false); setEditingCategoryId(null); }

  async function handleCreateCategory(e: React.FormEvent) {
    e.preventDefault();
    const amount = parseFloat(catFormAmount);
    if (!catFormName.trim() || isNaN(amount) || amount < 0) return;
    try { await createCategory({ name: catFormName.trim(), allocatedAmount: amount }); setAddingCategory(false); fetchCategories(); }
    catch (err) { setError(err instanceof Error ? err.message : "Failed to create category"); }
  }

  async function handleUpdateCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!editingCategoryId) return;
    const amount = parseFloat(catFormAmount);
    if (!catFormName.trim() || isNaN(amount) || amount < 0) return;
    try { await updateCategory(editingCategoryId, { name: catFormName.trim(), allocatedAmount: amount }); setEditingCategoryId(null); fetchCategories(); }
    catch (err) { setError(err instanceof Error ? err.message : "Failed to update category"); }
  }

  async function handleDeleteCategory(id: string) {
    if (!confirm("Delete this category?")) return;
    try { await deleteCategory(id); fetchCategories(); }
    catch (err) { setError(err instanceof Error ? err.message : "Failed to delete category"); }
  }

  function formatCurrency(amount: number, currency: string) {
    return new Intl.NumberFormat("en-US", { style: "decimal", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount) + " " + currency;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-warm-200/40 border-t-gold-400 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[13px] text-slate-400 font-light">Loading budget...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ── Header ── */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-editorial text-slate-400 mb-2">Finance</p>
        <h1 className="font-display text-3xl font-bold text-slate-900 tracking-headline">Wedding Budget</h1>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-2xl bg-red-50 border border-red-200/40 px-5 py-4 text-[13px] text-red-600">
          <div className="w-8 h-8 rounded-lg bg-red-100 border border-red-200/40 flex items-center justify-center shrink-0">
            <FiAlertCircle className="w-4 h-4 text-red-400" />
          </div>
          {error}
        </div>
      )}

      {/* ── Empty State ── */}
      {!budget && !creating && (
        <div className="text-center py-16 rounded-2xl border border-warm-200/50 bg-white">
          <div className="w-14 h-14 rounded-xl bg-warm-50 border border-warm-200/40 flex items-center justify-center mx-auto mb-4">
            <FiDollarSign className="w-6 h-6 text-slate-300" />
          </div>
          <h2 className="text-[16px] font-semibold text-slate-800 mb-2">No budget set yet</h2>
          <p className="text-[13px] text-slate-400 font-light mb-6 max-w-sm mx-auto">
            Set your total wedding budget to start tracking expenses and stay on top of your spending.
          </p>
          <button onClick={startCreate} className="cursor-pointer inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-full text-[13px] font-medium hover:bg-slate-800 transition-all duration-500">
            <FiPlus className="w-4 h-4" />
            Set My Budget
          </button>
        </div>
      )}

      {/* ── Create / Edit Form ── */}
      {(creating || editing) && (
        <form onSubmit={creating ? handleCreate : handleUpdate} className="rounded-2xl border border-warm-200/50 bg-white p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-warm-50 border border-warm-200/40 flex items-center justify-center">
              <FiDollarSign className="w-4 h-4 text-slate-400" />
            </div>
            <h2 className="text-[15px] font-semibold text-slate-900">
              {creating ? "Create Your Budget" : "Edit Budget"}
            </h2>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <label className="text-[12px] font-medium text-slate-600">Budget Name</label>
              <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} className={INPUT_CLS} placeholder="My Wedding Budget" />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2 flex flex-col gap-2">
                <label className="text-[12px] font-medium text-slate-600">Total Amount *</label>
                <input type="number" value={formAmount} onChange={(e) => setFormAmount(e.target.value)} min="0" step="0.01" required className={INPUT_CLS} placeholder="500000" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[12px] font-medium text-slate-600">Currency</label>
                <select value={formCurrency} onChange={(e) => setFormCurrency(e.target.value)} className={`${INPUT_CLS} appearance-none cursor-pointer`}>
                  <option value="ETB">ETB</option>
                  <option value="USD">USD</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[12px] font-medium text-slate-600">Notes (optional)</label>
              <textarea value={formNotes} onChange={(e) => setFormNotes(e.target.value)} rows={3} className={`${INPUT_CLS} resize-none`} placeholder="Any notes about your budget..." />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={submitting} className="cursor-pointer inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-full text-[13px] font-medium hover:bg-slate-800 transition-all duration-500 disabled:opacity-50">
              <FiSave className="w-4 h-4" />
              {submitting ? "Saving..." : creating ? "Create Budget" : "Save Changes"}
            </button>
            <button type="button" onClick={cancelForm} className="cursor-pointer inline-flex items-center gap-2 px-5 py-3 rounded-full border border-warm-200/50 text-[13px] font-medium text-slate-600 hover:bg-warm-50/50 transition-all duration-500">
              <FiX className="w-4 h-4" />
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* ── Budget Display ── */}
      {budget && !editing && (
        <div className="rounded-2xl border border-warm-200/50 bg-white p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[15px] font-semibold text-slate-900">{budget.name}</h2>
            <div className="flex gap-1.5">
              <button onClick={startEdit} className="cursor-pointer w-9 h-9 rounded-xl border border-warm-200/40 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:border-warm-200 transition-all duration-500" title="Edit">
                <FiEdit3 className="w-4 h-4" />
              </button>
              <button onClick={handleDelete} disabled={submitting} className="cursor-pointer w-9 h-9 rounded-xl border border-warm-200/40 flex items-center justify-center text-slate-400 hover:text-red-500 hover:border-red-200/50 transition-all duration-500" title="Delete">
                <FiTrash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="rounded-2xl bg-gradient-to-br from-warm-50 to-warm-100/50 border border-warm-200/20 p-8 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-luxury text-slate-400 mb-2">Total Budget</p>
            <p className="font-display text-4xl font-bold text-slate-900 tracking-tight">
              {formatCurrency(budget.totalAmount, budget.currency)}
            </p>
          </div>

          {budget.notes && (
            <div className="mt-5 p-4 rounded-xl bg-warm-50/40 border border-warm-200/20">
              <p className="text-[11px] font-semibold uppercase tracking-luxury text-slate-400 mb-1">Notes</p>
              <p className="text-[13px] text-slate-600 font-light">{budget.notes}</p>
            </div>
          )}

          <p className="text-[11px] text-slate-300 font-light mt-5">
            Last updated: {new Date(budget.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </p>
        </div>
      )}

      {/* ── Budget Breakdown ── */}
      {budget && !editing && !creating && (
        <div className="rounded-2xl border border-warm-200/50 bg-white p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-warm-50 border border-warm-200/40 flex items-center justify-center">
                <FiPieChart className="w-4 h-4 text-slate-400" />
              </div>
              <div>
                <h2 className="text-[15px] font-semibold text-slate-900">Budget Breakdown</h2>
                <p className="text-[11px] text-slate-400 font-light">Track spending by category</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setWizardOpen(true)} className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-2 text-[11px] font-medium bg-violet-50 text-violet-600 border border-violet-200/40 rounded-xl hover:bg-violet-100/60 transition-all duration-500">
                <FiZap className="w-3.5 h-3.5" /> Smart Reconfigure
              </button>
              <button onClick={startAddCategory} className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-2 text-[11px] font-medium bg-warm-50 text-slate-600 border border-warm-200/40 rounded-xl hover:bg-warm-100/60 transition-all duration-500">
                <FiPlus className="w-3.5 h-3.5" /> Add Category
              </button>
            </div>
          </div>

          {/* Allocation summary */}
          {categorySummary && budget.totalAmount > 0 && (
            <div className="mb-6">
              <div className="flex flex-wrap justify-between text-[12px] mb-2 gap-x-4">
                <span className="text-slate-500">Allocated: <span className="font-semibold text-slate-700">{formatCurrency(categorySummary.totalAllocated, budget.currency)}</span></span>
                <span className="text-slate-500">Spent: <span className="font-semibold text-slate-700">{formatCurrency(categorySummary.totalSpent, budget.currency)}</span></span>
                <span className="text-slate-400 font-light">Unallocated: {formatCurrency(categorySummary.unallocated, budget.currency)}</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-warm-100 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-gold-400 to-amber-400 transition-all duration-1000" style={{ width: `${Math.min((categorySummary.totalAllocated / budget.totalAmount) * 100, 100)}%` }} />
              </div>
            </div>
          )}

          {/* Add category form */}
          {addingCategory && (
            <form onSubmit={handleCreateCategory} className="mb-5 p-5 rounded-xl bg-warm-50/40 border border-warm-200/30 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-medium text-slate-500">Category Name *</label>
                  <input type="text" value={catFormName} onChange={(e) => setCatFormName(e.target.value)} required className={INPUT_CLS} placeholder="e.g., Flowers" autoFocus />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-medium text-slate-500">Allocated Amount ({budget.currency}) *</label>
                  <input type="number" value={catFormAmount} onChange={(e) => setCatFormAmount(e.target.value)} min="0" step="0.01" required className={INPUT_CLS} placeholder="50000" />
                </div>
              </div>
              <div className="flex gap-2">
                <button type="submit" className="cursor-pointer inline-flex items-center gap-1.5 px-4 py-2.5 text-[12px] bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-all duration-500">
                  <FiSave className="w-3.5 h-3.5" /> Add
                </button>
                <button type="button" onClick={cancelCategoryForm} className="cursor-pointer inline-flex items-center gap-1.5 px-4 py-2.5 text-[12px] border border-warm-200/40 text-slate-500 rounded-xl hover:bg-warm-50 transition-all duration-500">
                  Cancel
                </button>
              </div>
            </form>
          )}

          {catLoading && !categorySummary && (
            <div className="text-center py-10">
              <div className="w-8 h-8 border-2 border-warm-200/40 border-t-gold-400 rounded-full animate-spin mx-auto" />
            </div>
          )}

          {categorySummary && categorySummary.categories.length === 0 && !addingCategory && (
            <div className="text-center py-10">
              <p className="text-[13px] text-slate-400 font-light">No categories yet. Add one to start breaking down your budget.</p>
            </div>
          )}

          {categorySummary && categorySummary.categories.length > 0 && (
            <div className="space-y-2.5">
              {categorySummary.categories.map((cat) => {
                const spentPercent = cat.allocatedAmount > 0 ? (cat.spentAmount / cat.allocatedAmount) * 100 : 0;
                const isOver = spentPercent > 100;
                const isEditing = editingCategoryId === cat.id;

                if (isEditing) {
                  return (
                    <form key={cat.id} onSubmit={handleUpdateCategory} className="p-4 rounded-xl bg-warm-50/40 border border-gold-400/30 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input type="text" value={catFormName} onChange={(e) => setCatFormName(e.target.value)} required className={INPUT_CLS} autoFocus />
                        <input type="number" value={catFormAmount} onChange={(e) => setCatFormAmount(e.target.value)} min="0" step="0.01" required className={INPUT_CLS} />
                      </div>
                      <div className="flex gap-2">
                        <button type="submit" className="cursor-pointer inline-flex items-center gap-1.5 px-4 py-2.5 text-[12px] bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-all duration-500">
                          <FiSave className="w-3.5 h-3.5" /> Save
                        </button>
                        <button type="button" onClick={cancelCategoryForm} className="cursor-pointer px-4 py-2.5 text-[12px] border border-warm-200/40 text-slate-500 rounded-xl hover:bg-warm-50 transition-all duration-500">
                          Cancel
                        </button>
                      </div>
                    </form>
                  );
                }

                const hasVendors = cat.vendors && cat.vendors.length > 0;
                const isExpanded = expandedCatId === cat.id;

                return (
                  <div key={cat.id} className="rounded-xl border border-warm-200/30 overflow-hidden transition-all duration-500 hover:border-warm-200/50">
                    <div className="group flex items-center gap-3 p-4 hover:bg-warm-50/20 transition-all duration-300">
                      {hasVendors ? (
                        <button onClick={() => setExpandedCatId(isExpanded ? null : cat.id)} className="cursor-pointer p-0.5 text-slate-300 hover:text-slate-500 transition-colors">
                          {isExpanded ? <FiChevronUp className="w-3.5 h-3.5" /> : <FiChevronDown className="w-3.5 h-3.5" />}
                        </button>
                      ) : (
                        <div className="w-[18px]" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2 mb-1.5">
                          <span className="text-[13px] font-medium text-slate-800 truncate">{cat.name}</span>
                          <span className={`text-[10px] font-medium ${isOver ? "text-red-500" : spentPercent > 80 ? "text-amber-500" : "text-slate-400"}`}>
                            {spentPercent.toFixed(0)}% used
                          </span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-warm-100 overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-1000 ${isOver ? "bg-red-400" : spentPercent > 80 ? "bg-amber-400" : "bg-emerald-400"}`} style={{ width: `${Math.min(spentPercent, 100)}%` }} />
                        </div>
                        {hasVendors && (
                          <button onClick={() => setExpandedCatId(isExpanded ? null : cat.id)} className="cursor-pointer text-[10px] text-gold-500 font-medium mt-1.5 hover:text-gold-600 transition-colors">
                            {cat.vendors.length} vendor{cat.vendors.length > 1 ? "s" : ""} recommended
                          </button>
                        )}
                      </div>
                      <div className="text-right whitespace-nowrap">
                        <div className="text-[13px] font-semibold text-slate-700">{formatCurrency(cat.spentAmount, budget.currency)}</div>
                        <div className="text-[10px] text-slate-300 font-light">of {formatCurrency(cat.allocatedAmount, budget.currency)}</div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                        <button onClick={() => startEditCategory(cat)} className="cursor-pointer p-1.5 text-slate-300 hover:text-slate-500 rounded-lg transition-colors" title="Edit">
                          <FiEdit3 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDeleteCategory(cat.id)} className="cursor-pointer p-1.5 text-slate-300 hover:text-red-400 rounded-lg transition-colors" title="Delete">
                          <FiTrash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {isExpanded && hasVendors && (
                      <div className="px-4 pb-4 pt-2 bg-warm-50/20 border-t border-warm-200/15 space-y-2.5">
                        {cat.vendors.map((vendor) => (
                          <div key={vendor.id} className="flex items-start gap-3 p-3 bg-white rounded-xl border border-warm-200/30">
                            <div className="w-8 h-8 rounded-lg bg-warm-50 border border-warm-200/30 flex items-center justify-center shrink-0 mt-0.5">
                              <span className="text-[11px] font-bold text-slate-400">{vendor.businessName.charAt(0).toUpperCase()}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <button onClick={() => setPanelVendorId(vendor.id)} className="cursor-pointer text-[13px] font-medium text-slate-800 hover:text-slate-600 truncate block text-left transition-colors">
                                {vendor.businessName}
                              </button>
                              <div className="flex items-center gap-3 mt-0.5 text-[11px] text-slate-400 font-light">
                                <span className="flex items-center gap-0.5">
                                  <FiStar className="w-3 h-3 text-amber-400" />
                                  {vendor.rating.toFixed(1)} ({vendor.reviewCount})
                                </span>
                                {vendor.location && (
                                  <span className="flex items-center gap-0.5 truncate">
                                    <FiMapPin className="w-3 h-3" /> {vendor.location}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-gold-500 mt-1 italic font-light">&ldquo;{vendor.reason}&rdquo;</p>
                            </div>
                          </div>
                        ))}
                        {cat.contactedAt ? (
                          <div className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 text-[12px] text-emerald-600 bg-emerald-50 border border-emerald-200/30 rounded-xl font-medium">
                            <FiCheck className="w-3.5 h-3.5" />
                            Messages sent to vendor{cat.vendors.length > 1 ? "s" : ""}
                          </div>
                        ) : (
                          <button onClick={() => setContactingCategory({ id: cat.id, name: cat.name })} className="cursor-pointer w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-[12px] bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all duration-500 font-medium">
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

      {/* ── Expense Tracker ── */}
      {budget && !editing && !creating && categorySummary && (
        <ExpenseTracker currency={budget.currency} categories={categorySummary.categories} onExpenseChange={fetchBudget} />
      )}

      {/* ── Budget Report ── */}
      {budget && !editing && !creating && categorySummary && (
        <BudgetReport currency={budget.currency} />
      )}

      {/* Modals */}
      {wizardOpen && budget && (
        <CategoryWizard totalAmount={budget.totalAmount} currency={budget.currency} onComplete={() => { setWizardOpen(false); fetchCategories(); }} onCancel={() => setWizardOpen(false)} />
      )}
      {contactingCategory && (
        <ContactVendorsModal categoryId={contactingCategory.id} categoryName={contactingCategory.name} onClose={() => setContactingCategory(null)} onSent={() => { setContactingCategory(null); fetchCategories(); }} />
      )}
      <VendorDetailPanel vendorId={panelVendorId} onClose={() => setPanelVendorId(null)} />
    </div>
  );
}
