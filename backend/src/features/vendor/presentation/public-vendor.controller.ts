import type { Request, Response } from "express";
import {
  listVerifiedVendors,
  getVerifiedVendor,
} from "../use-cases/list-verified-vendors.js";
import type { VendorListFilters } from "../domain/types.js";

function handleError(res: Response, err: unknown): void {
  const error = err as Error & { statusCode?: number };
  const status = error.statusCode ?? 500;
  res.status(status).json({ error: { message: error.message } });
}

export async function handleListVendors(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const filters: VendorListFilters = {
      category: req.query.category as string | undefined,
      location: req.query.location as string | undefined,
      search: req.query.search as string | undefined,
      page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 20,
      sortBy: (req.query.sortBy as "businessName" | "createdAt") ?? "createdAt",
      order: (req.query.order as "asc" | "desc") ?? "desc",
    };
    const result = await listVerifiedVendors(filters);
    res.status(200).json({
      vendors: result.data,
      total: result.total,
      page: result.page,
      limit: result.limit,
    });
  } catch (err) {
    handleError(res, err);
  }
}

export async function handleGetVendor(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const id = req.params.vendorId;
    const vendor = await getVerifiedVendor(Array.isArray(id) ? id[0] : id);
    res.status(200).json({ vendor });
  } catch (err) {
    handleError(res, err);
  }
}
