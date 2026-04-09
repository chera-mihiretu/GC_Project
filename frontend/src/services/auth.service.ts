import { authClient } from "@/lib/auth-client";
import { ROLE_DASHBOARD_MAP } from "@/types/auth";

export async function loginWithEmail(email: string, password: string) {
  return authClient.signIn.email({ email, password });
}

export async function registerWithEmail(
  name: string,
  email: string,
  password: string,
) {
  return authClient.signUp.email({ name, email, password });
}

export async function loginWithGoogle() {
  return authClient.signIn.social({
    provider: "google",
    callbackURL: "/auth/callback",
  });
}

export async function loginWithApple() {
  return authClient.signIn.social({
    provider: "apple",
    callbackURL: "/auth/callback",
  });
}

export async function logout() {
  return authClient.signOut();
}

export async function getSession() {
  return authClient.getSession();
}

export function getDashboardPath(role?: string): string {
  if (!role) return "/dashboard";
  return ROLE_DASHBOARD_MAP[role] || "/dashboard";
}

export async function forgetPassword(email: string, redirectTo: string = "/reset-password") {
  return authClient.requestPasswordReset({ email, redirectTo });
}

export async function resetPassword(token: string, newPassword: string) {
  return authClient.resetPassword({ token, newPassword });
}

export async function apiFetch(input: RequestInfo, init?: RequestInit) {
  const baseURL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
  const url =
    typeof input === "string" && input.startsWith("/")
      ? `${baseURL}${input}`
      : input;

  const res = await fetch(url, {
    ...init,
  });

  if (res.status === 401 && typeof window !== "undefined") {
    window.location.href = "/login";
  }

  return res;
}
