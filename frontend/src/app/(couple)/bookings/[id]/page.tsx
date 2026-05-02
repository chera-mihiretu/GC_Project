"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  FiArrowLeft,
  FiCalendar,
  FiTag,
  FiMessageSquare,
  FiAlertCircle,
  FiX,
} from "react-icons/fi";
import { getBooking, updateBookingStatus } from "@/services/booking.service";
import { BookingStatus, type BookingDetail } from "@/types/booking";
import BookingStatusTimeline from "@/components/booking/booking-status-timeline";

export default function CoupleBookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.id as string;

  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

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

  useEffect(() => {
    fetchBooking();
  }, [fetchBooking]);

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
    booking.status === BookingStatus.ACCEPTED;

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
              className="px-4 py-2 rounded-lg text-sm font-medium text-red-600 border border-red-200 hover:bg-red-50 disabled:opacity-50 transition-colors"
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

      {/* Status timeline */}
      <div className="bg-white rounded-xl border border-gray-200/80 p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Status Timeline</h2>
        <BookingStatusTimeline
          currentStatus={booking.status}
          createdAt={booking.createdAt}
          updatedAt={booking.updatedAt}
        />
      </div>
    </div>
  );
}
