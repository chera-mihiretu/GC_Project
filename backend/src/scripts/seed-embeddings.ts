import dotenv from "dotenv";
dotenv.config();

import { pool } from "../config/db.js";
import { initAITables } from "../features/ai/infrastructure/init-tables.js";
import { buildVendorDocument, embedText } from "../features/ai/infrastructure/embedding.service.js";

const BATCH_SIZE = 5;
const DELAY_MS = 1000;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function embedVendor(id: string, name: string, index: number, total: number): Promise<boolean> {
  const prefix = `  [${index}/${total}] ${name}`;
  try {
    console.log(`${prefix} — Building document...`);
    const t0 = Date.now();
    const document = await buildVendorDocument(id);
    if (!document) {
      console.log(`${prefix} — SKIP (not verified or not found)`);
      return false;
    }
    const docTime = Date.now() - t0;
    console.log(`${prefix} — Document built (${document.length} chars, ${docTime}ms)`);
    console.log(`${prefix}   ↳ Preview: ${document.slice(0, 120).replace(/\n/g, " ")}...`);

    console.log(`${prefix} — Calling Gemini embedding API...`);
    const t1 = Date.now();
    const embedding = await embedText(document, "RETRIEVAL_DOCUMENT");
    const embedTime = Date.now() - t1;
    if (embedding.length === 0) {
      console.log(`${prefix} — FAIL (empty embedding returned, ${embedTime}ms)`);
      return false;
    }
    console.log(`${prefix} — Embedding received (${embedding.length} dims, ${embedTime}ms)`);

    console.log(`${prefix} — Upserting into vendor_embeddings...`);
    const t2 = Date.now();
    const vectorStr = `[${embedding.join(",")}]`;
    await pool.query(
      `INSERT INTO vendor_embeddings (vendor_profile_id, content, embedding, updated_at)
       VALUES ($1, $2, $3::vector, NOW())
       ON CONFLICT (vendor_profile_id)
       DO UPDATE SET content = $2, embedding = $3::vector, updated_at = NOW()`,
      [id, document, vectorStr],
    );
    const dbTime = Date.now() - t2;
    const totalTime = Date.now() - t0;
    console.log(`${prefix} — ✓ DONE (db: ${dbTime}ms, total: ${totalTime}ms)`);
    return true;
  } catch (err) {
    console.error(`${prefix} — ✗ ERROR:`, err instanceof Error ? err.message : err);
    return false;
  }
}

async function main() {
  console.log("╔══════════════════════════════════════╗");
  console.log("║       SEED VENDOR EMBEDDINGS         ║");
  console.log("╚══════════════════════════════════════╝\n");

  console.log("Tables affected by this script:");
  console.log("  READ  → vendor_profiles (fetch profile data)");
  console.log("  READ  → vendor_portfolio_items (portfolio summary)");
  console.log("  READ  → reviews (recent reviews + ratings)");
  console.log("  READ  → vendor_availability (future availability)");
  console.log("  READ  → bookings (completed booking count)");
  console.log("  WRITE → vendor_embeddings (upsert embedding per vendor)\n");

  console.log("[1/3] Initializing vendor_embeddings table...");
  await initAITables();
  console.log("  ✓ Table ready\n");

  console.log("[2/3] Fetching verified vendors...");
  const vendorsResult = await pool.query(
    `SELECT id, business_name FROM vendor_profiles WHERE status = 'verified' ORDER BY business_name`,
  );
  const vendors = vendorsResult.rows;
  console.log(`  Found ${vendors.length} verified vendors`);

  if (vendors.length === 0) {
    console.log("\nNo verified vendors to embed. Done.");
    await pool.end();
    return;
  }

  const existingResult = await pool.query(
    `SELECT vendor_profile_id FROM vendor_embeddings`,
  );
  const existingSet = new Set(existingResult.rows.map((r: { vendor_profile_id: string }) => r.vendor_profile_id));
  const toEmbed = vendors.filter((v: { id: string }) => !existingSet.has(v.id));

  console.log(`  Already embedded: ${existingSet.size}`);
  console.log(`  Remaining to embed: ${toEmbed.length}`);
  console.log(`  Batch size: ${BATCH_SIZE} | Delay between batches: ${DELAY_MS}ms\n`);

  if (toEmbed.length === 0) {
    console.log("All vendors already embedded. Done.");
    await pool.end();
    return;
  }

  console.log("[3/3] Embedding vendors...\n");
  const startTime = Date.now();
  let success = 0;
  let failed = 0;

  for (let i = 0; i < toEmbed.length; i += BATCH_SIZE) {
    const batch = toEmbed.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(toEmbed.length / BATCH_SIZE);

    console.log(`── Batch ${batchNum}/${totalBatches} ──────────────────────────`);

    const results = await Promise.allSettled(
      batch.map((v: { id: string; business_name: string }, bIdx: number) =>
        embedVendor(v.id, v.business_name, i + bIdx + 1, toEmbed.length),
      ),
    );

    for (const r of results) {
      if (r.status === "fulfilled" && r.value) success++;
      else failed++;
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const rate = success / (Number(elapsed) || 1);
    const remaining = toEmbed.length - (i + batch.length);
    const eta = remaining > 0 ? (remaining / rate / 60).toFixed(1) : "0";
    console.log(`\n  📊 Progress: ${success + failed}/${toEmbed.length} (${success} ok, ${failed} fail) | ${elapsed}s elapsed | ETA: ${eta} min\n`);

    if (i + BATCH_SIZE < toEmbed.length) {
      console.log(`  ⏳ Waiting ${DELAY_MS}ms before next batch...\n`);
      await sleep(DELAY_MS);
    }
  }

  console.log("╔══════════════════════════════════════╗");
  console.log("║            COMPLETE                  ║");
  console.log("╚══════════════════════════════════════╝");
  console.log(`  ✓ Embedded: ${success}`);
  console.log(`  ✗ Failed/Skipped: ${failed}`);
  console.log(`  ⏱ Total time: ${((Date.now() - startTime) / 1000).toFixed(1)}s`);

  await pool.end();
}

main().catch((err) => {
  console.error("Seed embeddings failed:", err);
  process.exit(1);
});
