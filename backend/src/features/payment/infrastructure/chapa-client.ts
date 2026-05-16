import { env } from "../../../config/env.js";
import type { ChapaInitParams, ChapaInitResponse, ChapaVerifyResponse } from "../domain/types.js";

const CHAPA_BASE_URL = "https://api.chapa.co/v1";

function headers(): Record<string, string> {
  return {
    Authorization: `Bearer ${env.CHAPA_SECRET_KEY}`,
    "Content-Type": "application/json",
  };
}

export async function initializeTransaction(
  params: ChapaInitParams,
): Promise<ChapaInitResponse> {
  const res = await fetch(`${CHAPA_BASE_URL}/transaction/initialize`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const body = await res.text();
    throw Object.assign(
      new Error(`Chapa initialize failed (${res.status}): ${body}`),
      { statusCode: 502 },
    );
  }

  return res.json() as Promise<ChapaInitResponse>;
}

export async function verifyTransaction(
  txRef: string,
): Promise<ChapaVerifyResponse> {
  const res = await fetch(
    `${CHAPA_BASE_URL}/transaction/verify/${encodeURIComponent(txRef)}`,
    { method: "GET", headers: headers() },
  );

  if (!res.ok) {
    const body = await res.text();
    throw Object.assign(
      new Error(`Chapa verify failed (${res.status}): ${body}`),
      { statusCode: 502 },
    );
  }

  return res.json() as Promise<ChapaVerifyResponse>;
}

// ──────────────────── Transfer / Payout ────────────────────

export interface ChapaTransferParams {
  account_name: string;
  account_number: string;
  amount: string;
  currency: string;
  bank_code: string;
  reference: string;
}

export interface ChapaTransferResponse {
  message: string;
  status: string;
  data: unknown;
}

export interface ChapaBank {
  id: string;
  name: string;
  country_id: number;
  created_at: string;
  updated_at: string;
}

export async function initiateTransfer(
  params: ChapaTransferParams,
): Promise<ChapaTransferResponse> {
  const res = await fetch(`${CHAPA_BASE_URL}/transfers`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const body = await res.text();
    throw Object.assign(
      new Error(`Chapa transfer failed (${res.status}): ${body}`),
      { statusCode: 502 },
    );
  }

  return res.json() as Promise<ChapaTransferResponse>;
}

export async function listBanks(): Promise<ChapaBank[]> {
  const res = await fetch(`${CHAPA_BASE_URL}/banks`, {
    method: "GET",
    headers: headers(),
  });

  if (!res.ok) {
    const body = await res.text();
    throw Object.assign(
      new Error(`Chapa list banks failed (${res.status}): ${body}`),
      { statusCode: 502 },
    );
  }

  const json = (await res.json()) as { data: ChapaBank[] };
  return json.data ?? [];
}
