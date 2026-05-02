import { Router } from "express";
import multer from "multer";
import { requireAuth } from "../../auth/presentation/auth.middleware.js";
import { requireRole } from "../../auth/presentation/auth.middleware.js";
import {
  handleCreateReview,
  handleGetReviewByBooking,
  handleUploadPhotos,
  handleGetPhotos,
} from "./review.controller.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

const router = Router();

router.post("/", requireAuth(), requireRole("couple"), handleCreateReview);
router.get("/booking/:bookingId", requireAuth(), handleGetReviewByBooking);
router.post("/:reviewId/photos", requireAuth(), requireRole("couple"), upload.array("photos", 5), handleUploadPhotos);
router.get("/:reviewId/photos", handleGetPhotos);

export default router;
