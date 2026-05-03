import { Router } from "express";
import { requireAuth, requireRole } from "../../auth/presentation/auth.middleware.js";
import {
  handleGetProfile,
  handleCreateProfile,
  handleUpdateProfile,
} from "./couple.controller.js";

const router = Router();

router.use(requireAuth(), requireRole("couple"));

router.get("/profile", handleGetProfile);
router.post("/profile", handleCreateProfile);
router.patch("/profile", handleUpdateProfile);

export default router;
