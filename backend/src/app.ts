import express, { Request, Response } from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth.js";
import { pool } from "./config/db.js";
import { initVendorTables } from "./features/vendor/infrastructure/init-tables.js";
import { ensureBucketExists } from "./features/vendor/infrastructure/supabase-storage.js";
import vendorRoutes from "./features/vendor/presentation/vendor.routes.js";
import adminVendorRoutes from "./features/vendor/presentation/admin-vendor.routes.js";
import publicVendorRoutes from "./features/vendor/presentation/public-vendor.routes.js";

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
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

app.use(express.json());

app.get("/api/v1/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/v1/vendor", vendorRoutes);
app.use("/api/v1/admin/vendors", adminVendorRoutes);
app.use("/api/v1/vendors", publicVendorRoutes);

initVendorTables().catch((err) => {
  console.error("Failed to initialize vendor tables:", err);
});

ensureBucketExists().catch((err) => {
  console.error("Failed to ensure Supabase storage bucket:", err);
});

export default app;