import { Router } from "express";
import { requireAuth } from "../../auth/presentation/auth.middleware.js";
import { requireRole } from "../../auth/presentation/auth.middleware.js";
import { handleCreateBooking } from "./booking.controller.js";

const router = Router();

router.post("/", requireAuth(), requireRole("couple"), handleCreateBooking);

export default router;
