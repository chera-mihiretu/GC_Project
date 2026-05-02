import type { Request, Response } from "express";
import * as reviewRepo from "../infrastructure/review.repository.js";
import { moderateReview, type ModerationAction } from "../use-cases/moderate-review.js";

const STATUS_CODE_MAP: Record<number, string> = {
  400: "BAD_REQUEST",
  401: "UNAUTHORIZED",
  403: "FORBIDDEN",
  404: "NOT_FOUND",
  409: "CONFLICT",
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

export async function handleListReviewsAdmin(req: Request, res: Response): Promise<void> {
  try {
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
    const isApprovedParam = req.query.isApproved as string | undefined;

    let isApproved: boolean | undefined;
    if (isApprovedParam === "true") isApproved = true;
    else if (isApprovedParam === "false") isApproved = false;

    const result = await reviewRepo.findAllForAdmin({ isApproved, page, limit });
    res.json(result);
  } catch (err) {
    handleError(res, err);
  }
}

export async function handleModerateReview(req: Request, res: Response): Promise<void> {
  try {
    const reviewId = req.params.id as string;
    const { action } = req.body ?? {};

    if (!action || !["approve", "reject"].includes(action)) {
      res.status(400).json({
        error: { code: "BAD_REQUEST", message: "action must be 'approve' or 'reject'" },
      });
      return;
    }

    const review = await moderateReview(reviewId, action as ModerationAction);
    res.json({ review });
  } catch (err) {
    handleError(res, err);
  }
}
