import { apiFetch } from "./auth.service";
import type { Review, ReviewWithAuthor, CreateReviewRequest } from "@/types/review";

const BASE = "/api/v1/reviews";

export async function createReview(data: CreateReviewRequest): Promise<Review> {
  const res = await apiFetch(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message ?? "Failed to submit review");
  }

  const json = await res.json();
  return json.review;
}

export async function getReviewByBooking(bookingId: string): Promise<Review | null> {
  const res = await apiFetch(`${BASE}/booking/${bookingId}`);

  if (res.status === 404) {
    return null;
  }

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message ?? "Failed to fetch review");
  }

  const json = await res.json();
  return json.review;
}

export interface VendorReviewsResponse {
  data: ReviewWithAuthor[];
  total: number;
  page: number;
  limit: number;
}

export async function uploadReviewPhotos(
  reviewId: string,
  files: File[],
): Promise<{ photos: { id: string; url: string }[] }> {
  const formData = new FormData();
  files.forEach((file) => formData.append("photos", file));

  const res = await apiFetch(`${BASE}/${reviewId}/photos`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message ?? "Failed to upload photos");
  }

  return res.json();
}

export async function getReviewPhotos(
  reviewId: string,
): Promise<{ photos: { id: string; url: string }[] }> {
  const res = await apiFetch(`${BASE}/${reviewId}/photos`);
  if (!res.ok) return { photos: [] };
  return res.json();
}

export async function getVendorReviews(
  vendorProfileId: string,
  params?: { page?: number; limit?: number },
): Promise<VendorReviewsResponse> {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));

  const qs = query.toString();
  const res = await apiFetch(
    `/api/v1/vendors/${vendorProfileId}/reviews${qs ? `?${qs}` : ""}`,
  );

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message ?? "Failed to fetch reviews");
  }

  return res.json();
}
