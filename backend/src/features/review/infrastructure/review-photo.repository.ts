import { pool } from "../../../config/db.js";

export interface ReviewPhoto {
  id: string;
  reviewId: string;
  url: string;
  createdAt: Date;
}

function rowToPhoto(row: Record<string, unknown>): ReviewPhoto {
  return {
    id: row.id as string,
    reviewId: row.review_id as string,
    url: row.url as string,
    createdAt: new Date(row.created_at as string),
  };
}

export async function addPhotos(reviewId: string, urls: string[]): Promise<ReviewPhoto[]> {
  if (urls.length === 0) return [];

  const values: unknown[] = [];
  const placeholders: string[] = [];
  let idx = 1;

  for (const url of urls) {
    placeholders.push(`($${idx++}, $${idx++})`);
    values.push(reviewId, url);
  }

  const { rows } = await pool.query(
    `INSERT INTO review_photos (review_id, url) VALUES ${placeholders.join(", ")} RETURNING *`,
    values,
  );

  return rows.map(rowToPhoto);
}

export async function findByReviewId(reviewId: string): Promise<ReviewPhoto[]> {
  const { rows } = await pool.query(
    `SELECT * FROM review_photos WHERE review_id = $1 ORDER BY created_at ASC`,
    [reviewId],
  );
  return rows.map(rowToPhoto);
}

export async function countByReviewId(reviewId: string): Promise<number> {
  const { rows } = await pool.query(
    `SELECT COUNT(*)::int as count FROM review_photos WHERE review_id = $1`,
    [reviewId],
  );
  return rows[0].count as number;
}
