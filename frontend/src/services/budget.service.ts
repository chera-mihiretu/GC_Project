import { apiFetch } from "./auth.service";

const BASE = "/api/v1/budget";

export interface Budget {
  id: string;
  userId: string;
  name: string;
  totalAmount: number;
  currency: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function getBudget(): Promise<Budget | null> {
  const res = await apiFetch(BASE);
  if (!res.ok) throw new Error("Failed to load budget");
  const data = await res.json();
  return data.budget ?? null;
}

export async function createBudget(payload: {
  totalAmount: number;
  name?: string;
  currency?: string;
  notes?: string;
}): Promise<Budget> {
  const res = await apiFetch(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.error?.message ?? "Failed to create budget");
  }
  const data = await res.json();
  return data.budget;
}

export async function updateBudget(payload: {
  totalAmount?: number;
  name?: string;
  currency?: string;
  notes?: string | null;
}): Promise<Budget> {
  const res = await apiFetch(BASE, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.error?.message ?? "Failed to update budget");
  }
  const data = await res.json();
  return data.budget;
}

export async function deleteBudget(): Promise<void> {
  const res = await apiFetch(BASE, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete budget");
}

// ──────────────────── Categories ────────────────────

export interface SavedVendor {
  id: string;
  businessName: string;
  priceRangeMin: number | null;
  priceRangeMax: number | null;
  rating: number;
  reviewCount: number;
  location: string | null;
  reason: string;
}

export interface BudgetCategory {
  id: string;
  budgetId: string;
  name: string;
  allocatedAmount: number;
  spentAmount: number;
  sortOrder: number;
  contactedAt: string | null;
  vendors: SavedVendor[];
  createdAt: string;
  updatedAt: string;
}

export interface BudgetCategorySummary {
  categories: BudgetCategory[];
  totalAllocated: number;
  unallocated: number;
  totalSpent: number;
}

export async function listCategories(): Promise<BudgetCategorySummary> {
  const res = await apiFetch(`${BASE}/categories`);
  if (!res.ok) throw new Error("Failed to load categories");
  return res.json();
}

export async function createCategory(payload: {
  name: string;
  allocatedAmount: number;
  sortOrder?: number;
}): Promise<BudgetCategory> {
  const res = await apiFetch(`${BASE}/categories`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.error?.message ?? "Failed to create category");
  }
  const data = await res.json();
  return data.category;
}

export async function updateCategory(
  id: string,
  payload: { name?: string; allocatedAmount?: number; sortOrder?: number },
): Promise<BudgetCategory> {
  const res = await apiFetch(`${BASE}/categories/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.error?.message ?? "Failed to update category");
  }
  const data = await res.json();
  return data.category;
}

export async function deleteCategory(id: string): Promise<void> {
  const res = await apiFetch(`${BASE}/categories/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete category");
}

// ──────────────────── AI Suggest & Bulk Replace ────────────────────

export interface SuggestedVendor {
  id: string;
  businessName: string;
  priceRangeMin: number | null;
  priceRangeMax: number | null;
  rating: number;
  reviewCount: number;
  location: string | null;
  reason: string;
}

export interface SuggestedCategory {
  name: string;
  allocatedAmount: number;
  sortOrder: number;
  vendors: SuggestedVendor[];
}

export interface DroppedCategory {
  name: string;
  reason: string;
}

export interface SuggestCategoriesResponse {
  categories: SuggestedCategory[];
  dropped: DroppedCategory[];
}

export async function suggestCategories(payload: {
  priorities: string[];
  weddingStyle: string;
  extras: string[];
}): Promise<SuggestCategoriesResponse> {
  const res = await apiFetch(`${BASE}/suggest-categories`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.error?.message ?? "Failed to get AI suggestions");
  }
  const data = await res.json();
  return { categories: data.categories, dropped: data.dropped ?? [] };
}

export async function bulkReplaceCategories(
  categories: {
    name: string;
    allocatedAmount: number;
    vendors?: SuggestedVendor[];
  }[],
): Promise<BudgetCategory[]> {
  const res = await apiFetch(`${BASE}/categories`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ categories }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.error?.message ?? "Failed to save categories");
  }
  const data = await res.json();
  return data.categories;
}

// ──────────────────── Contact Vendors ────────────────────

export interface DraftMessageResponse {
  draft: string;
  categoryName: string;
  vendors: { id: string; businessName: string }[];
}

export interface ContactVendorsResponse {
  success: boolean;
  messageSent: string;
  summary: string;
  results: {
    vendorProfileId: string;
    businessName: string;
    conversationId: string;
    sent: boolean;
    error?: string;
  }[];
}

export async function draftVendorMessage(categoryId: string): Promise<DraftMessageResponse> {
  const res = await apiFetch(`${BASE}/categories/${categoryId}/draft-message`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.error?.message ?? "Failed to draft message");
  }
  return res.json();
}

export async function contactCategoryVendors(
  categoryId: string,
  message?: string,
): Promise<ContactVendorsResponse> {
  const res = await apiFetch(`${BASE}/categories/${categoryId}/contact-vendors`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.error?.message ?? "Failed to contact vendors");
  }
  return res.json();
}

// ──────────────────── Expenses ────────────────────

export interface Expense {
  id: string;
  budgetId: string;
  categoryId: string | null;
  description: string;
  amount: number;
  vendorName: string | null;
  expenseDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseListResponse {
  expenses: Expense[];
  total: number;
}

export interface ExpenseSummary {
  totalBudget: number;
  totalSpent: number;
  remaining: number;
  byCategory: { categoryId: string; totalSpent: number }[];
}

export async function listExpenses(opts?: {
  categoryId?: string;
  limit?: number;
  offset?: number;
}): Promise<ExpenseListResponse> {
  const params = new URLSearchParams();
  if (opts?.categoryId) params.set("categoryId", opts.categoryId);
  if (opts?.limit) params.set("limit", String(opts.limit));
  if (opts?.offset) params.set("offset", String(opts.offset));
  const qs = params.toString() ? `?${params.toString()}` : "";
  const res = await apiFetch(`${BASE}/expenses${qs}`);
  if (!res.ok) throw new Error("Failed to load expenses");
  return res.json();
}

export async function getExpenseSummary(): Promise<ExpenseSummary> {
  const res = await apiFetch(`${BASE}/expenses/summary`);
  if (!res.ok) throw new Error("Failed to load expense summary");
  return res.json();
}

export async function createExpense(payload: {
  description: string;
  amount: number;
  categoryId?: string | null;
  vendorName?: string | null;
  expenseDate?: string;
}): Promise<Expense> {
  const res = await apiFetch(`${BASE}/expenses`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.error?.message ?? "Failed to create expense");
  }
  return res.json();
}

export async function updateExpense(
  id: string,
  payload: {
    description?: string;
    amount?: number;
    categoryId?: string | null;
    vendorName?: string | null;
    expenseDate?: string;
  },
): Promise<Expense> {
  const res = await apiFetch(`${BASE}/expenses/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.error?.message ?? "Failed to update expense");
  }
  return res.json();
}

export async function deleteExpense(id: string): Promise<void> {
  const res = await apiFetch(`${BASE}/expenses/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete expense");
}

// ──────────────────── Report ────────────────────

export interface BudgetReportData {
  budget: {
    name: string;
    totalAmount: number;
    currency: string;
    totalSpent: number;
    remaining: number;
    percentUsed: number;
  };
  categories: {
    name: string;
    allocated: number;
    spent: number;
    remaining: number;
    percentUsed: number;
  }[];
  expenses: {
    description: string;
    amount: number;
    vendorName: string | null;
    category: string;
    date: string;
  }[];
  generatedAt: string;
}

export async function getBudgetReport(): Promise<BudgetReportData> {
  const res = await apiFetch(`${BASE}/report`);
  if (!res.ok) throw new Error("Failed to load budget report");
  return res.json();
}

export async function downloadBudgetCSV(): Promise<void> {
  const res = await apiFetch(`${BASE}/report?format=csv`);
  if (!res.ok) throw new Error("Failed to download CSV");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `budget-report-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
