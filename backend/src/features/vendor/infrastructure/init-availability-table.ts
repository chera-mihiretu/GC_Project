import { pool } from "../../../config/db.js";

export async function initAvailabilityTable(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS vendor_availability (
      id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      vendor_profile_id  TEXT NOT NULL REFERENCES vendor_profiles(id),
      start_date         DATE NOT NULL,
      end_date           DATE NOT NULL,
      note               TEXT,
      created_at         TIMESTAMPTZ DEFAULT NOW(),
      CONSTRAINT chk_date_range CHECK (end_date >= start_date)
    )
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_vendor_availability_profile
    ON vendor_availability(vendor_profile_id, start_date, end_date)
  `);
}
