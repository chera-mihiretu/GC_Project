/**
 * Seed script — creates one user per platform role for testing.
 *
 * Roles seeded:
 *   1. Couple          (role = "couple")
 *   2. Vendor Owner    (role = "vendor", org owner)
 *   3. Vendor Staff    (role = "vendor", org member)
 *   4. Super Admin     (role = "admin")
 *   5. Content Moderator (role = "admin" with limited scope — treated as moderator)
 *
 * Usage:  npm run seed:users
 * Env:    DATABASE_URL, BETTER_AUTH_SECRET (loaded from .env)
 *
 * The script is IDEMPOTENT — it skips users whose email already exists.
 */

import { auth } from "../lib/auth.js";
import { pool } from "../config/db.js";
import dotenv from "dotenv";

dotenv.config();

const SEED_PASSWORD = process.env.SEED_PASSWORD || "Test@1234";

interface SeedUser {
  name: string;
  email: string;
  accountType: "couple" | "vendor";
  /** Override role after creation (for admin/moderator). */
  overrideRole?: string;
}

const seedUsers: SeedUser[] = [
  {
    name: "Test Couple",
    email: "couple@test.com",
    accountType: "couple",
  },
  {
    name: "Test Vendor Owner",
    email: "vendor.owner@test.com",
    accountType: "vendor",
  },
  {
    name: "Test Vendor Staff",
    email: "vendor.staff@test.com",
    accountType: "vendor",
  },
  {
    name: "Test Super Admin",
    email: "admin@test.com",
    accountType: "couple",
    overrideRole: "admin",
  },
  {
    name: "Test Moderator",
    email: "moderator@test.com",
    accountType: "couple",
    overrideRole: "moderator",
  },
];

async function emailExists(email: string): Promise<boolean> {
  const { rows } = await pool.query(
    'SELECT 1 FROM "user" WHERE email = $1 LIMIT 1',
    [email],
  );
  return rows.length > 0;
}

async function createUser(
  seed: SeedUser,
): Promise<{ id: string; email: string } | null> {
  if (await emailExists(seed.email)) {
    console.log(`  ⏭  ${seed.email} already exists — skipping`);
    return null;
  }

  const result = await auth.api.signUpEmail({
    body: {
      email: seed.email,
      password: SEED_PASSWORD,
      name: seed.name,
      accountType: seed.accountType,
    },
  });

  const user = result.user as { id: string; email: string };
  console.log(`  ✅ Created ${seed.email}  (id: ${user.id})`);
  return user;
}

async function setRole(userId: string, role: string): Promise<void> {
  await pool.query('UPDATE "user" SET role = $1 WHERE id = $2', [
    role,
    userId,
  ]);
  console.log(`  🔑 Role set to "${role}" for user ${userId}`);
}

async function ensureVendorOrg(
  ownerUserId: string,
  ownerName: string,
): Promise<string | null> {
  const { rows } = await pool.query(
    'SELECT id FROM "organization" WHERE slug = $1 LIMIT 1',
    [`vendor-${ownerUserId}`],
  );

  if (rows.length > 0) {
    console.log(`  🏢 Organization already exists for vendor ${ownerUserId}`);
    return rows[0].id as string;
  }

  try {
    const org = await auth.api.createOrganization({
      body: {
        name: `${ownerName}'s Business`,
        slug: `vendor-${ownerUserId}`,
        userId: ownerUserId,
      },
    });
    const orgId = (org as { id: string }).id;
    console.log(`  🏢 Created vendor organization (id: ${orgId})`);
    return orgId;
  } catch (err) {
    console.error("  ⚠️  Failed to create vendor organization:", err);
    return null;
  }
}

async function addStaffToVendorOrg(
  orgId: string,
  staffUserId: string,
): Promise<void> {
  const { rows } = await pool.query(
    'SELECT id FROM "member" WHERE "userId" = $1 AND "organizationId" = $2 LIMIT 1',
    [staffUserId, orgId],
  );

  if (rows.length > 0) {
    console.log(`  👥 Staff already a member of organization ${orgId}`);
    return;
  }

  await auth.api.addMember({
    body: {
      userId: staffUserId,
      role: "member",
      organizationId: orgId,
    },
  });

  console.log(
    `  👥 Added vendor staff (${staffUserId}) to organization ${orgId}`,
  );
}

async function ensureVerifiedVendorProfile(
  userId: string,
  profile: {
    businessName: string;
    category: string;
    description: string;
    phoneNumber: string;
    location: string;
  },
): Promise<void> {
  const { rows } = await pool.query(
    "SELECT id FROM vendor_profiles WHERE user_id = $1 LIMIT 1",
    [userId],
  );

  const categoryJson = JSON.stringify(profile.category);

  if (rows.length > 0) {
    await pool.query(
      "UPDATE vendor_profiles SET status = 'verified', business_name = $1, category = $2::jsonb, description = $3, phone_number = $4, location = $5, updated_at = NOW() WHERE user_id = $6",
      [profile.businessName, categoryJson, profile.description, profile.phoneNumber, profile.location, userId],
    );
    console.log(`  ✅ Vendor profile updated to verified: ${profile.businessName}`);
    return;
  }

  const id = crypto.randomUUID();
  await pool.query(
    `INSERT INTO vendor_profiles (id, user_id, business_name, category, description, phone_number, location, status)
     VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7, 'verified')`,
    [id, userId, profile.businessName, categoryJson, profile.description, profile.phoneNumber, profile.location],
  );
  console.log(`  ✅ Created verified vendor profile: ${profile.businessName} (id: ${id})`);
}

async function seed(): Promise<void> {
  console.log("\n🌱 Seeding test users …\n");

  const userMap = new Map<string, string>();
  const createdIds: string[] = [];

  for (const entry of seedUsers) {
    const user = await createUser(entry);
    if (user) {
      createdIds.push(user.id);
      userMap.set(entry.email, user.id);
    } else {
      const { rows } = await pool.query(
        'SELECT id FROM "user" WHERE email = $1 LIMIT 1',
        [entry.email],
      );
      if (rows.length > 0) userMap.set(entry.email, rows[0].id as string);
    }

    const userId = userMap.get(entry.email);
    if (userId && entry.overrideRole) {
      await setRole(userId, entry.overrideRole);
    }
  }

  // Mark all seeded emails as verified (covers both new and existing)
  const allEmails = seedUsers.map((u) => u.email);
  await pool.query(
    `UPDATE "user" SET "emailVerified" = true WHERE email = ANY($1)`,
    [allEmails],
  );
  console.log(`\n  📧 Ensured all seed users are email-verified`);

  // Vendor organization + staff membership
  const vendorOwnerId = userMap.get("vendor.owner@test.com");
  const vendorStaffId = userMap.get("vendor.staff@test.com");

  if (vendorOwnerId) {
    const orgId = await ensureVendorOrg(vendorOwnerId, "Test Vendor Owner");
    if (orgId && vendorStaffId) {
      await addStaffToVendorOrg(orgId, vendorStaffId);
    }
  }

  // Create verified vendor profiles for testing bookings
  if (vendorOwnerId) {
    await ensureVerifiedVendorProfile(vendorOwnerId, {
      businessName: "Sunset Photography",
      category: "photography",
      description: "Award-winning wedding photography studio in Addis Ababa. We capture timeless moments with artistic flair.",
      phoneNumber: "+251911223344",
      location: "Addis Ababa",
    });
  }

  // Seed additional verified vendors for a realistic browse page
  const extraVendors = [
    { email: "vendor2@test.com", name: "Habesha Catering", accountType: "vendor" as const, profile: { businessName: "Habesha Catering", category: "catering", description: "Traditional and modern Ethiopian cuisine for weddings and celebrations.", phoneNumber: "+251922334455", location: "Addis Ababa" } },
    { email: "vendor3@test.com", name: "Bloom Florist", accountType: "vendor" as const, profile: { businessName: "Bloom Florist", category: "florist", description: "Custom floral arrangements for weddings — bouquets, centerpieces, and venue decoration.", phoneNumber: "+251933445566", location: "Hawassa" } },
    { email: "vendor4@test.com", name: "DJ Beats", accountType: "vendor" as const, profile: { businessName: "DJ Beats", category: "dj", description: "Professional DJ services for weddings and events. All genres covered.", phoneNumber: "+251944556677", location: "Addis Ababa" } },
  ];

  for (const v of extraVendors) {
    let userId = userMap.get(v.email);
    if (!userId) {
      const user = await createUser({ name: v.name, email: v.email, accountType: v.accountType });
      if (user) {
        userId = user.id;
        userMap.set(v.email, userId);
      } else {
        const { rows } = await pool.query('SELECT id FROM "user" WHERE email = $1 LIMIT 1', [v.email]);
        if (rows.length > 0) userId = rows[0].id as string;
      }
    }
    if (userId) {
      await pool.query(`UPDATE "user" SET "emailVerified" = true WHERE id = $1`, [userId]);
      await ensureVerifiedVendorProfile(userId, v.profile);
    }
  }

  console.log("\n✅ Seed complete.\n");
  console.log("┌──────────────────────────────────────────────────┐");
  console.log("│  Credentials (all users share the same password) │");
  console.log("├──────────────────────────────────────────────────┤");
  console.log(`│  Password : ${SEED_PASSWORD.padEnd(36)}│`);
  console.log("├──────────────────────────────────────────────────┤");
  console.log("│  couple@test.com          → Couple               │");
  console.log("│  vendor.owner@test.com    → Vendor Owner          │");
  console.log("│  vendor.staff@test.com    → Vendor Staff (member) │");
  console.log("│  admin@test.com           → Super Admin            │");
  console.log("│  moderator@test.com       → Content Moderator      │");
  console.log("└──────────────────────────────────────────────────┘");
}

seed()
  .catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exitCode = 1;
  })
  .finally(() => {
    pool.end();
  });
