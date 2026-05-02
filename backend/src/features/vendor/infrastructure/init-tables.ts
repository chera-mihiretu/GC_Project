import { pool } from "../../../config/db.js";

export async function initVendorTables(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS vendor_profiles (
      id                TEXT PRIMARY KEY,
      user_id           TEXT NOT NULL,
      business_name     TEXT,
      category          TEXT,
      description       TEXT,
      phone_number      TEXT,
      location          TEXT,
      status            TEXT NOT NULL DEFAULT 'registered',
      rejection_reason  TEXT,
      created_at        TIMESTAMPTZ DEFAULT NOW(),
      updated_at        TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS vendor_documents (
      id                 TEXT PRIMARY KEY,
      vendor_profile_id  TEXT NOT NULL REFERENCES vendor_profiles(id) ON DELETE CASCADE,
      document_type      TEXT NOT NULL,
      file_url           TEXT NOT NULL,
      uploaded_at        TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  // Extend vendor_profiles with new columns (safe for existing DBs)
  const newColumns = [
    "latitude DECIMAL(10,8)",
    "longitude DECIMAL(11,8)",
    "price_range_min NUMERIC",
    "price_range_max NUMERIC",
    "portfolio JSONB DEFAULT '[]'",
    "years_of_experience INTEGER",
    "social_media JSONB",
    "rating NUMERIC(3,2) DEFAULT 0",
    "review_count INTEGER DEFAULT 0",
  ];
  for (const col of newColumns) {
    await pool.query(
      `ALTER TABLE vendor_profiles ADD COLUMN IF NOT EXISTS ${col}`,
    );
  }

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_vendor_profiles_user_id ON vendor_profiles(user_id)
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_vendor_profiles_status ON vendor_profiles(status)
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_vendor_documents_profile_id ON vendor_documents(vendor_profile_id)
  `);

  // Migrate category from TEXT to JSONB (array of strings) for multi-select
  const { rows: colInfo } = await pool.query(`
    SELECT data_type FROM information_schema.columns
    WHERE table_name = 'vendor_profiles' AND column_name = 'category'
  `);
  if (colInfo.length > 0 && colInfo[0].data_type === "text") {
    await pool.query(`
      ALTER TABLE vendor_profiles
        ALTER COLUMN category TYPE JSONB
        USING CASE
          WHEN category IS NULL THEN NULL
          ELSE to_jsonb(ARRAY[category])
        END
    `);
  }

  // GIST index for geo-queries on latitude/longitude via btree_gist extension
  await pool.query(`CREATE EXTENSION IF NOT EXISTS btree_gist`);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_vendor_profiles_geo
    ON vendor_profiles USING gist (latitude, longitude)
  `);
}
