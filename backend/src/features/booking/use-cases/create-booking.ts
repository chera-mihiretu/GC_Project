import { type Booking, type CreateBookingDTO } from "../domain/types.js";
import * as bookingRepo from "../infrastructure/booking.repository.js";
import { findById as findVendorProfile } from "../../vendor/infrastructure/vendor-profile.repository.js";
import { isDateAvailable } from "../../vendor/infrastructure/availability.repository.js";
import { VendorStatus } from "../../vendor/domain/types.js";
import { sendNotification } from "../../realtime/use-cases/send-notification.js";

export interface CreateBookingInput {
  coupleId: string;
  vendorProfileId: string;
  serviceCategory: string;
  eventDate: string;
  message?: string;
}

export async function createBooking(input: CreateBookingInput): Promise<Booking> {
  const { coupleId, vendorProfileId, serviceCategory, eventDate, message } = input;

  const missing: string[] = [];
  if (!vendorProfileId) missing.push("vendorProfileId");
  if (!serviceCategory) missing.push("serviceCategory");
  if (!eventDate) missing.push("eventDate");

  if (missing.length > 0) {
    throw Object.assign(
      new Error(`Missing required fields: ${missing.join(", ")}`),
      { statusCode: 400 },
    );
  }

  const eventDateObj = new Date(eventDate);
  if (isNaN(eventDateObj.getTime()) || eventDateObj <= new Date()) {
    throw Object.assign(
      new Error("eventDate must be a valid future date"),
      { statusCode: 400 },
    );
  }

  const vendorProfile = await findVendorProfile(vendorProfileId);
  if (!vendorProfile) {
    throw Object.assign(
      new Error("Vendor profile not found"),
      { statusCode: 404 },
    );
  }

  if (vendorProfile.status !== VendorStatus.VERIFIED) {
    throw Object.assign(
      new Error("Vendor is not currently accepting bookings"),
      { statusCode: 400 },
    );
  }

  const available = await isDateAvailable(vendorProfileId, eventDate);
  if (!available) {
    throw Object.assign(
      new Error("Vendor is not available on the selected date"),
      { statusCode: 400 },
    );
  }

  const dateBooked = await bookingRepo.isDateBookedForVendor(vendorProfileId, eventDate);
  if (dateBooked) {
    throw Object.assign(
      new Error("This vendor is already booked on the selected date"),
      { statusCode: 409 },
    );
  }

  const duplicate = await bookingRepo.existsForCoupleAndVendor(
    coupleId,
    vendorProfileId,
    eventDate,
  );
  if (duplicate) {
    throw Object.assign(
      new Error("You already have a pending or accepted booking with this vendor for the same date"),
      { statusCode: 409 },
    );
  }

  const dto: CreateBookingDTO = {
    coupleId,
    vendorId: vendorProfile.userId,
    vendorProfileId,
    serviceCategory,
    eventDate,
    message,
  };

  const booking = await bookingRepo.create(dto);

  await sendNotification({
    userId: vendorProfile.userId,
    type: "booking_request",
    title: "New Booking Request",
    body: `You have a new booking request for ${serviceCategory} on ${eventDate}.`,
    metadata: { bookingId: booking.id, coupleId, vendorProfileId },
  }).catch(() => {});

  return booking;
}
