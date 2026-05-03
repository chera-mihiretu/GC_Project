import crypto from "crypto";
import { env } from "../../../config/env.js";
import * as paymentRepo from "../infrastructure/payment.repository.js";
import * as bookingRepo from "../../booking/infrastructure/booking.repository.js";
import { PaymentStatus } from "../domain/types.js";
import { BookingStatus } from "../../booking/domain/types.js";
import { sendNotification } from "../../realtime/use-cases/send-notification.js";

export function verifyWebhookSignature(
  payload: string,
  signature: string | undefined,
): boolean {
  if (!signature) return false;

  const hash = crypto
    .createHmac("sha256", env.CHAPA_SECRET_KEY)
    .update(payload)
    .digest("hex");

  return hash === signature;
}

export async function handleWebhook(
  payload: Record<string, unknown>,
): Promise<void> {
  const event = payload.event as string | undefined;
  const txRef = payload.tx_ref as string | undefined;

  if (!txRef) return;

  if (event !== "charge.success") return;

  const payment = await paymentRepo.findByTxRef(txRef);
  if (!payment) return;

  if (payment.status === PaymentStatus.SUCCESS) return;

  await paymentRepo.updateStatus(
    txRef,
    PaymentStatus.SUCCESS,
    payload.reference as string | undefined,
    payload.payment_method as string | undefined,
    payload,
  );

  const booking = await bookingRepo.findById(payment.bookingId);
  if (!booking) return;

  if (booking.status === BookingStatus.ACCEPTED) {
    await bookingRepo.updateStatus(payment.bookingId, BookingStatus.DEPOSIT_PAID);
  }

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
