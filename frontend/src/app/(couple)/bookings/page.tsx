"use client";

import { useEffect, useState, useCallback } from "react";
import {
  FiCalendar,
  FiClock,
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

const STATUS_BADGE: Record<string, string> = {
  pending: "bg-amber-50 text-amber-600",
  accepted: "bg-green-50 text-green-600",
  payment_requested: "bg-purple-50 text-purple-600",
  declined: "bg-red-50 text-red-600",
  deposit_paid: "bg-blue-50 text-blue-600",
  completed: "bg-gray-100 text-gray-600",
  cancelled: "bg-gray-100 text-gray-400",
};

const PAGE_SIZE = 10;

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

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0;

  return (
    <div className="flex gap-0 h-[calc(100vh-8rem)]">
      {/* Left: Booking list */}
      <div className={`${selectedBookingId ? "hidden lg:flex" : "flex"} flex-col flex-1 min-w-0 overflow-hidden`}>
        <div className="px-1 mb-4">
          <h1 className="text-2xl font-bold text-gray-900 font-display">
            My Bookings
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Click a booking to view details.
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm mx-1 mb-3">
            <FiAlertCircle className="w-4 h-4 shrink-0" />
            {error}
            <button onClick={() => setError("")} className="ml-auto text-red-400 hover:text-red-600">
              <FiX className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="flex gap-1 overflow-x-auto pb-2 px-1 mb-3 scrollbar-hide">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.label}
              onClick={() => handleTabChange(tab.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.value
                  ? "bg-gray-900 text-white"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 px-1 pb-3">
          {loading && (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-200/80 p-4 animate-pulse">
                  <div className="h-4 w-32 bg-gray-100 rounded mb-2" />
                  <div className="h-3 w-48 bg-gray-100 rounded" />
                </div>
              ))}
            </div>
          )}

          {!loading && data && data.data.length === 0 && (
            <div className="bg-white rounded-xl border border-gray-200/80 p-12 text-center">
              <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <FiInbox className="w-5 h-5 text-gray-400" />
              </div>
              <h3 className="text-sm font-semibold text-gray-700 mb-1">No bookings found</h3>
              <p className="text-xs text-gray-400">
                {activeTab
                  ? `No ${activeTab} bookings at the moment.`
                  : "You haven't made any booking requests yet."}
              </p>
            </div>
          )}

          {!loading && data && data.data.length > 0 && (
            <>
              {data.data.map((booking) => (
                <BookingListCard
                  key={booking.id}
                  booking={booking}
                  isSelected={selectedBookingId === booking.id}
                  onClick={() => setSelectedBookingId(booking.id)}
                />
              ))}
            </>
          )}
        </div>

        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between bg-white border-t border-gray-100 px-4 py-2 mt-auto">
            <span className="text-xs text-gray-500">
              Page {page}/{totalPages}
            </span>
            <div className="flex gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded-lg text-gray-500 border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <FiChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-1.5 rounded-lg text-gray-500 border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <FiChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Right: Detail panel */}
      {selectedBookingId && (
        <div className="flex-1 lg:max-w-md lg:ml-4 flex flex-col min-w-0 overflow-hidden">
          <BookingDetailPanel
            bookingId={selectedBookingId}
            onClose={() => setSelectedBookingId(null)}
            onStatusChange={fetchBookings}
          />
        </div>
      )}

      {/* Empty state when no booking selected (desktop only) */}
      {!selectedBookingId && data && data.data.length > 0 && (
        <div className="hidden lg:flex flex-1 max-w-md ml-4 items-center justify-center bg-white rounded-xl border border-gray-200/80">
          <div className="text-center px-6">
            <FiCalendar className="w-8 h-8 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-400">Select a booking to view details</p>
          </div>
        </div>
      )}
    </div>
  );
}

function BookingListCard({
  booking,
  isSelected,
  onClick,
}: {
  booking: Booking;
  isSelected: boolean;
  onClick: () => void;
}) {
  const statusClass = STATUS_BADGE[booking.status] ?? "bg-gray-100 text-gray-500";
  const eventDate = new Date(booking.eventDate).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <button
      onClick={onClick}
      className={`w-full text-left bg-white rounded-xl border p-4 transition-all ${
        isSelected
          ? "border-rose-300 ring-2 ring-rose-100 shadow-sm"
          : "border-gray-200/80 hover:border-gray-300 hover:shadow-sm"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center shrink-0 text-rose-500 font-bold text-sm">
          {(booking.businessName ?? "V").charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-900 truncate">
            {booking.businessName ?? "Vendor"}
          </h3>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-50 text-blue-600 capitalize">
              {booking.serviceCategory}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${statusClass} capitalize`}>
              {booking.status.replace("_", " ")}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-500 mt-1.5">
            <span className="flex items-center gap-1">
              <FiCalendar className="w-3 h-3" />
              {eventDate}
            </span>
            {booking.vendorLocation && (
              <span className="flex items-center gap-1 truncate">
                <FiMapPin className="w-3 h-3" />
                {booking.vendorLocation}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

function BookingDetailPanel({
  bookingId,
  onClose,
  onStatusChange,
}: {
  bookingId: string;
  onClose: () => void;
  onStatusChange: () => void;
}) {
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [existingReview, setExistingReview] = useState<Review | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);

  const fetchBooking = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getBooking(bookingId);
      setBooking(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load booking");
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  const fetchReview = useCallback(async () => {
    setReviewLoading(true);
    try {
      const review = await getReviewByBooking(bookingId);
      setExistingReview(review);
    } catch {
      // Non-critical
    } finally {
      setReviewLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    fetchBooking();
    setExistingReview(null);
  }, [fetchBooking]);

  useEffect(() => {
    if (booking?.status === BookingStatus.COMPLETED) {
      fetchReview();
    }
  }, [booking?.status, fetchReview]);

  async function handleCancel() {
    if (!booking) return;
    const confirmed = window.confirm(
      "Are you sure you want to cancel this booking?",
    );
    if (!confirmed) return;

    setActionLoading(true);
    try {
      await updateBookingStatus(booking.id, BookingStatus.CANCELLED);
      await fetchBooking();
      onStatusChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel");
    } finally {
      setActionLoading(false);
    }
  }

  async function handlePayDeposit() {
    if (!booking) return;
    setPaymentLoading(true);
    setError("");
    try {
      const result = await initializePayment({ bookingId: booking.id });
      window.location.href = result.checkoutUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start payment");
    } finally {
      setPaymentLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200/80 p-5 h-full animate-pulse space-y-4">
        <div className="h-5 w-32 bg-gray-100 rounded" />
        <div className="h-4 w-48 bg-gray-100 rounded" />
        <div className="h-20 w-full bg-gray-100 rounded" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="bg-white rounded-xl border border-gray-200/80 p-6 h-full flex flex-col items-center justify-center">
        <FiAlertCircle className="w-6 h-6 text-red-400 mb-2" />
        <p className="text-sm text-gray-500">{error || "Booking not found"}</p>
        <button onClick={onClose} className="mt-3 text-sm text-rose-600 hover:underline">
          Close
        </button>
      </div>
    );
  }

  const canCancel =
    booking.status === BookingStatus.PENDING ||
    booking.status === BookingStatus.ACCEPTED ||
    booking.status === BookingStatus.PAYMENT_REQUESTED ||
    booking.status === BookingStatus.DEPOSIT_PAID;

  const showWaitingForPaymentRequest = booking.status === BookingStatus.ACCEPTED;
  const showPayDeposit = booking.status === BookingStatus.PAYMENT_REQUESTED;

  const eventDate = new Date(booking.eventDate).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="bg-white rounded-xl border border-gray-200/80 h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
        <button
          onClick={onClose}
          className="lg:hidden p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
        >
          <FiArrowLeft className="w-4 h-4" />
        </button>
        <h2 className="text-sm font-semibold text-gray-900 flex-1 truncate">
          {booking.businessName}
        </h2>
        <button
          onClick={onClose}
          className="hidden lg:block p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
        >
          <FiX className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Vendor info section */}
        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
          <div className="w-11 h-11 rounded-lg bg-rose-100 flex items-center justify-center shrink-0 text-rose-600 font-bold text-base">
            {booking.businessName.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-gray-900 truncate">{booking.businessName}</h3>
              <Link
                href={`/vendors/${booking.vendorProfileId}`}
                className="text-rose-500 hover:text-rose-600 shrink-0"
                title="View vendor profile"
              >
                <FiExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
            {booking.vendorLocation && (
              <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                <FiMapPin className="w-3 h-3" />
                {booking.vendorLocation}
              </p>
            )}
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {booking.vendorRating !== undefined && booking.vendorRating > 0 && (
                <span className="flex items-center gap-0.5 text-xs text-amber-600">
                  <FiStar className="w-3 h-3 fill-amber-400 text-amber-400" />
                  {booking.vendorRating.toFixed(1)}
                  {booking.vendorReviewCount !== undefined && (
                    <span className="text-gray-400 ml-0.5">({booking.vendorReviewCount})</span>
                  )}
                </span>
              )}
              {booking.vendorCategory && booking.vendorCategory.length > 0 && (
                <span className="text-[10px] text-gray-500 capitalize">
                  {booking.vendorCategory.slice(0, 2).join(", ")}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Status badge */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-600 capitalize">
            {booking.serviceCategory}
          </span>
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_BADGE[booking.status] ?? "bg-gray-100 text-gray-500"} capitalize`}>
            {booking.status.replace("_", " ")}
          </span>
        </div>

        {/* Details */}
        <div className="space-y-3">
          <div className="flex items-center gap-2.5 text-sm text-gray-600">
            <FiCalendar className="w-4 h-4 text-gray-400 shrink-0" />
            <span>{eventDate}</span>
          </div>
          <div className="flex items-center gap-2.5 text-sm text-gray-600">
            <FiTag className="w-4 h-4 text-gray-400 shrink-0" />
            <span className="capitalize">{booking.serviceCategory}</span>
          </div>
          {booking.message && (
            <div className="flex gap-2.5">
              <FiMessageSquare className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
              <p className="text-sm text-gray-600">{booking.message}</p>
            </div>
          )}
        </div>

        {booking.declineReason && (
          <div className="bg-red-50 border border-red-100 rounded-lg px-3 py-2.5">
            <p className="text-xs font-medium text-red-700 mb-0.5">Decline Reason</p>
            <p className="text-xs text-red-600">{booking.declineReason}</p>
          </div>
        )}

        {/* Waiting for vendor to request payment */}
        {showWaitingForPaymentRequest && (
          <div className="bg-amber-50 rounded-lg border border-amber-200 p-3 space-y-1">
            <div className="flex items-center gap-1.5">
              <FiDollarSign className="w-4 h-4 text-amber-600" />
              <p className="text-xs font-semibold text-amber-800">Booking Accepted</p>
            </div>
            <p className="text-xs text-amber-700">The vendor will send you a payment request shortly.</p>
          </div>
        )}

        {/* Pay deposit — vendor has requested payment */}
        {showPayDeposit && (
          <div className="bg-green-50 rounded-lg border border-green-200 p-3 space-y-3">
            <div className="flex items-center gap-1.5">
              <FiDollarSign className="w-4 h-4 text-green-600" />
              <p className="text-xs font-semibold text-gray-900">Payment Requested</p>
            </div>
            <div className="bg-white border border-green-100 rounded-md px-3 py-2">
              <p className="text-[10px] text-green-600 mb-0.5">Amount to pay</p>
              <p className="text-lg font-bold text-green-900">
                {booking.requestedAmount?.toLocaleString()} {booking.requestedCurrency ?? "ETB"}
              </p>
            </div>
            <button
              onClick={handlePayDeposit}
              disabled={paymentLoading}
              className="w-full py-2 rounded-lg text-xs font-medium bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {paymentLoading ? "Redirecting to Chapa..." : `Pay ${booking.requestedAmount?.toLocaleString()} ${booking.requestedCurrency ?? "ETB"} with Chapa`}
            </button>
          </div>
        )}

        {/* Status timeline */}
        <div className="pt-3 border-t border-gray-100">
          <h3 className="text-xs font-semibold text-gray-700 mb-3">Status Timeline</h3>
          <BookingStatusTimeline
            currentStatus={booking.status}
            createdAt={booking.createdAt}
            updatedAt={booking.updatedAt}
          />
        </div>

        {/* Review section */}
        {booking.status === BookingStatus.COMPLETED && (
          <div className="pt-3 border-t border-gray-100">
            <h3 className="text-xs font-semibold text-gray-700 mb-3">Your Review</h3>
            {reviewLoading ? (
              <div className="space-y-2 animate-pulse">
                <div className="h-5 w-24 bg-gray-100 rounded" />
                <div className="h-12 w-full bg-gray-100 rounded" />
              </div>
            ) : existingReview ? (
              <div className="space-y-2">
                <StarRating value={existingReview.rating} readonly size="md" />
                {existingReview.comment && (
                  <p className="text-xs text-gray-600">{existingReview.comment}</p>
                )}
                <p className="text-[10px] text-gray-400">
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
        <div className="border-t border-gray-100 px-4 py-3">
          <button
            onClick={handleCancel}
            disabled={actionLoading}
            className="w-full py-2.5 rounded-lg text-sm font-medium text-red-600 border border-red-200 hover:bg-red-50 disabled:opacity-50 transition-colors"
          >
            {actionLoading ? "Cancelling..." : "Cancel Booking"}
          </button>
        </div>
      )}
    </div>
  );
}
