import type { Request, Response } from "express";
import { createReview } from "../use-cases/create-review.js";
import * as reviewRepo from "../infrastructure/review.repository.js";

const STATUS_CODE_MAP: Record<number, string> = {
  400: "BAD_REQUEST",
  401: "UNAUTHORIZED",
  403: "FORBIDDEN",
  404: "NOT_FOUND",
  409: "CONFLICT",
  422: "UNPROCESSABLE_ENTITY",
};

function handleError(res: Response, err: unknown): void {
  const error = err as Error & { statusCode?: number };
  const status = error.statusCode ?? 500;
  res.status(status).json({
    error: {
      code: STATUS_CODE_MAP[status] ?? "SERVER_ERROR",
      message: status === 500 ? "Internal server error" : error.message,
    },
  });
}

export async function handleCreateReview(req: Request, res: Response): Promise<void> {
  try {
    const coupleId = req.authContext!.user.id;
    const { bookingId, rating, comment } = req.body ?? {};

    if (!bookingId) {
      res.status(400).json({
        error: { code: "BAD_REQUEST", message: "bookingId is required" },
      });
      return;
    }

    const review = await createReview({ bookingId, coupleId, rating, comment });
    res.status(201).json({ review });
  } catch (err) {
    handleError(res, err);
  }
}

export async function handleGetReviewByBooking(req: Request, res: Response): Promise<void> {
  try {
    const bookingId = req.params.bookingId as string;
    const review = await reviewRepo.findByBookingId(bookingId);

    if (!review) {
      res.status(404).json({
        error: { code: "NOT_FOUND", message: "No review found for this booking" },
      });
      return;
    }

    res.json({ review });
  } catch (err) {
    handleError(res, err);
  }
}
