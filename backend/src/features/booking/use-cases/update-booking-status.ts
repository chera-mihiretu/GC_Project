import { type Booking, BookingStatus } from "../domain/types.js";
import * as bookingRepo from "../infrastructure/booking.repository.js";
import { sendNotification } from "../../realtime/use-cases/send-notification.js";
import { getUserEmailById } from "../infrastructure/user-lookup.js";
import { getSendEmailUseCase } from "../../email/index.js";

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

  if (newStatus === BookingStatus.ACCEPTED) {
    const conflict = await bookingRepo.isDateBookedForVendor(
      booking.vendorProfileId,
      booking.eventDate,
      bookingId,
    );
    if (conflict) {
      throw Object.assign(
        new Error("You already have a confirmed booking on this date"),
        { statusCode: 409 },
      );
    }
  }

  const updated = await bookingRepo.updateStatus(bookingId, newStatus, declineReason);

  const notifyUserId = userRole === "vendor" ? booking.coupleId : booking.vendorId;
  const recipientRole = userRole === "vendor" ? "couple" : "vendor";
  const dateLabel = new Date(booking.eventDate).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const category = booking.serviceCategory;

  let title: string;
  let body: string;

  switch (newStatus) {
    case BookingStatus.ACCEPTED:
      title = "Booking Accepted";
      body = `Your booking for ${category} on ${dateLabel} has been accepted.`;
      break;
    case BookingStatus.DECLINED:
      title = "Booking Declined";
      body = `Your booking for ${category} on ${dateLabel} was declined.${declineReason ? ` Reason: ${declineReason}` : ""}`;
      break;
    case BookingStatus.COMPLETED:
      title = "Booking Completed";
      body = `Your booking for ${category} on ${dateLabel} has been marked complete.`;
      break;
    case BookingStatus.CANCELLED:
      title = "Booking Cancelled";
      body = `A booking for ${category} on ${dateLabel} has been cancelled by the couple.`;
      break;
    default:
      title = "Booking Update";
      body = `Your booking for ${category} on ${dateLabel} has been updated.`;
  }

  await sendNotification({
    userId: notifyUserId,
    type: "booking_status_update",
    title,
    body,
    metadata: {
      bookingId: booking.id,
      vendorProfileId: booking.vendorProfileId,
      recipientRole,
    },
  }).catch(() => {});

  if (newStatus === BookingStatus.ACCEPTED || newStatus === BookingStatus.DECLINED) {
    sendBookingEmail(notifyUserId, title, body).catch(() => {});
  }

  return updated;
}

async function sendBookingEmail(userId: string, subject: string, body: string): Promise<void> {
  const email = await getUserEmailById(userId);
  if (!email) return;

  try {
    const emailService = getSendEmailUseCase();
    await emailService.execute({ to: email, subject, text: body });
  } catch {
    // Email is non-critical; SMTP may not be configured
  }
}
