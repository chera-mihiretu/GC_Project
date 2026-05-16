import { apiFetch } from "./auth.service";

export interface AdminAnalytics {
  activeThisWeek: number;
  inactiveThisWeek: number;
  totalUsers: number;
  dailyActivity: { day: string; count: number }[];
}

export async function getAdminAnalytics(): Promise<AdminAnalytics> {
  const res = await apiFetch("/api/v1/admin/analytics");
  if (!res.ok) throw new Error("Failed to fetch analytics");
  return res.json();
}
