import { pool } from "../../../config/db.js";

export async function initCoupleTables(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS couple_profiles (
      id                TEXT PRIMARY KEY,
      user_id           TEXT NOT NULL UNIQUE,
      wedding_date      DATE,
      budget_currency   TEXT NOT NULL DEFAULT 'ETB',
      estimated_guests  INTEGER,
      wedding_theme     TEXT,
      wedding_location  TEXT,
      latitude          DECIMAL(10,8),
      longitude         DECIMAL(11,8),
      partner_name      TEXT,
      created_at        TIMESTAMPTZ DEFAULT NOW(),
      updated_at        TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  // Safe migration for existing databases
  for (const col of ["latitude DECIMAL(10,8)", "longitude DECIMAL(11,8)"]) {
    await pool.query(
      `ALTER TABLE couple_profiles ADD COLUMN IF NOT EXISTS ${col}`,
    );
  }

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_couple_profiles_user_id ON couple_profiles(user_id)
  `);
}
