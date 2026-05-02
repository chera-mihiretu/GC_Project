import { apiFetch } from "./auth.service";
import type { Booking, BookingStatus, CreateBookingRequest } from "@/types/booking";

const BASE = "/api/v1/bookings";

export interface BookingListParams {
  status?: BookingStatus;
  page?: number;
  limit?: number;
}

export interface BookingListResponse {
  data: Booking[];
  total: number;
  page: number;
  limit: number;
}

export async function createBooking(
  data: CreateBookingRequest,
): Promise<Booking> {
  const res = await apiFetch(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message ?? "Failed to create booking");
  }

  const json = await res.json();
  return json.booking;
}

export async function listBookings(
  params?: BookingListParams,
): Promise<BookingListResponse> {
  const query = new URLSearchParams();
  if (params?.status) query.set("status", params.status);
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));

  const qs = query.toString();
  const res = await apiFetch(`${BASE}${qs ? `?${qs}` : ""}`);

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message ?? "Failed to fetch bookings");
  }

  return res.json();
}

export async function getBooking(id: string): Promise<Booking> {
  const res = await apiFetch(`${BASE}/${id}`);

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message ?? "Failed to fetch booking");
  }

  const json = await res.json();
  return json.booking;
}

export async function updateBookingStatus(
  id: string,
  status: BookingStatus,
  declineReason?: string,
): Promise<Booking> {
  const res = await apiFetch(`${BASE}/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status, declineReason }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message ?? "Failed to update booking status");
  }

  const json = await res.json();
  return json.booking;
}
