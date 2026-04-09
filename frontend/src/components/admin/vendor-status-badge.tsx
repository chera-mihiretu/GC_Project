"use client";

import { VendorStatus } from "@/types/vendor";

const BADGE_STYLES: Record<string, string> = {
  [VendorStatus.REGISTERED]: "bg-gray-100 text-gray-700",
  [VendorStatus.PENDING_VERIFICATION]: "bg-amber-100 text-amber-800",
  [VendorStatus.VERIFIED]: "bg-green-100 text-green-800",
  [VendorStatus.REJECTED]: "bg-orange-100 text-orange-800",
  [VendorStatus.SUSPENDED]: "bg-red-100 text-red-800",
  [VendorStatus.DEACTIVATED]: "bg-gray-200 text-gray-500",
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
  return (
    <span
      className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${BADGE_STYLES[status] ?? "bg-gray-100 text-gray-600"}`}
    >
      {BADGE_LABELS[status] ?? status}
    </span>
  );
}
