"use client";

import { FiCalendar, FiTag } from "react-icons/fi";
import type { BookingCardData } from "@/services/ai.service";

interface Props {
  booking: BookingCardData;
  onClick?: (bookingId: string) => void;
}

const statusColors: Record<string, { bg: string; text: string }> = {
  pending: { bg: "bg-amber-50", text: "text-amber-700" },
  accepted: { bg: "bg-green-50", text: "text-green-700" },
  declined: { bg: "bg-red-50", text: "text-red-700" },
  cancelled: { bg: "bg-gray-100", text: "text-gray-500" },
  deposit_paid: { bg: "bg-blue-50", text: "text-blue-700" },
  completed: { bg: "bg-emerald-50", text: "text-emerald-700" },
};

export default function BookingCard({ booking, onClick }: Props) {
  const colors = statusColors[booking.status] ?? statusColors.pending;

  return (
    <button
      onClick={() => onClick?.(booking.bookingId)}
      className="flex gap-3 p-3 rounded-xl border border-gray-200 hover:border-rose-300 hover:shadow-sm transition-all bg-white group text-left w-full cursor-pointer"
    >
      <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center shrink-0">
        <FiCalendar className="w-4.5 h-4.5 text-rose-500" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-sm text-gray-900 truncate group-hover:text-rose-600 transition-colors">
          {booking.vendorBusinessName}
        </h4>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded-full ${colors.bg} ${colors.text} capitalize`}>
            {booking.status.replace("_", " ")}
          </span>
          <span className="flex items-center gap-0.5 text-xs text-gray-500">
            <FiTag className="w-3 h-3" />
            {booking.serviceCategory}
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {new Date(booking.eventDate + "T00:00:00").toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </p>
      </div>
    </button>
  );
}
