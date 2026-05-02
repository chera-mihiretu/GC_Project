import { pool } from "../../../config/db.js";
import { transition } from "../domain/status-machine.js";
import {
  BookingStatus,
  type Booking,
  type BookingDetail,
  type CreateBookingDTO,
  type BookingListFilters,
  type PaginatedResult,
} from "../domain/types.js";

function rowToBooking(row: Record<string, unknown>): Booking {
  return {
    id: row.id as string,
    coupleId: row.couple_id as string,
    vendorId: row.vendor_id as string,
    vendorProfileId: row.vendor_profile_id as string,
    serviceCategory: row.service_category as string,
    eventDate: row.event_date as string,
    message: row.message as string | null,
    status: row.status as BookingStatus,
    declineReason: row.decline_reason as string | null,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}

export async function create(dto: CreateBookingDTO): Promise<Booking> {
  const { rows } = await pool.query(
    `INSERT INTO bookings (couple_id, vendor_id, vendor_profile_id, service_category, event_date, message, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      dto.coupleId,
      dto.vendorId,
      dto.vendorProfileId,
      dto.serviceCategory,
      dto.eventDate,
      dto.message ?? null,
      BookingStatus.PENDING,
    ],
  );
  return rowToBooking(rows[0]);
}

export async function findById(id: string): Promise<Booking | null> {
  const { rows } = await pool.query(
    `SELECT b.*, vp.business_name
     FROM bookings b
     JOIN vendor_profiles vp ON vp.id = b.vendor_profile_id
     WHERE b.id = $1`,
    [id],
  );
  return rows.length ? rowToBooking(rows[0]) : null;
}

export async function findByIdWithDetails(id: string): Promise<BookingDetail | null> {
  const { rows } = await pool.query(
    `SELECT b.*, vp.business_name
     FROM bookings b
     JOIN vendor_profiles vp ON vp.id = b.vendor_profile_id
     WHERE b.id = $1`,
    [id],
  );
  if (!rows.length) return null;
  const row = rows[0];
  return {
    ...rowToBooking(row),
    businessName: row.business_name as string,
  };
}

export async function findByCoupleId(
  coupleId: string,
  filters: BookingListFilters,
): Promise<PaginatedResult<Booking>> {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 20;
  const offset = (page - 1) * limit;

  const conditions: string[] = ["b.couple_id = $1"];
  const values: unknown[] = [coupleId];
  let idx = 2;

  if (filters.status) {
    conditions.push(`b.status = $${idx++}`);
    values.push(filters.status);
  }

  const where = `WHERE ${conditions.join(" AND ")}`;

  const countResult = await pool.query(
    `SELECT COUNT(*) FROM bookings b ${where}`,
    values,
  );
  const total = parseInt(countResult.rows[0].count as string, 10);

  const dataValues = [...values, limit, offset];
  const { rows } = await pool.query(
    `SELECT b.* FROM bookings b ${where}
     ORDER BY b.created_at DESC
     LIMIT $${idx++} OFFSET $${idx}`,
    dataValues,
  );

  return { data: rows.map(rowToBooking), total, page, limit };
}

export async function findByVendorId(
  vendorId: string,
  filters: BookingListFilters,
): Promise<PaginatedResult<Booking>> {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 20;
  const offset = (page - 1) * limit;

  const conditions: string[] = ["b.vendor_id = $1"];
  const values: unknown[] = [vendorId];
  let idx = 2;

  if (filters.status) {
    conditions.push(`b.status = $${idx++}`);
    values.push(filters.status);
  }

  const where = `WHERE ${conditions.join(" AND ")}`;

  const countResult = await pool.query(
    `SELECT COUNT(*) FROM bookings b ${where}`,
    values,
  );
  const total = parseInt(countResult.rows[0].count as string, 10);

  const dataValues = [...values, limit, offset];
  const { rows } = await pool.query(
    `SELECT b.* FROM bookings b ${where}
     ORDER BY b.created_at DESC
     LIMIT $${idx++} OFFSET $${idx}`,
    dataValues,
  );

  return { data: rows.map(rowToBooking), total, page, limit };
}

export async function updateStatus(
  id: string,
  newStatus: BookingStatus,
  declineReason?: string,
): Promise<Booking> {
  const existing = await findById(id);
  if (!existing) throw new Error("Booking not found");

  transition(existing.status, newStatus);

  const { rows } = await pool.query(
    `UPDATE bookings
     SET status = $1, decline_reason = $2, updated_at = NOW()
     WHERE id = $3 RETURNING *`,
    [newStatus, declineReason ?? null, id],
  );
  return rowToBooking(rows[0]);
}

export async function existsForCoupleAndVendor(
  coupleId: string,
  vendorProfileId: string,
  eventDate: string,
): Promise<boolean> {
  const { rows } = await pool.query(
    `SELECT 1 FROM bookings
     WHERE couple_id = $1
       AND vendor_profile_id = $2
       AND event_date = $3
       AND status IN ($4, $5)
     LIMIT 1`,
    [
      coupleId,
      vendorProfileId,
      eventDate,
      BookingStatus.PENDING,
      BookingStatus.ACCEPTED,
    ],
  );
  return rows.length > 0;
}
