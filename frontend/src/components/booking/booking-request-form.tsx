"use client";

import { useState } from "react";
import { FiCalendar, FiSend } from "react-icons/fi";
import { createBooking } from "@/services/booking.service";

interface BookingRequestFormProps {
  vendorProfileId: string;
  vendorId: string;
  serviceCategory: string;
  onSuccess: () => void;
}

export default function BookingRequestForm({
  vendorProfileId,
  vendorId,
  serviceCategory,
  onSuccess,
}: BookingRequestFormProps) {
  const [eventDate, setEventDate] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!eventDate) {
      setError("Please select an event date.");
      return;
    }

    if (new Date(eventDate) <= new Date()) {
      setError("Event date must be in the future.");
      return;
    }

    setSubmitting(true);
    try {
      await createBooking({
        vendorProfileId,
        serviceCategory,
        eventDate,
        message: message.trim() || undefined,
      });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-xl border border-gray-200/80 p-6 space-y-5"
    >
      {/* Event Date */}
      <div>
        <label
          htmlFor="eventDate"
          className="block text-sm font-medium text-gray-700 mb-1.5"
        >
          Event Date
        </label>
        <div className="relative">
          <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            id="eventDate"
            type="date"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            min={minDate}
            className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-rose-300 focus:outline-none"
          />
        </div>
      </div>

      {/* Service Category (display only) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Service Category
        </label>
        <input
          type="text"
          value={serviceCategory ? serviceCategory.charAt(0).toUpperCase() + serviceCategory.slice(1) : "General"}
          disabled
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-500"
        />
      </div>

      {/* Message */}
      <div>
        <label
          htmlFor="message"
          className="block text-sm font-medium text-gray-700 mb-1.5"
        >
          Message <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Tell the vendor about your event..."
          rows={4}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-rose-300 focus:outline-none resize-none"
        />
      </div>

      {/* Error */}
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-gray-900 text-white rounded-lg text-sm font-medium py-2.5 hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {submitting ? (
          <span className="animate-pulse">Sending...</span>
        ) : (
          <>
            <FiSend className="w-4 h-4" />
            Send Booking Request
          </>
        )}
      </button>
    </form>
  );
}
