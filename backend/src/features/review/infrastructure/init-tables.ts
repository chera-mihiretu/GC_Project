import { pool } from "../../../config/db.js";

export async function initReviewTables(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS reviews (
      id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      booking_id        UUID NOT NULL UNIQUE REFERENCES bookings(id),
      couple_id         TEXT NOT NULL,
      vendor_id         TEXT NOT NULL,
      vendor_profile_id TEXT NOT NULL REFERENCES vendor_profiles(id),
      rating            SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
      comment           TEXT,
      is_approved       BOOLEAN NOT NULL DEFAULT true,
      created_at        TIMESTAMPTZ DEFAULT NOW(),
      updated_at        TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_reviews_vendor_profile ON reviews(vendor_profile_id)
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_reviews_couple ON reviews(couple_id)
  `);
}
