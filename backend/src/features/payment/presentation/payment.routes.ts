import { Router } from "express";
import { requireAuth, requireRole } from "../../auth/presentation/auth.middleware.js";
import { resolveVendorContext } from "../../auth/presentation/vendor-context.middleware.js";
import {
  handleInitializePayment,
  handleVerifyPayment,
  handlePaymentWebhook,
  handleGetPaymentByBooking,
} from "./payment.controller.js";

const router = Router();

router.post("/initialize", requireAuth(), requireRole("couple"), handleInitializePayment);
router.get("/verify/:txRef", requireAuth(), requireRole("couple"), handleVerifyPayment);
router.post("/webhook", handlePaymentWebhook);
router.get("/booking/:bookingId", requireAuth(), resolveVendorContext(), handleGetPaymentByBooking);

export default router;
