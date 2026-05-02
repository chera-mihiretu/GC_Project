"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "@/lib/auth-client";
import { apiFetch, getDashboardPath } from "@/services/auth.service";

const NEW_ACCOUNT_THRESHOLD_MS = 2 * 60 * 1000;

function isAccountJustCreated(user: Record<string, unknown>): boolean {
  const createdAt = user.createdAt;
  if (!createdAt) return false;
  const created = new Date(createdAt as string).getTime();
  return Date.now() - created < NEW_ACCOUNT_THRESHOLD_MS;
}

export default function SocialCallbackPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const processed = useRef(false);

  useEffect(() => {
    if (isPending || processed.current) return;
    if (!session?.user) return;

    processed.current = true;

    const intent = localStorage.getItem("socialLoginIntent");
    const pendingRole = localStorage.getItem("pendingAccountRole");
    localStorage.removeItem("socialLoginIntent");
    localStorage.removeItem("pendingAccountRole");

    const user = session.user as Record<string, unknown>;

    async function handleCallback() {
      if (intent === "login" && isAccountJustCreated(user)) {
        await signOut();
        router.replace("/login?error=no_account");
        return;
      }

      if (pendingRole === "vendor") {
        try {
          await apiFetch("/api/v1/auth/set-role", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ role: "vendor" }),
          });
          router.replace("/vendor/dashboard");
          return;
        } catch {
          // If set-role fails, fall through to default dashboard
        }
      }

      const userRole = user.role as string | undefined;
      router.replace(getDashboardPath(userRole));
    }

    handleCallback();
  }, [session, isPending, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="w-8 h-8 border-3 border-rose-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-gray-500">Setting up your account...</p>
    </div>
  );
}
