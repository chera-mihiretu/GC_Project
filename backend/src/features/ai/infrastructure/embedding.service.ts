import { pool } from "../../../config/db.js";
import { getGeminiClient } from "./gemini-client.js";

const EMBEDDING_MODEL = "gemini-embedding-001";
const EMBEDDING_DIMS = 768;

export async function buildVendorDocument(vendorProfileId: string): Promise<string | null> {
  const profileResult = await pool.query(
    `SELECT business_name, category, description, phone_number, location,
            latitude, longitude, price_range_min, price_range_max,
            years_of_experience, social_media, rating, review_count, status
     FROM vendor_profiles WHERE id = $1`,
    [vendorProfileId],
  );

  if (profileResult.rows.length === 0) return null;
  const p = profileResult.rows[0];

  if (p.status !== "verified") return null;

  const categories = Array.isArray(p.category) ? p.category : [];

  const parts: string[] = [];

  parts.push(`Business: ${p.business_name || "Unnamed"}`);
  parts.push(`Service Categories: ${categories.join(", ") || "Not specified"}`);
  parts.push(`Location: ${p.location || "Not specified"}`);
  if (p.latitude && p.longitude) {
    parts.push(`Coordinates: ${p.latitude}, ${p.longitude}`);
  }
  parts.push(`Price Range: ${p.price_range_min ?? "N/A"} - ${p.price_range_max ?? "N/A"} ETB`);
  parts.push(`Years of Experience: ${p.years_of_experience ?? "Not specified"}`);
  parts.push(`Overall Rating: ${p.rating}/5 (${p.review_count} reviews)`);
  if (p.description) {
    parts.push(`Description: ${p.description}`);
  }
  if (p.social_media && typeof p.social_media === "object") {
    const links = Object.entries(p.social_media)
      .filter(([, v]) => v)
      .map(([k, v]) => `${k}: ${v}`)
      .join(", ");
    if (links) parts.push(`Social Media: ${links}`);
  }

  const portfolioResult = await pool.query(
    `SELECT category, caption, media_type, COUNT(*) OVER (PARTITION BY category) as cat_count
     FROM vendor_portfolio_items
     WHERE vendor_profile_id = $1
     ORDER BY category, sort_order`,
    [vendorProfileId],
  );

  if (portfolioResult.rows.length > 0) {
    const categorySummary = new Map<string, { count: number; captions: string[] }>();
    for (const row of portfolioResult.rows) {
      if (!categorySummary.has(row.category)) {
        categorySummary.set(row.category, { count: Number(row.cat_count), captions: [] });
      }
      if (row.caption) {
        categorySummary.get(row.category)!.captions.push(row.caption);
      }
    }
    const portfolioParts: string[] = [];
    for (const [cat, info] of categorySummary) {
      let line = `${cat}: ${info.count} items`;
      if (info.captions.length > 0) {
        line += ` — ${info.captions.slice(0, 3).join("; ")}`;
      }
      portfolioParts.push(line);
    }
    parts.push(`Portfolio: ${portfolioParts.join(". ")}`);
  }

  const reviewResult = await pool.query(
    `SELECT rating, comment FROM reviews
     WHERE vendor_profile_id = $1 AND is_approved = true
     ORDER BY created_at DESC LIMIT 5`,
    [vendorProfileId],
  );

  if (reviewResult.rows.length > 0) {
    const comments = reviewResult.rows
      .filter((r: { comment: string | null }) => r.comment)
      .map((r: { rating: number; comment: string }) => `"${r.comment}" (${r.rating}/5)`);
    if (comments.length > 0) {
      parts.push(`Recent Reviews: ${comments.join(". ")}`);
    }
  }

  const availResult = await pool.query(
    `SELECT start_date, end_date, note FROM vendor_availability
     WHERE vendor_profile_id = $1 AND end_date >= CURRENT_DATE
     ORDER BY start_date LIMIT 10`,
    [vendorProfileId],
  );

  if (availResult.rows.length > 0) {
    const windows = availResult.rows.map(
      (r: { start_date: string; end_date: string; note: string | null }) =>
        `${r.start_date} to ${r.end_date}${r.note ? ` (${r.note})` : ""}`,
    );
    parts.push(`Available Dates: ${windows.join("; ")}`);
  }

  const bookingResult = await pool.query(
    `SELECT COUNT(*) as completed FROM bookings
     WHERE vendor_profile_id = $1 AND status = 'completed'`,
    [vendorProfileId],
  );
  const completedBookings = Number(bookingResult.rows[0]?.completed || 0);
  if (completedBookings > 0) {
    parts.push(`Completed Bookings: ${completedBookings}`);
  }

  return parts.join("\n");
}

export async function embedText(text: string, taskType: "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY"): Promise<number[]> {
  const ai = getGeminiClient();
  const response = await ai.models.embedContent({
    model: EMBEDDING_MODEL,
    contents: [text],
    config: {
      taskType,
      outputDimensionality: EMBEDDING_DIMS,
    },
  });
  return response.embeddings?.[0]?.values ?? [];
}

export async function refreshEmbedding(vendorProfileId: string): Promise<boolean> {
  try {
    const document = await buildVendorDocument(vendorProfileId);
    if (!document) return false;

    const embedding = await embedText(document, "RETRIEVAL_DOCUMENT");
    if (embedding.length === 0) return false;

    const vectorStr = `[${embedding.join(",")}]`;

    await pool.query(
      `INSERT INTO vendor_embeddings (vendor_profile_id, content, embedding, updated_at)
       VALUES ($1, $2, $3::vector, NOW())
       ON CONFLICT (vendor_profile_id)
       DO UPDATE SET content = $2, embedding = $3::vector, updated_at = NOW()`,
      [vendorProfileId, document, vectorStr],
    );

    return true;
  } catch (err) {
    console.error(`[AI] Failed to refresh embedding for ${vendorProfileId}:`, err);
    return false;
  }
}
