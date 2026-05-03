"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  FiArrowLeft,
  FiCalendar,
  FiTag,
  FiMessageSquare,
  FiAlertCircle,
  FiX,
  FiCheck,
  FiCheckCircle,
} from "react-icons/fi";
import { getBooking, updateBookingStatus } from "@/services/booking.service";
import { BookingStatus, type BookingDetail } from "@/types/booking";
import BookingStatusTimeline from "@/components/booking/booking-status-timeline";
import DeclineBookingModal from "@/components/booking/decline-booking-modal";
import { getPaymentForBooking } from "@/services/payment.service";
import type { Payment } from "@/types/payment";

export default function VendorBookingDetailPage() {
  const params = useParams();
  const bookingId = params.id as string;

  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState<Payment | null>(null);

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

  const fetchPaymentInfo = useCallback(async () => {
    try {
      const payment = await getPaymentForBooking(bookingId);
      setPaymentInfo(payment);
    } catch {
      // No payment exists
    }
  }, [bookingId]);

  useEffect(() => {
    fetchBooking();
  }, [fetchBooking]);

  useEffect(() => {
    if (booking?.status === BookingStatus.DEPOSIT_PAID) {
      fetchPaymentInfo();
    }
  }, [booking?.status, fetchPaymentInfo]);

  async function handleAccept() {
    if (!booking) return;
    setActionLoading(true);
    try {
      await updateBookingStatus(booking.id, BookingStatus.ACCEPTED);
      await fetchBooking();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to accept booking");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleComplete() {
    if (!booking) return;
    setActionLoading(true);
    try {
      await updateBookingStatus(booking.id, BookingStatus.COMPLETED);
      await fetchBooking();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to complete booking");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDeclineConfirm(_bookingId: string, reason: string) {
    if (!booking) return;
    setActionLoading(true);
    try {
      await updateBookingStatus(booking.id, BookingStatus.DECLINED, reason);
      setShowDeclineModal(false);
      await fetchBooking();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to decline booking");
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
        <Link href="/vendor/bookings" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6">
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

  const showAccept = booking.status === BookingStatus.PENDING;
  const showDecline = booking.status === BookingStatus.PENDING;
  const showComplete =
    booking.status === BookingStatus.ACCEPTED ||
    booking.status === BookingStatus.DEPOSIT_PAID;

  const eventDate = new Date(booking.eventDate).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-6">
      <Link href="/vendor/bookings" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors">
        <FiArrowLeft className="w-4 h-4" /> Back to Bookings
      </Link>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
          <FiAlertCircle className="w-4 h-4 shrink-0" />
          {error}
          <button onClick={() => setError("")} className="ml-auto text-red-400 hover:text-red-600">
            <FiX className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Booking details card */}
      <div className="bg-white rounded-xl border border-gray-200/80 p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-gray-900">Booking Request</h1>
            <p className="text-sm text-gray-500 mt-0.5">{booking.businessName}</p>
          </div>

          {/* Actions */}
          {(showAccept || showDecline || showComplete) && (
            <div className="flex items-center gap-2 shrink-0">
              {showAccept && (
                <button
                  onClick={handleAccept}
                  disabled={actionLoading}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  <FiCheck className="w-4 h-4" />
                  Accept
                </button>
              )}
              {showDecline && (
                <button
                  onClick={() => setShowDeclineModal(true)}
                  disabled={actionLoading}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-red-600 border border-red-200 hover:bg-red-50 disabled:opacity-50 transition-colors"
                >
                  <FiX className="w-4 h-4" />
                  Decline
                </button>
              )}
              {showComplete && (
                <button
                  onClick={handleComplete}
                  disabled={actionLoading}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50 transition-colors"
                >
                  <FiCheck className="w-4 h-4" />
                  Mark Complete
                </button>
              )}
            </div>
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
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Message from couple</p>
              <p className="text-sm text-gray-600">{booking.message}</p>
            </div>
          </div>
        )}

        {booking.declineReason && (
          <div className="bg-red-50 border border-red-100 rounded-lg px-4 py-3">
            <p className="text-sm font-medium text-red-700 mb-0.5">Decline Reason</p>
            <p className="text-sm text-red-600">{booking.declineReason}</p>
          </div>
        )}
      </div>

      {/* Payment received indicator */}
      {booking.status === BookingStatus.DEPOSIT_PAID && paymentInfo && (
        <div className="bg-green-50 rounded-xl border border-green-200 p-6 space-y-3">
          <div className="flex items-center gap-2">
            <FiCheckCircle className="w-5 h-5 text-green-600" />
            <h2 className="text-sm font-semibold text-green-800">Deposit Payment Received</h2>
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

      {/* Decline modal */}
      {showDeclineModal && (
        <DeclineBookingModal
          bookingId={booking.id}
          loading={actionLoading}
          onConfirm={handleDeclineConfirm}
          onCancel={() => setShowDeclineModal(false)}
        />
      )}
    </div>
  );
}
