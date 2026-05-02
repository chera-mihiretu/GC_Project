"use client";

import { useState } from "react";
import { FiX, FiAlertTriangle } from "react-icons/fi";

interface DeclineBookingModalProps {
  bookingId: string;
  loading: boolean;
  onConfirm: (bookingId: string, reason: string) => void;
  onCancel: () => void;
}

export default function DeclineBookingModal({
  bookingId,
  loading,
  onConfirm,
  onCancel,
}: DeclineBookingModalProps) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = reason.trim();
    if (trimmed.length < 10) {
      setError("Please provide a reason (at least 10 characters).");
      return;
    }
    setError("");
    onConfirm(bookingId, trimmed);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center">
              <FiAlertTriangle className="w-4 h-4 text-red-500" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              Decline Booking
            </h2>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-gray-500">
          Please provide a reason for declining this booking. The couple will be
          notified with your response.
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="decline-reason"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              Reason for declining
            </label>
            <textarea
              id="decline-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Fully booked on that date, unavailable for this service type..."
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-200 focus:border-red-400 focus:outline-none resize-none"
              disabled={loading}
            />
            {error && (
              <p className="text-xs text-red-500 mt-1">{error}</p>
            )}
          </div>

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {loading ? "Declining..." : "Decline Booking"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
