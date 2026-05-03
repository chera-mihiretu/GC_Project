import type { Request, Response } from "express";
import {
  getPortfolioItems,
  getPortfolioByCategory,
  requestUploadUrl,
  addPortfolioItem,
  updatePortfolioItem,
  deletePortfolioItem,
} from "../use-cases/manage-portfolio.js";

function getVendorOwnerId(req: Request): string {
  return req.authContext!.vendorOwnerId ?? req.authContext!.user.id;
}

function isStaff(req: Request): boolean {
  return req.authContext!.orgRole === "member";
}

function handleError(res: Response, err: unknown): void {
  const error = err as Error & { statusCode?: number };
  const status = error.statusCode ?? 500;
  res.status(status).json({ error: { message: error.message } });
}

export async function handleGetPortfolio(req: Request, res: Response): Promise<void> {
  try {
    const items = await getPortfolioItems(getVendorOwnerId(req));
    res.json({ portfolio: items });
  } catch (err) {
    handleError(res, err);
  }
}

export async function handleGetPortfolioByCategory(req: Request, res: Response): Promise<void> {
  try {
    const category = req.params.category as string;
    const limit = Math.min(Number(req.query.limit) || 12, 50);
    const offset = Number(req.query.offset) || 0;
    const result = await getPortfolioByCategory(getVendorOwnerId(req), category, limit, offset);
    res.json(result);
  } catch (err) {
    handleError(res, err);
  }
}

export async function handleRequestUploadUrl(req: Request, res: Response): Promise<void> {
  if (isStaff(req)) {
    res.status(403).json({ error: { message: "Staff cannot upload portfolio items" } });
    return;
  }
  try {
    const { fileName, contentType } = req.body;
    if (!fileName || !contentType) {
      res.status(400).json({ error: { message: "fileName and contentType are required" } });
      return;
    }
    const result = await requestUploadUrl(getVendorOwnerId(req), fileName, contentType);
    res.json(result);
  } catch (err) {
    handleError(res, err);
  }
}

export async function handleAddPortfolioItem(req: Request, res: Response): Promise<void> {
  if (isStaff(req)) {
    res.status(403).json({ error: { message: "Staff cannot add portfolio items" } });
    return;
  }
  try {
    const { category, mediaUrl, mediaType, caption } = req.body;
    if (!category || !mediaUrl || !mediaType) {
      res.status(400).json({ error: { message: "category, mediaUrl, and mediaType are required" } });
      return;
    }
    if (!["image", "video"].includes(mediaType)) {
      res.status(400).json({ error: { message: "mediaType must be 'image' or 'video'" } });
      return;
    }
    const item = await addPortfolioItem(getVendorOwnerId(req), {
      category,
      mediaUrl,
      mediaType,
      caption,
    });
    res.status(201).json({ item });
  } catch (err) {
    handleError(res, err);
  }
}

export async function handleUpdatePortfolioItem(req: Request, res: Response): Promise<void> {
  if (isStaff(req)) {
    res.status(403).json({ error: { message: "Staff cannot update portfolio items" } });
    return;
  }
  try {
    const item = await updatePortfolioItem(
      getVendorOwnerId(req),
      req.params.id as string,
      req.body,
    );
    res.json({ item });
  } catch (err) {
    handleError(res, err);
  }
}

export async function handleDeletePortfolioItem(req: Request, res: Response): Promise<void> {
  if (isStaff(req)) {
    res.status(403).json({ error: { message: "Staff cannot delete portfolio items" } });
    return;
  }
  try {
    await deletePortfolioItem(getVendorOwnerId(req), req.params.id as string);
    res.json({ success: true });
  } catch (err) {
    handleError(res, err);
  }
}
