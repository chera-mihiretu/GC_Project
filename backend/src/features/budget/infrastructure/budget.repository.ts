import { pool } from "../../../config/db.js";
import type { Budget, CreateBudgetDTO, UpdateBudgetDTO } from "../domain/types.js";

function rowToBudget(row: Record<string, unknown>): Budget {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    name: row.name as string,
    totalAmount: parseFloat(row.total_amount as string),
    currency: row.currency as string,
    notes: (row.notes as string) ?? null,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}

export async function findByUserId(userId: string): Promise<Budget | null> {
  const { rows } = await pool.query(
    "SELECT * FROM budgets WHERE user_id = $1",
    [userId],
  );
  return rows.length ? rowToBudget(rows[0]) : null;
}

export async function findById(budgetId: string): Promise<Budget | null> {
  const { rows } = await pool.query(
    "SELECT * FROM budgets WHERE id = $1",
    [budgetId],
  );
  return rows.length ? rowToBudget(rows[0]) : null;
}

export async function create(dto: CreateBudgetDTO): Promise<Budget> {
  const { rows } = await pool.query(
    `INSERT INTO budgets (user_id, name, total_amount, currency, notes)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [
      dto.userId,
      dto.name ?? "My Wedding Budget",
      dto.totalAmount,
      dto.currency ?? "ETB",
      dto.notes ?? null,
    ],
  );
  return rowToBudget(rows[0]);
}

export async function update(
  userId: string,
  dto: UpdateBudgetDTO,
): Promise<Budget | null> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (dto.totalAmount !== undefined) {
    fields.push(`total_amount = $${idx++}`);
    values.push(dto.totalAmount);
  }
  if (dto.name !== undefined) {
    fields.push(`name = $${idx++}`);
    values.push(dto.name);
  }
  if (dto.currency !== undefined) {
    fields.push(`currency = $${idx++}`);
    values.push(dto.currency);
  }
  if (dto.notes !== undefined) {
    fields.push(`notes = $${idx++}`);
    values.push(dto.notes);
  }

  if (fields.length === 0) return findByUserId(userId);

  fields.push("updated_at = NOW()");
  values.push(userId);

  const { rows } = await pool.query(
    `UPDATE budgets SET ${fields.join(", ")} WHERE user_id = $${idx} RETURNING *`,
    values,
  );
  return rows.length ? rowToBudget(rows[0]) : null;
}

export async function deleteByUserId(userId: string): Promise<boolean> {
  const { rowCount } = await pool.query(
    "DELETE FROM budgets WHERE user_id = $1",
    [userId],
  );
  return (rowCount ?? 0) > 0;
}
