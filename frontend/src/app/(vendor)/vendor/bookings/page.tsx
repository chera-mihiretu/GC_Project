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
  FiArrowRight,
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

const STATUS_BADGE: Record<string, { bg: string; text: string; border: string }> = {
  pending:           { bg: "bg-amber-50",   text: "text-amber-600",   border: "border-amber-200/40" },
  accepted:          { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-200/40" },
  declined:          { bg: "bg-red-50",     text: "text-red-500",     border: "border-red-200/40" },
  payment_requested: { bg: "bg-violet-50",  text: "text-violet-600",  border: "border-violet-200/40" },
  deposit_paid:      { bg: "bg-sky-50",     text: "text-sky-600",     border: "border-sky-200/40" },
  completed:         { bg: "bg-warm-50",    text: "text-slate-600",   border: "border-warm-200/30" },
  cancelled:         { bg: "bg-warm-50",    text: "text-slate-400",   border: "border-warm-200/30" },
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
    <div className="space-y-10">
      {/* ── Header ── */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-editorial text-slate-400 mb-2">
          Management
        </p>
        <h1 className="font-display text-3xl font-bold text-slate-900 tracking-headline">
          Bookings
        </h1>
        <p className="text-[14px] text-slate-400 font-light mt-2">
          Manage incoming requests and track their progress
        </p>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-red-100 bg-red-50/50 px-5 py-4 text-[13px] text-red-600">
          <FiAlertCircle className="w-4 h-4 shrink-0" />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError("")} className="cursor-pointer text-red-300 hover:text-red-500 transition-colors duration-300">
            <FiX className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Status tabs — segmented control ── */}
      <div className="rounded-2xl bg-warm-50/60 border border-warm-200/30 p-1.5 flex gap-1 overflow-x-auto">
        {STATUS_TABS.map((tab) => {
          const isActive = activeTab === tab.value;
          return (
            <button
              key={tab.label}
              onClick={() => handleTabChange(tab.value)}
              className={`cursor-pointer px-4 py-2.5 rounded-xl text-[13px] font-medium whitespace-nowrap transition-all duration-500 ${
                isActive
                  ? "bg-white text-slate-900 shadow-[0_1px_4px_rgba(15,23,42,0.06)]"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-warm-200/30 bg-white p-6 sm:p-8 animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-6 w-20 bg-warm-100 rounded-lg" />
                <div className="h-6 w-16 bg-warm-100 rounded-lg" />
              </div>
              <div className="h-4 w-3/4 bg-warm-100 rounded mb-3" />
              <div className="h-4 w-1/2 bg-warm-100 rounded" />
            </div>
          ))}
        </div>
      )}

      {/* ── Empty state ── */}
      {!loading && data && data.data.length === 0 && (
        <div className="rounded-2xl border border-warm-200/30 bg-white py-20 text-center">
          <div className="w-14 h-14 rounded-2xl bg-warm-50 border border-warm-200/40 flex items-center justify-center mx-auto mb-5">
            <FiInbox className="w-6 h-6 text-slate-300" />
          </div>
          <p className="text-[15px] font-medium text-slate-500 mb-1">
            No bookings found
          </p>
          <p className="text-[13px] text-slate-400 font-light">
            {activeTab
              ? `No ${activeTab.replace("_", " ")} bookings at the moment.`
              : "You haven\u2019t received any booking requests yet."}
          </p>
        </div>
      )}

      {/* ── Booking cards ── */}
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

      {/* ── Pagination ── */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between rounded-2xl border border-warm-200/30 bg-white px-6 sm:px-8 py-4">
          <span className="text-[13px] text-slate-400 font-light">
            Page <span className="text-slate-600 font-medium">{page}</span> of{" "}
            <span className="text-slate-600 font-medium">{totalPages}</span>
            <span className="hidden sm:inline ml-1.5">· {data!.total} total</span>
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="cursor-pointer flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-medium text-slate-600 border border-warm-200/60 hover:border-warm-200 hover:bg-warm-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-500"
            >
              <FiChevronLeft className="w-3.5 h-3.5" /> Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="cursor-pointer flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-medium text-slate-600 border border-warm-200/60 hover:border-warm-200 hover:bg-warm-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-500"
            >
              Next <FiChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ── Decline modal ── */}
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

/* ────────────────────── Booking Card ────────────────────── */

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
  const badge = STATUS_BADGE[booking.status] ?? { bg: "bg-warm-50", text: "text-slate-500", border: "border-warm-200/30" };
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
    <div className={`group relative rounded-2xl border bg-white transition-all duration-500 hover:shadow-[0_4px_20px_rgba(15,23,42,0.04)] ${
      loading ? "opacity-50 pointer-events-none" : "border-warm-200/50 hover:border-warm-200"
    }`}>
      <div className="p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5">
          {/* Left — clickable region */}
          <Link href={`/vendor/bookings/${booking.id}`} className="flex-1 min-w-0 space-y-3.5 cursor-pointer">
            {/* Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-semibold uppercase tracking-luxury px-2.5 py-1 rounded-lg border bg-warm-50 text-slate-600 border-warm-200/30 capitalize">
                {booking.serviceCategory}
              </span>
              <span className={`text-[10px] font-semibold uppercase tracking-luxury px-2.5 py-1 rounded-lg border ${badge.bg} ${badge.text} ${badge.border} capitalize`}>
                {booking.status.replace("_", " ")}
              </span>
            </div>

            {/* Meta row */}
            <div className="flex items-center gap-5 text-[13px] text-slate-500">
              <span className="flex items-center gap-2">
                <FiCalendar className="w-3.5 h-3.5 text-slate-400" />
                {eventDate}
              </span>
              <span className="flex items-center gap-2">
                <FiClock className="w-3.5 h-3.5 text-slate-400" />
                {createdAt}
              </span>
            </div>

            {/* Message */}
            {booking.message && (
              <p className="text-[13px] text-slate-400 font-light line-clamp-2 leading-relaxed italic">
                &ldquo;{booking.message}&rdquo;
              </p>
            )}

            {/* Decline reason */}
            {booking.declineReason && (
              <div className="flex items-start gap-2 rounded-xl bg-red-50/50 border border-red-100 px-4 py-3">
                <FiAlertCircle className="w-3.5 h-3.5 text-red-400 mt-0.5 shrink-0" />
                <p className="text-[12px] text-red-500 font-light">{booking.declineReason}</p>
              </div>
            )}

            {/* View arrow */}
            <span className="inline-flex items-center gap-1.5 text-[12px] text-slate-300 font-medium group-hover:text-slate-500 transition-colors duration-500">
              View details
              <FiArrowRight className="w-3 h-3 transition-transform duration-500 group-hover:translate-x-1" />
            </span>
          </Link>

          {/* Right — actions */}
          {(showAccept || showDecline || showComplete) && (
            <div className="flex items-center gap-2.5 shrink-0 sm:pt-1">
              {showAccept && (
                <button
                  onClick={onAccept}
                  disabled={loading}
                  className="cursor-pointer flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[12px] font-semibold bg-emerald-600 text-white shadow-[0_2px_8px_rgba(5,150,105,0.15)] hover:bg-emerald-700 hover:shadow-[0_4px_16px_rgba(5,150,105,0.25)] disabled:opacity-40 transition-all duration-500"
                >
                  <FiCheck className="w-3.5 h-3.5" />
                  Accept
                </button>
              )}
              {showDecline && (
                <button
                  onClick={onDecline}
                  disabled={loading}
                  className="cursor-pointer flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[12px] font-semibold text-red-500 border border-red-200/60 hover:bg-red-50 hover:border-red-300 disabled:opacity-40 transition-all duration-500"
                >
                  <FiX className="w-3.5 h-3.5" />
                  Decline
                </button>
              )}
              {showComplete && (
                <button
                  onClick={onComplete}
                  disabled={loading}
                  className="cursor-pointer flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[12px] font-semibold bg-slate-900 text-white shadow-[0_2px_12px_rgba(15,23,42,0.1)] hover:bg-slate-800 hover:shadow-[0_4px_20px_rgba(15,23,42,0.18)] disabled:opacity-40 transition-all duration-500"
                >
                  <FiCheck className="w-3.5 h-3.5" />
                  Complete
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
