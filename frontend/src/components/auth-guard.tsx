/**
 * @fileoverview Client-side authentication guard component.
 * 
 * This component protects routes by verifying user authentication and
 * optionally checking role-based access. It handles loading states,
 * session verification, and redirects for unauthorized access.
 * 
 * @module components/auth-guard
 */
"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSession, organization } from "@/lib/auth-client";
import { authClient } from "@/lib/auth-client";

/**
 * Props for the AuthGuard component.
 */
interface AuthGuardProps {
  /** Child components to render when authentication passes */
  children: React.ReactNode;
  /** Optional array of roles that are allowed to access this route */
  allowedRoles?: string[];
}

/**
 * Authentication guard that wraps protected routes.
 * 
 * This component performs several checks:
 * 1. Verifies the user has an active session
 * 2. If allowedRoles is specified, checks the user's role
 * 3. For vendor role checks, also verifies organization membership
 * 
 * Shows a loading state while checks are in progress, and redirects
 * to login if authentication fails.
 * 
 * @param props - Component props including children and optional allowedRoles
 * @returns The children if authenticated, loading state, or null while redirecting
 */
export default function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, isPending } = useSession();
  const retried = useRef(false);
  const [orgChecked, setOrgChecked] = useState(false);
  const [orgAllowed, setOrgAllowed] = useState(false);

  const loginUrl = "/login?redirect=" + encodeURIComponent(pathname);

  const verifyAndRedirect = useCallback(async () => {
    if (retried.current) return;
    retried.current = true;

    try {
      const { data } = await authClient.getSession();
      if (!data?.user) {
        router.replace(loginUrl);
      }
    } catch {
      router.replace(loginUrl);
    }
  }, [router, loginUrl]);

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
            router.replace(loginUrl);
          }
          setOrgChecked(true);
        }).catch(() => {
          router.replace(loginUrl);
          setOrgChecked(true);
        });
        return;
      }

      router.replace(loginUrl);
    } else {
      setOrgChecked(true);
      setOrgAllowed(true);
    }
  }, [session, isPending, allowedRoles, router, verifyAndRedirect, loginUrl]);

  if (isPending || (!session?.user && !retried.current) || (allowedRoles && !orgChecked)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-warm-50">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-10 h-10">
            <div className="absolute inset-0 rounded-xl border-2 border-warm-200/40" />
            <div className="absolute inset-0 rounded-xl border-2 border-transparent border-t-gold-400 animate-spin" />
          </div>
          <p className="text-[13px] text-slate-400 font-light tracking-wide">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session?.user || (allowedRoles && !orgAllowed)) {
    return null;
  }

  return <>{children}</>;
}