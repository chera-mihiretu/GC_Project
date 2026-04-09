import { pool } from "../../../config/db.js";

export async function initRealtimeTables(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS notification (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id TEXT NOT NULL,
      type VARCHAR(100) NOT NULL,
      title VARCHAR(255) NOT NULL,
      body TEXT NOT NULL DEFAULT '',
      metadata JSONB NOT NULL DEFAULT '{}',
      read BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_notification_user_id
      ON notification (user_id, created_at DESC);

    CREATE TABLE IF NOT EXISTS conversation (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      participant_one TEXT NOT NULL,
      participant_two TEXT NOT NULL,
      last_message_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (participant_one, participant_two)
    );

    CREATE INDEX IF NOT EXISTS idx_conversation_participants
      ON conversation (participant_one, participant_two);

    CREATE TABLE IF NOT EXISTS chat_message (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      conversation_id UUID NOT NULL REFERENCES conversation(id) ON DELETE CASCADE,
      sender_id TEXT NOT NULL,
      content TEXT NOT NULL,
      read BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_chat_message_conversation
      ON chat_message (conversation_id, created_at DESC);
  `);
}
