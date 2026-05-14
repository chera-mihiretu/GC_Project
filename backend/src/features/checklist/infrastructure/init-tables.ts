import { pool } from "../../../config/db.js";

export async function initChecklistTables(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS checklist_items (
      id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id         TEXT NOT NULL,
      title           TEXT NOT NULL,
      category        TEXT,
      due_date        DATE,
      is_completed    BOOLEAN DEFAULT FALSE,
      sort_order      INTEGER DEFAULT 0,
      notes           TEXT,
      created_at      TIMESTAMPTZ DEFAULT NOW(),
      updated_at      TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_checklist_user ON checklist_items(user_id);
  `);
  console.log("[Checklist] Tables initialized");
}
