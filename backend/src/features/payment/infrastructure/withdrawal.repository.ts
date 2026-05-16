import { pool } from "../../../config/db.js";
import { type Withdrawal, WithdrawalStatus } from "../domain/types.js";

function rowToWithdrawal(row: Record<string, unknown>): Withdrawal {
  return {
    id: row.id as string,
    vendorId: row.vendor_id as string,
    amount: parseFloat(row.amount as string),
    currency: row.currency as string,
    bankCode: row.bank_code as string,
    bankName: row.bank_name as string,
    accountNumber: row.account_number as string,
    accountName: row.account_name as string,
    reference: row.reference as string,
    status: row.status as WithdrawalStatus,
    failureReason: (row.failure_reason as string) || null,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}

export interface CreateWithdrawalParams {
  vendorId: string;
  amount: number;
  currency: string;
  bankCode: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  reference: string;
}

export async function create(params: CreateWithdrawalParams): Promise<Withdrawal> {
  const { rows } = await pool.query(
    `INSERT INTO withdrawals
       (vendor_id, amount, currency, bank_code, bank_name, account_number, account_name, reference, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [
      params.vendorId,
      params.amount,
      params.currency,
      params.bankCode,
      params.bankName,
      params.accountNumber,
      params.accountName,
      params.reference,
      WithdrawalStatus.PENDING,
    ],
  );
  return rowToWithdrawal(rows[0]);
}

export async function updateStatus(
  id: string,
  status: WithdrawalStatus,
  failureReason?: string,
): Promise<Withdrawal> {
  const { rows } = await pool.query(
    `UPDATE withdrawals
     SET status = $1, failure_reason = $2, updated_at = NOW()
     WHERE id = $3
     RETURNING *`,
    [status, failureReason ?? null, id],
  );
  if (!rows.length) {
    throw Object.assign(new Error("Withdrawal not found"), { statusCode: 404 });
  }
  return rowToWithdrawal(rows[0]);
}

export async function findByVendorId(
  vendorId: string,
  opts: { limit?: number; offset?: number } = {},
): Promise<{ withdrawals: Withdrawal[]; total: number }> {
  const limit = opts.limit ?? 20;
  const offset = opts.offset ?? 0;

  const countResult = await pool.query(
    "SELECT COUNT(*) FROM withdrawals WHERE vendor_id = $1",
    [vendorId],
  );
  const total = parseInt(countResult.rows[0].count as string, 10);

  const { rows } = await pool.query(
    `SELECT * FROM withdrawals
     WHERE vendor_id = $1
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [vendorId, limit, offset],
  );

  return { withdrawals: rows.map(rowToWithdrawal), total };
}

export async function hasPendingWithdrawal(vendorId: string): Promise<boolean> {
  const { rows } = await pool.query(
    "SELECT 1 FROM withdrawals WHERE vendor_id = $1 AND status = $2 LIMIT 1",
    [vendorId, WithdrawalStatus.PENDING],
  );
  return rows.length > 0;
}
