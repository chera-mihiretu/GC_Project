import { Router } from "express";
import { requireAuth } from "../../auth/presentation/auth.middleware.js";
import { resolveVendorContext } from "../../auth/presentation/vendor-context.middleware.js";
import {
  handleGetEarningsSummary,
  handleGetPaymentHistory,
  handleGetWithdrawalHistory,
  handleRequestWithdrawal,
  handleListBanks,
} from "./earnings.controller.js";

const router = Router();

router.get("/summary", requireAuth(), resolveVendorContext(), handleGetEarningsSummary);
router.get("/payments", requireAuth(), resolveVendorContext(), handleGetPaymentHistory);
router.get("/withdrawals", requireAuth(), resolveVendorContext(), handleGetWithdrawalHistory);
router.post("/withdraw", requireAuth(), resolveVendorContext(), handleRequestWithdrawal);
router.get("/banks", requireAuth(), resolveVendorContext(), handleListBanks);

export default router;
