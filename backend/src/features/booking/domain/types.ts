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
  createdAt: Date;
  updatedAt: Date;
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
  requestedAmount: number | null;
  requestedCurrency: string | null;
}

export interface CreateBookingDTO {
  coupleId: string;
  vendorId: string;
  vendorProfileId: string;
  serviceCategory: string;
  eventDate: string;
  message?: string;
}

export interface BookingListFilters {
  status?: BookingStatus;
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
