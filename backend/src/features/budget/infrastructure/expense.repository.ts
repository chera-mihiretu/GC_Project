import { pool } from "../../../config/db.js";
import type {
  Expense,
  CreateExpenseDTO,
  UpdateExpenseDTO,
  CategorySpendSummary,
} from "../domain/types.js";

function rowToExpense(row: Record<string, unknown>): Expense {
  return {
    id: row.id as string,
    budgetId: row.budget_id as string,
    categoryId: (row.category_id as string) || null,
    description: row.description as string,
    amount: parseFloat(row.amount as string),
    vendorName: (row.vendor_name as string) || null,
    expenseDate: row.expense_date instanceof Date
      ? row.expense_date.toISOString().slice(0, 10)
      : String(row.expense_date).slice(0, 10),
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}

export async function findByBudgetId(
  budgetId: string,
  opts: { categoryId?: string; limit?: number; offset?: number } = {},
): Promise<{ expenses: Expense[]; total: number }> {
  const conditions = ["e.budget_id = $1"];
  const params: unknown[] = [budgetId];
  let idx = 2;

  if (opts.categoryId) {
    conditions.push(`e.category_id = $${idx++}`);
    params.push(opts.categoryId);
  }

  const where = conditions.join(" AND ");

  const countResult = await pool.query(
    `SELECT COUNT(*) FROM expenses e WHERE ${where}`,
    params,
  );
  const total = parseInt(countResult.rows[0].count as string, 10);

  const limit = opts.limit ?? 50;
  const offset = opts.offset ?? 0;
  params.push(limit, offset);

  const { rows } = await pool.query(
    `SELECT e.* FROM expenses e
     WHERE ${where}
     ORDER BY e.expense_date DESC, e.created_at DESC
     LIMIT $${idx++} OFFSET $${idx}`,
    params,
  );

  return { expenses: rows.map(rowToExpense), total };
}

export async function findById(id: string, budgetId: string): Promise<Expense | null> {
  const { rows } = await pool.query(
    "SELECT * FROM expenses WHERE id = $1 AND budget_id = $2",
    [id, budgetId],
  );
  return rows.length ? rowToExpense(rows[0]) : null;
}

export async function create(dto: CreateExpenseDTO): Promise<Expense> {
  const { rows } = await pool.query(
    `INSERT INTO expenses (budget_id, category_id, description, amount, vendor_name, expense_date)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      dto.budgetId,
      dto.categoryId ?? null,
      dto.description,
      dto.amount,
      dto.vendorName ?? null,
      dto.expenseDate ?? new Date().toISOString().slice(0, 10),
    ],
  );
  return rowToExpense(rows[0]);
}

export async function update(
  id: string,
  budgetId: string,
  dto: UpdateExpenseDTO,
): Promise<Expense | null> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (dto.categoryId !== undefined) {
    fields.push(`category_id = $${idx++}`);
    values.push(dto.categoryId);
  }
  if (dto.description !== undefined) {
    fields.push(`description = $${idx++}`);
    values.push(dto.description);
  }
  if (dto.amount !== undefined) {
    fields.push(`amount = $${idx++}`);
    values.push(dto.amount);
  }
  if (dto.vendorName !== undefined) {
    fields.push(`vendor_name = $${idx++}`);
    values.push(dto.vendorName);
  }
  if (dto.expenseDate !== undefined) {
    fields.push(`expense_date = $${idx++}`);
    values.push(dto.expenseDate);
  }

  if (fields.length === 0) return findById(id, budgetId);

  fields.push("updated_at = NOW()");
  values.push(id, budgetId);

  const { rows } = await pool.query(
    `UPDATE expenses SET ${fields.join(", ")} WHERE id = $${idx++} AND budget_id = $${idx} RETURNING *`,
    values,
  );
  return rows.length ? rowToExpense(rows[0]) : null;
}

export async function deleteById(id: string, budgetId: string): Promise<boolean> {
  const { rowCount } = await pool.query(
    "DELETE FROM expenses WHERE id = $1 AND budget_id = $2",
    [id, budgetId],
  );
  return (rowCount ?? 0) > 0;
}

export async function getTotalSpentByBudget(budgetId: string): Promise<number> {
  const { rows } = await pool.query(
    "SELECT COALESCE(SUM(amount), 0) AS total FROM expenses WHERE budget_id = $1",
    [budgetId],
  );
  return parseFloat(rows[0].total as string);
}

export async function getSpentByCategory(budgetId: string): Promise<CategorySpendSummary[]> {
  const { rows } = await pool.query(
    `SELECT category_id, COALESCE(SUM(amount), 0) AS total_spent
     FROM expenses
     WHERE budget_id = $1 AND category_id IS NOT NULL
     GROUP BY category_id`,
    [budgetId],
  );
  return rows.map((r: Record<string, unknown>) => ({
    categoryId: r.category_id as string,
    totalSpent: parseFloat(r.total_spent as string),
  }));
}
