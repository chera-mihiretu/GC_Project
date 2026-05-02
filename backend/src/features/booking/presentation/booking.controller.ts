import type { Request, Response } from "express";
import { createBooking } from "../use-cases/create-booking.js";
import {
  listBookingsForCouple,
  listBookingsForVendor,
  getBookingById,
} from "../use-cases/list-bookings.js";
import { updateBookingStatus } from "../use-cases/update-booking-status.js";
import type { BookingStatus } from "../domain/types.js";

function handleError(res: Response, err: unknown): void {
  const error = err as Error & { statusCode?: number };
  const status = error.statusCode ?? 500;
  res.status(status).json({
    error: { code: status === 500 ? "SERVER_ERROR" : "BAD_REQUEST", message: error.message },
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

export async function handleListBookings(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const userId = req.authContext!.user.id;
    const role = req.authContext!.user.role;
    const status = req.query.status as string | undefined;
    const page = req.query.page as string | undefined;
    const limit = req.query.limit as string | undefined;

    const filters = {
      status: status as BookingStatus | undefined,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    };

    const result =
      role === "vendor"
        ? await listBookingsForVendor(userId, filters)
        : await listBookingsForCouple(userId, filters);

    res.json(result);
  } catch (err) {
    handleError(res, err);
  }
}

export async function handleGetBooking(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const userId = req.authContext!.user.id;
    const id = req.params.id as string;

    const booking = await getBookingById(id, userId);
    res.json({ booking });
  } catch (err) {
    handleError(res, err);
  }
}

export async function handleUpdateBookingStatus(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const userId = req.authContext!.user.id;
    const role = req.authContext!.user.role as string;
    const id = req.params.id as string;
    const { status, declineReason } = req.body as {
      status?: string;
      declineReason?: string;
    };

    if (!status) {
      res.status(400).json({
        error: { code: "BAD_REQUEST", message: "status is required" },
      });
      return;
    }

    const booking = await updateBookingStatus({
      bookingId: id,
      userId,
      userRole: role,
      newStatus: status as BookingStatus,
      declineReason,
    });

    res.json({ booking });
  } catch (err) {
    handleError(res, err);
  }
}
