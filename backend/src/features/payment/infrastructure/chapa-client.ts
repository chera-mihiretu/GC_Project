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
