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
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_payments_vendor_id ON payments(vendor_id)
  `);
  await pool.query(`ALTER TABLE payments ADD COLUMN IF NOT EXISTS charge_amount DECIMAL(12,2) DEFAULT 0`);

  // Withdrawals table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS withdrawals (
      id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      vendor_id       TEXT NOT NULL,
      amount          DECIMAL(12,2) NOT NULL,
      currency        VARCHAR(3) NOT NULL DEFAULT 'ETB',
      bank_code       VARCHAR(20) NOT NULL,
      bank_name       TEXT NOT NULL,
      account_number  VARCHAR(50) NOT NULL,
      account_name    TEXT NOT NULL,
      reference       VARCHAR(255) UNIQUE NOT NULL,
      status          VARCHAR(20) NOT NULL DEFAULT 'pending',
      failure_reason  TEXT,
      created_at      TIMESTAMPTZ DEFAULT NOW(),
      updated_at      TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_withdrawals_vendor_id ON withdrawals(vendor_id)
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_withdrawals_reference ON withdrawals(reference)
  `);
}
