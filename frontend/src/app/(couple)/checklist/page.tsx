"use client";

import { useState, useEffect, useCallback } from "react";
import {
  FiPlus,
  FiTrash2,
  FiEdit2,
  FiCheck,
  FiX,
  FiClipboard,
  FiCalendar,
} from "react-icons/fi";
import {
  listChecklist,
  createChecklistItem,
  toggleChecklistItem,
  deleteChecklistItem,
  updateChecklistItem,
  seedChecklist,
  getChecklistProgress,
  type ChecklistItem,
  type ChecklistProgress,
} from "@/services/checklist.service";

const CATEGORIES = [
  "All", "Venue", "Catering", "Attire", "Decor", "Music",
  "Photography", "Guests", "Planning", "Budget", "Logistics", "Legal", "Ceremony",
];

const INPUT_CLS =
  "w-full px-4 py-3 rounded-xl bg-warm-50/60 border border-warm-200/40 text-[13px] text-slate-800 placeholder:text-slate-300 outline-none transition-all duration-500 focus:border-gold-400/50 focus:ring-2 focus:ring-gold-400/10";

export default function ChecklistPage() {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [progress, setProgress] = useState<ChecklistProgress>({ total: 0, completed: 0 });
  const [activeCategory, setActiveCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [seeding, setSeeding] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const category = activeCategory === "All" ? undefined : activeCategory;
      const [itemsData, progressData] = await Promise.all([
        listChecklist(category),
        getChecklistProgress(),
      ]);
      setItems(itemsData);
      setProgress(progressData);
    } catch (err) {
      console.error("Failed to load checklist:", err);
    } finally {
      setLoading(false);
    }
  }, [activeCategory]);

  useEffect(() => { setLoading(true); loadData(); }, [loadData]);

  const handleAdd = async () => {
    if (!newTitle.trim()) return;
    try {
      await createChecklistItem({ title: newTitle.trim(), category: newCategory || undefined, dueDate: newDueDate || undefined });
      setNewTitle(""); setNewCategory(""); setNewDueDate(""); setShowAddForm(false); loadData();
    } catch (err) { console.error("Failed to add item:", err); }
  };

  const handleToggle = async (id: string) => {
    try {
      const updated = await toggleChecklistItem(id);
      setItems((prev) => prev.map((i) => (i.id === id ? updated : i)));
      setProgress((prev) => ({ total: prev.total, completed: updated.isCompleted ? prev.completed + 1 : prev.completed - 1 }));
    } catch (err) { console.error("Failed to toggle item:", err); }
  };

  const handleDelete = async (id: string) => {
    try {
      const deleted = items.find((i) => i.id === id);
      await deleteChecklistItem(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
      setProgress((prev) => ({ total: prev.total - 1, completed: deleted?.isCompleted ? prev.completed - 1 : prev.completed }));
    } catch (err) { console.error("Failed to delete item:", err); }
  };

  const startEdit = (item: ChecklistItem) => {
    setEditingId(item.id); setEditTitle(item.title); setEditCategory(item.category || ""); setEditDueDate(item.dueDate || "");
  };

  const handleEditSave = async () => {
    if (!editingId || !editTitle.trim()) return;
    try {
      const updated = await updateChecklistItem(editingId, { title: editTitle.trim(), category: editCategory || null, dueDate: editDueDate || null });
      setItems((prev) => prev.map((i) => (i.id === editingId ? updated : i)));
      setEditingId(null);
    } catch (err) { console.error("Failed to update item:", err); }
  };

  const handleSeed = async () => {
    setSeeding(true);
    try { const result = await seedChecklist(); if (result.seeded) await loadData(); }
    catch (err) { console.error("Failed to seed checklist:", err); }
    finally { setSeeding(false); }
  };

  const progressPercent = progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-editorial text-slate-400 mb-2">Planning</p>
          <h1 className="font-display text-3xl font-bold text-slate-900 tracking-headline">Wedding Checklist</h1>
          <p className="text-[13px] text-slate-400 font-light mt-2">
            {progress.completed} of {progress.total} tasks completed
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="cursor-pointer flex items-center gap-1.5 px-5 py-3 bg-slate-900 text-white rounded-full text-[13px] font-medium hover:bg-slate-800 transition-all duration-500 shrink-0"
        >
          <FiPlus className="w-4 h-4" />
          Add Task
        </button>
      </div>

      {/* ── Progress ── */}
      <div className="rounded-2xl border border-warm-200/50 bg-white p-5 sm:p-6">
        <div className="flex items-center justify-between text-[12px] mb-2.5">
          <span className="text-slate-500 font-medium">{progressPercent}% complete</span>
          <span className="text-slate-300 font-light">{progress.completed}/{progress.total}</span>
        </div>
        <div className="w-full h-2.5 rounded-full bg-warm-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-gold-400 to-amber-400 transition-all duration-1000"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* ── Category Tabs ── */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`cursor-pointer px-3.5 py-2 rounded-xl text-[11px] font-medium whitespace-nowrap transition-all duration-500 ${
              activeCategory === cat
                ? "bg-slate-900 text-white"
                : "bg-warm-50 border border-warm-200/30 text-slate-500 hover:bg-warm-100/60"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* ── Add Form ── */}
      {showAddForm && (
        <div className="rounded-2xl border border-warm-200/50 bg-white p-5 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="Task title *"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              className={`col-span-1 sm:col-span-3 ${INPUT_CLS}`}
              autoFocus
            />
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className={`${INPUT_CLS} appearance-none cursor-pointer`}
            >
              <option value="">Category (optional)</option>
              {CATEGORIES.filter((c) => c !== "All").map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <input
              type="date"
              value={newDueDate}
              onChange={(e) => setNewDueDate(e.target.value)}
              className={INPUT_CLS}
            />
            <div className="flex gap-2">
              <button
                onClick={handleAdd}
                disabled={!newTitle.trim()}
                className="cursor-pointer flex-1 px-4 py-3 bg-slate-900 text-white rounded-xl text-[12px] font-medium disabled:opacity-40 hover:bg-slate-800 transition-all duration-500"
              >
                Add
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="cursor-pointer px-4 py-3 border border-warm-200/40 text-slate-500 rounded-xl text-[12px] hover:bg-warm-50 transition-all duration-500"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Empty State ── */}
      {!loading && items.length === 0 && (
        <div className="text-center py-16 rounded-2xl border border-warm-200/50 bg-white">
          {seeding ? (
            <>
              <div className="w-10 h-10 border-2 border-warm-200/40 border-t-gold-400 rounded-full animate-spin mx-auto mb-4" />
              <h3 className="text-[15px] font-semibold text-slate-700 mb-2">Populating your checklist...</h3>
              <p className="text-[13px] text-slate-400 font-light">Adding suggested wedding tasks. This will only take a moment.</p>
            </>
          ) : (
            <>
              <div className="w-14 h-14 rounded-xl bg-warm-50 border border-warm-200/40 flex items-center justify-center mx-auto mb-4">
                <FiClipboard className="w-6 h-6 text-slate-300" />
              </div>
              <h3 className="text-[15px] font-semibold text-slate-700 mb-2">No tasks yet</h3>
              <p className="text-[13px] text-slate-400 font-light mb-6 max-w-sm mx-auto">
                Get started by adding your first task or populate with suggested wedding tasks.
              </p>
              <button
                onClick={handleSeed}
                className="cursor-pointer px-6 py-3 bg-slate-900 text-white rounded-full text-[13px] font-medium hover:bg-slate-800 transition-all duration-500"
              >
                Populate Suggested Tasks
              </button>
            </>
          )}
        </div>
      )}

      {/* ── Loading ── */}
      {loading && (
        <div className="space-y-2.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-warm-50 border border-warm-200/20 rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {/* ── Items List ── */}
      {!loading && items.length > 0 && (
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className={`group flex items-center gap-3.5 px-5 py-3.5 rounded-xl border transition-all duration-500 ${
                item.isCompleted
                  ? "border-warm-200/20 bg-warm-50/20 opacity-60"
                  : "border-warm-200/40 bg-white hover:border-warm-200/60 hover:shadow-[0_2px_12px_rgba(15,23,42,0.04)]"
              }`}
            >
              {editingId === item.id ? (
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleEditSave()}
                    className={`sm:col-span-2 ${INPUT_CLS}`}
                    autoFocus
                  />
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className={`${INPUT_CLS} appearance-none cursor-pointer`}
                  >
                    <option value="">No category</option>
                    {CATEGORIES.filter((c) => c !== "All").map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <div className="flex gap-1.5">
                    <input
                      type="date"
                      value={editDueDate}
                      onChange={(e) => setEditDueDate(e.target.value)}
                      className={`flex-1 ${INPUT_CLS}`}
                    />
                    <button onClick={handleEditSave} className="cursor-pointer w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-200/40 flex items-center justify-center text-emerald-500 hover:bg-emerald-100/60 transition-all shrink-0 self-center">
                      <FiCheck className="w-4 h-4" />
                    </button>
                    <button onClick={() => setEditingId(null)} className="cursor-pointer w-9 h-9 rounded-lg bg-warm-50 border border-warm-200/40 flex items-center justify-center text-slate-400 hover:bg-warm-100/60 transition-all shrink-0 self-center">
                      <FiX className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => handleToggle(item.id)}
                    className={`cursor-pointer w-5.5 h-5.5 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all duration-500 ${
                      item.isCompleted
                        ? "bg-gold-400 border-gold-400 text-white"
                        : "border-warm-200/60 hover:border-gold-400/60"
                    }`}
                  >
                    {item.isCompleted && <FiCheck className="w-3 h-3" />}
                  </button>

                  <div className="flex-1 min-w-0">
                    <p className={`text-[13px] font-medium truncate ${item.isCompleted ? "line-through text-slate-400" : "text-slate-800"}`}>
                      {item.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {item.category && (
                        <span className="text-[10px] px-2 py-0.5 bg-warm-50 border border-warm-200/30 text-slate-500 rounded-lg font-medium">
                          {item.category}
                        </span>
                      )}
                      {item.dueDate && (
                        <span className="text-[10px] text-slate-300 font-light flex items-center gap-1">
                          <FiCalendar className="w-2.5 h-2.5" />
                          {new Date(item.dueDate + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <button onClick={() => startEdit(item)} className="cursor-pointer p-1.5 text-slate-300 hover:text-slate-500 rounded-lg transition-colors" title="Edit">
                      <FiEdit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="cursor-pointer p-1.5 text-slate-300 hover:text-red-400 rounded-lg transition-colors" title="Delete">
                      <FiTrash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
