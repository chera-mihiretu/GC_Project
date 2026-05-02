import { Router, type Request, type Response } from "express";
import {
  handleListVendors,
  handleGetVendor,
} from "./public-vendor.controller.js";
import { getVendorAvailabilityForMonth } from "../use-cases/manage-availability.js";
import { findById } from "../infrastructure/vendor-profile.repository.js";

const router = Router();

router.get("/", handleListVendors);
router.get("/:vendorId", handleGetVendor);

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
