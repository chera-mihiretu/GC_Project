import { pool } from "../../../config/db.js";

export async function getUserEmailById(userId: string): Promise<string | null> {
  const { rows } = await pool.query(
    `SELECT email FROM "user" WHERE id = $1 LIMIT 1`,
    [userId],
  );
  return rows.length ? (rows[0].email as string) : null;
}
