import { pool } from "../../../config/db.js";

export async function initReviewPhotoTables(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS review_photos (
      id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      review_id  UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
      url        TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_review_photos_review ON review_photos(review_id)
  `);
}
