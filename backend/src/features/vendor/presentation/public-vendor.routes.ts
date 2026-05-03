import { Router, type Request, type Response } from "express";
import {
  handleListVendors,
  handleGetVendor,
} from "./public-vendor.controller.js";
import { getVendorAvailabilityForMonth } from "../use-cases/manage-availability.js";
import { findById } from "../infrastructure/vendor-profile.repository.js";
import { findByVendorProfileIdWithAuthor } from "../../review/infrastructure/review.repository.js";
import { findByVendorProfileId, findByVendorProfileIdPaginated } from "../infrastructure/portfolio.repository.js";
import type { PortfolioItem } from "../infrastructure/portfolio.repository.js";

const router = Router();

router.get("/", handleListVendors);
router.get("/:vendorId", handleGetVendor);

router.get("/:vendorId/reviews", async (req: Request, res: Response): Promise<void> => {
  try {
    const vendorProfileId = req.params.vendorId as string;
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;

    const result = await findByVendorProfileIdWithAuthor(vendorProfileId, { page, limit });
    res.json(result);
  } catch (err) {
    const error = err as Error & { statusCode?: number };
    res.status(error.statusCode ?? 500).json({
      error: { code: "SERVER_ERROR", message: error.message },
    });
  }
});

router.get("/:vendorId/portfolio", async (req: Request, res: Response): Promise<void> => {
  try {
    const vendorProfileId = req.params.vendorId as string;
    const profile = await findById(vendorProfileId);
    if (!profile) {
      res.status(404).json({ error: { message: "Vendor not found" } });
      return;
    }
    const items = await findByVendorProfileId(vendorProfileId);
    const grouped: Record<string, PortfolioItem[]> = {};
    for (const item of items) {
      if (!grouped[item.category]) grouped[item.category] = [];
      grouped[item.category].push(item);
    }
    res.json({ portfolio: grouped });
  } catch (err) {
    const error = err as Error & { statusCode?: number };
    res.status(error.statusCode ?? 500).json({ error: { message: error.message } });
  }
});

router.get("/:vendorId/portfolio/:category", async (req: Request, res: Response): Promise<void> => {
  try {
    const vendorProfileId = req.params.vendorId as string;
    const category = req.params.category as string;
    const limit = Math.min(Number(req.query.limit) || 12, 50);
    const offset = Number(req.query.offset) || 0;

    const profile = await findById(vendorProfileId);
    if (!profile) {
      res.status(404).json({ error: { message: "Vendor not found" } });
      return;
    }
    const result = await findByVendorProfileIdPaginated(vendorProfileId, category, limit, offset);
    res.json(result);
  } catch (err) {
    const error = err as Error & { statusCode?: number };
    res.status(error.statusCode ?? 500).json({ error: { message: error.message } });
  }
  }
});

router.get("/:vendorId/availability", async (req: Request, res: Response): Promise<void> => {
  try {
    const vendorProfileId = req.params.vendorId as string;
    const month = req.query.month as string | undefined;

    const profile = await findById(vendorProfileId);
    if (!profile) {
      res.status(404).json({ error: { code: "NOT_FOUND", message: "Vendor not found" } });
      return;
    }

    let year: number;
    let monthNum: number;

    if (month && /^\d{4}-\d{2}$/.test(month)) {
      const [y, m] = month.split("-");
      year = parseInt(y, 10);
      monthNum = parseInt(m, 10);
    } else {
      const now = new Date();
      year = now.getFullYear();
      monthNum = now.getMonth() + 1;
    }

    const ranges = await getVendorAvailabilityForMonth(vendorProfileId, year, monthNum);
    res.json({ availability: ranges });
  } catch (err) {
    const error = err as Error & { statusCode?: number };
    res.status(error.statusCode ?? 500).json({
      error: { code: "SERVER_ERROR", message: error.message },
    });
  }
});

export default router;
