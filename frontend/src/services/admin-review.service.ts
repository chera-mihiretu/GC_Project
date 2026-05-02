import { apiFetch } from "./auth.service";
import type { ReviewWithAuthor } from "@/types/review";

const BASE = "/api/v1/admin/reviews";

export interface AdminReviewListParams {
  isApproved?: boolean;
  page?: number;
  limit?: number;
}

export interface AdminReviewListResponse {
  data: (ReviewWithAuthor & { vendorName?: string })[];
  total: number;
  page: number;
  limit: number;
}

export async function listReviewsAdmin(
  params?: AdminReviewListParams,
): Promise<AdminReviewListResponse> {
  const query = new URLSearchParams();
  if (params?.isApproved !== undefined) query.set("isApproved", String(params.isApproved));
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));

  const qs = query.toString();
  const res = await apiFetch(`${BASE}${qs ? `?${qs}` : ""}`);

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message ?? "Failed to fetch reviews");
  }

  return res.json();
}

export async function moderateReview(
  id: string,
  action: "approve" | "reject",
): Promise<void> {
  const res = await apiFetch(`${BASE}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message ?? "Failed to moderate review");
  }
}
