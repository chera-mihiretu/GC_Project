import { apiFetch } from "./auth.service";

export interface VendorAnalytics {
  bookingsByStatus: Record<string, number>;
  dailyBookings: { day: string; count: number }[];
  totalEarned: number;
  paymentCount: number;
  dailyEarnings: { day: string; total: number }[];
}

export async function getVendorAnalytics(): Promise<VendorAnalytics> {
  const res = await apiFetch("/api/v1/vendor/analytics");
  if (!res.ok) throw new Error("Failed to fetch vendor analytics");
  return res.json();
}
