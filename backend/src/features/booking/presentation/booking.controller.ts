import type { Request, Response } from "express";
import { createBooking } from "../use-cases/create-booking.js";
import {
  listBookingsForCouple,
  listBookingsForVendor,
  getBookingById,
} from "../use-cases/list-bookings.js";
import { updateBookingStatus } from "../use-cases/update-booking-status.js";
import { BookingStatus } from "../domain/types.js";

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
      page: Math.max(1, page ? parseInt(page, 10) : 1),
      limit: Math.min(Math.max(1, limit ? parseInt(limit, 10) : 20), 100),
    };

    let result;
    if (role === "vendor") {
      result = await listBookingsForVendor(userId, filters);
    } else if (role === "couple") {
      result = await listBookingsForCouple(userId, filters);
    } else {
      res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Use the admin management endpoint for booking oversight",
        },
      });
      return;
    }

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

    const validStatuses = Object.values(BookingStatus) as string[];
    if (!validStatuses.includes(status)) {
      res.status(400).json({
        error: {
          code: "BAD_REQUEST",
          message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
        },
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
