"use client";

import { useEffect, useState, useCallback } from "react";
import {
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
  FiInbox,
  FiAlertCircle,
  FiX,
  FiTag,
  FiMessageSquare,
  FiArrowLeft,
  FiMapPin,
  FiStar,
  FiExternalLink,
  FiDollarSign,
  FiClock,
} from "react-icons/fi";
import Link from "next/link";
import { listBookings, getBooking, updateBookingStatus } from "@/services/booking.service";
import { BookingStatus, type Booking, type BookingDetail } from "@/types/booking";
import type { BookingListResponse } from "@/services/booking.service";
import BookingStatusTimeline from "@/components/booking/booking-status-timeline";
import { initializePayment } from "@/services/payment.service";
import { getReviewByBooking } from "@/services/review.service";
import { ReviewForm } from "@/components/review/review-form";
import { StarRating } from "@/components/review/star-rating";
import type { Review } from "@/types/review";

const STATUS_TABS = [
  { label: "All", value: undefined },
  { label: "Pending", value: BookingStatus.PENDING },
  { label: "Accepted", value: BookingStatus.ACCEPTED },
  { label: "Payment Req.", value: BookingStatus.PAYMENT_REQUESTED },
  { label: "Declined", value: BookingStatus.DECLINED },
  { label: "Completed", value: BookingStatus.COMPLETED },
  { label: "Cancelled", value: BookingStatus.CANCELLED },
] as const;

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  pending:           { bg: "bg-amber-50",  text: "text-amber-600",  border: "border-amber-200/40", dot: "bg-amber-400" },
  accepted:          { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-200/40", dot: "bg-emerald-400" },
  payment_requested: { bg: "bg-violet-50", text: "text-violet-600", border: "border-violet-200/40", dot: "bg-violet-400" },
  declined:          { bg: "bg-red-50",    text: "text-red-500",    border: "border-red-200/40", dot: "bg-red-400" },
  deposit_paid:      { bg: "bg-blue-50",   text: "text-blue-600",   border: "border-blue-200/40", dot: "bg-blue-400" },
  completed:         { bg: "bg-slate-50",  text: "text-slate-600",  border: "border-slate-200/40", dot: "bg-slate-400" },
  cancelled:         { bg: "bg-slate-50",  text: "text-slate-400",  border: "border-slate-200/30", dot: "bg-slate-300" },
};

const PAGE_SIZE = 10;

function StatusBadge({ status }: { status: string }) {
  const c = STATUS_COLORS[status] ?? STATUS_COLORS.cancelled;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-luxury border ${c.bg} ${c.text} ${c.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {status.replace("_", " ")}
    </span>
  );
}

export default function CoupleBookingsPage() {
  const [data, setData] = useState<BookingListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await listBookings({ status: activeTab as BookingStatus | undefined, page, limit: PAGE_SIZE });
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  }, [activeTab, page]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  function handleTabChange(value: string | undefined) { setActiveTab(value); setPage(1); }

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0;

  return (
    <div className="flex gap-0 h-[calc(100vh-8rem)]">
      {/* ── Left: Booking List ── */}
      <div className={`${selectedBookingId ? "hidden lg:flex" : "flex"} flex-col flex-1 min-w-0 overflow-hidden`}>
        {/* Header */}
        <div className="px-1 mb-5">
          <p className="text-[11px] font-semibold uppercase tracking-editorial text-slate-400 mb-2">Reservations</p>
          <h1 className="font-display text-2xl font-bold text-slate-900 tracking-headline">My Bookings</h1>
          <p className="text-[12px] text-slate-400 font-light mt-1.5">Select a booking to view details</p>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2.5 rounded-2xl border border-red-200/40 bg-red-50/80 px-4 py-3 text-[12px] text-red-600 mx-1 mb-3">
            <div className="w-7 h-7 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
              <FiAlertCircle className="w-3.5 h-3.5 text-red-500" />
            </div>
            <span className="flex-1">{error}</span>
            <button onClick={() => setError("")} className="cursor-pointer text-red-300 hover:text-red-500 transition-colors">
              <FiX className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Status Tabs */}
        <div className="flex gap-1 overflow-x-auto pb-2 px-1 mb-3 scrollbar-hide">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.label}
              onClick={() => handleTabChange(tab.value)}
              className={`cursor-pointer px-3.5 py-2 rounded-xl text-[11px] font-medium whitespace-nowrap transition-all duration-500 ${
                activeTab === tab.value
                  ? "bg-slate-900 text-white"
                  : "bg-warm-50 border border-warm-200/30 text-slate-500 hover:bg-warm-100/60"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto space-y-2 px-1 pb-3">
          {loading && (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-warm-200/30 bg-white p-4 animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-warm-100/60" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3.5 w-28 bg-warm-100/60 rounded-lg" />
                      <div className="h-3 w-40 bg-warm-100/40 rounded-lg" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && data && data.data.length === 0 && (
            <div className="rounded-2xl border border-warm-200/50 bg-white p-12 text-center">
              <div className="w-12 h-12 rounded-xl bg-warm-50 border border-warm-200/40 flex items-center justify-center mx-auto mb-3">
                <FiInbox className="w-5 h-5 text-slate-300" />
              </div>
              <h3 className="text-[14px] font-semibold text-slate-700 mb-1">No bookings found</h3>
              <p className="text-[12px] text-slate-400 font-light">
                {activeTab ? `No ${activeTab} bookings at the moment.` : "You haven\u2019t made any booking requests yet."}
              </p>
            </div>
          )}

          {!loading && data && data.data.map((booking) => (
            <BookingListCard
              key={booking.id}
              booking={booking}
              isSelected={selectedBookingId === booking.id}
              onClick={() => setSelectedBookingId(booking.id)}
            />
          ))}
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-warm-200/20 px-4 py-2.5 mt-auto">
            <span className="text-[11px] text-slate-400 font-light">
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="cursor-pointer w-8 h-8 rounded-lg border border-warm-200/40 bg-white flex items-center justify-center text-slate-400 hover:bg-warm-50 disabled:opacity-30 transition-all duration-500"
              >
                <FiChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="cursor-pointer w-8 h-8 rounded-lg border border-warm-200/40 bg-white flex items-center justify-center text-slate-400 hover:bg-warm-50 disabled:opacity-30 transition-all duration-500"
              >
                <FiChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Right: Detail Panel ── */}
      {selectedBookingId && (
        <div className="flex-1 lg:max-w-md lg:ml-4 flex flex-col min-w-0 overflow-hidden">
          <BookingDetailPanel
            bookingId={selectedBookingId}
            onClose={() => setSelectedBookingId(null)}
            onStatusChange={fetchBookings}
          />
        </div>
      )}

      {/* Empty detail state (desktop) */}
      {!selectedBookingId && data && data.data.length > 0 && (
        <div className="hidden lg:flex flex-1 max-w-md ml-4 items-center justify-center rounded-2xl border border-warm-200/50 bg-white">
          <div className="text-center px-8">
            <div className="w-12 h-12 rounded-xl bg-warm-50 border border-warm-200/30 flex items-center justify-center mx-auto mb-3">
              <FiCalendar className="w-5 h-5 text-slate-300" />
            </div>
            <p className="text-[13px] text-slate-400 font-light">Select a booking to view details</p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Booking List Card ── */

function BookingListCard({ booking, isSelected, onClick }: { booking: Booking; isSelected: boolean; onClick: () => void }) {
  const eventDate = new Date(booking.eventDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const timeAgo = new Date(booking.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return (
    <button
      onClick={onClick}
      className={`cursor-pointer w-full text-left rounded-xl border p-4 transition-all duration-500 ${
        isSelected
          ? "border-gold-400/40 bg-warm-50/60 shadow-[0_4px_16px_rgba(15,23,42,0.04)]"
          : "border-warm-200/40 bg-white hover:border-warm-200/60 hover:shadow-[0_2px_12px_rgba(15,23,42,0.03)]"
      }`}
    >
      <div className="flex items-start gap-3.5">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-warm-50 to-warm-100 border border-warm-200/30 flex items-center justify-center shrink-0 font-display text-[14px] font-bold text-slate-500">
          {(booking.businessName ?? "V").charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-[13px] font-semibold text-slate-900 truncate">
              {booking.businessName ?? "Vendor"}
            </h3>
            <span className="text-[10px] text-slate-300 font-light whitespace-nowrap shrink-0">{timeAgo}</span>
          </div>

          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            <span className="px-2 py-0.5 rounded-lg bg-warm-50 border border-warm-200/30 text-[10px] font-medium text-slate-500 capitalize">
              {booking.serviceCategory}
            </span>
            <StatusBadge status={booking.status} />
          </div>

          <div className="flex items-center gap-3 text-[11px] text-slate-400 font-light mt-2">
            <span className="flex items-center gap-1">
              <FiCalendar className="w-3 h-3 text-slate-300" />
              {eventDate}
            </span>
            {booking.vendorLocation && (
              <span className="flex items-center gap-1 truncate">
                <FiMapPin className="w-3 h-3 text-slate-300" />
                {booking.vendorLocation}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

/* ── Booking Detail Panel ── */

function BookingDetailPanel({ bookingId, onClose, onStatusChange }: { bookingId: string; onClose: () => void; onStatusChange: () => void }) {
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [existingReview, setExistingReview] = useState<Review | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);

  const fetchBooking = useCallback(async () => {
    setLoading(true); setError("");
    try { setBooking(await getBooking(bookingId)); }
    catch (err) { setError(err instanceof Error ? err.message : "Failed to load booking"); }
    finally { setLoading(false); }
  }, [bookingId]);

  const fetchReview = useCallback(async () => {
    setReviewLoading(true);
    try { setExistingReview(await getReviewByBooking(bookingId)); }
    catch { /* non-critical */ }
    finally { setReviewLoading(false); }
  }, [bookingId]);

  useEffect(() => { fetchBooking(); setExistingReview(null); }, [fetchBooking]);
  useEffect(() => { if (booking?.status === BookingStatus.COMPLETED) fetchReview(); }, [booking?.status, fetchReview]);

  async function handleCancel() {
    if (!booking || !window.confirm("Are you sure you want to cancel this booking?")) return;
    setActionLoading(true);
    try { await updateBookingStatus(booking.id, BookingStatus.CANCELLED); await fetchBooking(); onStatusChange(); }
    catch (err) { setError(err instanceof Error ? err.message : "Failed to cancel"); }
    finally { setActionLoading(false); }
  }

  async function handlePayDeposit() {
    if (!booking) return;
    setPaymentLoading(true); setError("");
    try { const result = await initializePayment({ bookingId: booking.id }); window.location.href = result.checkoutUrl; }
    catch (err) { setError(err instanceof Error ? err.message : "Failed to start payment"); }
    finally { setPaymentLoading(false); }
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-warm-200/40 bg-white p-6 h-full animate-pulse space-y-4">
        <div className="h-5 w-32 bg-warm-100/60 rounded-lg" />
        <div className="h-4 w-48 bg-warm-100/40 rounded-lg" />
        <div className="h-24 w-full bg-warm-100/30 rounded-xl" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="rounded-2xl border border-warm-200/40 bg-white p-8 h-full flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-200/40 flex items-center justify-center mb-3">
          <FiAlertCircle className="w-5 h-5 text-red-400" />
        </div>
        <p className="text-[13px] text-slate-500 mb-3">{error || "Booking not found"}</p>
        <button onClick={onClose} className="cursor-pointer text-[12px] font-medium text-gold-500 hover:text-gold-600 transition-colors">Close</button>
      </div>
    );
  }

  const canCancel = [BookingStatus.PENDING, BookingStatus.ACCEPTED, BookingStatus.PAYMENT_REQUESTED, BookingStatus.DEPOSIT_PAID].includes(booking.status);
  const showWaitingForPaymentRequest = booking.status === BookingStatus.ACCEPTED;
  const showPayDeposit = booking.status === BookingStatus.PAYMENT_REQUESTED;

  const eventDate = new Date(booking.eventDate).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  return (
    <div className="rounded-2xl border border-warm-200/40 bg-white h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-warm-200/20">
        <button onClick={onClose} className="cursor-pointer lg:hidden w-8 h-8 rounded-lg bg-warm-50 border border-warm-200/30 flex items-center justify-center text-slate-400 hover:bg-warm-100/60 transition-all">
          <FiArrowLeft className="w-3.5 h-3.5" />
        </button>
        <h2 className="text-[14px] font-semibold text-slate-900 flex-1 truncate">{booking.businessName}</h2>
        <button onClick={onClose} className="cursor-pointer hidden lg:flex w-8 h-8 rounded-lg bg-warm-50 border border-warm-200/30 items-center justify-center text-slate-400 hover:bg-warm-100/60 transition-all">
          <FiX className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Vendor Info */}
        <div className="flex items-start gap-3.5 p-4 rounded-xl bg-warm-50/50 border border-warm-200/20">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-warm-100 to-warm-50 border border-warm-200/30 flex items-center justify-center shrink-0 font-display text-[16px] font-bold text-slate-500">
            {booking.businessName.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-[13px] font-semibold text-slate-900 truncate">{booking.businessName}</h3>
              <Link href={`/vendors/${booking.vendorProfileId}`} className="text-gold-500 hover:text-gold-600 shrink-0 transition-colors" title="View vendor profile">
                <FiExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
            {booking.vendorLocation && (
              <p className="text-[11px] text-slate-400 font-light flex items-center gap-1 mt-0.5">
                <FiMapPin className="w-3 h-3" /> {booking.vendorLocation}
              </p>
            )}
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {booking.vendorRating > 0 && (
                <span className="flex items-center gap-0.5 text-[11px] text-amber-600">
                  <FiStar className="w-3 h-3 fill-amber-400 text-amber-400" />
                  {booking.vendorRating.toFixed(1)}
                  {booking.vendorReviewCount > 0 && <span className="text-slate-400 ml-0.5">({booking.vendorReviewCount})</span>}
                </span>
              )}
              {booking.vendorCategory?.length > 0 && (
                <span className="text-[10px] text-slate-400 font-light capitalize">{booking.vendorCategory.slice(0, 2).join(", ")}</span>
              )}
            </div>
          </div>
        </div>

        {/* Status & Service */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-2.5 py-1 rounded-lg bg-warm-50 border border-warm-200/30 text-[10px] font-medium text-slate-500 capitalize">{booking.serviceCategory}</span>
          <StatusBadge status={booking.status} />
        </div>

        {/* Details */}
        <div className="space-y-3">
          <div className="flex items-center gap-2.5 text-[13px] text-slate-600">
            <div className="w-7 h-7 rounded-lg bg-warm-50 border border-warm-200/20 flex items-center justify-center shrink-0">
              <FiCalendar className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <span>{eventDate}</span>
          </div>
          <div className="flex items-center gap-2.5 text-[13px] text-slate-600">
            <div className="w-7 h-7 rounded-lg bg-warm-50 border border-warm-200/20 flex items-center justify-center shrink-0">
              <FiTag className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <span className="capitalize">{booking.serviceCategory}</span>
          </div>
          {booking.message && (
            <div className="flex gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-warm-50 border border-warm-200/20 flex items-center justify-center shrink-0 mt-0.5">
                <FiMessageSquare className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <p className="text-[13px] text-slate-500 font-light leading-relaxed">{booking.message}</p>
            </div>
          )}
        </div>

        {/* Decline Reason */}
        {booking.declineReason && (
          <div className="rounded-xl border border-red-200/40 bg-red-50/60 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-luxury text-red-500 mb-1">Decline Reason</p>
            <p className="text-[12px] text-red-600 font-light">{booking.declineReason}</p>
          </div>
        )}

        {/* Waiting for payment request */}
        {showWaitingForPaymentRequest && (
          <div className="rounded-xl border border-amber-200/40 bg-amber-50/60 p-4 space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center">
                <FiClock className="w-3.5 h-3.5 text-amber-600" />
              </div>
              <p className="text-[12px] font-semibold text-amber-800">Booking Accepted</p>
            </div>
            <p className="text-[12px] text-amber-700 font-light pl-9">The vendor will send you a payment request shortly.</p>
          </div>
        )}

        {/* Pay deposit */}
        {showPayDeposit && (
          <div className="rounded-xl border border-emerald-200/40 bg-emerald-50/60 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center">
                <FiDollarSign className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <p className="text-[12px] font-semibold text-slate-800">Payment Requested</p>
            </div>
            <div className="rounded-lg bg-white border border-emerald-200/30 px-4 py-3">
              <p className="text-[10px] text-emerald-500 font-medium uppercase tracking-luxury mb-0.5">Amount to pay</p>
              <p className="font-display text-xl font-bold text-slate-900">
                {booking.requestedAmount?.toLocaleString()} <span className="text-[13px] font-normal text-slate-400">{booking.requestedCurrency ?? "ETB"}</span>
              </p>
            </div>
            <button
              onClick={handlePayDeposit}
              disabled={paymentLoading}
              className="cursor-pointer w-full py-3 rounded-xl text-[12px] font-medium bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-all duration-500"
            >
              {paymentLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Redirecting to Chapa...
                </span>
              ) : (
                `Pay ${booking.requestedAmount?.toLocaleString()} ${booking.requestedCurrency ?? "ETB"} with Chapa`
              )}
            </button>
          </div>
        )}

        {/* Timeline */}
        <div className="pt-4 border-t border-warm-200/20">
          <p className="text-[11px] font-semibold uppercase tracking-luxury text-slate-500 mb-3">Status Timeline</p>
          <BookingStatusTimeline currentStatus={booking.status} createdAt={booking.createdAt} updatedAt={booking.updatedAt} />
        </div>

        {/* Review */}
        {booking.status === BookingStatus.COMPLETED && (
          <div className="pt-4 border-t border-warm-200/20">
            <p className="text-[11px] font-semibold uppercase tracking-luxury text-slate-500 mb-3">Your Review</p>
            {reviewLoading ? (
              <div className="space-y-2 animate-pulse">
                <div className="h-5 w-24 bg-warm-100/50 rounded-lg" />
                <div className="h-14 w-full bg-warm-100/30 rounded-lg" />
              </div>
            ) : existingReview ? (
              <div className="space-y-2">
                <StarRating value={existingReview.rating} readonly size="md" />
                {existingReview.comment && <p className="text-[12px] text-slate-500 font-light leading-relaxed">{existingReview.comment}</p>}
                <p className="text-[10px] text-slate-300 font-light">
                  Submitted {new Date(existingReview.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </p>
              </div>
            ) : (
              <ReviewForm bookingId={bookingId} onSuccess={fetchReview} />
            )}
          </div>
        )}
      </div>

      {/* Footer action */}
      {canCancel && (
        <div className="border-t border-warm-200/20 px-5 py-3.5">
          <button
            onClick={handleCancel}
            disabled={actionLoading}
            className="cursor-pointer w-full py-3 rounded-xl text-[12px] font-medium text-red-500 border border-red-200/40 hover:bg-red-50/60 disabled:opacity-40 transition-all duration-500"
          >
            {actionLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-red-200 border-t-red-500 rounded-full animate-spin" />
                Cancelling...
              </span>
            ) : "Cancel Booking"}
          </button>
        </div>
      )}
    </div>
  );
}
