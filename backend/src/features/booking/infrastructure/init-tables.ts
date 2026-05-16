import { pool } from "../../../config/db.js";

export async function initBookingTables(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS bookings (
      id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      couple_id          TEXT NOT NULL,
      vendor_id          TEXT NOT NULL,
      vendor_profile_id  TEXT NOT NULL REFERENCES vendor_profiles(id),
      service_category   TEXT NOT NULL,
      event_date         DATE NOT NULL,
      message            TEXT,
      status             TEXT NOT NULL DEFAULT 'pending',
      decline_reason     TEXT,
      created_at         TIMESTAMPTZ DEFAULT NOW(),
      updated_at         TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_bookings_couple ON bookings(couple_id)
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_bookings_vendor ON bookings(vendor_id)
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status)
  `);

  // Migration: add requested_amount and requested_currency columns
  await pool.query(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS requested_amount DECIMAL(12,2)`);
  await pool.query(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS requested_currency TEXT DEFAULT 'ETB'`);

  // FIX-02: Partial unique index to prevent double-booking at the DB level
  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_vendor_date_unique
      ON bookings (vendor_profile_id, event_date)
      WHERE status IN ('accepted', 'deposit_paid', 'payment_requested')
  `);

  // FIX-10: CHECK constraint on status column (updated to include payment_requested)
  await pool.query(`
    DO $$ BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.check_constraints
        WHERE constraint_name = 'bookings_status_check'
      ) THEN
        ALTER TABLE bookings DROP CONSTRAINT bookings_status_check;
      END IF;
      ALTER TABLE bookings ADD CONSTRAINT bookings_status_check
        CHECK (status IN ('pending','accepted','declined','payment_requested','deposit_paid','completed','cancelled'));
    END $$
  `);
}
