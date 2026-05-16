import { pool } from "../../../config/db.js";
import type {
  BudgetCategory,
  CreateBudgetCategoryDTO,
  UpdateBudgetCategoryDTO,
  CategoryVendor,
  CreateCategoryVendorDTO,
} from "../domain/types.js";

function rowToCategory(row: Record<string, unknown>): BudgetCategory {
  return {
    id: row.id as string,
    budgetId: row.budget_id as string,
    name: row.name as string,
    allocatedAmount: parseFloat(row.allocated_amount as string),
    sortOrder: row.sort_order as number,
    contactedAt: row.contacted_at ? new Date(row.contacted_at as string) : null,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}

export async function findByBudgetId(budgetId: string): Promise<BudgetCategory[]> {
  const { rows } = await pool.query(
    "SELECT * FROM budget_categories WHERE budget_id = $1 ORDER BY sort_order, created_at",
    [budgetId],
  );
  return rows.map(rowToCategory);
}

export async function create(dto: CreateBudgetCategoryDTO): Promise<BudgetCategory> {
  const { rows } = await pool.query(
    `INSERT INTO budget_categories (budget_id, name, allocated_amount, sort_order)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [dto.budgetId, dto.name, dto.allocatedAmount, dto.sortOrder ?? 0],
  );
  return rowToCategory(rows[0]);
}

export async function bulkCreate(
  budgetId: string,
  categories: { name: string; allocatedAmount: number; sortOrder: number }[],
): Promise<BudgetCategory[]> {
  if (categories.length === 0) return [];

  const values: unknown[] = [];
  const placeholders: string[] = [];
  let idx = 1;

  for (const cat of categories) {
    placeholders.push(`($${idx++}, $${idx++}, $${idx++}, $${idx++})`);
    values.push(budgetId, cat.name, cat.allocatedAmount, cat.sortOrder);
  }

  const { rows } = await pool.query(
    `INSERT INTO budget_categories (budget_id, name, allocated_amount, sort_order)
     VALUES ${placeholders.join(", ")}
     RETURNING *`,
    values,
  );
  return rows.map(rowToCategory);
}

export async function update(
  id: string,
  budgetId: string,
  dto: UpdateBudgetCategoryDTO,
): Promise<BudgetCategory | null> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (dto.name !== undefined) {
    fields.push(`name = $${idx++}`);
    values.push(dto.name);
  }
  if (dto.allocatedAmount !== undefined) {
    fields.push(`allocated_amount = $${idx++}`);
    values.push(dto.allocatedAmount);
  }
  if (dto.sortOrder !== undefined) {
    fields.push(`sort_order = $${idx++}`);
    values.push(dto.sortOrder);
  }

  if (fields.length === 0) return null;

  fields.push("updated_at = NOW()");
  values.push(id, budgetId);

  const { rows } = await pool.query(
    `UPDATE budget_categories SET ${fields.join(", ")} WHERE id = $${idx++} AND budget_id = $${idx} RETURNING *`,
    values,
  );
  return rows.length ? rowToCategory(rows[0]) : null;
}

export async function deleteAllByBudgetId(budgetId: string): Promise<void> {
  await pool.query("DELETE FROM budget_categories WHERE budget_id = $1", [budgetId]);
}

export async function deleteById(id: string, budgetId: string): Promise<boolean> {
  const { rowCount } = await pool.query(
    "DELETE FROM budget_categories WHERE id = $1 AND budget_id = $2",
    [id, budgetId],
  );
  return (rowCount ?? 0) > 0;
}

export async function markContacted(categoryId: string): Promise<void> {
  await pool.query(
    "UPDATE budget_categories SET contacted_at = NOW() WHERE id = $1",
    [categoryId],
  );
}

// ──────────────────── Category Vendors ────────────────────

function rowToVendor(row: Record<string, unknown>): CategoryVendor {
  return {
    id: row.id as string,
    budgetCategoryId: row.budget_category_id as string,
    vendorProfileId: row.vendor_profile_id as string,
    businessName: row.business_name as string,
    priceRangeMin: row.price_range_min != null ? parseFloat(row.price_range_min as string) : null,
    priceRangeMax: row.price_range_max != null ? parseFloat(row.price_range_max as string) : null,
    rating: parseFloat(row.rating as string),
    reviewCount: row.review_count as number,
    location: (row.location as string) || null,
    reason: row.reason as string,
    createdAt: new Date(row.created_at as string),
  };
}

export async function findVendorsByCategoryIds(categoryIds: string[]): Promise<CategoryVendor[]> {
  if (categoryIds.length === 0) return [];
  const placeholders = categoryIds.map((_, i) => `$${i + 1}`).join(", ");
  const { rows } = await pool.query(
    `SELECT * FROM budget_category_vendors WHERE budget_category_id IN (${placeholders}) ORDER BY created_at`,
    categoryIds,
  );
  return rows.map(rowToVendor);
}

export async function bulkCreateVendors(vendors: CreateCategoryVendorDTO[]): Promise<CategoryVendor[]> {
  if (vendors.length === 0) return [];

  const values: unknown[] = [];
  const placeholders: string[] = [];
  let idx = 1;

  for (const v of vendors) {
    placeholders.push(
      `($${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++})`,
    );
    values.push(
      v.budgetCategoryId,
      v.vendorProfileId,
      v.businessName,
      v.priceRangeMin ?? null,
      v.priceRangeMax ?? null,
      v.rating,
      v.reviewCount,
      v.location ?? null,
      v.reason,
    );
  }

  const { rows } = await pool.query(
    `INSERT INTO budget_category_vendors
       (budget_category_id, vendor_profile_id, business_name, price_range_min, price_range_max, rating, review_count, location, reason)
     VALUES ${placeholders.join(", ")}
     RETURNING *`,
    values,
  );
  return rows.map(rowToVendor);
}
