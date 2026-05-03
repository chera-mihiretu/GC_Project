import { Router } from "express";
import multer from "multer";
import { requireAuth, requireRole } from "../../auth/presentation/auth.middleware.js";
import { resolveVendorContext } from "../../auth/presentation/vendor-context.middleware.js";
import {
  handleCreateProfile,
  handleUpdateProfile,
  handleGetProfile,
  handleUploadDocument,
  handleDeleteDocument,
  handleSubmitForVerification,
} from "./vendor.controller.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/jpg",
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF, JPG, and PNG files are allowed"));
    }
  },
});

const router = Router();

router.use(requireAuth(), requireRole("vendor"), resolveVendorContext());

router.post("/profile", handleCreateProfile);
router.patch("/profile", handleUpdateProfile);
router.get("/profile", handleGetProfile);
router.post("/documents", upload.single("file"), handleUploadDocument);
router.delete("/documents/:documentId", handleDeleteDocument);
router.post("/profile/submit", handleSubmitForVerification);

export default router;
