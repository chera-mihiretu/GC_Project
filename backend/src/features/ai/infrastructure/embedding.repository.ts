import { pool } from "../../../config/db.js";
import { embedText } from "./embedding.service.js";
import type { VendorCard } from "../domain/types.js";

export interface SearchFilters {
  categories?: string[];
  location?: string;
  maxBudget?: number;
  minRating?: number;
  limit?: number;
}

export async function searchVendorsByVector(
  query: string,
  filters: SearchFilters = {},
): Promise<(VendorCard & { similarity: number; content: string })[]> {
  const queryEmbedding = await embedText(query, "RETRIEVAL_QUERY");
  if (queryEmbedding.length === 0) return [];

  const vectorStr = `[${queryEmbedding.join(",")}]`;
  const limit = filters.limit ?? 5;

  const conditions: string[] = ["vp.status = 'verified'"];
  const params: (string | number)[] = [vectorStr, limit];
  let paramIdx = 3;

  if (filters.categories && filters.categories.length > 0) {
    conditions.push(`vp.category ?| $${paramIdx}::text[]`);
    params.push(filters.categories as unknown as string);
    paramIdx++;
  }

  if (filters.location) {
    conditions.push(`vp.location ILIKE '%' || $${paramIdx} || '%'`);
    params.push(filters.location);
    paramIdx++;
  }

  if (filters.maxBudget) {
    conditions.push(`vp.price_range_min <= $${paramIdx}`);
    params.push(filters.maxBudget);
    paramIdx++;
  }

  if (filters.minRating) {
    conditions.push(`vp.rating >= $${paramIdx}`);
    params.push(filters.minRating);
    paramIdx++;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const result = await pool.query(
    `SELECT
       vp.id,
       vp.business_name,
       vp.category,
       vp.rating,
       vp.review_count,
       vp.price_range_min,
       vp.price_range_max,
       vp.location,
       ve.content,
       1 - (ve.embedding <=> $1::vector) AS similarity,
       (SELECT media_url FROM vendor_portfolio_items
        WHERE vendor_profile_id = vp.id ORDER BY sort_order LIMIT 1) AS thumbnail
     FROM vendor_embeddings ve
     JOIN vendor_profiles vp ON vp.id = ve.vendor_profile_id
     ${whereClause}
     ORDER BY ve.embedding <=> $1::vector ASC
     LIMIT $2`,
    params,
  );

  return result.rows.map((r: Record<string, unknown>) => ({
    id: r.id as string,
    businessName: r.business_name as string,
    category: (r.category as string[]) || [],
    rating: Number(r.rating),
    reviewCount: Number(r.review_count),
    thumbnail: (r.thumbnail as string) || null,
    priceRangeMin: r.price_range_min ? Number(r.price_range_min) : null,
    priceRangeMax: r.price_range_max ? Number(r.price_range_max) : null,
    location: (r.location as string) || null,
    similarity: Number(r.similarity),
    content: r.content as string,
  }));
}
