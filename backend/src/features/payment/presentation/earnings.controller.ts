import type { Request, Response } from "express";
import * as paymentRepo from "../infrastructure/payment.repository.js";
import * as withdrawalRepo from "../infrastructure/withdrawal.repository.js";
import * as chapaClient from "../infrastructure/chapa-client.js";
import { WithdrawalStatus } from "../domain/types.js";

function handleError(res: Response, err: unknown): void {
  const error = err as Error & { statusCode?: number };
  const status = error.statusCode ?? 500;
  const codeMap: Record<number, string> = {
    400: "BAD_REQUEST",
    403: "FORBIDDEN",
    409: "CONFLICT",
    422: "UNPROCESSABLE_ENTITY",
    502: "BAD_GATEWAY",
  };
  res.status(status).json({
    error: {
      code: codeMap[status] ?? "SERVER_ERROR",
      message: status === 500 ? "Internal server error" : error.message,
    },
  });
}

export async function handleGetEarningsSummary(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const vendorId = req.authContext!.vendorOwnerId ?? req.authContext!.user.id;
    const summary = await paymentRepo.getVendorEarningsSummary(vendorId);
    res.json(summary);
  } catch (err) {
    handleError(res, err);
  }
}

export async function handleGetPaymentHistory(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const vendorId = req.authContext!.vendorOwnerId ?? req.authContext!.user.id;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const page = parseInt(req.query.page as string) || 1;
    const offset = (page - 1) * limit;

    const result = await paymentRepo.getVendorPaymentHistory(vendorId, { limit, offset });
    res.json({ ...result, page, limit });
  } catch (err) {
    handleError(res, err);
  }
}

export async function handleGetWithdrawalHistory(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const vendorId = req.authContext!.vendorOwnerId ?? req.authContext!.user.id;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const page = parseInt(req.query.page as string) || 1;
    const offset = (page - 1) * limit;

    const result = await withdrawalRepo.findByVendorId(vendorId, { limit, offset });
    res.json({ ...result, page, limit });
  } catch (err) {
    handleError(res, err);
  }
}

export async function handleRequestWithdrawal(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const vendorId = req.authContext!.vendorOwnerId ?? req.authContext!.user.id;
    const { amount, bankCode, bankName, accountNumber, accountName } = req.body as {
      amount?: number;
      bankCode?: string;
      bankName?: string;
      accountNumber?: string;
      accountName?: string;
    };

    if (!amount || amount <= 0) {
      res.status(400).json({ error: { code: "BAD_REQUEST", message: "amount must be positive" } });
      return;
    }
    if (!bankCode || !accountNumber || !accountName) {
      res.status(400).json({
        error: { code: "BAD_REQUEST", message: "bankCode, accountNumber, and accountName are required" },
      });
      return;
    }

    const hasPending = await withdrawalRepo.hasPendingWithdrawal(vendorId);
    if (hasPending) {
      res.status(409).json({
        error: { code: "CONFLICT", message: "You already have a pending withdrawal. Wait for it to complete." },
      });
      return;
    }

    const summary = await paymentRepo.getVendorEarningsSummary(vendorId);
    if (amount > summary.availableBalance) {
      res.status(400).json({
        error: {
          code: "BAD_REQUEST",
          message: `Insufficient balance. Available: ${summary.availableBalance.toFixed(2)} ${summary.currency}`,
        },
      });
      return;
    }

    const reference = `tw-wd-${vendorId.replace(/-/g, "").slice(0, 8)}-${Date.now()}`;

    const withdrawal = await withdrawalRepo.create({
      vendorId,
      amount,
      currency: summary.currency,
      bankCode,
      bankName: bankName ?? bankCode,
      accountNumber,
      accountName,
      reference,
    });

    try {
      await chapaClient.initiateTransfer({
        account_name: accountName,
        account_number: accountNumber,
        amount: amount.toFixed(2),
        currency: summary.currency,
        bank_code: bankCode,
        reference,
      });

      await withdrawalRepo.updateStatus(withdrawal.id, WithdrawalStatus.COMPLETED);
      withdrawal.status = WithdrawalStatus.COMPLETED;
    } catch (transferErr) {
      const msg = transferErr instanceof Error ? transferErr.message : "Transfer failed";
      await withdrawalRepo.updateStatus(withdrawal.id, WithdrawalStatus.FAILED, msg);
      withdrawal.status = WithdrawalStatus.FAILED;
      withdrawal.failureReason = msg;
    }

    res.status(201).json({ withdrawal });
  } catch (err) {
    handleError(res, err);
  }
}

export async function handleListBanks(
  _req: Request,
  res: Response,
): Promise<void> {
  try {
    const banks = await chapaClient.listBanks();
    res.json({ banks });
  } catch (err) {
    handleError(res, err);
  }
}
