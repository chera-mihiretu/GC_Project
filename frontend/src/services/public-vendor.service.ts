import { apiFetch } from "./auth.service";
import type { VendorProfile } from "@/types/vendor";

const BASE = "/api/v1/vendors";

export interface VendorListResponse {
  vendors: VendorProfile[];
  total: number;
  page: number;
  limit: number;
}

export async function listVendors(params?: {
  category?: string;
  location?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<VendorListResponse> {
  const query = new URLSearchParams();
  if (params?.category) query.set("category", params.category);
  if (params?.location) query.set("location", params.location);
  if (params?.search) query.set("search", params.search);
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));

  const res = await apiFetch(`${BASE}?${query.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch vendors");
  return res.json();
}

export async function getVendorDetail(
  vendorId: string,
): Promise<{ vendor: VendorProfile }> {
  const res = await apiFetch(`${BASE}/${vendorId}`);
  if (!res.ok) throw new Error("Failed to fetch vendor detail");
  return res.json();
}
