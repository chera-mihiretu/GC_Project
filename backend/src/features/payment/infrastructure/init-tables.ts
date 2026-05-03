import { pool } from "../../../config/db.js";

export async function initPaymentTables(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS payments (
      id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      booking_id      UUID NOT NULL REFERENCES bookings(id),
      couple_id       TEXT NOT NULL,
      vendor_id       TEXT NOT NULL,
      tx_ref          VARCHAR(255) UNIQUE NOT NULL,
      chapa_ref       VARCHAR(255),
      amount          DECIMAL(12,2) NOT NULL,
      currency        VARCHAR(3) NOT NULL DEFAULT 'ETB',
      status          VARCHAR(20) NOT NULL DEFAULT 'pending',
      payment_method  VARCHAR(50),
      checkout_url    TEXT,
      webhook_payload JSONB,
      created_at      TIMESTAMPTZ DEFAULT NOW(),
      updated_at      TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON payments(booking_id)
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_payments_tx_ref ON payments(tx_ref)
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_payments_couple_id ON payments(couple_id)
  `);
}
