"use client";

import { useState, useEffect, useCallback } from "react";
import {
  FiPlus,
  FiTrash2,
  FiEdit2,
  FiCheck,
  FiX,
  FiClipboard,
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
  "All",
  "Venue",
  "Catering",
  "Attire",
  "Decor",
  "Music",
  "Photography",
  "Guests",
  "Planning",
  "Budget",
  "Logistics",
  "Legal",
  "Ceremony",
];

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

  useEffect(() => {
    setLoading(true);
    loadData();
  }, [loadData]);

  const handleAdd = async () => {
    if (!newTitle.trim()) return;
    try {
      await createChecklistItem({
        title: newTitle.trim(),
        category: newCategory || undefined,
        dueDate: newDueDate || undefined,
      });
      setNewTitle("");
      setNewCategory("");
      setNewDueDate("");
      setShowAddForm(false);
      loadData();
    } catch (err) {
      console.error("Failed to add item:", err);
    }
  };

  const handleToggle = async (id: string) => {
    try {
      const updated = await toggleChecklistItem(id);
      setItems((prev) => prev.map((i) => (i.id === id ? updated : i)));
      setProgress((prev) => ({
        total: prev.total,
        completed: updated.isCompleted ? prev.completed + 1 : prev.completed - 1,
      }));
    } catch (err) {
      console.error("Failed to toggle item:", err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteChecklistItem(id);
      const deleted = items.find((i) => i.id === id);
      setItems((prev) => prev.filter((i) => i.id !== id));
      setProgress((prev) => ({
        total: prev.total - 1,
        completed: deleted?.isCompleted ? prev.completed - 1 : prev.completed,
      }));
    } catch (err) {
      console.error("Failed to delete item:", err);
    }
  };

  const startEdit = (item: ChecklistItem) => {
    setEditingId(item.id);
    setEditTitle(item.title);
    setEditCategory(item.category || "");
    setEditDueDate(item.dueDate || "");
  };

  const handleEditSave = async () => {
    if (!editingId || !editTitle.trim()) return;
    try {
      const updated = await updateChecklistItem(editingId, {
        title: editTitle.trim(),
        category: editCategory || null,
        dueDate: editDueDate || null,
      });
      setItems((prev) => prev.map((i) => (i.id === editingId ? updated : i)));
      setEditingId(null);
    } catch (err) {
      console.error("Failed to update item:", err);
    }
  };

  const handleSeed = async () => {
    try {
      const result = await seedChecklist();
      if (result.seeded) loadData();
    } catch (err) {
      console.error("Failed to seed checklist:", err);
    }
  };

  const progressPercent = progress.total > 0
    ? Math.round((progress.completed / progress.total) * 100)
    : 0;

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Wedding Checklist</h1>
          <p className="text-sm text-gray-500 mt-1">
            {progress.completed} of {progress.total} tasks completed
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 text-white rounded-lg text-sm font-medium hover:bg-rose-700 transition-colors"
        >
          <FiPlus className="w-4 h-4" />
          Add Task
        </button>
      </div>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
          <span>{progressPercent}% complete</span>
          <span>{progress.completed}/{progress.total}</span>
        </div>
        <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-rose-500 to-pink-500 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex gap-1.5 mb-5 overflow-x-auto pb-2 scrollbar-hide">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              activeCategory === cat
                ? "bg-rose-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Add form */}
      {showAddForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="Task title *"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              className="col-span-1 sm:col-span-3 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
              autoFocus
            />
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-rose-400"
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
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-rose-400"
            />
            <div className="flex gap-2">
              <button
                onClick={handleAdd}
                disabled={!newTitle.trim()}
                className="flex-1 px-3 py-2 bg-rose-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-rose-700 transition-colors"
              >
                Add
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="px-3 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && items.length === 0 && (
        <div className="text-center py-16">
          <FiClipboard className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">No tasks yet</h3>
          <p className="text-sm text-gray-500 mb-6">
            Get started by adding your first task or populate with suggested wedding tasks.
          </p>
          <button
            onClick={handleSeed}
            className="px-5 py-2.5 bg-rose-600 text-white rounded-lg text-sm font-medium hover:bg-rose-700 transition-colors"
          >
            Populate Suggested Tasks
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {/* Items list */}
      {!loading && items.length > 0 && (
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className={`group flex items-center gap-3 px-4 py-3 bg-white border rounded-xl transition-all ${
                item.isCompleted
                  ? "border-gray-100 opacity-60"
                  : "border-gray-200 hover:border-rose-200 hover:shadow-sm"
              }`}
            >
              {editingId === item.id ? (
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleEditSave()}
                    className="sm:col-span-2 px-2 py-1 border border-gray-200 rounded text-sm outline-none focus:border-rose-400"
                    autoFocus
                  />
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="px-2 py-1 border border-gray-200 rounded text-sm outline-none"
                  >
                    <option value="">No category</option>
                    {CATEGORIES.filter((c) => c !== "All").map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <div className="flex gap-1">
                    <input
                      type="date"
                      value={editDueDate}
                      onChange={(e) => setEditDueDate(e.target.value)}
                      className="flex-1 px-2 py-1 border border-gray-200 rounded text-sm outline-none"
                    />
                    <button onClick={handleEditSave} className="p-1 text-green-600 hover:bg-green-50 rounded">
                      <FiCheck className="w-4 h-4" />
                    </button>
                    <button onClick={() => setEditingId(null)} className="p-1 text-gray-400 hover:bg-gray-50 rounded">
                      <FiX className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => handleToggle(item.id)}
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                      item.isCompleted
                        ? "bg-rose-500 border-rose-500 text-white"
                        : "border-gray-300 hover:border-rose-400"
                    }`}
                  >
                    {item.isCompleted && <FiCheck className="w-3 h-3" />}
                  </button>

                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${item.isCompleted ? "line-through text-gray-400" : "text-gray-800"}`}>
                      {item.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {item.category && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-full">
                          {item.category}
                        </span>
                      )}
                      {item.dueDate && (
                        <span className="text-[10px] text-gray-400">
                          Due: {new Date(item.dueDate + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => startEdit(item)}
                      className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    >
                      <FiEdit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
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
