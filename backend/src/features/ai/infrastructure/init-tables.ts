import { pool } from "../../../config/db.js";

export async function initAITables() {
  await pool.query(`CREATE EXTENSION IF NOT EXISTS vector`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS vendor_embeddings (
      vendor_profile_id TEXT PRIMARY KEY REFERENCES vendor_profiles(id) ON DELETE CASCADE,
      content           TEXT NOT NULL,
      embedding         vector(768) NOT NULL,
      updated_at        TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await pool.query(`
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_indexes WHERE indexname = 'idx_vendor_embeddings_vec'
      ) THEN
        CREATE INDEX idx_vendor_embeddings_vec
          ON vendor_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 20);
      END IF;
    END $$
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS ai_sessions (
      id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id      TEXT NOT NULL,
      title        TEXT,
      created_at   TIMESTAMPTZ DEFAULT NOW(),
      updated_at   TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_ai_sessions_user ON ai_sessions(user_id)
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS ai_messages (
      id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      session_id      UUID NOT NULL REFERENCES ai_sessions(id) ON DELETE CASCADE,
      role            TEXT NOT NULL CHECK (role IN ('user', 'model')),
      content         TEXT NOT NULL,
      vendor_cards    JSONB,
      pending_action  JSONB,
      created_at      TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_ai_messages_session ON ai_messages(session_id)
  `);

  console.log("[AI] AI tables initialized");
}
