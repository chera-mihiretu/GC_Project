import { Router, type Request, type Response } from "express";
import { requireAuth, requireRole } from "../../auth/presentation/auth.middleware.js";
import { resolveVendorContext } from "../../auth/presentation/vendor-context.middleware.js";
import {
  addAvailabilityRange,
  removeAvailabilityRange,
  getVendorAvailability,
} from "../use-cases/manage-availability.js";
import { findByUserId } from "../infrastructure/vendor-profile.repository.js";

const router = Router();

router.use(requireAuth(), requireRole("vendor"), resolveVendorContext());

router.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.authContext!.vendorOwnerId ?? req.authContext!.user.id;
    const profile = await findByUserId(userId);
    if (!profile) {
      res.status(404).json({ error: { code: "NOT_FOUND", message: "Vendor profile not found" } });
      return;
    }
    const ranges = await getVendorAvailability(profile.id);
    res.json({ availability: ranges });
  } catch (err) {
    const error = err as Error & { statusCode?: number };
    res.status(error.statusCode ?? 500).json({
      error: { code: "SERVER_ERROR", message: error.message },
    });
  }
});

router.post("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.authContext!.vendorOwnerId ?? req.authContext!.user.id;
    const profile = await findByUserId(userId);
    if (!profile) {
      res.status(404).json({ error: { code: "NOT_FOUND", message: "Vendor profile not found" } });
      return;
    }
    const { startDate, endDate, note } = req.body as {
      startDate?: string;
      endDate?: string;
      note?: string;
    };
    const range = await addAvailabilityRange({
      vendorProfileId: profile.id,
      startDate: startDate ?? "",
      endDate: endDate ?? "",
      note,
    });
    res.status(201).json({ availability: range });
  } catch (err) {
    const error = err as Error & { statusCode?: number };
    res.status(error.statusCode ?? 500).json({
      error: { code: "BAD_REQUEST", message: error.message },
    });
  }
});

router.delete("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.authContext!.vendorOwnerId ?? req.authContext!.user.id;
    const profile = await findByUserId(userId);
    if (!profile) {
      res.status(404).json({ error: { code: "NOT_FOUND", message: "Vendor profile not found" } });
      return;
    }
    const id = req.params.id as string;
    await removeAvailabilityRange(id, profile.id);
    res.status(204).send();
  } catch (err) {
    const error = err as Error & { statusCode?: number };
    res.status(error.statusCode ?? 500).json({
      error: { code: "NOT_FOUND", message: error.message },
    });
  }
});

export default router;
