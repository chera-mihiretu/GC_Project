import { env } from "../../../config/env.js";
import { pool } from "../../../config/db.js";
import { BookingStatus } from "../../booking/domain/types.js";
import * as bookingRepo from "../../booking/infrastructure/booking.repository.js";
import * as paymentRepo from "../infrastructure/payment.repository.js";
import * as chapaClient from "../infrastructure/chapa-client.js";
import type { Payment, ChapaInitParams } from "../domain/types.js";

export interface InitializePaymentInput {
  bookingId: string;
  coupleId: string;
  amount: number;
  currency?: string;
}

export interface InitializePaymentResult {
  payment: Payment;
  checkoutUrl: string;
}

export async function initializePayment(
  input: InitializePaymentInput,
): Promise<InitializePaymentResult> {
  const { bookingId, coupleId, amount, currency = "ETB" } = input;

  if (amount <= 0) {
    throw Object.assign(new Error("Amount must be greater than zero"), { statusCode: 400 });
  }

  const booking = await bookingRepo.findById(bookingId);
  if (!booking) {
    throw Object.assign(new Error("Booking not found"), { statusCode: 404 });
  }

  if (booking.coupleId !== coupleId) {
    throw Object.assign(new Error("Access denied"), { statusCode: 403 });
  }

  if (booking.status !== BookingStatus.ACCEPTED) {
    throw Object.assign(
      new Error("Payment can only be made for accepted bookings"),
      { statusCode: 422 },
    );
  }

  const existingPayment = await paymentRepo.findPendingOrSuccessByBookingId(bookingId);
  if (existingPayment) {
    if (existingPayment.status === "success") {
      throw Object.assign(
        new Error("This booking has already been paid"),
        { statusCode: 409 },
      );
    }
    if (existingPayment.checkoutUrl) {
      return { payment: existingPayment, checkoutUrl: existingPayment.checkoutUrl };
    }
  }

  const userRow = await pool.query(
    `SELECT name, email FROM "user" WHERE id = $1 LIMIT 1`,
    [coupleId],
  );
  if (!userRow.rows.length) {
    throw Object.assign(new Error("User not found"), { statusCode: 404 });
  }
  const { name, email } = userRow.rows[0];
  const nameParts = (name as string).split(" ");
  const firstName = nameParts[0] || "Customer";
  const lastName = nameParts.slice(1).join(" ") || "Customer";

  const txRef = `twedar-${bookingId}-${Date.now()}`;
  const returnUrl = `${env.FRONTEND_URL}/bookings/${bookingId}?payment=verifying&tx_ref=${txRef}`;
  const callbackUrl = `${env.BETTER_AUTH_URL}/api/v1/payments/webhook`;

  const chapaParams: ChapaInitParams = {
    amount: amount.toFixed(2),
    currency,
    email: email as string,
    first_name: firstName,
    last_name: lastName,
    tx_ref: txRef,
    callback_url: callbackUrl,
    return_url: returnUrl,
    customization: {
      title: "Twedar Booking Deposit",
      description: `Deposit for booking ${bookingId.slice(0, 8)}`,
    },
    meta: {
      booking_id: bookingId,
      vendor_id: booking.vendorId,
    },
  };

  const chapaResponse = await chapaClient.initializeTransaction(chapaParams);
  const checkoutUrl = chapaResponse.data.checkout_url;

  const payment = await paymentRepo.create({
    bookingId,
    coupleId,
    vendorId: booking.vendorId,
    txRef,
    amount,
    currency,
    checkoutUrl,
  });

  return { payment, checkoutUrl };
}
