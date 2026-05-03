import { apiFetch } from "./auth.service";
import type { VendorProfile } from "@/types/vendor";
import type { Conversation } from "@/types/realtime";

const BASE = "/api/v1/vendors";

export interface VendorListParams {
  search?: string;
  category?: string;
  location?: string;
  page?: number;
  limit?: number;
  sortBy?: "businessName" | "createdAt";
  order?: "asc" | "desc";
}

export interface VendorListResponse {
  vendors: VendorProfile[];
  total: number;
  page: number;
  limit: number;
}

export async function listVendors(
  params?: VendorListParams,
): Promise<VendorListResponse> {
  const query = new URLSearchParams();
  if (params?.search) query.set("search", params.search);
  if (params?.category) query.set("category", params.category);
  if (params?.location) query.set("location", params.location);
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.sortBy) query.set("sortBy", params.sortBy);
  if (params?.order) query.set("order", params.order);

  const qs = query.toString();
  const res = await apiFetch(`${BASE}${qs ? `?${qs}` : ""}`);
  if (!res.ok) throw new Error("Failed to fetch vendors");
  return res.json();
}

export async function getVendorDetail(
  vendorId: string,
): Promise<VendorProfile> {
  const res = await apiFetch(`${BASE}/${vendorId}`);
  if (!res.ok) throw new Error("Failed to fetch vendor");
  const data = await res.json();
  return data.vendor;
}

export interface PublicPortfolioItem {
  id: string;
  vendorProfileId: string;
  category: string;
  mediaUrl: string;
  mediaType: "image" | "video";
  caption: string | null;
  sortOrder: number;
  createdAt: string;
}

export async function getVendorPortfolio(
  vendorId: string,
): Promise<Record<string, PublicPortfolioItem[]>> {
  const res = await apiFetch(`${BASE}/${vendorId}/portfolio`);
  if (!res.ok) return {};
  const data = await res.json();
  return data.portfolio;
}

export async function getVendorPortfolioByCategory(
  vendorId: string,
  category: string,
  limit = 12,
  offset = 0,
): Promise<{ items: PublicPortfolioItem[]; total: number }> {
  const res = await apiFetch(
    `${BASE}/${vendorId}/portfolio/${encodeURIComponent(category)}?limit=${limit}&offset=${offset}`,
  );
  if (!res.ok) return { items: [], total: 0 };
  return res.json();
}

export async function startConversation(
  participantId: string,
): Promise<Conversation> {
  const res = await apiFetch("/api/v1/conversations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ participantId }),
  });
  if (!res.ok) throw new Error("Failed to start conversation");
  const data = await res.json();
  return data.conversation;
}
