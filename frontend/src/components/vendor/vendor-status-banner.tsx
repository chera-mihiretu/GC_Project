"use client";

import { VendorStatus } from "@/types/vendor";
import {
  FiCheckCircle,
  FiClock,
  FiAlertTriangle,
  FiXCircle,
  FiInfo,
} from "react-icons/fi";

const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    message: string;
    bg: string;
    border: string;
    text: string;
    labelBg: string;
    icon: React.ReactNode;
  }
> = {
  [VendorStatus.REGISTERED]: {
    label: "Incomplete",
    message: "Complete your profile and upload documents to get verified.",
    bg: "bg-blue-50/40",
    border: "border-blue-200/40",
    text: "text-blue-700",
    labelBg: "bg-blue-100/60 text-blue-700",
    icon: <FiInfo className="w-4.5 h-4.5 text-blue-500" />,
  },
  [VendorStatus.PENDING_VERIFICATION]: {
    label: "Under Review",
    message: "Your profile is being reviewed by our team. We'll notify you once approved.",
    bg: "bg-amber-50/40",
    border: "border-amber-200/40",
    text: "text-amber-700",
    labelBg: "bg-amber-100/60 text-amber-700",
    icon: <FiClock className="w-4.5 h-4.5 text-amber-500" />,
  },
  [VendorStatus.VERIFIED]: {
    label: "Verified",
    message: "Your profile is live and visible to couples.",
    bg: "bg-emerald-50/40",
    border: "border-emerald-200/40",
    text: "text-emerald-700",
    labelBg: "bg-emerald-100/60 text-emerald-700",
    icon: <FiCheckCircle className="w-4.5 h-4.5 text-emerald-500" />,
  },
  [VendorStatus.REJECTED]: {
    label: "Rejected",
    message: "Your application was rejected. Please review the reason below and resubmit.",
    bg: "bg-orange-50/40",
    border: "border-orange-200/40",
    text: "text-orange-700",
    labelBg: "bg-orange-100/60 text-orange-700",
    icon: <FiAlertTriangle className="w-4.5 h-4.5 text-orange-500" />,
  },
  [VendorStatus.SUSPENDED]: {
    label: "Suspended",
    message: "Your account has been suspended due to a policy violation.",
    bg: "bg-red-50/40",
    border: "border-red-200/40",
    text: "text-red-700",
    labelBg: "bg-red-100/60 text-red-700",
    icon: <FiXCircle className="w-4.5 h-4.5 text-red-500" />,
  },
  [VendorStatus.DEACTIVATED]: {
    label: "Deactivated",
    message: "This account has been permanently closed.",
    bg: "bg-slate-50/40",
    border: "border-slate-200/40",
    text: "text-slate-600",
    labelBg: "bg-slate-100/60 text-slate-600",
    icon: <FiXCircle className="w-4.5 h-4.5 text-slate-400" />,
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
    <div className={`rounded-2xl border p-6 ${config.bg} ${config.border}`}>
      <div className="flex items-start gap-4">
        <div className="shrink-0 mt-0.5">{config.icon}</div>
        <div className="min-w-0">
          <div className="flex items-center gap-2.5 mb-2">
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-luxury ${config.labelBg}`}
            >
              {config.label}
            </span>
          </div>
          <p className={`text-[13px] font-light leading-relaxed ${config.text}`}>
            {config.message}
          </p>
          {rejectionReason && status === VendorStatus.REJECTED && (
            <div className="mt-4 p-4 bg-white/60 rounded-xl border border-orange-200/30">
              <p className="text-[11px] font-semibold uppercase tracking-editorial text-orange-500 mb-1.5">
                Reason
              </p>
              <p className="text-[13px] text-orange-800 leading-relaxed">{rejectionReason}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
