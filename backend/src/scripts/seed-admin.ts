/**
 * Seed script — creates the initial admin account.
 *
 * Usage:  npm run seed:admin
 *
 * Uses the running Better Auth instance to hash the password, then
 * promotes the user to role "admin" and marks the email as verified.
 * Safe to run multiple times — skips if admin@admin.com already exists.
 */

import { pool } from "../config/db.js";
import { auth } from "../lib/auth.js";

const ADMIN_EMAIL = "admin@admin.com";
const ADMIN_PASSWORD = "123123123";
const ADMIN_NAME = "Admin";

async function seed() {
  console.log("🔍 Checking for existing admin account...");

  const existing = await pool.query(
    'SELECT id, role FROM "user" WHERE email = $1',
    [ADMIN_EMAIL],
  );

  if (existing.rows.length > 0) {
    const user = existing.rows[0];
    if (user.role === "admin") {
      console.log(`✅ Admin account already exists (${ADMIN_EMAIL}). Nothing to do.`);
    } else {
      await pool.query(
        'UPDATE "user" SET role = $1, "emailVerified" = true WHERE id = $2',
        ["admin", user.id],
      );
      console.log(`⬆️  Promoted existing user ${ADMIN_EMAIL} to admin.`);
    }
    await pool.end();
    return;
  }

  console.log("📝 Creating admin account via Better Auth...");

  const ctx = await auth.api.signUpEmail({
    body: {
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    },
  });

  if (!ctx?.user?.id) {
    console.error("❌ Failed to create admin account.");
    await pool.end();
    process.exit(1);
  }

  await pool.query(
    'UPDATE "user" SET role = $1, "emailVerified" = true WHERE id = $2',
    ["admin", ctx.user.id],
  );

  console.log("✅ Admin account created successfully:");
  console.log(`   Email:    ${ADMIN_EMAIL}`);
  console.log(`   Password: ${ADMIN_PASSWORD}`);
  console.log(`   Role:     admin`);

  await pool.end();
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  pool.end().then(() => process.exit(1));
});
