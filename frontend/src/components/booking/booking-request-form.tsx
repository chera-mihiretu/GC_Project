"use client";

import { useState, useEffect, useCallback } from "react";
import { FiChevronLeft, FiChevronRight, FiSend } from "react-icons/fi";
import { createBooking } from "@/services/booking.service";
import {
  getVendorAvailability,
  type AvailabilityRange,
} from "@/services/availability.service";

interface BookingRequestFormProps {
  vendorProfileId: string;
  vendorId: string;
  serviceCategory: string;
  onSuccess: () => void;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number): number {
  return new Date(year, month - 1, 1).getDay();
}

function toDateString(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function isDateInRanges(date: string, ranges: AvailabilityRange[]): boolean {
  return ranges.some((r) => date >= r.startDate && date <= r.endDate);
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

  const today = new Date();
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth() + 1);
  const [availability, setAvailability] = useState<AvailabilityRange[]>([]);
  const [loadingAvail, setLoadingAvail] = useState(true);

  const fetchAvailability = useCallback(async () => {
    setLoadingAvail(true);
    try {
      const monthStr = `${calYear}-${String(calMonth).padStart(2, "0")}`;
      const data = await getVendorAvailability(vendorProfileId, monthStr);
      setAvailability(data);
    } catch {
      setAvailability([]);
    } finally {
      setLoadingAvail(false);
    }
  }, [vendorProfileId, calYear, calMonth]);

  useEffect(() => {
    fetchAvailability();
  }, [fetchAvailability]);

  function goNextMonth() {
    if (calMonth === 12) {
      setCalYear((y) => y + 1);
      setCalMonth(1);
    } else {
      setCalMonth((m) => m + 1);
    }
  }

  function goPrevMonth() {
    const nowYear = today.getFullYear();
    const nowMonth = today.getMonth() + 1;
    if (calYear === nowYear && calMonth === nowMonth) return;
    if (calMonth === 1) {
      setCalYear((y) => y - 1);
      setCalMonth(12);
    } else {
      setCalMonth((m) => m - 1);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!eventDate) {
      setError("Please select an available date.");
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

  const daysInMonth = getDaysInMonth(calYear, calMonth);
  const firstDay = getFirstDayOfWeek(calYear, calMonth);
  const todayStr = toDateString(today.getFullYear(), today.getMonth() + 1, today.getDate());
  const monthLabel = new Date(calYear, calMonth - 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
  const isPrevDisabled =
    calYear === today.getFullYear() && calMonth === today.getMonth() + 1;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Calendar date picker */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Event Date
        </label>
        <div className="border border-gray-200 rounded-xl p-4">
          {/* Month nav */}
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={goPrevMonth}
              disabled={isPrevDisabled}
              className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <FiChevronLeft className="w-4 h-4 text-gray-600" />
            </button>
            <span className="text-sm font-medium text-gray-900">{monthLabel}</span>
            <button
              type="button"
              onClick={goNextMonth}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <FiChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-0.5 mb-1">
            {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
              <div key={i} className="text-center text-[10px] font-medium text-gray-400 py-0.5">
                {d}
              </div>
            ))}
          </div>

          {/* Days */}
          {loadingAvail ? (
            <div className="h-40 flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-0.5">
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`e-${i}`} />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dateStr = toDateString(calYear, calMonth, day);
                const isPast = dateStr <= todayStr;
                const isAvailable = isDateInRanges(dateStr, availability);
                const isSelected = eventDate === dateStr;
                const canClick = !isPast && isAvailable;

                let cellClass =
                  "w-full aspect-square flex items-center justify-center rounded-md text-xs transition-all ";

                if (isSelected) {
                  cellClass += "bg-rose-500 text-white font-semibold";
                } else if (isPast) {
                  cellClass += "text-gray-300 cursor-not-allowed";
                } else if (isAvailable) {
                  cellClass += "bg-green-50 text-green-700 font-medium cursor-pointer hover:bg-green-100";
                } else {
                  cellClass += "text-gray-300 cursor-not-allowed";
                }

                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => canClick && setEventDate(dateStr)}
                    disabled={!canClick}
                    className={cellClass}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          )}

          {/* Legend */}
          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-1 text-[10px] text-gray-400">
              <div className="w-2.5 h-2.5 rounded bg-green-50 border border-green-200" />
              Available
            </div>
            <div className="flex items-center gap-1 text-[10px] text-gray-400">
              <div className="w-2.5 h-2.5 rounded bg-gray-100 border border-gray-200" />
              Unavailable
            </div>
          </div>

          {eventDate && (
            <p className="text-xs text-gray-600 mt-2">
              Selected:{" "}
              <span className="font-medium">
                {new Date(eventDate + "T00:00:00").toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </p>
          )}
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
      {error && <p className="text-sm text-red-500">{error}</p>}

      {/* Submit */}
      <button
        type="submit"
        disabled={submitting || !eventDate}
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
