import { Router } from "express";
import { requireAuth, requireRole } from "../../auth/presentation/auth.middleware.js";
import { resolveVendorContext } from "../../auth/presentation/vendor-context.middleware.js";
import {
  handleCreateBooking,
  handleListBookings,
  handleGetBooking,
  handleUpdateBookingStatus,
} from "./booking.controller.js";

const router = Router();

router.get("/", requireAuth(), resolveVendorContext(), handleListBookings);
router.get("/:id", requireAuth(), resolveVendorContext(), handleGetBooking);
router.post("/", requireAuth(), requireRole("couple"), handleCreateBooking);
router.patch("/:id/status", requireAuth(), resolveVendorContext(), handleUpdateBookingStatus);

export default router;
