import { pool } from "../../../config/db.js";
import * as budgetRepo from "../../budget/infrastructure/budget.repository.js";
import * as expenseRepo from "../../budget/infrastructure/expense.repository.js";
import { checkBudgetAlerts } from "../../budget/use-cases/check-budget-alerts.js";
import type { Payment } from "../domain/types.js";
import type { Booking } from "../../booking/domain/types.js";

/**
 * After a successful payment, automatically record it as an expense in the
 * couple's budget. Attempts to link the expense to the correct budget category
 * by matching the vendor profile in budget_category_vendors.
 *
 * Silently no-ops if the couple has no budget set up.
 */
export async function recordPaymentAsExpense(
  payment: Payment,
  booking: Booking,
): Promise<void> {
  const budget = await budgetRepo.findByUserId(payment.coupleId);
  if (!budget) return;

  const categoryId =
    await findCategoryByVendor(budget.id, booking.vendorProfileId) ??
    await findCategoryByServiceName(budget.id, booking.serviceCategory);

  const vendorName = booking.businessName ?? await getVendorBusinessName(booking.vendorProfileId);
  const description = `Payment for ${booking.serviceCategory ?? "booking"}${vendorName ? ` – ${vendorName}` : ""}`;

  await expenseRepo.create({
    budgetId: budget.id,
    categoryId,
    description,
    amount: payment.amount,
    vendorName,
    expenseDate: new Date().toISOString().slice(0, 10),
  });

  checkBudgetAlerts({ budgetId: budget.id, userId: payment.coupleId }).catch(() => {});
}

async function findCategoryByVendor(
  budgetId: string,
  vendorProfileId: string,
): Promise<string | null> {
  const { rows } = await pool.query(
    `SELECT bc.id
     FROM budget_category_vendors bcv
     JOIN budget_categories bc ON bc.id = bcv.budget_category_id
     WHERE bc.budget_id = $1 AND bcv.vendor_profile_id = $2
     LIMIT 1`,
    [budgetId, vendorProfileId],
  );
  return rows.length ? (rows[0].id as string) : null;
}

async function findCategoryByServiceName(
  budgetId: string,
  serviceCategory: string | undefined,
): Promise<string | null> {
  if (!serviceCategory) return null;
  const { rows } = await pool.query(
    `SELECT id FROM budget_categories
     WHERE budget_id = $1 AND LOWER(name) LIKE '%' || LOWER($2) || '%'
     LIMIT 1`,
    [budgetId, serviceCategory],
  );
  return rows.length ? (rows[0].id as string) : null;
}

async function getVendorBusinessName(vendorProfileId: string): Promise<string | null> {
  const { rows } = await pool.query(
    "SELECT business_name FROM vendor_profiles WHERE id = $1",
    [vendorProfileId],
  );
  return rows.length ? (rows[0].business_name as string) : null;
}
