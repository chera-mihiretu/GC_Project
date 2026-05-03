import { apiFetch } from "./auth.service";
import type { Payment } from "@/types/payment";
import type { Booking } from "@/types/booking";

const BASE = "/api/v1/payments";

export interface InitializePaymentRequest {
  bookingId: string;
  amount: number;
  currency?: string;
}

export interface InitializePaymentResponse {
  payment: Payment;
  checkoutUrl: string;
}

export interface VerifyPaymentResponse {
  payment: Payment;
  booking: Booking;
}

export async function initializePayment(
  data: InitializePaymentRequest,
): Promise<InitializePaymentResponse> {
  const res = await apiFetch(`${BASE}/initialize`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message ?? "Failed to initialize payment");
  }

  return res.json();
}

export async function verifyPayment(
  txRef: string,
): Promise<VerifyPaymentResponse> {
  const res = await apiFetch(`${BASE}/verify/${encodeURIComponent(txRef)}`);

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message ?? "Failed to verify payment");
  }

  return res.json();
}

export async function getPaymentForBooking(
  bookingId: string,
): Promise<Payment> {
  const res = await apiFetch(`${BASE}/booking/${bookingId}`);

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message ?? "Failed to fetch payment");
  }

  const json = await res.json();
  return json.payment;
}
