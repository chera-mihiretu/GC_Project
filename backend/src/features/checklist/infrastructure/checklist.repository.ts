import { pool } from "../../../config/db.js";
import type {
  ChecklistItem,
  CreateChecklistDTO,
  UpdateChecklistDTO,
  ChecklistProgress,
} from "../domain/types.js";

function toDateString(d: unknown): string | null {
  if (!d) return null;
  if (d instanceof Date) {
    return d.toISOString().split("T")[0];
  }
  return String(d).split("T")[0];
}

function rowToItem(row: Record<string, unknown>): ChecklistItem {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    title: row.title as string,
    category: (row.category as string) ?? null,
    dueDate: toDateString(row.due_date),
    isCompleted: row.is_completed as boolean,
    sortOrder: Number(row.sort_order ?? 0),
    notes: (row.notes as string) ?? null,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}

export async function findByUserId(
  userId: string,
  category?: string,
): Promise<ChecklistItem[]> {
  const conditions: string[] = ["user_id = $1"];
  const values: unknown[] = [userId];

  if (category) {
    conditions.push("category = $2");
    values.push(category);
  }

  const where = `WHERE ${conditions.join(" AND ")}`;
  const { rows } = await pool.query(
    `SELECT * FROM checklist_items ${where}
     ORDER BY is_completed ASC, sort_order ASC, created_at ASC`,
    values,
  );
  return rows.map(rowToItem);
}

export async function create(dto: CreateChecklistDTO): Promise<ChecklistItem> {
  const { rows } = await pool.query(
    `INSERT INTO checklist_items (user_id, title, category, due_date, sort_order, notes)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      dto.userId,
      dto.title,
      dto.category ?? null,
      dto.dueDate ?? null,
      dto.sortOrder ?? 0,
      dto.notes ?? null,
    ],
  );
  return rowToItem(rows[0]);
}

export async function update(
  id: string,
  userId: string,
  dto: UpdateChecklistDTO,
): Promise<ChecklistItem | null> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (dto.title !== undefined) {
    fields.push(`title = $${idx++}`);
    values.push(dto.title);
  }
  if (dto.category !== undefined) {
    fields.push(`category = $${idx++}`);
    values.push(dto.category);
  }
  if (dto.dueDate !== undefined) {
    fields.push(`due_date = $${idx++}`);
    values.push(dto.dueDate);
  }
  if (dto.sortOrder !== undefined) {
    fields.push(`sort_order = $${idx++}`);
    values.push(dto.sortOrder);
  }
  if (dto.notes !== undefined) {
    fields.push(`notes = $${idx++}`);
    values.push(dto.notes);
  }
  if (dto.isCompleted !== undefined) {
    fields.push(`is_completed = $${idx++}`);
    values.push(dto.isCompleted);
  }

  if (fields.length === 0) return null;

  fields.push("updated_at = NOW()");
  values.push(id, userId);

  const { rows } = await pool.query(
    `UPDATE checklist_items SET ${fields.join(", ")}
     WHERE id = $${idx++} AND user_id = $${idx}
     RETURNING *`,
    values,
  );
  return rows.length ? rowToItem(rows[0]) : null;
}

export async function toggleComplete(
  id: string,
  userId: string,
): Promise<ChecklistItem | null> {
  const { rows } = await pool.query(
    `UPDATE checklist_items
     SET is_completed = NOT is_completed, updated_at = NOW()
     WHERE id = $1 AND user_id = $2
     RETURNING *`,
    [id, userId],
  );
  return rows.length ? rowToItem(rows[0]) : null;
}

export async function deleteById(id: string, userId: string): Promise<boolean> {
  const { rowCount } = await pool.query(
    `DELETE FROM checklist_items WHERE id = $1 AND user_id = $2`,
    [id, userId],
  );
  return (rowCount ?? 0) > 0;
}

export async function getProgress(userId: string): Promise<ChecklistProgress> {
  const { rows } = await pool.query(
    `SELECT
       COUNT(*)::int AS total,
       COUNT(*) FILTER (WHERE is_completed = TRUE)::int AS completed
     FROM checklist_items
     WHERE user_id = $1`,
    [userId],
  );
  return {
    total: rows[0]?.total ?? 0,
    completed: rows[0]?.completed ?? 0,
  };
}

export async function countByUserId(userId: string): Promise<number> {
  const { rows } = await pool.query(
    "SELECT COUNT(*)::int AS cnt FROM checklist_items WHERE user_id = $1",
    [userId],
  );
  return rows[0]?.cnt ?? 0;
}

const DEFAULT_TASKS = [
  { title: "Set wedding budget", category: "Budget", sortOrder: 1 },
  { title: "Create guest list", category: "Guests", sortOrder: 2 },
  { title: "Choose wedding date", category: "Planning", sortOrder: 3 },
  { title: "Book venue", category: "Venue", sortOrder: 4 },
  { title: "Hire photographer", category: "Photography", sortOrder: 5 },
  { title: "Hire videographer", category: "Photography", sortOrder: 6 },
  { title: "Book caterer / choose menu", category: "Catering", sortOrder: 7 },
  { title: "Order wedding cake", category: "Catering", sortOrder: 8 },
  { title: "Choose wedding attire", category: "Attire", sortOrder: 9 },
  { title: "Book hair & makeup artist", category: "Attire", sortOrder: 10 },
  { title: "Hire DJ / live band", category: "Music", sortOrder: 11 },
  { title: "Book florist & decor", category: "Decor", sortOrder: 12 },
  { title: "Send invitations", category: "Guests", sortOrder: 13 },
  { title: "Arrange transportation", category: "Logistics", sortOrder: 14 },
  { title: "Plan honeymoon", category: "Planning", sortOrder: 15 },
  { title: "Get marriage license", category: "Legal", sortOrder: 16 },
  { title: "Plan rehearsal dinner", category: "Planning", sortOrder: 17 },
  { title: "Write vows", category: "Ceremony", sortOrder: 18 },
  { title: "Create seating chart", category: "Guests", sortOrder: 19 },
  { title: "Final vendor confirmations", category: "Logistics", sortOrder: 20 },
];

export async function seedDefaults(userId: string): Promise<ChecklistItem[]> {
  const existing = await countByUserId(userId);
  if (existing > 0) return [];

  const items: ChecklistItem[] = [];
  for (const task of DEFAULT_TASKS) {
    const item = await create({
      userId,
      title: task.title,
      category: task.category,
      sortOrder: task.sortOrder,
    });
    items.push(item);
  }
  return items;
}
