export const BookingStatus = {
  PENDING: "pending",
  ACCEPTED: "accepted",
  DECLINED: "declined",
  DEPOSIT_PAID: "deposit_paid",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
} as const;

export type BookingStatus = (typeof BookingStatus)[keyof typeof BookingStatus];

export interface Booking {
  id: string;
  coupleId: string;
  vendorId: string;
  vendorProfileId: string;
  serviceCategory: string;
  eventDate: string;
  message: string | null;
  status: BookingStatus;
  declineReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BookingDetail extends Booking {
  businessName: string;
}

export interface CreateBookingRequest {
  vendorProfileId: string;
  serviceCategory: string;
  eventDate: string;
  message?: string;
}
