import { pool } from "../../../config/db.js";
import type {
  Review,
  ReviewWithAuthor,
  CreateReviewDTO,
  PaginatedResult,
  ReviewListFilters,
} from "../domain/types.js";

function rowToReview(row: Record<string, unknown>): Review {
  return {
    id: row.id as string,
    bookingId: row.booking_id as string,
    coupleId: row.couple_id as string,
    vendorId: row.vendor_id as string,
    vendorProfileId: row.vendor_profile_id as string,
    rating: row.rating as number,
    comment: row.comment as string | null,
    isApproved: row.is_approved as boolean,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}

export async function create(dto: CreateReviewDTO): Promise<Review> {
  const { rows } = await pool.query(
    `INSERT INTO reviews (booking_id, couple_id, vendor_id, vendor_profile_id, rating, comment)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      dto.bookingId,
      dto.coupleId,
      dto.vendorId,
      dto.vendorProfileId,
      dto.rating,
      dto.comment ?? null,
    ],
  );
  return rowToReview(rows[0]);
}

export async function findByBookingId(bookingId: string): Promise<Review | null> {
  const { rows } = await pool.query(
    `SELECT * FROM reviews WHERE booking_id = $1`,
    [bookingId],
  );
  return rows.length ? rowToReview(rows[0]) : null;
}

export async function findByVendorProfileId(
  vendorProfileId: string,
  filters: ReviewListFilters = {},
): Promise<PaginatedResult<Review>> {
  const page = Math.max(1, filters.page ?? 1);
  const limit = Math.min(Math.max(1, filters.limit ?? 20), 100);
  const offset = (page - 1) * limit;

  const countResult = await pool.query(
    `SELECT COUNT(*) FROM reviews WHERE vendor_profile_id = $1 AND is_approved = true`,
    [vendorProfileId],
  );
  const total = parseInt(countResult.rows[0].count as string, 10);

  const { rows } = await pool.query(
    `SELECT * FROM reviews
     WHERE vendor_profile_id = $1 AND is_approved = true
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [vendorProfileId, limit, offset],
  );

  return { data: rows.map(rowToReview), total, page, limit };
}

export async function findByVendorProfileIdWithAuthor(
  vendorProfileId: string,
  filters: ReviewListFilters = {},
): Promise<PaginatedResult<ReviewWithAuthor>> {
  const page = Math.max(1, filters.page ?? 1);
  const limit = Math.min(Math.max(1, filters.limit ?? 20), 100);
  const offset = (page - 1) * limit;

  const countResult = await pool.query(
    `SELECT COUNT(*) FROM reviews WHERE vendor_profile_id = $1 AND is_approved = true`,
    [vendorProfileId],
  );
  const total = parseInt(countResult.rows[0].count as string, 10);

  const { rows } = await pool.query(
    `SELECT r.*, u.name as author_name
     FROM reviews r
     LEFT JOIN "user" u ON u.id = r.couple_id
     WHERE r.vendor_profile_id = $1 AND r.is_approved = true
     ORDER BY r.created_at DESC
     LIMIT $2 OFFSET $3`,
    [vendorProfileId, limit, offset],
  );

  return {
    data: rows.map((row) => ({
      ...rowToReview(row),
      authorName: (row.author_name as string) ?? "Anonymous",
    })),
    total,
    page,
    limit,
  };
}

export async function findAllForAdmin(
  filters: { isApproved?: boolean; page?: number; limit?: number } = {},
): Promise<PaginatedResult<ReviewWithAuthor>> {
  const page = Math.max(1, filters.page ?? 1);
  const limit = Math.min(Math.max(1, filters.limit ?? 20), 100);
  const offset = (page - 1) * limit;

  const conditions: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (filters.isApproved !== undefined) {
    conditions.push(`r.is_approved = $${idx++}`);
    values.push(filters.isApproved);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const countResult = await pool.query(
    `SELECT COUNT(*) FROM reviews r ${where}`,
    values,
  );
  const total = parseInt(countResult.rows[0].count as string, 10);

  const { rows } = await pool.query(
    `SELECT r.*, u.name as author_name, vp.business_name as vendor_name
     FROM reviews r
     LEFT JOIN "user" u ON u.id = r.couple_id
     LEFT JOIN vendor_profiles vp ON vp.id = r.vendor_profile_id
     ${where}
     ORDER BY r.created_at DESC
     LIMIT $${idx++} OFFSET $${idx}`,
    [...values, limit, offset],
  );

  return {
    data: rows.map((row) => ({
      ...rowToReview(row),
      authorName: (row.author_name as string) ?? "Anonymous",
      vendorName: (row.vendor_name as string) ?? "Unknown Vendor",
    })),
    total,
    page,
    limit,
  };
}

export async function updateApproval(
  reviewId: string,
  isApproved: boolean,
): Promise<Review> {
  const { rows } = await pool.query(
    `UPDATE reviews SET is_approved = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
    [isApproved, reviewId],
  );
  if (!rows.length) {
    throw Object.assign(new Error("Review not found"), { statusCode: 404 });
  }
  return rowToReview(rows[0]);
}

export async function findById(reviewId: string): Promise<Review | null> {
  const { rows } = await pool.query(
    `SELECT * FROM reviews WHERE id = $1`,
    [reviewId],
  );
  return rows.length ? rowToReview(rows[0]) : null;
}

export async function getAverageRating(
  vendorProfileId: string,
): Promise<{ avg: number; count: number }> {
  const { rows } = await pool.query(
    `SELECT COALESCE(AVG(rating), 0) as avg, COUNT(*)::int as count
     FROM reviews
     WHERE vendor_profile_id = $1 AND is_approved = true`,
    [vendorProfileId],
  );
  return {
    avg: parseFloat(rows[0].avg as string),
    count: rows[0].count as number,
  };
}
