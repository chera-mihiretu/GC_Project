import { Router } from "express";
import { requireAuth } from "../../auth/presentation/auth.middleware.js";
import { requireRole } from "../../auth/presentation/auth.middleware.js";
import {
  handleCreateReview,
  handleGetReviewByBooking,
} from "./review.controller.js";

const router = Router();

router.post("/", requireAuth(), requireRole("couple"), handleCreateReview);
router.get("/booking/:bookingId", requireAuth(), handleGetReviewByBooking);

export default router;
