export interface Budget {
  id: string;
  userId: string;
  name: string;
  totalAmount: number;
  currency: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateBudgetDTO {
  userId: string;
  totalAmount: number;
  name?: string;
  currency?: string;
  notes?: string;
}

export interface UpdateBudgetDTO {
  totalAmount?: number;
  name?: string;
  currency?: string;
  notes?: string | null;
}

export interface BudgetCategory {
  id: string;
  budgetId: string;
  name: string;
  allocatedAmount: number;
  sortOrder: number;
  contactedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateBudgetCategoryDTO {
  budgetId: string;
  name: string;
  allocatedAmount: number;
  sortOrder?: number;
}

export interface UpdateBudgetCategoryDTO {
  name?: string;
  allocatedAmount?: number;
  sortOrder?: number;
}

export interface CategoryVendor {
  id: string;
  budgetCategoryId: string;
  vendorProfileId: string;
  businessName: string;
  priceRangeMin: number | null;
  priceRangeMax: number | null;
  rating: number;
  reviewCount: number;
  location: string | null;
  reason: string;
  createdAt: Date;
}

export interface CreateCategoryVendorDTO {
  budgetCategoryId: string;
  vendorProfileId: string;
  businessName: string;
  priceRangeMin?: number | null;
  priceRangeMax?: number | null;
  rating: number;
  reviewCount: number;
  location?: string | null;
  reason: string;
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
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateExpenseDTO {
  budgetId: string;
  categoryId?: string | null;
  description: string;
  amount: number;
  vendorName?: string | null;
  expenseDate?: string;
}

export interface UpdateExpenseDTO {
  categoryId?: string | null;
  description?: string;
  amount?: number;
  vendorName?: string | null;
  expenseDate?: string;
}

export interface CategorySpendSummary {
  categoryId: string;
  totalSpent: number;
}
