import { apiFetch } from "./auth.service";

export interface AvailabilityRange {
  id: string;
  vendorProfileId: string;
  startDate: string;
  endDate: string;
  note: string | null;
  createdAt: string;
}

export async function getMyAvailability(): Promise<AvailabilityRange[]> {
  const res = await apiFetch("/api/v1/vendor/availability");
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error?.message ?? "Failed to fetch availability");
  }
  const data = await res.json();
  return data.availability;
}

export async function addAvailability(
  startDate: string,
  endDate: string,
  note?: string,
): Promise<AvailabilityRange> {
  const res = await apiFetch("/api/v1/vendor/availability", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ startDate, endDate, note }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error?.message ?? "Failed to add availability");
  }
  const data = await res.json();
  return data.availability;
}

export async function removeAvailability(id: string): Promise<void> {
  const res = await apiFetch(`/api/v1/vendor/availability/${id}`, {
    method: "DELETE",
  });
  if (!res.ok && res.status !== 204) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error?.message ?? "Failed to remove availability");
  }
}

export async function getVendorAvailability(
  vendorProfileId: string,
  month: string,
): Promise<AvailabilityRange[]> {
  const res = await apiFetch(
    `/api/v1/vendors/${vendorProfileId}/availability?month=${month}`,
  );
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error?.message ?? "Failed to fetch vendor availability");
  }
  const data = await res.json();
  return data.availability;
}
