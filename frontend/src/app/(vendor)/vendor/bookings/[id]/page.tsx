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
  FiDollarSign,
  FiClock,
} from "react-icons/fi";
import { getBooking, updateBookingStatus, requestPayment } from "@/services/booking.service";
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
  const [requestAmount, setRequestAmount] = useState("");
  const [requestLoading, setRequestLoading] = useState(false);

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

  async function handleRequestPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!booking) return;
    const amount = parseFloat(requestAmount);
    if (!amount || amount <= 0) {
      setError("Please enter a valid amount");
      return;
    }
    setRequestLoading(true);
    setError("");
    try {
      await requestPayment(booking.id, amount);
      await fetchBooking();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to request payment");
    } finally {
      setRequestLoading(false);
    }
  }

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="space-y-8">
        <div className="h-4 w-32 bg-warm-100 rounded animate-pulse" />
        <div className="rounded-2xl border border-warm-200/30 bg-white p-8 sm:p-10 animate-pulse space-y-5">
          <div className="h-7 w-48 bg-warm-100 rounded-lg" />
          <div className="h-4 w-64 bg-warm-100 rounded" />
          <div className="h-24 w-full bg-warm-100 rounded-xl" />
        </div>
        <div className="rounded-2xl border border-warm-200/30 bg-white p-8 sm:p-10 animate-pulse">
          <div className="h-5 w-36 bg-warm-100 rounded mb-5" />
          <div className="h-16 bg-warm-100 rounded-xl" />
        </div>
      </div>
    );
  }

  /* ── Error (no booking) ── */
  if (error && !booking) {
    return (
      <div className="space-y-8">
        <Link
          href="/vendor/bookings"
          className="inline-flex items-center gap-2 text-[13px] text-slate-400 hover:text-slate-600 transition-colors duration-500"
        >
          <FiArrowLeft className="w-3.5 h-3.5" /> Back to Bookings
        </Link>
        <div className="rounded-2xl border border-warm-200/30 bg-white py-20 text-center">
          <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center mx-auto mb-5">
            <FiAlertCircle className="w-6 h-6 text-red-400" />
          </div>
          <p className="text-[15px] font-medium text-slate-600 mb-1">Could not load booking</p>
          <p className="text-[13px] text-slate-400 font-light">{error}</p>
        </div>
      </div>
    );
  }

  if (!booking) return null;

  const showAccept = booking.status === BookingStatus.PENDING;
  const showDecline = booking.status === BookingStatus.PENDING;
  const showComplete = booking.status === BookingStatus.DEPOSIT_PAID;
  const showRequestPayment = booking.status === BookingStatus.ACCEPTED;
  const showPaymentPending = booking.status === BookingStatus.PAYMENT_REQUESTED;

  const eventDate = new Date(booking.eventDate).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-8">
      {/* ── Back link ── */}
      <Link
        href="/vendor/bookings"
        className="inline-flex items-center gap-2 text-[13px] text-slate-400 hover:text-slate-600 transition-colors duration-500"
      >
        <FiArrowLeft className="w-3.5 h-3.5" /> Back to Bookings
      </Link>

      {/* ── Error banner ── */}
      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-red-100 bg-red-50/50 px-5 py-4 text-[13px] text-red-600">
          <FiAlertCircle className="w-4 h-4 shrink-0" />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError("")} className="cursor-pointer text-red-300 hover:text-red-500 transition-colors duration-300">
            <FiX className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Main detail card ── */}
      <section className="rounded-2xl border border-warm-200/50 bg-white p-8 sm:p-10 space-y-8">
        {/* Header + actions */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-editorial text-slate-400 mb-2">
              Booking Request
            </p>
            <h1 className="font-display text-2xl font-bold text-slate-900 tracking-headline">
              {booking.businessName}
            </h1>
          </div>

          {(showAccept || showDecline || showComplete) && (
            <div className="flex items-center gap-2.5 shrink-0">
              {showAccept && (
                <button
                  onClick={handleAccept}
                  disabled={actionLoading}
                  className="cursor-pointer flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-[12px] font-semibold bg-emerald-600 text-white shadow-[0_2px_8px_rgba(5,150,105,0.15)] hover:bg-emerald-700 hover:shadow-[0_4px_16px_rgba(5,150,105,0.25)] disabled:opacity-40 transition-all duration-500"
                >
                  {actionLoading ? (
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <FiCheck className="w-3.5 h-3.5" />
                  )}
                  Accept
                </button>
              )}
              {showDecline && (
                <button
                  onClick={() => setShowDeclineModal(true)}
                  disabled={actionLoading}
                  className="cursor-pointer flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-[12px] font-semibold text-red-500 border border-red-200/60 hover:bg-red-50 hover:border-red-300 disabled:opacity-40 transition-all duration-500"
                >
                  <FiX className="w-3.5 h-3.5" />
                  Decline
                </button>
              )}
              {showComplete && (
                <button
                  onClick={handleComplete}
                  disabled={actionLoading}
                  className="cursor-pointer flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-[12px] font-semibold bg-slate-900 text-white shadow-[0_2px_12px_rgba(15,23,42,0.1)] hover:bg-slate-800 hover:shadow-[0_4px_20px_rgba(15,23,42,0.18)] disabled:opacity-40 transition-all duration-500"
                >
                  {actionLoading ? (
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <FiCheck className="w-3.5 h-3.5" />
                  )}
                  Mark Complete
                </button>
              )}
            </div>
          )}
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 rounded-xl bg-warm-50/60 border border-warm-200/20 px-4 py-3.5">
            <div className="w-9 h-9 rounded-lg bg-white border border-warm-200/40 flex items-center justify-center shrink-0">
              <FiCalendar className="w-4 h-4 text-slate-400" />
            </div>
            <div>
              <p className="text-[11px] text-slate-400 font-light">Event Date</p>
              <p className="text-[14px] font-medium text-slate-700">{eventDate}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-warm-50/60 border border-warm-200/20 px-4 py-3.5">
            <div className="w-9 h-9 rounded-lg bg-white border border-warm-200/40 flex items-center justify-center shrink-0">
              <FiTag className="w-4 h-4 text-slate-400" />
            </div>
            <div>
              <p className="text-[11px] text-slate-400 font-light">Service</p>
              <p className="text-[14px] font-medium text-slate-700 capitalize">{booking.serviceCategory}</p>
            </div>
          </div>
        </div>

        {/* Message */}
        {booking.message && (
          <div className="flex gap-3 rounded-xl bg-warm-50/40 border border-warm-200/20 px-5 py-4">
            <div className="w-9 h-9 rounded-lg bg-white border border-warm-200/40 flex items-center justify-center shrink-0 mt-0.5">
              <FiMessageSquare className="w-4 h-4 text-slate-400" />
            </div>
            <div>
              <p className="text-[11px] text-slate-400 font-light mb-1.5">Message from couple</p>
              <p className="text-[13px] text-slate-600 font-light leading-relaxed italic">
                &ldquo;{booking.message}&rdquo;
              </p>
            </div>
          </div>
        )}

        {/* Decline reason */}
        {booking.declineReason && (
          <div className="rounded-xl bg-red-50/50 border border-red-100 px-5 py-4 space-y-1.5">
            <p className="text-[12px] font-semibold uppercase tracking-luxury text-red-500">Decline Reason</p>
            <p className="text-[13px] text-red-600 font-light leading-relaxed">{booking.declineReason}</p>
          </div>
        )}
      </section>

      {/* ── Request Payment ── */}
      {showRequestPayment && (
        <section className="rounded-2xl border border-warm-200/50 bg-white p-8 sm:p-10 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-warm-50 border border-warm-200/40 flex items-center justify-center">
              <FiDollarSign className="w-4.5 h-4.5 text-slate-400" />
            </div>
            <div>
              <h2 className="text-[15px] font-semibold text-slate-900">Request Payment</h2>
              <p className="text-[11px] text-slate-400 font-light mt-0.5">
                Enter the amount to charge
                {booking.priceRangeMax ? ` · Max ${booking.priceRangeMax.toLocaleString()} ETB` : ""}
              </p>
            </div>
          </div>

          <form onSubmit={handleRequestPayment} className="flex flex-col sm:flex-row items-end gap-3 max-w-lg">
            <div className="flex-1 w-full">
              <label htmlFor="req-amount" className="block text-[12px] font-medium text-slate-500 mb-2">
                Amount (ETB)
              </label>
              <input
                id="req-amount"
                type="number"
                value={requestAmount}
                onChange={(e) => setRequestAmount(e.target.value)}
                min="1"
                max={booking.priceRangeMax ?? undefined}
                step="0.01"
                required
                placeholder={booking.priceRangeMax ? `Up to ${booking.priceRangeMax.toLocaleString()}` : "Enter amount"}
                className="w-full px-4 py-3.5 border border-warm-200/60 rounded-xl text-[14px] text-slate-800 bg-white outline-none transition-all duration-500 placeholder:text-slate-300 focus:border-slate-300 focus:shadow-[0_0_0_3px_rgba(250,248,245,1),0_0_0_5px_rgba(201,168,76,0.15)]"
              />
            </div>
            <button
              type="submit"
              disabled={requestLoading}
              className="cursor-pointer flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-900 text-white rounded-xl text-[13px] font-semibold shadow-[0_2px_12px_rgba(15,23,42,0.1)] hover:bg-slate-800 hover:shadow-[0_4px_20px_rgba(15,23,42,0.18)] transition-all duration-500 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {requestLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Requesting...
                </span>
              ) : (
                <>
                  <FiDollarSign className="w-3.5 h-3.5" />
                  Request Payment
                </>
              )}
            </button>
          </form>
        </section>
      )}

      {/* ── Payment Pending ── */}
      {showPaymentPending && (
        <section className="rounded-2xl border border-amber-200/50 bg-amber-50/30 p-8 sm:p-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-200/40 flex items-center justify-center">
              <FiClock className="w-4.5 h-4.5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-[15px] font-semibold text-amber-800">Payment Requested</h2>
              <p className="text-[13px] text-amber-600 font-light mt-0.5">
                You requested <span className="font-semibold">{booking.requestedAmount?.toLocaleString()} {booking.requestedCurrency ?? "ETB"}</span> — waiting for the couple to pay.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* ── Payment Received ── */}
      {booking.status === BookingStatus.DEPOSIT_PAID && paymentInfo && (
        <section className="rounded-2xl border border-emerald-200/50 bg-emerald-50/30 p-8 sm:p-10 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-200/40 flex items-center justify-center">
              <FiCheckCircle className="w-4.5 h-4.5 text-emerald-600" />
            </div>
            <h2 className="text-[15px] font-semibold text-emerald-800">Deposit Payment Received</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-xl bg-white border border-emerald-200/30 px-4 py-3.5">
              <p className="text-[11px] text-emerald-600 font-light mb-1">Amount</p>
              <p className="text-[15px] font-semibold text-emerald-900">
                {paymentInfo.amount.toLocaleString()} {paymentInfo.currency}
              </p>
            </div>
            <div className="rounded-xl bg-white border border-emerald-200/30 px-4 py-3.5">
              <p className="text-[11px] text-emerald-600 font-light mb-1">Reference</p>
              <p className="text-[13px] font-medium text-emerald-900 font-mono">
                {paymentInfo.chapaRef ?? paymentInfo.txRef}
              </p>
            </div>
            {paymentInfo.paymentMethod && (
              <div className="rounded-xl bg-white border border-emerald-200/30 px-4 py-3.5">
                <p className="text-[11px] text-emerald-600 font-light mb-1">Method</p>
                <p className="text-[13px] font-medium text-emerald-900 capitalize">
                  {paymentInfo.paymentMethod}
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Status Timeline ── */}
      <section className="rounded-2xl border border-warm-200/50 bg-white p-8 sm:p-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-warm-50 border border-warm-200/40 flex items-center justify-center">
            <FiClock className="w-4.5 h-4.5 text-slate-400" />
          </div>
          <h2 className="text-[15px] font-semibold text-slate-900">Status Timeline</h2>
        </div>
        <BookingStatusTimeline
          currentStatus={booking.status}
          createdAt={booking.createdAt}
          updatedAt={booking.updatedAt}
        />
      </section>

      {/* ── Decline modal ── */}
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
