import { pool } from "../../../config/db.js";
import type { Notification } from "../domain/types.js";

function rowToNotification(row: Record<string, unknown>): Notification {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    type: row.type as string,
    title: row.title as string,
    body: row.body as string,
    metadata: (row.metadata ?? {}) as Record<string, unknown>,
    read: row.read as boolean,
    createdAt: new Date(row.created_at as string),
  };
}

export async function createNotification(
  data: Omit<Notification, "id" | "read" | "createdAt">,
): Promise<Notification> {
  const result = await pool.query(
    `INSERT INTO notification (user_id, type, title, body, metadata)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [data.userId, data.type, data.title, data.body, JSON.stringify(data.metadata)],
  );
  return rowToNotification(result.rows[0]);
}

export async function getNotificationsByUser(
  userId: string,
  limit = 20,
  offset = 0,
): Promise<Notification[]> {
  const result = await pool.query(
    `SELECT * FROM notification
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset],
  );
  return result.rows.map(rowToNotification);
}

export async function getUnreadCount(userId: string): Promise<number> {
  const result = await pool.query(
    `SELECT COUNT(*)::int AS count FROM notification WHERE user_id = $1 AND read = FALSE`,
    [userId],
  );
  return result.rows[0].count;
}

export async function markRead(id: string, userId: string): Promise<boolean> {
  const result = await pool.query(
    `UPDATE notification SET read = TRUE WHERE id = $1 AND user_id = $2`,
    [id, userId],
  );
  return (result.rowCount ?? 0) > 0;
}

export async function markAllRead(userId: string): Promise<void> {
  await pool.query(
    `UPDATE notification SET read = TRUE WHERE user_id = $1 AND read = FALSE`,
    [userId],
  );
}
