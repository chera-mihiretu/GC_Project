"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export default function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  useEffect(() => {
    if (isPending) return;

    if (!session?.user) {
      router.replace("/login");
      return;
    }

    if (allowedRoles && allowedRoles.length > 0) {
      const userRole = (session.user as Record<string, unknown>).role as string;
      if (!allowedRoles.includes(userRole)) {
        router.replace("/login");
      }
    }
  }, [session, isPending, allowedRoles, router]);

  if (isPending) {
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
