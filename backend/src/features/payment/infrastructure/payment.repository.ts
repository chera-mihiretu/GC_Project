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
    chargeAmount: parseFloat((row.charge_amount as string) ?? "0"),
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
  chargeAmount?: number,
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
  if (chargeAmount !== undefined) {
    setClauses.push(`charge_amount = $${idx++}`);
    values.push(chargeAmount);
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

// ──────────────────── Vendor Earnings ────────────────────

export interface VendorEarningsSummary {
  totalEarned: number;
  totalWithdrawn: number;
  availableBalance: number;
  currency: string;
  paymentCount: number;
}

export async function getVendorEarningsSummary(
  vendorId: string,
): Promise<VendorEarningsSummary> {
  const earningsResult = await pool.query(
    `SELECT COALESCE(SUM(amount - COALESCE(charge_amount, 0)), 0) AS total_earned,
            COUNT(*) AS payment_count,
            COALESCE(MAX(currency), 'ETB') AS currency
     FROM payments
     WHERE vendor_id = $1 AND status = $2`,
    [vendorId, PaymentStatus.SUCCESS],
  );

  const withdrawnResult = await pool.query(
    `SELECT COALESCE(SUM(amount), 0) AS total_withdrawn
     FROM withdrawals
     WHERE vendor_id = $1 AND status IN ('completed', 'pending')`,
    [vendorId],
  );

  const totalEarned = parseFloat(earningsResult.rows[0].total_earned as string);
  const totalWithdrawn = parseFloat(withdrawnResult.rows[0].total_withdrawn as string);

  return {
    totalEarned,
    totalWithdrawn,
    availableBalance: totalEarned - totalWithdrawn,
    currency: earningsResult.rows[0].currency as string,
    paymentCount: parseInt(earningsResult.rows[0].payment_count as string, 10),
  };
}

export interface VendorPaymentRecord {
  id: string;
  bookingId: string;
  grossAmount: number;
  chargeAmount: number;
  netAmount: number;
  currency: string;
  status: PaymentStatus;
  paymentMethod: string | null;
  createdAt: Date;
  serviceCategory: string | null;
  coupleName: string | null;
}

export async function getVendorPaymentHistory(
  vendorId: string,
  opts: { limit?: number; offset?: number } = {},
): Promise<{ payments: VendorPaymentRecord[]; total: number }> {
  const limit = opts.limit ?? 20;
  const offset = opts.offset ?? 0;

  const countResult = await pool.query(
    "SELECT COUNT(*) FROM payments WHERE vendor_id = $1 AND status = $2",
    [vendorId, PaymentStatus.SUCCESS],
  );
  const total = parseInt(countResult.rows[0].count as string, 10);

  const { rows } = await pool.query(
    `SELECT p.id, p.booking_id, p.amount, p.charge_amount, p.currency, p.status,
            p.payment_method, p.created_at,
            b.service_category, u.name AS couple_name
     FROM payments p
     LEFT JOIN bookings b ON b.id = p.booking_id
     LEFT JOIN "user" u ON u.id = p.couple_id
     WHERE p.vendor_id = $1 AND p.status = $2
     ORDER BY p.created_at DESC
     LIMIT $3 OFFSET $4`,
    [vendorId, PaymentStatus.SUCCESS, limit, offset],
  );

  return {
    payments: rows.map((r: Record<string, unknown>) => {
      const gross = parseFloat(r.amount as string);
      const charge = parseFloat((r.charge_amount as string) ?? "0");
      return {
        id: r.id as string,
        bookingId: r.booking_id as string,
        grossAmount: gross,
        chargeAmount: charge,
        netAmount: gross - charge,
        currency: r.currency as string,
        status: r.status as PaymentStatus,
        paymentMethod: (r.payment_method as string) || null,
        createdAt: new Date(r.created_at as string),
        serviceCategory: (r.service_category as string) || null,
        coupleName: (r.couple_name as string) || null,
      };
    }),
    total,
  };
}
