"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, organization } from "@/lib/auth-client";
import { authClient } from "@/lib/auth-client";

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export default function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const retried = useRef(false);
  const [orgChecked, setOrgChecked] = useState(false);
  const [orgAllowed, setOrgAllowed] = useState(false);

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

    const userRole = (session.user as Record<string, unknown>).role as string;

    if (allowedRoles && allowedRoles.length > 0) {
      if (allowedRoles.includes(userRole)) {
        setOrgChecked(true);
        setOrgAllowed(true);
        return;
      }

      if (allowedRoles.includes("vendor")) {
        organization.list().then((res) => {
          const orgs = res?.data;
          if (orgs && orgs.length > 0) {
            setOrgAllowed(true);
          } else {
            router.replace("/login");
          }
          setOrgChecked(true);
        }).catch(() => {
          router.replace("/login");
          setOrgChecked(true);
        });
        return;
      }

      router.replace("/login");
    } else {
      setOrgChecked(true);
      setOrgAllowed(true);
    }
  }, [session, isPending, allowedRoles, router, verifyAndRedirect]);

  if (isPending || (!session?.user && !retried.current) || (allowedRoles && !orgChecked)) {
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

  if (!session?.user || (allowedRoles && !orgAllowed)) {
    return null;
  }

  return <>{children}</>;
}
