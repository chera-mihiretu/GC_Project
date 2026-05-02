import { pool } from "../../../config/db.js";
import type { AvailabilityRange, CreateAvailabilityDTO } from "../domain/availability-types.js";

function toDateString(d: unknown): string {
  if (d instanceof Date) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }
  return String(d);
}

function rowToAvailabilityRange(row: Record<string, unknown>): AvailabilityRange {
  return {
    id: row.id as string,
    vendorProfileId: row.vendor_profile_id as string,
    startDate: toDateString(row.start_date),
    endDate: toDateString(row.end_date),
    note: row.note as string | null,
    createdAt: new Date(row.created_at as string),
  };
}

export async function create(dto: CreateAvailabilityDTO): Promise<AvailabilityRange> {
  const { rows } = await pool.query(
    `INSERT INTO vendor_availability (vendor_profile_id, start_date, end_date, note)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [dto.vendorProfileId, dto.startDate, dto.endDate, dto.note ?? null],
  );
  return rowToAvailabilityRange(rows[0]);
}

export async function findByVendorProfileId(vendorProfileId: string): Promise<AvailabilityRange[]> {
  const { rows } = await pool.query(
    `SELECT * FROM vendor_availability
     WHERE vendor_profile_id = $1
     ORDER BY start_date ASC`,
    [vendorProfileId],
  );
  return rows.map(rowToAvailabilityRange);
}

export async function findByVendorForMonth(
  vendorProfileId: string,
  year: number,
  month: number,
): Promise<AvailabilityRange[]> {
  const monthStart = `${year}-${String(month).padStart(2, "0")}-01`;
  const nextMonth = month === 12 ? `${year + 1}-01-01` : `${year}-${String(month + 1).padStart(2, "0")}-01`;

  const { rows } = await pool.query(
    `SELECT * FROM vendor_availability
     WHERE vendor_profile_id = $1
       AND start_date < $3::date
       AND end_date >= $2::date
     ORDER BY start_date ASC`,
    [vendorProfileId, monthStart, nextMonth],
  );
  return rows.map(rowToAvailabilityRange);
}

export async function deleteById(id: string, vendorProfileId: string): Promise<boolean> {
  const { rowCount } = await pool.query(
    `DELETE FROM vendor_availability WHERE id = $1 AND vendor_profile_id = $2`,
    [id, vendorProfileId],
  );
  return (rowCount ?? 0) > 0;
}

export async function isDateAvailable(vendorProfileId: string, date: string): Promise<boolean> {
  const { rows } = await pool.query(
    `SELECT 1 FROM vendor_availability
     WHERE vendor_profile_id = $1
       AND start_date <= $2::date
       AND end_date >= $2::date
     LIMIT 1`,
    [vendorProfileId, date],
  );
  return rows.length > 0;
}
