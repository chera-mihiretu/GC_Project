import { pool } from "../../../config/db.js";

export interface PortfolioItem {
  id: string;
  vendorProfileId: string;
  category: string;
  mediaUrl: string;
  mediaType: "image" | "video";
  caption: string | null;
  sortOrder: number;
  createdAt: Date;
}

function rowToItem(row: Record<string, unknown>): PortfolioItem {
  return {
    id: row.id as string,
    vendorProfileId: row.vendor_profile_id as string,
    category: row.category as string,
    mediaUrl: row.media_url as string,
    mediaType: row.media_type as "image" | "video",
    caption: (row.caption as string) ?? null,
    sortOrder: Number(row.sort_order ?? 0),
    createdAt: new Date(row.created_at as string),
  };
}

export async function findByVendorProfileId(
  vendorProfileId: string,
): Promise<PortfolioItem[]> {
  const { rows } = await pool.query(
    `SELECT * FROM vendor_portfolio_items
     WHERE vendor_profile_id = $1
     ORDER BY category, sort_order, created_at`,
    [vendorProfileId],
  );
  return rows.map(rowToItem);
}

export async function findByVendorProfileIdPaginated(
  vendorProfileId: string,
  category: string,
  limit: number,
  offset: number,
): Promise<{ items: PortfolioItem[]; total: number }> {
  const countResult = await pool.query(
    `SELECT COUNT(*)::int AS total FROM vendor_portfolio_items
     WHERE vendor_profile_id = $1 AND category = $2`,
    [vendorProfileId, category],
  );
  const total = countResult.rows[0]?.total ?? 0;

  const { rows } = await pool.query(
    `SELECT * FROM vendor_portfolio_items
     WHERE vendor_profile_id = $1 AND category = $2
     ORDER BY sort_order, created_at
     LIMIT $3 OFFSET $4`,
    [vendorProfileId, category, limit, offset],
  );
  return { items: rows.map(rowToItem), total };
}

export async function findById(id: string): Promise<PortfolioItem | null> {
  const { rows } = await pool.query(
    "SELECT * FROM vendor_portfolio_items WHERE id = $1",
    [id],
  );
  return rows.length ? rowToItem(rows[0]) : null;
}

export async function create(dto: {
  vendorProfileId: string;
  category: string;
  mediaUrl: string;
  mediaType: "image" | "video";
  caption?: string;
}): Promise<PortfolioItem> {
  const id = crypto.randomUUID();

  const { rows: countRows } = await pool.query(
    `SELECT COALESCE(MAX(sort_order), -1) + 1 AS next_order
     FROM vendor_portfolio_items
     WHERE vendor_profile_id = $1 AND category = $2`,
    [dto.vendorProfileId, dto.category],
  );
  const sortOrder = Number(countRows[0].next_order);

  const { rows } = await pool.query(
    `INSERT INTO vendor_portfolio_items
       (id, vendor_profile_id, category, media_url, media_type, caption, sort_order)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      id,
      dto.vendorProfileId,
      dto.category,
      dto.mediaUrl,
      dto.mediaType,
      dto.caption ?? null,
      sortOrder,
    ],
  );
  return rowToItem(rows[0]);
}

export async function updateItem(
  id: string,
  dto: { caption?: string | null; sortOrder?: number },
): Promise<PortfolioItem | null> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (dto.caption !== undefined) {
    fields.push(`caption = $${idx++}`);
    values.push(dto.caption);
  }
  if (dto.sortOrder !== undefined) {
    fields.push(`sort_order = $${idx++}`);
    values.push(dto.sortOrder);
  }

  if (fields.length === 0) return findById(id);

  values.push(id);
  const { rows } = await pool.query(
    `UPDATE vendor_portfolio_items SET ${fields.join(", ")} WHERE id = $${idx} RETURNING *`,
    values,
  );
  return rows.length ? rowToItem(rows[0]) : null;
}

export async function deleteItem(id: string): Promise<boolean> {
  const { rowCount } = await pool.query(
    "DELETE FROM vendor_portfolio_items WHERE id = $1",
    [id],
  );
  return (rowCount ?? 0) > 0;
}
