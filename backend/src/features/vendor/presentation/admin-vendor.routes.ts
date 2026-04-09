import { Router } from "express";
import { requireAuth, requireRole } from "../../auth/presentation/auth.middleware.js";
import {
  handleListVendors,
  handleGetVendorDetail,
  handleApproveVendor,
  handleRejectVendor,
  handleSuspendVendor,
  handleReinstateVendor,
  handleDeactivateVendor,
} from "./admin-vendor.controller.js";

const router = Router();

router.use(requireAuth(), requireRole("admin"));

router.get("/", handleListVendors);
router.get("/:vendorId", handleGetVendorDetail);
router.post("/:vendorId/approve", handleApproveVendor);
router.post("/:vendorId/reject", handleRejectVendor);
router.post("/:vendorId/suspend", handleSuspendVendor);
router.post("/:vendorId/reinstate", handleReinstateVendor);
router.post("/:vendorId/deactivate", handleDeactivateVendor);

export default router;
