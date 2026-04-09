import { Router } from "express";
import {
  handleListVendors,
  handleGetVendor,
} from "./public-vendor.controller.js";

const router = Router();

router.get("/", handleListVendors);
router.get("/:vendorId", handleGetVendor);

export default router;
