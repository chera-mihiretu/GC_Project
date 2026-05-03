import { Router } from "express";
import { requireAuth, requireRole } from "../../auth/presentation/auth.middleware.js";
import { resolveVendorContext } from "../../auth/presentation/vendor-context.middleware.js";
import {
  handleGetPortfolio,
  handleGetPortfolioByCategory,
  handleRequestUploadUrl,
  handleAddPortfolioItem,
  handleUpdatePortfolioItem,
  handleDeletePortfolioItem,
} from "./portfolio.controller.js";

const router = Router();

router.use(requireAuth(), requireRole("vendor"), resolveVendorContext());

router.get("/", handleGetPortfolio);
router.get("/category/:category", handleGetPortfolioByCategory);
router.post("/upload-url", handleRequestUploadUrl);
router.post("/", handleAddPortfolioItem);
router.patch("/:id", handleUpdatePortfolioItem);
router.delete("/:id", handleDeletePortfolioItem);

export default router;
