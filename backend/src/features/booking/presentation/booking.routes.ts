import { Router } from "express";
import { requireAuth } from "../../auth/presentation/auth.middleware.js";
import { requireRole } from "../../auth/presentation/auth.middleware.js";
import {
  handleCreateBooking,
  handleListBookings,
  handleGetBooking,
  handleUpdateBookingStatus,
} from "./booking.controller.js";

const router = Router();

router.get("/", requireAuth(), handleListBookings);
router.get("/:id", requireAuth(), handleGetBooking);
router.post("/", requireAuth(), requireRole("couple"), handleCreateBooking);
router.patch("/:id/status", requireAuth(), handleUpdateBookingStatus);

export default router;
