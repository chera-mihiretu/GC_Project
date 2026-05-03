import type { Request, Response } from "express";
import { initializePayment } from "../use-cases/initialize-payment.js";
import { verifyPayment } from "../use-cases/verify-payment.js";
import { handleWebhook, verifyWebhookSignature } from "../use-cases/handle-webhook.js";
import * as paymentRepo from "../infrastructure/payment.repository.js";

const STATUS_CODE_MAP: Record<number, string> = {
  400: "BAD_REQUEST",
  403: "FORBIDDEN",
  404: "NOT_FOUND",
  409: "CONFLICT",
  422: "UNPROCESSABLE_ENTITY",
  502: "BAD_GATEWAY",
};

function handleError(res: Response, err: unknown): void {
  const error = err as Error & { statusCode?: number };
  const status = error.statusCode ?? 500;
  res.status(status).json({
    error: {
      code: STATUS_CODE_MAP[status] ?? "SERVER_ERROR",
      message: status === 500 ? "Internal server error" : error.message,
    },
  });
}

export async function handleInitializePayment(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const coupleId = req.authContext!.user.id;
    const { bookingId, amount, currency } = req.body as {
      bookingId?: string;
      amount?: number;
      currency?: string;
    };

    if (!bookingId || !amount) {
      res.status(400).json({
        error: { code: "BAD_REQUEST", message: "bookingId and amount are required" },
      });
      return;
    }

    const result = await initializePayment({
      bookingId,
      coupleId,
      amount,
      currency,
    });

    res.status(201).json({
      payment: result.payment,
      checkoutUrl: result.checkoutUrl,
    });
  } catch (err) {
    handleError(res, err);
  }
}

export async function handleVerifyPayment(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const coupleId = req.authContext!.user.id;
    const txRef = req.params.txRef as string;

    const result = await verifyPayment(txRef, coupleId);

    res.json({
      payment: result.payment,
      booking: result.booking,
    });
  } catch (err) {
    handleError(res, err);
  }
}

export async function handlePaymentWebhook(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const rawBody = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
    const signature =
      (req.headers["x-chapa-signature"] as string) ??
      (req.headers["chapa-signature"] as string);

    if (!verifyWebhookSignature(rawBody, signature)) {
      res.status(401).json({ error: { message: "Invalid signature" } });
      return;
    }

    const payload = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    await handleWebhook(payload);

    res.status(200).json({ received: true });
  } catch (err) {
    console.error("Webhook processing error:", err);
    res.status(200).json({ received: true });
  }
}

export async function handleGetPaymentByBooking(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const bookingId = req.params.bookingId as string;
    const payment = await paymentRepo.findByBookingId(bookingId);

    if (!payment) {
      res.status(404).json({
        error: { code: "NOT_FOUND", message: "No payment found for this booking" },
      });
      return;
    }

    const userId = req.authContext!.vendorOwnerId ?? req.authContext!.user.id;
    if (payment.coupleId !== userId && payment.vendorId !== userId) {
      res.status(403).json({
        error: { code: "FORBIDDEN", message: "Access denied" },
      });
      return;
    }

    res.json({ payment });
  } catch (err) {
    handleError(res, err);
  }
}
