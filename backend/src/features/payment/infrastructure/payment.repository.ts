import { pool } from "../../../config/db.js";
import { type Payment, PaymentStatus } from "../domain/types.js";

function rowToPayment(row: Record<string, unknown>): Payment {
  return {
    id: row.id as string,
    bookingId: row.booking_id as string,
    coupleId: row.couple_id as string,
    vendorId: row.vendor_id as string,
    txRef: row.tx_ref as string,
    chapaRef: row.chapa_ref as string | null,
    amount: parseFloat(row.amount as string),
    currency: row.currency as string,
    status: row.status as PaymentStatus,
    paymentMethod: row.payment_method as string | null,
    checkoutUrl: row.checkout_url as string | null,
    webhookPayload: row.webhook_payload as Record<string, unknown> | null,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}

export interface CreatePaymentParams {
  bookingId: string;
  coupleId: string;
  vendorId: string;
  txRef: string;
  amount: number;
  currency: string;
  checkoutUrl: string;
}

export async function create(params: CreatePaymentParams): Promise<Payment> {
  const { rows } = await pool.query(
    `INSERT INTO payments (booking_id, couple_id, vendor_id, tx_ref, amount, currency, checkout_url, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      params.bookingId,
      params.coupleId,
      params.vendorId,
      params.txRef,
      params.amount,
      params.currency,
      params.checkoutUrl,
      PaymentStatus.PENDING,
    ],
  );
  return rowToPayment(rows[0]);
}

export async function findByTxRef(txRef: string): Promise<Payment | null> {
  const { rows } = await pool.query(
    `SELECT * FROM payments WHERE tx_ref = $1 LIMIT 1`,
    [txRef],
  );
  return rows.length ? rowToPayment(rows[0]) : null;
}

export async function findByBookingId(bookingId: string): Promise<Payment | null> {
  const { rows } = await pool.query(
    `SELECT * FROM payments WHERE booking_id = $1 ORDER BY created_at DESC LIMIT 1`,
    [bookingId],
  );
  return rows.length ? rowToPayment(rows[0]) : null;
}

export async function findPendingOrSuccessByBookingId(
  bookingId: string,
): Promise<Payment | null> {
  const { rows } = await pool.query(
    `SELECT * FROM payments
     WHERE booking_id = $1 AND status IN ($2, $3)
     ORDER BY created_at DESC LIMIT 1`,
    [bookingId, PaymentStatus.PENDING, PaymentStatus.SUCCESS],
  );
  return rows.length ? rowToPayment(rows[0]) : null;
}

export async function updateStatus(
  txRef: string,
  status: PaymentStatus,
  chapaRef?: string,
  paymentMethod?: string,
  webhookPayload?: Record<string, unknown>,
): Promise<Payment> {
  const setClauses = ["status = $1", "updated_at = NOW()"];
  const values: unknown[] = [status];
  let idx = 2;

  if (chapaRef !== undefined) {
    setClauses.push(`chapa_ref = $${idx++}`);
    values.push(chapaRef);
  }
  if (paymentMethod !== undefined) {
    setClauses.push(`payment_method = $${idx++}`);
    values.push(paymentMethod);
  }
  if (webhookPayload !== undefined) {
    setClauses.push(`webhook_payload = $${idx++}`);
    values.push(JSON.stringify(webhookPayload));
  }

  values.push(txRef);

  const { rows } = await pool.query(
    `UPDATE payments SET ${setClauses.join(", ")} WHERE tx_ref = $${idx} RETURNING *`,
    values,
  );

  if (!rows.length) {
    throw Object.assign(new Error("Payment not found"), { statusCode: 404 });
  }

  return rowToPayment(rows[0]);
}
