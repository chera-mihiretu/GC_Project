import { pool } from "../../../config/db.js";

export interface AISession {
  id: string;
  userId: string;
  title: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AIMessage {
  id: string;
  sessionId: string;
  role: "user" | "model";
  content: string;
  vendorCards: unknown[] | null;
  pendingAction: Record<string, unknown> | null;
  createdAt: Date;
}

function rowToSession(row: Record<string, unknown>): AISession {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    title: (row.title as string) || null,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}

function rowToMessage(row: Record<string, unknown>): AIMessage {
  return {
    id: row.id as string,
    sessionId: row.session_id as string,
    role: row.role as "user" | "model",
    content: row.content as string,
    vendorCards: (row.vendor_cards as unknown[]) || null,
    pendingAction: (row.pending_action as Record<string, unknown>) || null,
    createdAt: new Date(row.created_at as string),
  };
}

export async function createSession(userId: string, title?: string): Promise<AISession> {
  const { rows } = await pool.query(
    `INSERT INTO ai_sessions (user_id, title) VALUES ($1, $2) RETURNING *`,
    [userId, title || null],
  );
  return rowToSession(rows[0]);
}

export async function listSessionsByUser(
  userId: string,
  limit = 50,
  offset = 0,
): Promise<{ sessions: AISession[]; total: number }> {
  const countResult = await pool.query(
    `SELECT COUNT(*)::int AS total FROM ai_sessions WHERE user_id = $1`,
    [userId],
  );
  const total = countResult.rows[0]?.total ?? 0;

  const { rows } = await pool.query(
    `SELECT * FROM ai_sessions WHERE user_id = $1 ORDER BY updated_at DESC LIMIT $2 OFFSET $3`,
    [userId, limit, offset],
  );
  return { sessions: rows.map(rowToSession), total };
}

export async function getSessionById(sessionId: string): Promise<AISession | null> {
  const { rows } = await pool.query(
    `SELECT * FROM ai_sessions WHERE id = $1`,
    [sessionId],
  );
  return rows.length > 0 ? rowToSession(rows[0]) : null;
}

export async function deleteSession(sessionId: string): Promise<boolean> {
  const result = await pool.query(
    `DELETE FROM ai_sessions WHERE id = $1`,
    [sessionId],
  );
  return (result.rowCount ?? 0) > 0;
}

export async function updateSessionTitle(sessionId: string, title: string): Promise<void> {
  await pool.query(
    `UPDATE ai_sessions SET title = $1, updated_at = NOW() WHERE id = $2`,
    [title, sessionId],
  );
}

export async function touchSession(sessionId: string): Promise<void> {
  await pool.query(
    `UPDATE ai_sessions SET updated_at = NOW() WHERE id = $1`,
    [sessionId],
  );
}

export async function addMessage(
  sessionId: string,
  role: "user" | "model",
  content: string,
  vendorCards?: unknown[],
  pendingAction?: Record<string, unknown>,
): Promise<AIMessage> {
  const { rows } = await pool.query(
    `INSERT INTO ai_messages (session_id, role, content, vendor_cards, pending_action)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [
      sessionId,
      role,
      content,
      vendorCards ? JSON.stringify(vendorCards) : null,
      pendingAction ? JSON.stringify(pendingAction) : null,
    ],
  );
  await touchSession(sessionId);
  return rowToMessage(rows[0]);
}

export async function getMessagesBySession(
  sessionId: string,
  limit = 200,
  offset = 0,
): Promise<AIMessage[]> {
  const { rows } = await pool.query(
    `SELECT * FROM ai_messages WHERE session_id = $1 ORDER BY created_at ASC LIMIT $2 OFFSET $3`,
    [sessionId, limit, offset],
  );
  return rows.map(rowToMessage);
}
