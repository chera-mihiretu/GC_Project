import { apiFetch } from "./auth.service";
import type {
  EarningsSummary,
  VendorPaymentRecord,
  Withdrawal,
  ChapaBank,
} from "@/types/payment";

const BASE = "/api/v1/earnings";

export async function getEarningsSummary(): Promise<EarningsSummary> {
  const res = await apiFetch(BASE + "/summary");
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message ?? "Failed to load earnings");
  }
  return res.json();
}

export async function getPaymentHistory(
  page = 1,
  limit = 20,
): Promise<{ payments: VendorPaymentRecord[]; total: number; page: number; limit: number }> {
  const res = await apiFetch(`${BASE}/payments?page=${page}&limit=${limit}`);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message ?? "Failed to load payment history");
  }
  return res.json();
}

export async function getWithdrawalHistory(
  page = 1,
  limit = 20,
): Promise<{ withdrawals: Withdrawal[]; total: number; page: number; limit: number }> {
  const res = await apiFetch(`${BASE}/withdrawals?page=${page}&limit=${limit}`);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message ?? "Failed to load withdrawal history");
  }
  return res.json();
}

export interface WithdrawRequest {
  amount: number;
  bankCode: string;
  bankName?: string;
  accountNumber: string;
  accountName: string;
}

export async function requestWithdrawal(
  data: WithdrawRequest,
): Promise<{ withdrawal: Withdrawal }> {
  const res = await apiFetch(BASE + "/withdraw", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message ?? "Withdrawal failed");
  }
  return res.json();
}

export async function listBanks(): Promise<ChapaBank[]> {
  const res = await apiFetch(BASE + "/banks");
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message ?? "Failed to load banks");
  }
  const json = await res.json();
  return json.banks;
}
