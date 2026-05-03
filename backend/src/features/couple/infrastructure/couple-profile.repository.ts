import { pool } from "../../../config/db.js";
import type {
  CoupleProfile,
  CreateCoupleProfileDTO,
  UpdateCoupleProfileDTO,
} from "../domain/types.js";

function rowToProfile(row: Record<string, unknown>): CoupleProfile {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    weddingDate: row.wedding_date ? String(row.wedding_date) : null,
    budgetCurrency: (row.budget_currency as string) ?? "ETB",
    estimatedGuests: row.estimated_guests != null ? Number(row.estimated_guests) : null,
    weddingTheme: (row.wedding_theme as string) ?? null,
    weddingLocation: (row.wedding_location as string) ?? null,
    latitude: row.latitude != null ? Number(row.latitude) : null,
    longitude: row.longitude != null ? Number(row.longitude) : null,
    partnerName: (row.partner_name as string) ?? null,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}

export async function findByUserId(userId: string): Promise<CoupleProfile | null> {
  const { rows } = await pool.query(
    "SELECT * FROM couple_profiles WHERE user_id = $1",
    [userId],
  );
  return rows.length ? rowToProfile(rows[0]) : null;
}

export async function create(dto: CreateCoupleProfileDTO): Promise<CoupleProfile> {
  const id = crypto.randomUUID();
  const { rows } = await pool.query(
    `INSERT INTO couple_profiles
       (id, user_id, wedding_date, budget_currency, estimated_guests, wedding_theme, wedding_location, latitude, longitude, partner_name)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING *`,
    [
      id,
      dto.userId,
      dto.weddingDate ?? null,
      dto.budgetCurrency ?? "ETB",
      dto.estimatedGuests ?? null,
      dto.weddingTheme ?? null,
      dto.weddingLocation ?? null,
      dto.latitude ?? null,
      dto.longitude ?? null,
      dto.partnerName ?? null,
    ],
  );
  return rowToProfile(rows[0]);
}

export async function update(
  userId: string,
  dto: UpdateCoupleProfileDTO,
): Promise<CoupleProfile | null> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (dto.weddingDate !== undefined) {
    fields.push(`wedding_date = $${idx++}`);
    values.push(dto.weddingDate);
  }
  if (dto.budgetCurrency !== undefined) {
    fields.push(`budget_currency = $${idx++}`);
    values.push(dto.budgetCurrency);
  }
  if (dto.estimatedGuests !== undefined) {
    fields.push(`estimated_guests = $${idx++}`);
    values.push(dto.estimatedGuests);
  }
  if (dto.weddingTheme !== undefined) {
    fields.push(`wedding_theme = $${idx++}`);
    values.push(dto.weddingTheme);
  }
  if (dto.weddingLocation !== undefined) {
    fields.push(`wedding_location = $${idx++}`);
    values.push(dto.weddingLocation);
  }
  if (dto.latitude !== undefined) {
    fields.push(`latitude = $${idx++}`);
    values.push(dto.latitude);
  }
  if (dto.longitude !== undefined) {
    fields.push(`longitude = $${idx++}`);
    values.push(dto.longitude);
  }
  if (dto.partnerName !== undefined) {
    fields.push(`partner_name = $${idx++}`);
    values.push(dto.partnerName);
  }

  if (fields.length === 0) return findByUserId(userId);

  fields.push(`updated_at = NOW()`);
  values.push(userId);

  const { rows } = await pool.query(
    `UPDATE couple_profiles SET ${fields.join(", ")} WHERE user_id = $${idx} RETURNING *`,
    values,
  );
  return rows.length ? rowToProfile(rows[0]) : null;
}
