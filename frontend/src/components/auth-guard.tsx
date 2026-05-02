"use client";

import { useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { authClient } from "@/lib/auth-client";

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export default function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const retried = useRef(false);

  const verifyAndRedirect = useCallback(async () => {
    if (retried.current) return;
    retried.current = true;

    try {
      const { data } = await authClient.getSession();
      if (!data?.user) {
        router.replace("/login");
      }
    } catch {
      router.replace("/login");
    }
  }, [router]);

  useEffect(() => {
    if (isPending) return;

    if (!session?.user) {
      verifyAndRedirect();
      return;
    }

    if (allowedRoles && allowedRoles.length > 0) {
      const userRole = (session.user as Record<string, unknown>).role as string;
      if (!allowedRoles.includes(userRole)) {
        router.replace("/login");
      }
    }
  }, [session, isPending, allowedRoles, router, verifyAndRedirect]);

  if (isPending || (!session?.user && !retried.current)) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          color: "#666",
        }}
      >
        Loading...
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  return <>{children}</>;
}
