import type { Request, Response } from "express";
import { createBooking } from "../use-cases/create-booking.js";

function handleError(res: Response, err: unknown): void {
  const error = err as Error & { statusCode?: number };
  const status = error.statusCode ?? 500;
  res.status(status).json({
    error: { message: error.message },
  });
}

export async function handleCreateBooking(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const coupleId = req.authContext!.user.id;
    const { vendorProfileId, serviceCategory, eventDate, message } = req.body;

    const booking = await createBooking({
      coupleId,
      vendorProfileId,
      serviceCategory,
      eventDate,
      message,
    });

    res.status(201).json({ booking });
  } catch (err) {
    handleError(res, err);
  }
}
