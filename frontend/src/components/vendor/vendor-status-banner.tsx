"use client";

import { VendorStatus } from "@/types/vendor";

const STATUS_CONFIG: Record<
  string,
  { label: string; message: string; bg: string; text: string; border: string }
> = {
  [VendorStatus.REGISTERED]: {
    label: "Profile Incomplete",
    message: "Complete your profile and upload documents to get verified.",
    bg: "bg-blue-50",
    text: "text-blue-800",
    border: "border-blue-200",
  },
  [VendorStatus.PENDING_VERIFICATION]: {
    label: "Under Review",
    message: "Your profile is being reviewed by our team. We'll notify you once approved.",
    bg: "bg-amber-50",
    text: "text-amber-800",
    border: "border-amber-200",
  },
  [VendorStatus.VERIFIED]: {
    label: "Verified",
    message: "Your profile is live and visible to couples.",
    bg: "bg-green-50",
    text: "text-green-800",
    border: "border-green-200",
  },
  [VendorStatus.REJECTED]: {
    label: "Rejected",
    message: "Your application was rejected. Please review the reason below and resubmit.",
    bg: "bg-orange-50",
    text: "text-orange-800",
    border: "border-orange-200",
  },
  [VendorStatus.SUSPENDED]: {
    label: "Suspended",
    message: "Your account has been suspended due to a policy violation.",
    bg: "bg-red-50",
    text: "text-red-800",
    border: "border-red-200",
  },
  [VendorStatus.DEACTIVATED]: {
    label: "Deactivated",
    message: "This account has been permanently closed.",
    bg: "bg-gray-50",
    text: "text-gray-800",
    border: "border-gray-200",
  },
};

interface Props {
  status: string;
  rejectionReason?: string | null;
}

export default function VendorStatusBanner({ status, rejectionReason }: Props) {
  const config = STATUS_CONFIG[status];
  if (!config) return null;

  return (
    <div className={`rounded-xl border p-4 mb-6 ${config.bg} ${config.border}`}>
      <div className="flex items-center gap-2 mb-1">
        <span
          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${config.text} ${config.bg}`}
        >
          {config.label}
        </span>
      </div>
      <p className={`text-sm ${config.text}`}>{config.message}</p>
      {rejectionReason && status === VendorStatus.REJECTED && (
        <div className="mt-3 p-3 bg-white/60 rounded-lg">
          <p className="text-xs font-medium text-orange-700 mb-1">Reason:</p>
          <p className="text-sm text-orange-900">{rejectionReason}</p>
        </div>
      )}
    </div>
  );
}
