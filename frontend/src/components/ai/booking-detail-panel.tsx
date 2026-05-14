"use client";

import { useEffect, useState, useCallback } from "react";
import {
  FiX,
  FiCalendar,
  FiTag,
  FiClock,
  FiLoader,
  FiAlertCircle,
  FiCheckCircle,
  FiXCircle,
  FiMessageSquare,
  FiMapPin,
  FiStar,
} from "react-icons/fi";
import { getBooking } from "@/services/booking.service";
import type { BookingDetail } from "@/types/booking";

interface Props {
  bookingId: string | null;
  onClose: () => void;
  onCancelBooking?: (bookingId: string, vendorName: string) => void;
  onViewVendor?: (vendorProfileId: string) => void;
}

const statusConfig: Record<string, { icon: React.ReactNode; label: string; bg: string; text: string; border: string }> = {
  pending: {
    icon: <FiClock className="w-4 h-4" />,
    label: "Pending",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
  },
  accepted: {
    icon: <FiCheckCircle className="w-4 h-4" />,
    label: "Accepted",
    bg: "bg-green-50",
    text: "text-green-700",
    border: "border-green-200",
  },
  declined: {
    icon: <FiXCircle className="w-4 h-4" />,
    label: "Declined",
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
  },
  cancelled: {
    icon: <FiXCircle className="w-4 h-4" />,
    label: "Cancelled",
    bg: "bg-gray-50",
    text: "text-gray-500",
    border: "border-gray-200",
  },
  deposit_paid: {
    icon: <FiCheckCircle className="w-4 h-4" />,
    label: "Deposit Paid",
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
  },
  completed: {
    icon: <FiCheckCircle className="w-4 h-4" />,
    label: "Completed",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
  },
};

export default function BookingDetailPanel({ bookingId, onClose, onCancelBooking, onViewVendor }: Props) {
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchBooking = useCallback(async (id: string) => {
    setLoading(true);
    setBooking(null);
    try {
      const data = await getBooking(id);
      setBooking(data);
    } catch {
      // keep empty state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (bookingId) {
      fetchBooking(bookingId);
    }
  }, [bookingId, fetchBooking]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (bookingId) {
      document.addEventListener("keydown", onKey);
      return () => document.removeEventListener("keydown", onKey);
    }
  }, [bookingId, onClose]);

  const isOpen = bookingId !== null;
  const status = statusConfig[booking?.status ?? ""] ?? statusConfig.pending;
  const canCancel = booking && !["cancelled", "completed"].includes(booking.status);

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/30 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      <div
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-md bg-white shadow-2xl transform transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Booking Details</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <FiX className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="overflow-y-auto h-[calc(100%-57px)] px-5 py-5 space-y-5">
          {loading && (
            <div className="flex items-center justify-center py-20">
              <FiLoader className="w-6 h-6 text-rose-400 animate-spin" />
            </div>
          )}

          {!loading && !booking && (
            <div className="text-center py-20 text-sm text-gray-400">
              Booking not found.
            </div>
          )}

          {!loading && booking && (
            <>
              {/* Status badge */}
              <div className={`flex items-center gap-2 p-3 rounded-xl ${status.bg} border ${status.border}`}>
                <span className={status.text}>{status.icon}</span>
                <span className={`text-sm font-medium ${status.text}`}>{status.label}</span>
              </div>

              {/* Vendor info */}
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="w-11 h-11 rounded-lg bg-rose-100 flex items-center justify-center shrink-0 text-rose-600 font-bold text-base">
                  {booking.businessName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-gray-900 truncate">{booking.businessName}</h3>
                  {booking.vendorLocation && (
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                      <FiMapPin className="w-3 h-3 shrink-0" />
                      {booking.vendorLocation}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {booking.vendorRating > 0 && (
                      <span className="flex items-center gap-0.5 text-xs text-amber-600">
                        <FiStar className="w-3 h-3 fill-amber-400 text-amber-400" />
                        {booking.vendorRating.toFixed(1)}
                        {booking.vendorReviewCount > 0 && (
                          <span className="text-gray-400">({booking.vendorReviewCount})</span>
                        )}
                      </span>
                    )}
                    {booking.vendorCategory && booking.vendorCategory.length > 0 && (
                      <span className="text-[10px] text-gray-500 capitalize">
                        {booking.vendorCategory.slice(0, 3).join(", ")}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => onViewVendor?.(booking.vendorProfileId)}
                    className="text-xs text-rose-600 hover:underline mt-1.5 font-medium"
                  >
                    View full profile &rarr;
                  </button>
                </div>
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <FiCalendar className="w-4 h-4 text-gray-400 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Event Date</p>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(booking.eventDate + "T00:00:00").toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <FiTag className="w-4 h-4 text-gray-400 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Service Category</p>
                    <p className="text-sm font-medium text-gray-900 capitalize">{booking.serviceCategory}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <FiClock className="w-4 h-4 text-gray-400 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Booked On</p>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(booking.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Message */}
              {booking.message && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                    <FiMessageSquare className="w-3.5 h-3.5" />
                    Your Message
                  </h4>
                  <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3 whitespace-pre-wrap">
                    {booking.message}
                  </p>
                </div>
              )}

              {/* Decline reason */}
              {booking.declineReason && (
                <div>
                  <h4 className="text-xs font-semibold text-red-700 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                    <FiAlertCircle className="w-3.5 h-3.5" />
                    Decline Reason
                  </h4>
                  <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">
                    {booking.declineReason}
                  </p>
                </div>
              )}

              {/* Cancel button */}
              {canCancel && onCancelBooking && (
                <button
                  onClick={() => onCancelBooking(booking.id, booking.businessName)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm font-medium hover:bg-red-100 transition-colors"
                >
                  <FiXCircle className="w-4 h-4" />
                  Cancel This Booking
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
