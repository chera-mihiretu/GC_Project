"use client";

import { BookingStatus } from "@/types/booking";
import { FiCheck, FiX } from "react-icons/fi";

interface BookingStatusTimelineProps {
  currentStatus: string;
  createdAt: string;
  updatedAt: string;
}

const HAPPY_PATH = [
  { key: BookingStatus.PENDING, label: "Pending" },
  { key: BookingStatus.ACCEPTED, label: "Accepted" },
  { key: BookingStatus.PAYMENT_REQUESTED, label: "Payment Requested" },
  { key: BookingStatus.DEPOSIT_PAID, label: "Deposit Paid" },
  { key: BookingStatus.COMPLETED, label: "Completed" },
];

const STATUS_ORDER: Record<string, number> = {
  pending: 0,
  accepted: 1,
  payment_requested: 2,
  deposit_paid: 3,
  completed: 4,
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function BookingStatusTimeline({
  currentStatus,
  createdAt,
  updatedAt,
}: BookingStatusTimelineProps) {
  const isTerminalNegative =
    currentStatus === BookingStatus.DECLINED ||
    currentStatus === BookingStatus.CANCELLED;

  const currentIndex = STATUS_ORDER[currentStatus] ?? -1;

  return (
    <div className="space-y-6">
      {/* Main timeline */}
      <div className="flex items-start gap-0 overflow-x-auto py-2">
        {HAPPY_PATH.map((step, i) => {
          const stepIndex = STATUS_ORDER[step.key];
          let state: "done" | "current" | "upcoming" = "upcoming";

          if (isTerminalNegative) {
            if (stepIndex < currentIndex || stepIndex <= STATUS_ORDER[BookingStatus.PENDING]) {
              state = stepIndex === 0 ? "done" : "upcoming";
            }
            if (currentStatus === BookingStatus.DECLINED && stepIndex === 0) state = "done";
            if (currentStatus === BookingStatus.CANCELLED) {
              state = stepIndex <= (currentIndex > 0 ? currentIndex - 1 : 0) ? "done" : "upcoming";
            }
          } else {
            if (stepIndex < currentIndex) state = "done";
            else if (stepIndex === currentIndex) state = "current";
          }

          return (
            <div key={step.key} className="flex items-start">
              <div className="flex flex-col items-center min-w-[90px]">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-[12px] font-semibold border transition-all duration-500 ${
                    state === "done"
                      ? "bg-emerald-50 text-emerald-600 border-emerald-200/40"
                      : state === "current"
                        ? "bg-slate-900 text-white border-slate-900 shadow-[0_2px_12px_rgba(15,23,42,0.15)]"
                        : "bg-warm-50 text-slate-400 border-warm-200/30"
                  }`}
                >
                  {state === "done" ? (
                    <FiCheck className="w-4 h-4" />
                  ) : (
                    <span>{i + 1}</span>
                  )}
                </div>
                <span
                  className={`text-[11px] mt-2.5 text-center whitespace-nowrap font-medium ${
                    state === "done"
                      ? "text-emerald-600"
                      : state === "current"
                        ? "text-slate-800"
                        : "text-slate-400"
                  }`}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector */}
              {i < HAPPY_PATH.length - 1 && (
                <div
                  className={`h-[2px] w-8 sm:w-14 mt-[18px] rounded-full transition-colors duration-500 ${
                    state === "done" ? "bg-emerald-200" : "bg-warm-200/40"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Terminal negative state */}
      {isTerminalNegative && (
        <div className="flex items-center gap-3 px-5 py-4 rounded-xl bg-red-50/50 border border-red-100">
          <div className="w-8 h-8 rounded-lg bg-red-100 border border-red-200/40 flex items-center justify-center shrink-0">
            <FiX className="w-3.5 h-3.5 text-red-500" />
          </div>
          <span className="text-[13px] font-semibold text-red-600">
            {currentStatus === BookingStatus.DECLINED ? "Declined" : "Cancelled"}
          </span>
          <span className="text-[12px] text-red-400 font-light ml-auto">
            {formatDate(updatedAt)}
          </span>
        </div>
      )}

      {/* Timestamps */}
      <div className="flex gap-6 text-[11px] text-slate-400 font-light pt-2 border-t border-warm-200/30">
        <span>Created: <span className="text-slate-500 font-medium">{formatDate(createdAt)}</span></span>
        {createdAt !== updatedAt && (
          <span>Last updated: <span className="text-slate-500 font-medium">{formatDate(updatedAt)}</span></span>
        )}
      </div>
    </div>
  );
}
