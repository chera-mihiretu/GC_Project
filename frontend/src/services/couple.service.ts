import { apiFetch } from "./auth.service";

const BASE = "/api/v1/couple";

export interface CoupleProfile {
  id: string;
  userId: string;
  weddingDate: string | null;
  budgetCurrency: string;
  estimatedGuests: number | null;
  weddingTheme: string | null;
  weddingLocation: string | null;
  latitude: number | null;
  longitude: number | null;
  partnerName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CoupleProfilePayload {
  weddingDate?: string | null;
  budgetCurrency?: string;
  estimatedGuests?: number | null;
  weddingTheme?: string | null;
  weddingLocation?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  partnerName?: string | null;
}

export async function getCoupleProfile(): Promise<{ coupleProfile: CoupleProfile } | null> {
  const res = await apiFetch(BASE + "/profile");
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to fetch couple profile");
  return res.json();
}

export async function createCoupleProfile(
  data: CoupleProfilePayload,
): Promise<{ coupleProfile: CoupleProfile }> {
  const res = await apiFetch(BASE + "/profile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message ?? "Failed to create profile");
  }
  return res.json();
}

export async function updateCoupleProfile(
  data: CoupleProfilePayload,
): Promise<{ coupleProfile: CoupleProfile }> {
  const res = await apiFetch(BASE + "/profile", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message ?? "Failed to update profile");
  }
  return res.json();
}
