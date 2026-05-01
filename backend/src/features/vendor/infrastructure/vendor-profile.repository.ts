import { pool } from "../../../config/db.js";
import { transition } from "../domain/status-machine.js";
import {
  VendorStatus,
  type VendorProfile,
  type CreateVendorProfileDTO,
  type UpdateVendorProfileDTO,
  type VendorListFilters,
  type PaginatedResult,
} from "../domain/types.js";

function toNumber(v: unknown): number | null {
  if (v == null) return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}

function rowToProfile(row: Record<string, unknown>): VendorProfile {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    businessName: row.business_name as string | null,
    category: Array.isArray(row.category) ? row.category as string[] : null,
    description: row.description as string | null,
    phoneNumber: row.phone_number as string | null,
    location: row.location as string | null,
    latitude: toNumber(row.latitude),
    longitude: toNumber(row.longitude),
    priceRangeMin: toNumber(row.price_range_min),
    priceRangeMax: toNumber(row.price_range_max),
    portfolio: Array.isArray(row.portfolio) ? row.portfolio as string[] : [],
    yearsOfExperience: toNumber(row.years_of_experience),
    socialMedia: (row.social_media as Record<string, string>) ?? null,
    rating: toNumber(row.rating) ?? 0,
    reviewCount: toNumber(row.review_count) ?? 0,
    status: row.status as VendorStatus,
    rejectionReason: row.rejection_reason as string | null,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}

export async function createProfile(
  dto: CreateVendorProfileDTO,
): Promise<VendorProfile> {
  const id = crypto.randomUUID();
  const { rows } = await pool.query(
    `INSERT INTO vendor_profiles
       (id, user_id, business_name, category, description, phone_number,
        location, latitude, longitude, price_range_min, price_range_max,
        portfolio, years_of_experience, social_media, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
     RETURNING *`,
    [
      id,
      dto.userId,
      dto.businessName ?? null,
      dto.category ? JSON.stringify(dto.category) : null,
      dto.description ?? null,
      dto.phoneNumber ?? null,
      dto.location ?? null,
      dto.latitude ?? null,
      dto.longitude ?? null,
      dto.priceRangeMin ?? null,
      dto.priceRangeMax ?? null,
      JSON.stringify(dto.portfolio ?? []),
      dto.yearsOfExperience ?? null,
      dto.socialMedia ? JSON.stringify(dto.socialMedia) : null,
      VendorStatus.REGISTERED,
    ],
  );
  return rowToProfile(rows[0]);
}

export async function findByUserId(
  userId: string,
): Promise<VendorProfile | null> {
  const { rows } = await pool.query(
    "SELECT * FROM vendor_profiles WHERE user_id = $1",
    [userId],
  );
  return rows.length ? rowToProfile(rows[0]) : null;
}

export async function findById(
  id: string,
): Promise<VendorProfile | null> {
  const { rows } = await pool.query(
    "SELECT * FROM vendor_profiles WHERE id = $1",
    [id],
  );
  return rows.length ? rowToProfile(rows[0]) : null;
}

export async function update(
  id: string,
  dto: UpdateVendorProfileDTO,
): Promise<VendorProfile | null> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (dto.businessName !== undefined) {
    fields.push(`business_name = $${idx++}`);
    values.push(dto.businessName);
  }
  if (dto.category !== undefined) {
    fields.push(`category = $${idx++}`);
    values.push(JSON.stringify(dto.category));
  }
  if (dto.description !== undefined) {
    fields.push(`description = $${idx++}`);
    values.push(dto.description);
  }
  if (dto.phoneNumber !== undefined) {
    fields.push(`phone_number = $${idx++}`);
    values.push(dto.phoneNumber);
  }
  if (dto.location !== undefined) {
    fields.push(`location = $${idx++}`);
    values.push(dto.location);
  }
  if (dto.latitude !== undefined) {
    fields.push(`latitude = $${idx++}`);
    values.push(dto.latitude);
  }
  if (dto.longitude !== undefined) {
    fields.push(`longitude = $${idx++}`);
    values.push(dto.longitude);
  }
  if (dto.priceRangeMin !== undefined) {
    fields.push(`price_range_min = $${idx++}`);
    values.push(dto.priceRangeMin);
  }
  if (dto.priceRangeMax !== undefined) {
    fields.push(`price_range_max = $${idx++}`);
    values.push(dto.priceRangeMax);
  }
  if (dto.portfolio !== undefined) {
    fields.push(`portfolio = $${idx++}`);
    values.push(JSON.stringify(dto.portfolio));
  }
  if (dto.yearsOfExperience !== undefined) {
    fields.push(`years_of_experience = $${idx++}`);
    values.push(dto.yearsOfExperience);
  }
  if (dto.socialMedia !== undefined) {
    fields.push(`social_media = $${idx++}`);
    values.push(JSON.stringify(dto.socialMedia));
  }

  if (fields.length === 0) return findById(id);

  fields.push(`updated_at = NOW()`);
  values.push(id);

  const { rows } = await pool.query(
    `UPDATE vendor_profiles SET ${fields.join(", ")} WHERE id = $${idx} RETURNING *`,
    values,
  );
  return rows.length ? rowToProfile(rows[0]) : null;
}

export async function updateStatus(
  id: string,
  newStatus: VendorStatus,
  reason?: string,
): Promise<VendorProfile> {
  const existing = await findById(id);
  if (!existing) throw new Error("Vendor profile not found");

  transition(existing.status, newStatus);

  const { rows } = await pool.query(
    `UPDATE vendor_profiles
     SET status = $1, rejection_reason = $2, updated_at = NOW()
     WHERE id = $3 RETURNING *`,
    [newStatus, reason ?? null, id],
  );
  return rowToProfile(rows[0]);
}

export async function findByStatus(
  filters: VendorListFilters,
): Promise<PaginatedResult<VendorProfile>> {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 20;
  const offset = (page - 1) * limit;

  const conditions: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (filters.status) {
    conditions.push(`vp.status = $${idx++}`);
    values.push(filters.status);
  }
  if (filters.category) {
    conditions.push(`vp.category @> $${idx++}::jsonb`);
    values.push(JSON.stringify([filters.category]));
  }
  if (filters.location) {
    conditions.push(`LOWER(vp.location) LIKE $${idx++}`);
    values.push(`%${filters.location.toLowerCase()}%`);
  }
  if (filters.search) {
    conditions.push(
      `(LOWER(vp.business_name) LIKE $${idx} OR LOWER(vp.description) LIKE $${idx})`,
    );
    values.push(`%${filters.search.toLowerCase()}%`);
    idx++;
  }

  const where = conditions.length
    ? `WHERE ${conditions.join(" AND ")}`
    : "";

  const sortBy =
    filters.sortBy === "businessName" ? "vp.business_name" : "vp.created_at";
  const order = filters.order === "asc" ? "ASC" : "DESC";

  const countResult = await pool.query(
    `SELECT COUNT(*) FROM vendor_profiles vp ${where}`,
    values,
  );
  const total = parseInt(countResult.rows[0].count as string, 10);

  const dataValues = [...values, limit, offset];
  const { rows } = await pool.query(
    `SELECT vp.* FROM vendor_profiles vp ${where}
     ORDER BY ${sortBy} ${order}
     LIMIT $${idx++} OFFSET $${idx}`,
    dataValues,
  );

  return {
    data: rows.map(rowToProfile),
    total,
    page,
    limit,
  };
}

export async function findVerified(
  filters: VendorListFilters,
): Promise<PaginatedResult<VendorProfile>> {
  return findByStatus({ ...filters, status: VendorStatus.VERIFIED });
}
