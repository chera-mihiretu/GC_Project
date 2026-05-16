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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-[0_20px_60px_rgba(15,23,42,0.15)] w-full max-w-md p-8 sm:p-10 space-y-6 animate-scale-reveal">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center">
              <FiAlertTriangle className="w-4.5 h-4.5 text-red-400" />
            </div>
            <div>
              <h2 className="font-display text-lg font-semibold text-slate-900">
                Decline Booking
              </h2>
              <p className="text-[11px] text-slate-400 font-light mt-0.5">
                The couple will be notified
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="cursor-pointer w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-slate-500 hover:bg-warm-50 transition-all duration-500"
          >
            <FiX className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="decline-reason"
              className="block text-[12px] font-medium text-slate-500 mb-2"
            >
              Reason for declining
            </label>
            <textarea
              id="decline-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Fully booked on that date, unavailable for this service type..."
              rows={4}
              className="w-full px-4 py-3.5 border border-warm-200/60 rounded-xl text-[14px] text-slate-800 bg-white outline-none transition-all duration-500 placeholder:text-slate-300 resize-none focus:border-slate-300 focus:shadow-[0_0_0_3px_rgba(250,248,245,1),0_0_0_5px_rgba(220,38,38,0.1)]"
              disabled={loading}
            />
            {error && (
              <p className="text-[12px] text-red-500 font-light mt-2">{error}</p>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="cursor-pointer flex-1 py-3 rounded-xl text-[13px] font-semibold text-slate-600 border border-warm-200/60 hover:bg-warm-50 hover:border-warm-200 disabled:opacity-40 transition-all duration-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="cursor-pointer flex-1 py-3 rounded-xl text-[13px] font-semibold text-white bg-red-600 shadow-[0_2px_12px_rgba(220,38,38,0.15)] hover:bg-red-700 hover:shadow-[0_4px_20px_rgba(220,38,38,0.25)] disabled:opacity-40 transition-all duration-500"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Declining...
                </span>
              ) : (
                "Decline Booking"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
