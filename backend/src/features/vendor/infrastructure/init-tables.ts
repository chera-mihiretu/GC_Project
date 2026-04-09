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

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_vendor_profiles_user_id ON vendor_profiles(user_id)
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_vendor_profiles_status ON vendor_profiles(status)
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_vendor_documents_profile_id ON vendor_documents(vendor_profile_id)
  `);
}
