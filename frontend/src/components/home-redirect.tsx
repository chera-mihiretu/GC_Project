"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { getDashboardPath } from "@/services/auth.service";

export default function HomeRedirect() {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  useEffect(() => {
    if (!isPending && session?.user) {
      const role = (session.user as Record<string, unknown>).role as string;
      router.replace(getDashboardPath(role));
    }
  }, [session, isPending, router]);

  return null;
}
