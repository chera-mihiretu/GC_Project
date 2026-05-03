"use client";

import { useEffect, useState, useCallback } from "react";
import { authClient } from "@/lib/auth-client";
import { FiAlertTriangle, FiLogOut, FiLoader } from "react-icons/fi";

interface ImpersonationData {
  userName: string;
  userEmail: string;
  userId: string;
}

export default function ImpersonationBanner() {
  const [data, setData] = useState<ImpersonationData | null>(null);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem("twedar_impersonating");
    if (raw) {
      try {
        setData(JSON.parse(raw));
      } catch {
        localStorage.removeItem("twedar_impersonating");
      }
    }
  }, []);

  const handleExit = useCallback(async () => {
    setExiting(true);
    try {
      await authClient.admin.stopImpersonating();
      localStorage.removeItem("twedar_impersonating");
      window.location.href = "/admin/users";
    } catch {
      localStorage.removeItem("twedar_impersonating");
      window.location.href = "/admin/users";
    }
  }, []);

  if (!data) return null;

  return (
    <div className="fixed top-0 inset-x-0 z-[100] bg-amber-500 text-white px-4 py-2 flex items-center justify-center gap-3 shadow-lg">
      <FiAlertTriangle className="w-4 h-4 shrink-0" />
      <p className="text-sm font-medium truncate">
        Impersonating <span className="font-bold">{data.userName}</span>{" "}
        <span className="opacity-80 text-xs">({data.userEmail})</span>
      </p>
      <button
        onClick={handleExit}
        disabled={exiting}
        className="flex items-center gap-1.5 px-3 py-1 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold rounded-md transition-colors ml-2 shrink-0 cursor-pointer disabled:opacity-60"
      >
        {exiting ? <FiLoader className="w-3 h-3 animate-spin" /> : <FiLogOut className="w-3 h-3" />}
        Exit Impersonation
      </button>
    </div>
  );
}
