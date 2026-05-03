import express, { Request, Response } from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { env } from "./config/env.js";
import { auth } from "./lib/auth.js";
import { pool } from "./config/db.js";
import { initVendorTables } from "./features/vendor/infrastructure/init-tables.js";
import { ensureBucketExists } from "./features/vendor/infrastructure/supabase-storage.js";
import { ensurePortfolioBucketExists } from "./features/vendor/infrastructure/portfolio-storage.js";
import vendorRoutes from "./features/vendor/presentation/vendor.routes.js";
import portfolioRoutes from "./features/vendor/presentation/portfolio.routes.js";
import adminVendorRoutes from "./features/vendor/presentation/admin-vendor.routes.js";
import publicVendorRoutes from "./features/vendor/presentation/public-vendor.routes.js";
import { requireAuth } from "./features/auth/presentation/auth.middleware.js";
import notificationRoutes from "./features/realtime/presentation/notification.routes.js";
import chatRoutes from "./features/realtime/presentation/chat.routes.js";
import { initRealtimeTables } from "./features/realtime/infrastructure/init-tables.js";
import bookingRoutes from "./features/booking/presentation/booking.routes.js";
import { initBookingTables } from "./features/booking/infrastructure/init-tables.js";
import { initAvailabilityTable } from "./features/vendor/infrastructure/init-availability-table.js";
import availabilityRoutes from "./features/vendor/presentation/availability.routes.js";
import reviewRoutes from "./features/review/presentation/review.routes.js";
import adminReviewRoutes from "./features/review/presentation/admin-review.routes.js";
import { initReviewTables } from "./features/review/infrastructure/init-tables.js";
import { initReviewPhotoTables } from "./features/review/infrastructure/init-photos-table.js";
import { ensureReviewBucketExists } from "./features/review/infrastructure/review-storage.js";
import { sendNotification } from "./features/realtime/use-cases/send-notification.js";
import { getSendEmailUseCase } from "./features/email/index.js";
import coupleRoutes from "./features/couple/presentation/couple.routes.js";
import { initCoupleTables } from "./features/couple/infrastructure/init-tables.js";

const app = express();

const allowedOrigins = [
  env.FRONTEND_URL,
  "http://localhost:3000",
].filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked: ${origin}`));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.all("/api/auth/*splat", toNodeHandler(auth));

app.use(express.json());

// Pre-signup email availability check. Better Auth v1.5.2+ masks
// duplicate-email errors when requireEmailVerification is enabled.
app.post("/api/v1/auth/check-email", async (req: Request, res: Response) => {
  const { email } = req.body ?? {};
  if (!email || typeof email !== "string") {
    res.status(400).json({ available: false, message: "Email is required" });
    return;
  }
  try {
    const result = await pool.query(
      'SELECT 1 FROM "user" WHERE email = $1 LIMIT 1',
      [email.toLowerCase().trim()],
    );
    const exists = result.rows.length > 0;
    res.json({ available: !exists });
  } catch {
    res.status(500).json({ available: false, message: "Server error" });
  }
});

app.patch("/api/v1/auth/set-role", requireAuth(), async (req: Request, res: Response) => {
  const userId = req.authContext!.user.id;
  const currentRole = req.authContext!.user.role;
  const { role } = req.body ?? {};

  if (!role || !["couple", "vendor"].includes(role)) {
    res.status(400).json({ error: { code: "BAD_REQUEST", message: "role must be 'couple' or 'vendor'" } });
    return;
  }

  if (currentRole !== "couple") {
    res.status(409).json({ error: { code: "CONFLICT", message: "Role can only be changed from the default" } });
    return;
  }

  if (role === "couple") {
    res.json({ user: req.authContext!.user });
    return;
  }

  try {
    await pool.query('UPDATE "user" SET role = $1 WHERE id = $2', [role, userId]);

    if (role === "vendor") {
      await auth.api.createOrganization({
        body: {
          name: `${req.authContext!.user.name}'s Business`,
          slug: `vendor-${userId}`,
          userId,
        },
      });
    }

    const updated = await pool.query('SELECT id, name, email, role FROM "user" WHERE id = $1', [userId]);
    res.json({ user: updated.rows[0] });
  } catch (err) {
    console.error("Failed to set role:", err);
    res.status(500).json({ error: { code: "SERVER_ERROR", message: "Failed to update role" } });
  }
});

app.get("/api/v1/auth/invitation/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'SELECT id, email, status, "organizationId" FROM "invitation" WHERE id = $1 LIMIT 1',
      [id],
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: "Invitation not found" });
      return;
    }
    const inv = result.rows[0];
    const orgResult = await pool.query(
      'SELECT name FROM "organization" WHERE id = $1 LIMIT 1',
      [inv.organizationId],
    );
    res.json({
      id: inv.id,
      email: inv.email,
      status: inv.status,
      organizationName: orgResult.rows[0]?.name || "Unknown",
    });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/v1/auth/invitation/:id/accepted", async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const invResult = await pool.query(
      'SELECT email, "organizationId" FROM "invitation" WHERE id = $1 LIMIT 1',
      [id],
    );
    if (invResult.rows.length === 0) {
      res.status(404).json({ error: "Invitation not found" });
      return;
    }
    const { email, organizationId } = invResult.rows[0];

    const orgResult = await pool.query(
      'SELECT name FROM "organization" WHERE id = $1 LIMIT 1',
      [organizationId],
    );
    const orgName = orgResult.rows[0]?.name || "your team";

    const ownerResult = await pool.query(
      `SELECT "userId" FROM "member" WHERE "organizationId" = $1 AND role = 'owner' LIMIT 1`,
      [organizationId],
    );
    if (ownerResult.rows.length === 0) {
      res.json({ sent: false });
      return;
    }

    const ownerId = ownerResult.rows[0].userId;
    await sendNotification({
      userId: ownerId,
      type: "invitation_accepted",
      title: "Staff Joined",
      body: `${email} has accepted the invitation and joined ${orgName}.`,
      metadata: { invitationId: id, email, organizationId },
    });

    res.json({ sent: true });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/v1/auth/check-invite-eligibility", requireAuth(), async (req: Request, res: Response) => {
  const { email } = req.body ?? {};
  if (!email || typeof email !== "string") {
    res.status(400).json({ eligible: false, reason: "Email is required" });
    return;
  }
  try {
    const result = await pool.query(
      'SELECT role FROM "user" WHERE email = $1 LIMIT 1',
      [email.toLowerCase().trim()],
    );
    if (result.rows.length === 0) {
      res.json({ eligible: true });
      return;
    }
    const existingRole = result.rows[0].role;
    if (existingRole === "couple") {
      res.json({ eligible: false, reason: "This email belongs to a couple account and cannot be invited as staff." });
    } else if (existingRole === "vendor") {
      res.json({ eligible: false, reason: "This email already belongs to a vendor account." });
    } else {
      res.json({ eligible: false, reason: "This email is already registered with a different role." });
    }
  } catch {
    res.status(500).json({ eligible: false, reason: "Server error" });
  }
});

app.get("/api/v1/vendor/context", requireAuth(), async (req: Request, res: Response) => {
  const userId = req.authContext!.user.id;
  try {
    const memberResult = await pool.query(
      `SELECT m."organizationId", m.role FROM "member" m WHERE m."userId" = $1 LIMIT 1`,
      [userId],
    );
    if (memberResult.rows.length === 0) {
      res.json({ vendorOwnerId: userId, orgRole: "owner", isStaff: false });
      return;
    }
    const { organizationId, role: orgRole } = memberResult.rows[0];
    if (orgRole === "owner") {
      res.json({ vendorOwnerId: userId, orgRole: "owner", isStaff: false });
      return;
    }
    const ownerResult = await pool.query(
      `SELECT m."userId" FROM "member" m WHERE m."organizationId" = $1 AND m.role = 'owner' LIMIT 1`,
      [organizationId],
    );
    const ownerId = ownerResult.rows[0]?.userId ?? userId;
    res.json({ vendorOwnerId: ownerId, orgRole, isStaff: true });
  } catch {
    res.json({ vendorOwnerId: userId, orgRole: "owner", isStaff: false });
  }
});

// Admin user action notifications (ban/unban emails)
app.post("/api/v1/admin/notify-user-action", requireAuth(), async (req: Request, res: Response) => {
  const role = req.authContext!.user.role;
  if (role !== "admin") {
    res.status(403).json({ error: { code: "FORBIDDEN", message: "Admin only" } });
    return;
  }

  const { userId, action, reason, duration } = req.body ?? {};
  if (!userId || !action) {
    res.status(400).json({ error: { code: "BAD_REQUEST", message: "userId and action are required" } });
    return;
  }

  try {
    const userResult = await pool.query(
      'SELECT name, email FROM "user" WHERE id = $1 LIMIT 1',
      [userId],
    );
    if (userResult.rows.length === 0) {
      res.status(404).json({ error: { code: "NOT_FOUND", message: "User not found" } });
      return;
    }
    const { name, email } = userResult.rows[0];

    if (action === "ban") {
      const durationText = duration === "permanent" || !duration
        ? "permanently"
        : `for ${duration}`;
      const reasonText = reason ? `<p><strong>Reason:</strong> ${reason}</p>` : "";

      void getSendEmailUseCase().execute({
        to: email,
        subject: "Your Twedar account has been suspended",
        html: `
          <h2>Account Suspended</h2>
          <p>Hi ${name},</p>
          <p>Your Twedar account has been suspended ${durationText} due to a policy violation.</p>
          ${reasonText}
          <p>While suspended, you will not be able to sign in or use the platform.</p>
          <p>If you believe this was a mistake, please contact support at <a href="mailto:support@twedar.com">support@twedar.com</a>.</p>
          <p>— The Twedar Team</p>
        `,
        text: `Hi ${name}, your Twedar account has been suspended ${durationText}.${reason ? ` Reason: ${reason}.` : ""} You will not be able to sign in while suspended. Contact support@twedar.com if you believe this is a mistake.`,
      });
    } else if (action === "unban") {
      void getSendEmailUseCase().execute({
        to: email,
        subject: "Your Twedar account has been reactivated",
        html: `
          <h2>Account Reactivated</h2>
          <p>Hi ${name},</p>
          <p>Good news! Your Twedar account has been reviewed and reactivated. You can now sign in and use the platform as usual.</p>
          <p>Please ensure you follow our community guidelines to avoid future suspensions.</p>
          <p>— The Twedar Team</p>
        `,
        text: `Hi ${name}, your Twedar account has been reactivated. You can now sign in and use the platform as usual. Please follow our community guidelines to avoid future suspensions.`,
      });
    }

    res.json({ sent: true });
  } catch (err) {
    console.error("Failed to send admin notification email:", err);
    res.status(500).json({ error: { code: "SERVER_ERROR", message: "Failed to send notification" } });
  }
});

app.get("/api/v1/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/v1/vendor", vendorRoutes);
app.use("/api/v1/vendor/portfolio", portfolioRoutes);
app.use("/api/v1/vendor/availability", availabilityRoutes);
app.use("/api/v1/admin/vendors", adminVendorRoutes);
app.use("/api/v1/vendors", publicVendorRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/conversations", chatRoutes);
app.use("/api/v1/bookings", bookingRoutes);
app.use("/api/v1/reviews", reviewRoutes);
app.use("/api/v1/admin/reviews", adminReviewRoutes);
app.use("/api/v1/couple", coupleRoutes);

initVendorTables().catch((err) => {
  console.error("Failed to initialize vendor tables:", err);
});

initRealtimeTables().catch((err) => {
  console.error("Failed to initialize realtime tables:", err);
});

initBookingTables().catch((err) => {
  console.error("Failed to initialize booking tables:", err);
});

initReviewTables()
  .then(() => initReviewPhotoTables())
  .catch((err) => {
    console.error("Failed to initialize review tables:", err);
  });

ensureReviewBucketExists().catch((err) => {
  console.error("Failed to ensure review photos bucket:", err);
});

initAvailabilityTable().catch((err) => {
  console.error("Failed to initialize availability table:", err);
});

initCoupleTables().catch((err) => {
  console.error("Failed to initialize couple tables:", err);
});

ensureBucketExists().catch((err) => {
  console.error("Failed to ensure Supabase storage bucket:", err);
});

ensurePortfolioBucketExists().catch((err) => {
  console.error("Failed to ensure portfolio storage bucket:", err);
});

export default app;