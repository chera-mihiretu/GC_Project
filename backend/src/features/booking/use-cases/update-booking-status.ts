import { type Booking, BookingStatus } from "../domain/types.js";
import * as bookingRepo from "../infrastructure/booking.repository.js";
import { sendNotification } from "../../realtime/use-cases/send-notification.js";

export interface UpdateBookingStatusInput {
  bookingId: string;
  userId: string;
  userRole: string;
  newStatus: BookingStatus;
  declineReason?: string;
}

export async function updateBookingStatus(input: UpdateBookingStatusInput): Promise<Booking> {
  const { bookingId, userId, userRole, newStatus, declineReason } = input;

  const booking = await bookingRepo.findById(bookingId);
  if (!booking) {
    throw Object.assign(new Error("Booking not found"), { statusCode: 404 });
  }

  if (userRole === "vendor" && booking.vendorId !== userId) {
    throw Object.assign(new Error("Access denied"), { statusCode: 403 });
  }

  if (userRole === "couple" && booking.coupleId !== userId) {
    throw Object.assign(new Error("Access denied"), { statusCode: 403 });
  }

  const vendorOnlyStatuses: BookingStatus[] = [
    BookingStatus.ACCEPTED,
    BookingStatus.DECLINED,
    BookingStatus.COMPLETED,
  ];
  if (vendorOnlyStatuses.includes(newStatus) && userRole !== "vendor") {
    throw Object.assign(
      new Error("Only vendors can accept, decline, or complete bookings"),
      { statusCode: 403 },
    );
  }

  if (newStatus === BookingStatus.CANCELLED && userRole !== "couple") {
    throw Object.assign(
      new Error("Only couples can cancel bookings"),
      { statusCode: 403 },
    );
  }

  if (newStatus === BookingStatus.DECLINED && !declineReason) {
    throw Object.assign(
      new Error("A reason is required when declining a booking"),
      { statusCode: 400 },
    );
  }

  const updated = await bookingRepo.updateStatus(bookingId, newStatus, declineReason);

  const notifyUserId = userRole === "vendor" ? booking.coupleId : booking.vendorId;
  const statusLabel = newStatus.replace("_", " ");

  await sendNotification({
    userId: notifyUserId,
    type: "booking_status_update",
    title: "Booking Update",
    body: `Your booking has been ${statusLabel}.`,
    metadata: { bookingId: booking.id },
  }).catch(() => {});

  return updated;
}
