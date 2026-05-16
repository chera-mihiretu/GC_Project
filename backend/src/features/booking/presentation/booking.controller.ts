import type { Request, Response } from "express";
import { createBooking } from "../use-cases/create-booking.js";
import {
  listBookingsForCouple,
  listBookingsForVendor,
  getBookingById,
} from "../use-cases/list-bookings.js";
import { updateBookingStatus } from "../use-cases/update-booking-status.js";
import { BookingStatus } from "../domain/types.js";
import * as bookingRepo from "../infrastructure/booking.repository.js";
import { findById as findVendorProfile } from "../../vendor/infrastructure/vendor-profile.repository.js";
import { sendNotification } from "../../realtime/use-cases/send-notification.js";

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
    const userRole = req.authContext!.user.role as string;
    const effectiveRole = userRole === "couple" ? "couple" : (req.authContext!.vendorOwnerId ? "vendor" : userRole);
    const userId = effectiveRole === "couple" ? req.authContext!.user.id : (req.authContext!.vendorOwnerId ?? req.authContext!.user.id);
    const status = req.query.status as string | undefined;
    const page = req.query.page as string | undefined;
    const limit = req.query.limit as string | undefined;

    const filters = {
      status: status as BookingStatus | undefined,
      page: Math.max(1, page ? parseInt(page, 10) : 1),
      limit: Math.min(Math.max(1, limit ? parseInt(limit, 10) : 20), 100),
    };

    let result;
    if (effectiveRole === "vendor") {
      result = await listBookingsForVendor(userId, filters);
    } else if (effectiveRole === "couple") {
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
    const userRole = req.authContext!.user.role as string;
    const userId = userRole === "couple" ? req.authContext!.user.id : (req.authContext!.vendorOwnerId ?? req.authContext!.user.id);
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
    const userRole = req.authContext!.user.role as string;
    const effectiveRole = userRole === "couple" ? "couple" : (req.authContext!.vendorOwnerId ? "vendor" : userRole);
    const userId = effectiveRole === "couple" ? req.authContext!.user.id : (req.authContext!.vendorOwnerId ?? req.authContext!.user.id);
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
      userRole: effectiveRole,
      newStatus: status as BookingStatus,
      declineReason,
    });

    res.json({ booking });
  } catch (err) {
    handleError(res, err);
  }
}

export async function handleRequestPayment(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const vendorUserId = req.authContext!.vendorOwnerId ?? req.authContext!.user.id;
    const bookingId = req.params.id as string;
    const { amount, currency } = req.body as { amount?: number; currency?: string };

    if (!amount || typeof amount !== "number" || amount <= 0) {
      res.status(400).json({
        error: { code: "BAD_REQUEST", message: "amount must be a positive number" },
      });
      return;
    }

    const booking = await bookingRepo.findById(bookingId);
    if (!booking) {
      res.status(404).json({ error: { code: "NOT_FOUND", message: "Booking not found" } });
      return;
    }

    if (booking.vendorId !== vendorUserId) {
      res.status(403).json({ error: { code: "FORBIDDEN", message: "Access denied" } });
      return;
    }

    if (booking.status !== BookingStatus.ACCEPTED) {
      res.status(422).json({
        error: { code: "UNPROCESSABLE_ENTITY", message: "Payment can only be requested for accepted bookings" },
      });
      return;
    }

    const vendorProfile = await findVendorProfile(booking.vendorProfileId);
    if (!vendorProfile) {
      res.status(404).json({ error: { code: "NOT_FOUND", message: "Vendor profile not found" } });
      return;
    }

    if (vendorProfile.priceRangeMax !== null && amount > vendorProfile.priceRangeMax) {
      res.status(400).json({
        error: {
          code: "BAD_REQUEST",
          message: `Amount cannot exceed your maximum price (${vendorProfile.priceRangeMax})`,
        },
      });
      return;
    }

    const updated = await bookingRepo.setRequestedPayment(
      bookingId,
      amount,
      currency ?? "ETB",
    );

    const dateLabel = new Date(booking.eventDate).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    await sendNotification({
      userId: booking.coupleId,
      type: "payment_requested",
      title: "Payment Requested",
      body: `Your vendor has requested a payment of ${amount.toLocaleString()} ${currency ?? "ETB"} for ${booking.serviceCategory} on ${dateLabel}.`,
      metadata: {
        bookingId: booking.id,
        vendorProfileId: booking.vendorProfileId,
        amount,
        currency: currency ?? "ETB",
      },
    }).catch(() => {});

    res.json({ booking: updated });
  } catch (err) {
    handleError(res, err);
  }
}
