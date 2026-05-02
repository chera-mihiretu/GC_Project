import * as reviewRepo from "../infrastructure/review.repository.js";
import { pool } from "../../../config/db.js";
import type { Review } from "../domain/types.js";

export type ModerationAction = "approve" | "reject";

export async function moderateReview(
  reviewId: string,
  action: ModerationAction,
): Promise<Review> {
  const existing = await reviewRepo.findById(reviewId);
  if (!existing) {
    throw Object.assign(new Error("Review not found"), { statusCode: 404 });
  }

  const isApproved = action === "approve";
  const review = await reviewRepo.updateApproval(reviewId, isApproved);

  const { avg, count } = await reviewRepo.getAverageRating(existing.vendorProfileId);
  await pool.query(
    `UPDATE vendor_profiles SET rating = $1, review_count = $2, updated_at = NOW() WHERE id = $3`,
    [Math.round(avg * 10) / 10, count, existing.vendorProfileId],
  );

  return review;
}
