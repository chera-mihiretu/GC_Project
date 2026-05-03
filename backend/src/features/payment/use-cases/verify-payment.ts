import * as paymentRepo from "../infrastructure/payment.repository.js";
import * as bookingRepo from "../../booking/infrastructure/booking.repository.js";
import * as chapaClient from "../infrastructure/chapa-client.js";
import { PaymentStatus, type Payment } from "../domain/types.js";
import { BookingStatus, type Booking } from "../../booking/domain/types.js";
import { sendNotification } from "../../realtime/use-cases/send-notification.js";

export interface VerifyPaymentResult {
  payment: Payment;
  booking: Booking;
}

export async function verifyPayment(
  txRef: string,
  coupleId: string,
): Promise<VerifyPaymentResult> {
  const payment = await paymentRepo.findByTxRef(txRef);
  if (!payment) {
    throw Object.assign(new Error("Payment not found"), { statusCode: 404 });
  }

  if (payment.coupleId !== coupleId) {
    throw Object.assign(new Error("Access denied"), { statusCode: 403 });
  }

  if (payment.status === PaymentStatus.SUCCESS) {
    const booking = await bookingRepo.findById(payment.bookingId);
    if (!booking) {
      throw Object.assign(new Error("Booking not found"), { statusCode: 404 });
    }
    return { payment, booking };
  }

  const chapaResult = await chapaClient.verifyTransaction(txRef);
  const chapaStatus = chapaResult.data.status;

  if (chapaStatus === "success") {
    const updatedPayment = await paymentRepo.updateStatus(
      txRef,
      PaymentStatus.SUCCESS,
      chapaResult.data.reference,
      chapaResult.data.method,
    );

    const booking = await transitionBookingToDepositPaid(payment.bookingId);

    await notifyVendor(payment, booking);

    return { payment: updatedPayment, booking };
  }

  if (chapaStatus === "failed") {
    const updatedPayment = await paymentRepo.updateStatus(txRef, PaymentStatus.FAILED);
    const booking = await bookingRepo.findById(payment.bookingId);
    if (!booking) {
      throw Object.assign(new Error("Booking not found"), { statusCode: 404 });
    }
    return { payment: updatedPayment, booking };
  }

  const booking = await bookingRepo.findById(payment.bookingId);
  if (!booking) {
    throw Object.assign(new Error("Booking not found"), { statusCode: 404 });
  }
  return { payment, booking };
}

async function transitionBookingToDepositPaid(bookingId: string): Promise<Booking> {
  const booking = await bookingRepo.findById(bookingId);
  if (!booking) {
    throw Object.assign(new Error("Booking not found"), { statusCode: 404 });
  }

  if (booking.status === BookingStatus.DEPOSIT_PAID) {
    return booking;
  }

  return bookingRepo.updateStatus(bookingId, BookingStatus.DEPOSIT_PAID);
}

async function notifyVendor(payment: Payment, booking: Booking): Promise<void> {
  const dateLabel = new Date(booking.eventDate).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  await sendNotification({
    userId: payment.vendorId,
    type: "payment_received",
    title: "Deposit Payment Received",
    body: `A deposit of ${payment.amount.toFixed(2)} ${payment.currency} has been received for ${booking.serviceCategory} on ${dateLabel}.`,
    metadata: {
      bookingId: payment.bookingId,
      paymentId: payment.id,
      amount: payment.amount,
      currency: payment.currency,
    },
  }).catch(() => {});
}
