"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  FiArrowLeft,
  FiCalendar,
  FiTag,
  FiMessageSquare,
  FiAlertCircle,
  FiX,
  FiDollarSign,
  FiCheckCircle,
  FiLoader,
} from "react-icons/fi";
import { getBooking, updateBookingStatus } from "@/services/booking.service";
import { BookingStatus, type BookingDetail } from "@/types/booking";
import BookingStatusTimeline from "@/components/booking/booking-status-timeline";
import { getReviewByBooking } from "@/services/review.service";
import { ReviewForm } from "@/components/review/review-form";
import { StarRating } from "@/components/review/star-rating";
import type { Review } from "@/types/review";
import {
  initializePayment,
  verifyPayment,
  getPaymentForBooking,
} from "@/services/payment.service";
import type { Payment } from "@/types/payment";

export default function CoupleBookingDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const bookingId = params.id as string;

  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [existingReview, setExistingReview] = useState<Review | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);

  const [depositAmount, setDepositAmount] = useState("");
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState<Payment | null>(null);
  const verifyAttempted = useRef(false);

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

  const fetchPaymentInfo = useCallback(async () => {
    try {
      const payment = await getPaymentForBooking(bookingId);
      setPaymentInfo(payment);
    } catch {
      // No payment exists yet
    }
  }, [bookingId]);

  useEffect(() => {
    fetchBooking();
  }, [fetchBooking]);

  useEffect(() => {
    if (booking?.status === BookingStatus.COMPLETED) {
      fetchReview();
    }
    if (booking?.status === BookingStatus.DEPOSIT_PAID) {
      fetchPaymentInfo();
    }
  }, [booking?.status, fetchReview, fetchPaymentInfo]);

  useEffect(() => {
    const paymentParam = searchParams.get("payment");
    const txRef = searchParams.get("tx_ref");

    if (paymentParam === "verifying" && txRef && !verifyAttempted.current) {
      verifyAttempted.current = true;
      setVerifying(true);

      verifyPayment(txRef)
        .then((result) => {
          setBooking((prev) =>
            prev ? { ...prev, status: result.booking.status as BookingStatus } : prev,
          );
          setPaymentInfo(result.payment);
          if (result.payment.status === "failed") {
            setError("Payment was not completed. Please try again.");
          }
        })
        .catch((err) => {
          setError(err instanceof Error ? err.message : "Failed to verify payment");
        })
        .finally(() => {
          setVerifying(false);
          window.history.replaceState({}, "", `/bookings/${bookingId}`);
        });
    }
  }, [searchParams, bookingId]);

  async function handlePayDeposit() {
    if (!booking) return;
    const amount = parseFloat(depositAmount);
    if (!amount || amount <= 0) {
      setError("Please enter a valid deposit amount");
      return;
    }

    setPaymentLoading(true);
    setError("");
    try {
      const result = await initializePayment({
        bookingId: booking.id,
        amount,
      });
      window.location.href = result.checkoutUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start payment");
      setPaymentLoading(false);
    }
  }

  async function handleCancel() {
    if (!booking) return;
    const confirmed = window.confirm(
      "Are you sure you want to cancel this booking? This action cannot be undone.",
    );
    if (!confirmed) return;

    setActionLoading(true);
    try {
      await updateBookingStatus(booking.id, BookingStatus.CANCELLED);
      await fetchBooking();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel booking");
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-5 w-32 bg-gray-100 rounded animate-pulse" />
        <div className="bg-white rounded-xl border border-gray-200/80 p-6 animate-pulse space-y-4">
          <div className="h-6 w-48 bg-gray-100 rounded" />
          <div className="h-4 w-64 bg-gray-100 rounded" />
          <div className="h-20 w-full bg-gray-100 rounded" />
        </div>
      </div>
    );
  }

  if (error && !booking) {
    return (
      <div>
        <Link href="/bookings" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <FiArrowLeft className="w-4 h-4" /> Back to Bookings
        </Link>
        <div className="bg-white rounded-xl border border-gray-200/80 p-16 text-center">
          <FiAlertCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-gray-700 mb-1">Could not load booking</h3>
          <p className="text-xs text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  if (!booking) return null;

  const canCancel =
    booking.status === BookingStatus.PENDING ||
    booking.status === BookingStatus.ACCEPTED ||
    booking.status === BookingStatus.DEPOSIT_PAID;

  const showPayDeposit = booking.status === BookingStatus.ACCEPTED;

  const eventDate = new Date(booking.eventDate).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-6">
      <Link href="/bookings" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors">
        <FiArrowLeft className="w-4 h-4" /> Back to Bookings
      </Link>

      {verifying && (
        <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg text-sm">
          <FiLoader className="w-4 h-4 shrink-0 animate-spin" />
          Verifying your payment...
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
          <FiAlertCircle className="w-4 h-4 shrink-0" />
          {error}
          <button className="cursor-pointer ml-auto text-red-400 hover:text-red-600" onClick={() => setError("")}>
            <FiX className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Booking details card */}
      <div className="bg-white rounded-xl border border-gray-200/80 p-6 space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900">
              {booking.businessName}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">Booking Request</p>
          </div>
          {canCancel && (
            <button
              onClick={handleCancel}
              disabled={actionLoading}
              className="cursor-pointer px-4 py-2 rounded-lg text-sm font-medium text-red-600 border border-red-200 hover:bg-red-50 disabled:opacity-50 transition-colors"
            >
              {actionLoading ? "Cancelling..." : "Cancel Booking"}
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-2.5 text-sm text-gray-600">
            <FiCalendar className="w-4 h-4 text-gray-400" />
            <span>{eventDate}</span>
          </div>
          <div className="flex items-center gap-2.5 text-sm text-gray-600">
            <FiTag className="w-4 h-4 text-gray-400" />
            <span className="capitalize">{booking.serviceCategory}</span>
          </div>
        </div>

        {booking.message && (
          <div className="flex gap-2.5">
            <FiMessageSquare className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
            <p className="text-sm text-gray-600">{booking.message}</p>
          </div>
        )}

        {booking.declineReason && (
          <div className="bg-red-50 border border-red-100 rounded-lg px-4 py-3">
            <p className="text-sm font-medium text-red-700 mb-0.5">Decline Reason</p>
            <p className="text-sm text-red-600">{booking.declineReason}</p>
          </div>
        )}
      </div>

      {/* Pay deposit section */}
      {showPayDeposit && (
        <div className="bg-white rounded-xl border border-green-200 p-6 space-y-4">
          <div className="flex items-center gap-2">
            <FiDollarSign className="w-5 h-5 text-green-600" />
            <h2 className="text-sm font-semibold text-gray-900">Pay Deposit</h2>
          </div>
          <p className="text-sm text-gray-500">
            Your booking has been accepted. Pay the deposit to confirm your reservation.
          </p>
          {(booking.priceRangeMin || booking.priceRangeMax) && (
            <p className="text-sm text-gray-600">
              <span className="font-medium">Vendor price range:</span>{" "}
              {booking.priceRangeMin?.toLocaleString() ?? "—"} – {booking.priceRangeMax?.toLocaleString() ?? "—"} ETB
            </p>
          )}
          <div className="flex items-end gap-3 max-w-sm">
            <div className="flex-1">
              <label htmlFor="deposit-amount" className="block text-xs font-medium text-gray-600 mb-1">
                Amount (ETB)
              </label>
              <input
                id="deposit-amount"
                type="number"
                min="1"
                step="0.01"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder="e.g. 5000"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={handlePayDeposit}
              disabled={paymentLoading || !depositAmount}
              className="cursor-pointer px-5 py-2 rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {paymentLoading ? "Redirecting..." : "Pay with Chapa"}
            </button>
          </div>
        </div>
      )}

      {/* Payment confirmation */}
      {booking.status === BookingStatus.DEPOSIT_PAID && paymentInfo && (
        <div className="bg-green-50 rounded-xl border border-green-200 p-6 space-y-3">
          <div className="flex items-center gap-2">
            <FiCheckCircle className="w-5 h-5 text-green-600" />
            <h2 className="text-sm font-semibold text-green-800">Deposit Paid</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            <div>
              <p className="text-xs text-green-600 mb-0.5">Amount</p>
              <p className="font-medium text-green-900">
                {paymentInfo.amount.toLocaleString()} {paymentInfo.currency}
              </p>
            </div>
            <div>
              <p className="text-xs text-green-600 mb-0.5">Reference</p>
              <p className="font-medium text-green-900 font-mono text-xs">
                {paymentInfo.chapaRef ?? paymentInfo.txRef}
              </p>
            </div>
            {paymentInfo.paymentMethod && (
              <div>
                <p className="text-xs text-green-600 mb-0.5">Method</p>
                <p className="font-medium text-green-900 capitalize">
                  {paymentInfo.paymentMethod}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Status timeline */}
      <div className="bg-white rounded-xl border border-gray-200/80 p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Status Timeline</h2>
        <BookingStatusTimeline
          currentStatus={booking.status}
          createdAt={booking.createdAt}
          updatedAt={booking.updatedAt}
        />
      </div>

      {/* Review section */}
      {booking.status === BookingStatus.COMPLETED && (
        <div className="bg-white rounded-xl border border-gray-200/80 p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Your Review</h2>
          {reviewLoading ? (
            <div className="space-y-3 animate-pulse">
              <div className="h-6 w-32 bg-gray-100 rounded" />
              <div className="h-16 w-full bg-gray-100 rounded" />
            </div>
          ) : existingReview ? (
            <div className="space-y-3">
              <StarRating value={existingReview.rating} readonly size="md" />
              {existingReview.comment && (
                <p className="text-sm text-gray-600">{existingReview.comment}</p>
              )}
              <p className="text-xs text-gray-400">
                Submitted on{" "}
                {new Date(existingReview.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          ) : (
            <ReviewForm bookingId={bookingId} onSuccess={fetchReview} />
          )}
        </div>
      )}
    </div>
  );
}
