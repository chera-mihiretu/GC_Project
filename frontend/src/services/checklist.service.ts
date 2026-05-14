import { apiFetch } from "./auth.service";

const BASE = "/api/v1/checklist";

export interface ChecklistItem {
  id: string;
  userId: string;
  title: string;
  category: string | null;
  dueDate: string | null;
  isCompleted: boolean;
  sortOrder: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChecklistProgress {
  total: number;
  completed: number;
}

export async function listChecklist(category?: string): Promise<ChecklistItem[]> {
  const url = category ? `${BASE}?category=${encodeURIComponent(category)}` : BASE;
  const res = await apiFetch(url);
  if (!res.ok) throw new Error("Failed to load checklist");
  const data = await res.json();
  return data.items;
}

export async function getChecklistProgress(): Promise<ChecklistProgress> {
  const res = await apiFetch(`${BASE}/progress`);
  if (!res.ok) throw new Error("Failed to load progress");
  return res.json();
}

export async function createChecklistItem(body: {
  title: string;
  category?: string;
  dueDate?: string;
  notes?: string;
}): Promise<ChecklistItem> {
  const res = await apiFetch(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message ?? "Failed to create item");
  }
  const data = await res.json();
  return data.item;
}

export async function updateChecklistItem(
  id: string,
  body: { title?: string; category?: string | null; dueDate?: string | null; notes?: string | null; sortOrder?: number },
): Promise<ChecklistItem> {
  const res = await apiFetch(`${BASE}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Failed to update item");
  const data = await res.json();
  return data.item;
}

export async function toggleChecklistItem(id: string): Promise<ChecklistItem> {
  const res = await apiFetch(`${BASE}/${id}/toggle`, { method: "PATCH" });
  if (!res.ok) throw new Error("Failed to toggle item");
  const data = await res.json();
  return data.item;
}

export async function deleteChecklistItem(id: string): Promise<void> {
  const res = await apiFetch(`${BASE}/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete item");
}

export async function seedChecklist(): Promise<{ seeded: boolean; count?: number }> {
  const res = await apiFetch(`${BASE}/seed`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to seed checklist");
  return res.json();
}
