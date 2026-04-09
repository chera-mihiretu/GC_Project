import { apiFetch } from "./auth.service";
import type { VendorProfile, VendorStatus } from "@/types/vendor";

const BASE = "/api/v1/admin/vendors";

export interface VendorListResponse {
  vendors: VendorProfile[];
  total: number;
  page: number;
  limit: number;
}

export async function listVendorsAdmin(params?: {
  status?: VendorStatus;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<VendorListResponse> {
  const query = new URLSearchParams();
  if (params?.status) query.set("status", params.status);
  if (params?.search) query.set("search", params.search);
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));

  const res = await apiFetch(`${BASE}?${query.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch vendors");
  return res.json();
}

export async function getVendorDetailAdmin(
  vendorId: string,
): Promise<{ vendor: VendorProfile }> {
  const res = await apiFetch(`${BASE}/${vendorId}`);
  if (!res.ok) throw new Error("Failed to fetch vendor detail");
  return res.json();
}

export async function approveVendor(vendorId: string): Promise<VendorProfile> {
  const res = await apiFetch(`${BASE}/${vendorId}/approve`, {
    method: "POST",
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message ?? "Failed to approve vendor");
  }
  const data = await res.json();
  return data.vendorProfile;
}

export async function rejectVendor(
  vendorId: string,
  reason: string,
): Promise<VendorProfile> {
  const res = await apiFetch(`${BASE}/${vendorId}/reject`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message ?? "Failed to reject vendor");
  }
  const data = await res.json();
  return data.vendorProfile;
}

export async function suspendVendor(
  vendorId: string,
  reason: string,
): Promise<VendorProfile> {
  const res = await apiFetch(`${BASE}/${vendorId}/suspend`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message ?? "Failed to suspend vendor");
  }
  const data = await res.json();
  return data.vendorProfile;
}

export async function reinstateVendor(
  vendorId: string,
): Promise<VendorProfile> {
  const res = await apiFetch(`${BASE}/${vendorId}/reinstate`, {
    method: "POST",
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message ?? "Failed to reinstate vendor");
  }
  const data = await res.json();
  return data.vendorProfile;
}

export async function deactivateVendor(
  vendorId: string,
): Promise<VendorProfile> {
  const res = await apiFetch(`${BASE}/${vendorId}/deactivate`, {
    method: "POST",
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message ?? "Failed to deactivate vendor");
  }
  const data = await res.json();
  return data.vendorProfile;
}
