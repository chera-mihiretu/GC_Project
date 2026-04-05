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
