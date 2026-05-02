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
  { key: BookingStatus.DEPOSIT_PAID, label: "Deposit Paid" },
  { key: BookingStatus.COMPLETED, label: "Completed" },
];

const STATUS_ORDER: Record<string, number> = {
  pending: 0,
  accepted: 1,
  deposit_paid: 2,
  completed: 3,
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
    <div className="space-y-4">
      {/* Main timeline */}
      <div className="flex items-center gap-0 overflow-x-auto py-2">
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
            <div key={step.key} className="flex items-center">
              {/* Step */}
              <div className="flex flex-col items-center min-w-[80px]">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    state === "done"
                      ? "bg-green-100 text-green-600"
                      : state === "current"
                        ? "bg-blue-100 text-blue-600 ring-2 ring-blue-300 ring-offset-2"
                        : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {state === "done" ? (
                    <FiCheck className="w-4 h-4" />
                  ) : (
                    <span>{i + 1}</span>
                  )}
                </div>
                <span
                  className={`text-xs mt-1.5 text-center whitespace-nowrap ${
                    state === "done"
                      ? "text-green-600 font-medium"
                      : state === "current"
                        ? "text-blue-600 font-medium"
                        : "text-gray-400"
                  }`}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector */}
              {i < HAPPY_PATH.length - 1 && (
                <div
                  className={`h-0.5 w-8 sm:w-12 ${
                    state === "done" ? "bg-green-300" : "bg-gray-200"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Terminal negative state */}
      {isTerminalNegative && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 border border-red-100">
          <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
            <FiX className="w-3.5 h-3.5 text-red-500" />
          </div>
          <span className="text-sm font-medium text-red-600 capitalize">
            {currentStatus === BookingStatus.DECLINED ? "Declined" : "Cancelled"}
          </span>
          <span className="text-xs text-red-400 ml-auto">
            {formatDate(updatedAt)}
          </span>
        </div>
      )}

      {/* Timestamps */}
      <div className="flex gap-4 text-xs text-gray-400">
        <span>Created: {formatDate(createdAt)}</span>
        {createdAt !== updatedAt && (
          <span>Last updated: {formatDate(updatedAt)}</span>
        )}
      </div>
    </div>
  );
}
