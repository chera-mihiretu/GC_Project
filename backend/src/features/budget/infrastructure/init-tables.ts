import { pool } from "../../../config/db.js";

export async function initBudgetTables(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS budgets (
      id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id       TEXT NOT NULL UNIQUE,
      name          TEXT NOT NULL DEFAULT 'My Wedding Budget',
      total_amount  DECIMAL(12,2) NOT NULL DEFAULT 0,
      currency      TEXT NOT NULL DEFAULT 'ETB',
      notes         TEXT,
      created_at    TIMESTAMPTZ DEFAULT NOW(),
      updated_at    TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_budgets_user ON budgets(user_id);

    CREATE TABLE IF NOT EXISTS budget_categories (
      id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      budget_id        UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
      name             TEXT NOT NULL,
      allocated_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
      sort_order       INT NOT NULL DEFAULT 0,
      contacted_at     TIMESTAMPTZ,
      created_at       TIMESTAMPTZ DEFAULT NOW(),
      updated_at       TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_budget_categories_budget ON budget_categories(budget_id);

    CREATE TABLE IF NOT EXISTS budget_category_vendors (
      id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      budget_category_id UUID NOT NULL REFERENCES budget_categories(id) ON DELETE CASCADE,
      vendor_profile_id  TEXT NOT NULL,
      business_name      TEXT NOT NULL,
      price_range_min    DECIMAL(12,2),
      price_range_max    DECIMAL(12,2),
      rating             DECIMAL(3,2) NOT NULL DEFAULT 0,
      review_count       INT NOT NULL DEFAULT 0,
      location           TEXT,
      reason             TEXT NOT NULL DEFAULT '',
      created_at         TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_bcv_category ON budget_category_vendors(budget_category_id);

    CREATE TABLE IF NOT EXISTS expenses (
      id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      budget_id     UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
      category_id   UUID REFERENCES budget_categories(id) ON DELETE SET NULL,
      description   TEXT NOT NULL,
      amount        DECIMAL(12,2) NOT NULL,
      vendor_name   TEXT,
      expense_date  DATE NOT NULL DEFAULT CURRENT_DATE,
      created_at    TIMESTAMPTZ DEFAULT NOW(),
      updated_at    TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_expenses_budget ON expenses(budget_id);
    CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category_id);

    CREATE TABLE IF NOT EXISTS budget_alerts (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      budget_id   UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
      alert_key   TEXT NOT NULL,
      created_at  TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(budget_id, alert_key)
    );
  `);
  // Migration: add contacted_at if missing
  await pool.query(`
    ALTER TABLE budget_categories ADD COLUMN IF NOT EXISTS contacted_at TIMESTAMPTZ;
  `);

  console.log("[Budget] Tables initialized");
}
