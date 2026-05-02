import { Router } from "express";
import { requireAuth, requireRole } from "../../auth/presentation/auth.middleware.js";
import {
  handleListReviewsAdmin,
  handleModerateReview,
} from "./admin-review.controller.js";

const router = Router();

router.get("/", requireAuth(), requireRole("admin"), handleListReviewsAdmin);
router.patch("/:id", requireAuth(), requireRole("admin"), handleModerateReview);

export default router;
