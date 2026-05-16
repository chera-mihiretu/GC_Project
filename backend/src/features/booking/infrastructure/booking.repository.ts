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
    requestedAmount: row.requested_amount ? parseFloat(row.requested_amount as string) : null,
    requestedCurrency: (row.requested_currency as string) || null,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}

function rowToBookingWithVendor(row: Record<string, unknown>): Booking {
  return {
    ...rowToBooking(row),
    businessName: (row.business_name as string) ?? undefined,
    vendorLocation: (row.vendor_location as string) ?? null,
    vendorCategory: (row.vendor_category as string[]) ?? [],
    vendorRating: row.vendor_rating ? Number(row.vendor_rating) : 0,
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
    `SELECT b.*, vp.business_name, vp.price_range_min, vp.price_range_max,
            vp.location AS vendor_location, vp.category AS vendor_category,
            vp.rating AS vendor_rating, vp.review_count AS vendor_review_count
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
    priceRangeMin: row.price_range_min ? parseFloat(row.price_range_min as string) : null,
    priceRangeMax: row.price_range_max ? parseFloat(row.price_range_max as string) : null,
    vendorLocation: (row.vendor_location as string) ?? null,
    vendorCategory: (row.vendor_category as string[]) ?? [],
    vendorRating: row.vendor_rating ? Number(row.vendor_rating) : 0,
    vendorReviewCount: row.vendor_review_count ? Number(row.vendor_review_count) : 0,
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
    `SELECT b.*, vp.business_name, vp.location AS vendor_location,
            vp.category AS vendor_category, vp.rating AS vendor_rating
     FROM bookings b
     LEFT JOIN vendor_profiles vp ON vp.id = b.vendor_profile_id
     ${where}
     ORDER BY b.created_at DESC
     LIMIT $${idx++} OFFSET $${idx}`,
    dataValues,
  );

  return { data: rows.map(rowToBookingWithVendor), total, page, limit };
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
    `SELECT b.*, vp.business_name, vp.location AS vendor_location,
            vp.category AS vendor_category, vp.rating AS vendor_rating
     FROM bookings b
     LEFT JOIN vendor_profiles vp ON vp.id = b.vendor_profile_id
     ${where}
     ORDER BY b.created_at DESC
     LIMIT $${idx++} OFFSET $${idx}`,
    dataValues,
  );

  return { data: rows.map(rowToBookingWithVendor), total, page, limit };
}

export async function updateStatus(
  id: string,
  newStatus: BookingStatus,
  declineReason?: string,
): Promise<Booking> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { rows: [existing] } = await client.query(
      "SELECT * FROM bookings WHERE id = $1 FOR UPDATE",
      [id],
    );
    if (!existing) {
      throw Object.assign(new Error("Booking not found"), { statusCode: 404 });
    }

    transition(rowToBooking(existing).status, newStatus);

    const { rows } = await client.query(
      `UPDATE bookings
       SET status = $1, decline_reason = $2, updated_at = NOW()
       WHERE id = $3 RETURNING *`,
      [newStatus, declineReason ?? null, id],
    );

    await client.query("COMMIT");
    return rowToBooking(rows[0]);
  } catch (err: unknown) {
    await client.query("ROLLBACK");
    const pgErr = err as { code?: string };
    if (pgErr.code === "23505") {
      throw Object.assign(
        new Error("This vendor already has a confirmed booking on this date"),
        { statusCode: 409 },
      );
    }
    throw err;
  } finally {
    client.release();
  }
}

export async function setRequestedPayment(
  id: string,
  amount: number,
  currency: string,
): Promise<Booking> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { rows: [existing] } = await client.query(
      "SELECT * FROM bookings WHERE id = $1 FOR UPDATE",
      [id],
    );
    if (!existing) {
      throw Object.assign(new Error("Booking not found"), { statusCode: 404 });
    }

    transition(rowToBooking(existing).status, BookingStatus.PAYMENT_REQUESTED);

    const { rows } = await client.query(
      `UPDATE bookings
       SET status = $1, requested_amount = $2, requested_currency = $3, updated_at = NOW()
       WHERE id = $4 RETURNING *`,
      [BookingStatus.PAYMENT_REQUESTED, amount, currency, id],
    );

    await client.query("COMMIT");
    return rowToBooking(rows[0]);
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
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

export async function isDateBookedForVendor(
  vendorProfileId: string,
  eventDate: string,
  excludeBookingId?: string,
): Promise<boolean> {
  const params: unknown[] = [
    vendorProfileId,
    eventDate,
    BookingStatus.ACCEPTED,
    BookingStatus.DEPOSIT_PAID,
  ];
  let excludeClause = "";
  if (excludeBookingId) {
    excludeClause = " AND id != $5";
    params.push(excludeBookingId);
  }
  const { rows } = await pool.query(
    `SELECT 1 FROM bookings
     WHERE vendor_profile_id = $1
       AND event_date = $2
       AND status IN ($3, $4)${excludeClause}
     LIMIT 1`,
    params,
  );
  return rows.length > 0;
}
