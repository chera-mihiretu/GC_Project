"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  FiCalendar,
  FiClock,
  FiCheck,
  FiX,
  FiAlertCircle,
  FiChevronLeft,
  FiChevronRight,
  FiInbox,
} from "react-icons/fi";
import { listBookings, updateBookingStatus } from "@/services/booking.service";
import { BookingStatus, type Booking } from "@/types/booking";
import type { BookingListResponse } from "@/services/booking.service";
import DeclineBookingModal from "@/components/booking/decline-booking-modal";

const STATUS_TABS = [
  { label: "All", value: undefined },
  { label: "Pending", value: BookingStatus.PENDING },
  { label: "Accepted", value: BookingStatus.ACCEPTED },
  { label: "Declined", value: BookingStatus.DECLINED },
  { label: "Completed", value: BookingStatus.COMPLETED },
  { label: "Cancelled", value: BookingStatus.CANCELLED },
] as const;

const STATUS_BADGE: Record<string, string> = {
  pending: "bg-amber-50 text-amber-600",
  accepted: "bg-green-50 text-green-600",
  declined: "bg-red-50 text-red-600",
  deposit_paid: "bg-blue-50 text-blue-600",
  completed: "bg-gray-100 text-gray-600",
  cancelled: "bg-gray-100 text-gray-400",
};

const PAGE_SIZE = 10;

export default function VendorBookingsPage() {
  const [data, setData] = useState<BookingListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [declineTarget, setDeclineTarget] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await listBookings({
        status: activeTab as BookingStatus | undefined,
        page,
        limit: PAGE_SIZE,
      });
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  }, [activeTab, page]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  function handleTabChange(value: string | undefined) {
    setActiveTab(value);
    setPage(1);
  }

  async function handleAccept(bookingId: string) {
    setActionLoading(bookingId);
    try {
      await updateBookingStatus(bookingId, BookingStatus.ACCEPTED);
      await fetchBookings();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to accept booking");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleComplete(bookingId: string) {
    setActionLoading(bookingId);
    try {
      await updateBookingStatus(bookingId, BookingStatus.COMPLETED);
      await fetchBookings();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to complete booking");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDeclineConfirm(bookingId: string, reason: string) {
    setActionLoading(bookingId);
    try {
      await updateBookingStatus(bookingId, BookingStatus.DECLINED, reason);
      setDeclineTarget(null);
      await fetchBookings();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to decline booking");
    } finally {
      setActionLoading(null);
    }
  }

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 font-display">
          Bookings
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage incoming booking requests and track their status.
        </p>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
          <FiAlertCircle className="w-4 h-4 shrink-0" />
          {error}
          <button
            onClick={() => setError("")}
            className="ml-auto text-red-400 hover:text-red-600"
          >
            <FiX className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Status tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.label}
            onClick={() => handleTabChange(tab.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.value
                ? "bg-gray-900 text-white"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-gray-200/80 p-5 animate-pulse"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="h-5 w-20 bg-gray-100 rounded-full" />
                <div className="h-4 w-32 bg-gray-100 rounded" />
              </div>
              <div className="h-4 w-3/4 bg-gray-100 rounded mb-2" />
              <div className="h-4 w-1/2 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && data && data.data.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200/80 p-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <FiInbox className="w-6 h-6 text-gray-400" />
          </div>
          <h3 className="text-sm font-semibold text-gray-700 mb-1">
            No bookings found
          </h3>
          <p className="text-xs text-gray-400">
            {activeTab
              ? `No ${activeTab} bookings at the moment.`
              : "You haven't received any booking requests yet."}
          </p>
        </div>
      )}

      {/* Booking cards */}
      {!loading && data && data.data.length > 0 && (
        <div className="space-y-4">
          {data.data.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              loading={actionLoading === booking.id}
              onAccept={() => handleAccept(booking.id)}
              onDecline={() => setDeclineTarget(booking.id)}
              onComplete={() => handleComplete(booking.id)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200/80 px-5 py-3">
          <span className="text-sm text-gray-500">
            Page {page} of {totalPages} ({data!.total} total)
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <FiChevronLeft className="w-4 h-4" /> Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next <FiChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Decline modal */}
      {declineTarget && (
        <DeclineBookingModal
          bookingId={declineTarget}
          loading={actionLoading === declineTarget}
          onConfirm={handleDeclineConfirm}
          onCancel={() => setDeclineTarget(null)}
        />
      )}
    </div>
  );
}

function BookingCard({
  booking,
  loading,
  onAccept,
  onDecline,
  onComplete,
}: {
  booking: Booking;
  loading: boolean;
  onAccept: () => void;
  onDecline: () => void;
  onComplete: () => void;
}) {
  const statusClass = STATUS_BADGE[booking.status] ?? "bg-gray-100 text-gray-500";
  const eventDate = new Date(booking.eventDate).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const createdAt = new Date(booking.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const showAccept = booking.status === BookingStatus.PENDING;
  const showDecline = booking.status === BookingStatus.PENDING;
  const showComplete =
    booking.status === BookingStatus.ACCEPTED ||
    booking.status === BookingStatus.DEPOSIT_PAID;

  return (
    <div className="bg-white rounded-xl border border-gray-200/80 p-5 hover:border-gray-300 transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        {/* Left content */}
        <Link href={`/vendor/bookings/${booking.id}`} className="flex-1 min-w-0 space-y-2 cursor-pointer">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-600 capitalize">
              {booking.serviceCategory}
            </span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClass} capitalize`}>
              {booking.status.replace("_", " ")}
            </span>
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span className="flex items-center gap-1.5">
              <FiCalendar className="w-3.5 h-3.5 text-gray-400" />
              {eventDate}
            </span>
            <span className="flex items-center gap-1.5">
              <FiClock className="w-3.5 h-3.5 text-gray-400" />
              Received {createdAt}
            </span>
          </div>

          {booking.message && (
            <p className="text-sm text-gray-500 line-clamp-2">
              &ldquo;{booking.message}&rdquo;
            </p>
          )}

          {booking.declineReason && (
            <p className="text-sm text-red-500">
              Reason: {booking.declineReason}
            </p>
          )}
        </Link>

        {/* Actions */}
        {(showAccept || showDecline || showComplete) && (
          <div className="flex items-center gap-2 shrink-0">
            {showAccept && (
              <button
                onClick={onAccept}
                disabled={loading}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                <FiCheck className="w-4 h-4" />
                Accept
              </button>
            )}
            {showDecline && (
              <button
                onClick={onDecline}
                disabled={loading}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium bg-white text-red-600 border border-red-200 hover:bg-red-50 disabled:opacity-50 transition-colors"
              >
                <FiX className="w-4 h-4" />
                Decline
              </button>
            )}
            {showComplete && (
              <button
                onClick={onComplete}
                disabled={loading}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50 transition-colors"
              >
                <FiCheck className="w-4 h-4" />
                Complete
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
