import * as reviewRepo from "../infrastructure/review.repository.js";
import * as bookingRepo from "../../booking/infrastructure/booking.repository.js";
import { BookingStatus } from "../../booking/domain/types.js";
import { pool } from "../../../config/db.js";
import { sendNotification } from "../../realtime/use-cases/send-notification.js";
import type { Review } from "../domain/types.js";

export interface CreateReviewInput {
  bookingId: string;
  coupleId: string;
  rating: number;
  comment?: string;
}

export async function createReview(input: CreateReviewInput): Promise<Review> {
  const { bookingId, coupleId, rating, comment } = input;

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw Object.assign(
      new Error("Rating must be an integer between 1 and 5"),
      { statusCode: 400 },
    );
  }

  const booking = await bookingRepo.findById(bookingId);
  if (!booking) {
    throw Object.assign(
      new Error("Booking not found"),
      { statusCode: 404 },
    );
  }

  if (booking.coupleId !== coupleId) {
    throw Object.assign(
      new Error("You do not own this booking"),
      { statusCode: 403 },
    );
  }

  if (booking.status !== BookingStatus.COMPLETED) {
    throw Object.assign(
      new Error("You can only review completed bookings"),
      { statusCode: 400 },
    );
  }

  const existingReview = await reviewRepo.findByBookingId(bookingId);
  if (existingReview) {
    throw Object.assign(
      new Error("You have already reviewed this booking"),
      { statusCode: 409 },
    );
  }

  const review = await reviewRepo.create({
    bookingId,
    coupleId,
    vendorId: booking.vendorId,
    vendorProfileId: booking.vendorProfileId,
    rating,
    comment,
  });

  const { avg, count } = await reviewRepo.getAverageRating(booking.vendorProfileId);
  await pool.query(
    `UPDATE vendor_profiles SET rating = $1, review_count = $2, updated_at = NOW() WHERE id = $3`,
    [Math.round(avg * 10) / 10, count, booking.vendorProfileId],
  );

  await sendNotification({
    userId: booking.vendorId,
    type: "new_review",
    title: "New Review",
    body: `You received a ${rating}-star review for your service.`,
    metadata: { reviewId: review.id, bookingId },
  });

  return review;
}
