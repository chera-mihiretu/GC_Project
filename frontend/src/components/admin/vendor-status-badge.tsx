"use client";

import { VendorStatus } from "@/types/vendor";

const BADGE_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  [VendorStatus.REGISTERED]:            { bg: "bg-warm-50",    text: "text-slate-600",   border: "border-warm-200/30" },
  [VendorStatus.PENDING_VERIFICATION]:  { bg: "bg-amber-50",   text: "text-amber-600",   border: "border-amber-200/40" },
  [VendorStatus.VERIFIED]:              { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-200/40" },
  [VendorStatus.REJECTED]:              { bg: "bg-orange-50",  text: "text-orange-600",  border: "border-orange-200/40" },
  [VendorStatus.SUSPENDED]:             { bg: "bg-red-50",     text: "text-red-600",     border: "border-red-200/40" },
  [VendorStatus.DEACTIVATED]:           { bg: "bg-warm-50",    text: "text-slate-400",   border: "border-warm-200/30" },
};

const BADGE_LABELS: Record<string, string> = {
  [VendorStatus.REGISTERED]: "Registered",
  [VendorStatus.PENDING_VERIFICATION]: "Pending Review",
  [VendorStatus.VERIFIED]: "Verified",
  [VendorStatus.REJECTED]: "Rejected",
  [VendorStatus.SUSPENDED]: "Suspended",
  [VendorStatus.DEACTIVATED]: "Deactivated",
};

export default function VendorStatusBadge({ status }: { status: string }) {
  const style = BADGE_STYLES[status] ?? { bg: "bg-warm-50", text: "text-slate-500", border: "border-warm-200/30" };
  return (
    <span
      className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-luxury border ${style.bg} ${style.text} ${style.border}`}
    >
      {BADGE_LABELS[status] ?? status}
    </span>
  );
}
