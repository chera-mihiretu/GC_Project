import { type Booking, type BookingDetail, type BookingListFilters, type PaginatedResult } from "../domain/types.js";
import * as bookingRepo from "../infrastructure/booking.repository.js";

export async function listBookingsForCouple(
  coupleId: string,
  filters: BookingListFilters,
): Promise<PaginatedResult<Booking>> {
  return bookingRepo.findByCoupleId(coupleId, filters);
}

export async function listBookingsForVendor(
  vendorId: string,
  filters: BookingListFilters,
): Promise<PaginatedResult<Booking>> {
  return bookingRepo.findByVendorId(vendorId, filters);
}

export async function getBookingById(
  id: string,
  userId: string,
): Promise<BookingDetail> {
  const booking = await bookingRepo.findByIdWithDetails(id);

  if (!booking) {
    throw Object.assign(new Error("Booking not found"), { statusCode: 404 });
  }

  if (booking.coupleId !== userId && booking.vendorId !== userId) {
    throw Object.assign(new Error("Access denied"), { statusCode: 403 });
  }

  return booking;
}
