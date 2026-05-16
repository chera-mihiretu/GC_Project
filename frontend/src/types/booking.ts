export const BookingStatus = {
  PENDING: "pending",
  ACCEPTED: "accepted",
  DECLINED: "declined",
  PAYMENT_REQUESTED: "payment_requested",
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
  requestedAmount: number | null;
  requestedCurrency: string | null;
  createdAt: string;
  updatedAt: string;
  businessName?: string;
  vendorLocation?: string | null;
  vendorCategory?: string[];
  vendorRating?: number;
}

export interface BookingDetail extends Booking {
  businessName: string;
  priceRangeMin: number | null;
  priceRangeMax: number | null;
  vendorLocation: string | null;
  vendorCategory: string[];
  vendorRating: number;
  vendorReviewCount: number;
}

export interface CreateBookingRequest {
  vendorProfileId: string;
  serviceCategory: string;
  eventDate: string;
  message?: string;
}
