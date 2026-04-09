import express, { Request, Response } from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth.js";
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