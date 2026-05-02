import { apiFetch } from "./auth.service";
import type { Booking, CreateBookingRequest } from "@/types/booking";

const BASE = "/api/v1/bookings";

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
