import { apiFetch } from "./auth.service";
import type { Review, CreateReviewRequest } from "@/types/review";

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
