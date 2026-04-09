import type { Request, Response } from "express";
import {
  listVendorsAdmin,
  getVendorDetailAdmin,
  approveVendor,
  rejectVendor,
  suspendVendor,
  reinstateVendor,
  deactivateVendor,
} from "../use-cases/admin-vendor.js";
import type { VendorStatus, VendorListFilters } from "../domain/types.js";

function handleError(res: Response, err: unknown): void {
  const error = err as Error & { statusCode?: number };
  const status = error.statusCode ?? 500;
  res.status(status).json({ error: { message: error.message } });
}

function getVendorId(req: Request): string {
  const id = req.params.vendorId;
  return Array.isArray(id) ? id[0] : id;
}

export async function handleListVendors(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const filters: VendorListFilters = {
      status: req.query.status as VendorStatus | undefined,
      category: req.query.category as string | undefined,
      search: req.query.search as string | undefined,
      page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 20,
      sortBy: (req.query.sortBy as "businessName" | "createdAt") ?? "createdAt",
      order: (req.query.order as "asc" | "desc") ?? "desc",
    };
    const result = await listVendorsAdmin(filters);
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

export async function handleGetVendorDetail(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const vendor = await getVendorDetailAdmin(getVendorId(req));
    res.status(200).json({ vendor });
  } catch (err) {
    handleError(res, err);
  }
}

export async function handleApproveVendor(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const profile = await approveVendor(getVendorId(req));
    res.status(200).json({
      vendorProfile: profile,
      message: "Vendor approved successfully",
    });
  } catch (err) {
    handleError(res, err);
  }
}

export async function handleRejectVendor(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const { reason } = req.body;
    const profile = await rejectVendor(getVendorId(req), reason);
    res.status(200).json({
      vendorProfile: profile,
      message: "Vendor rejected",
    });
  } catch (err) {
    handleError(res, err);
  }
}

export async function handleSuspendVendor(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const { reason } = req.body;
    const profile = await suspendVendor(getVendorId(req), reason);
    res.status(200).json({
      vendorProfile: profile,
      message: "Vendor suspended",
    });
  } catch (err) {
    handleError(res, err);
  }
}

export async function handleReinstateVendor(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const profile = await reinstateVendor(getVendorId(req));
    res.status(200).json({
      vendorProfile: profile,
      message: "Vendor reinstated",
    });
  } catch (err) {
    handleError(res, err);
  }
}

export async function handleDeactivateVendor(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const profile = await deactivateVendor(getVendorId(req));
    res.status(200).json({
      vendorProfile: profile,
      message: "Vendor permanently deactivated",
    });
  } catch (err) {
    handleError(res, err);
  }
}
