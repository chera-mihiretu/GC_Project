"use client";

import { useEffect, useState, useCallback } from "react";
import {
  FiChevronLeft,
  FiChevronRight,
  FiPlus,
  FiTrash2,
  FiAlertCircle,
  FiCalendar,
} from "react-icons/fi";
import {
  getMyAvailability,
  addAvailability,
  removeAvailability,
  type AvailabilityRange,
} from "@/services/availability.service";

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number): number {
  return new Date(year, month - 1, 1).getDay();
}

function formatDate(d: string): string {
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function isDateInRange(date: string, ranges: AvailabilityRange[]): boolean {
  return ranges.some((r) => date >= r.startDate && date <= r.endDate);
}

function toDateString(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export default function VendorAvailabilityPage() {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1);
  const [ranges, setRanges] = useState<AvailabilityRange[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const [selectStart, setSelectStart] = useState<string | null>(null);
  const [selectEnd, setSelectEnd] = useState<string | null>(null);
  const [note, setNote] = useState("");

  const fetchRanges = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getMyAvailability();
      setRanges(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load availability");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRanges();
  }, [fetchRanges]);

  function goNextMonth() {
    if (currentMonth === 12) {
      setCurrentYear((y) => y + 1);
      setCurrentMonth(1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  }

  function goPrevMonth() {
    const nowYear = today.getFullYear();
    const nowMonth = today.getMonth() + 1;
    if (currentYear === nowYear && currentMonth === nowMonth) return;
    if (currentMonth === 1) {
      setCurrentYear((y) => y - 1);
      setCurrentMonth(12);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  }

  function handleDayClick(dateStr: string) {
    const todayStr = toDateString(today.getFullYear(), today.getMonth() + 1, today.getDate());
    if (dateStr < todayStr) return;

    if (!selectStart || (selectStart && selectEnd)) {
      setSelectStart(dateStr);
      setSelectEnd(null);
    } else {
      if (dateStr < selectStart) {
        setSelectEnd(selectStart);
        setSelectStart(dateStr);
      } else {
        setSelectEnd(dateStr);
      }
    }
  }

  async function handleAddRange() {
    if (!selectStart) return;
    const endDate = selectEnd ?? selectStart;
    setActionLoading(true);
    setError("");
    try {
      await addAvailability(selectStart, endDate, note.trim() || undefined);
      setSelectStart(null);
      setSelectEnd(null);
      setNote("");
      await fetchRanges();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add range");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleRemove(id: string) {
    setActionLoading(true);
    setError("");
    try {
      await removeAvailability(id);
      await fetchRanges();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove range");
    } finally {
      setActionLoading(false);
    }
  }

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfWeek(currentYear, currentMonth);
  const monthLabel = new Date(currentYear, currentMonth - 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
  const todayStr = toDateString(today.getFullYear(), today.getMonth() + 1, today.getDate());
  const isPrevDisabled =
    currentYear === today.getFullYear() && currentMonth === today.getMonth() + 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 font-display">
          Availability Calendar
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Mark the dates you are available for bookings. Couples can only book on your available dates.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
          <FiAlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200/80 p-6">
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={goPrevMonth}
              disabled={isPrevDisabled}
              className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <FiChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h2 className="text-base font-semibold text-gray-900">{monthLabel}</h2>
            <button
              onClick={goNextMonth}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <FiChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = toDateString(currentYear, currentMonth, day);
              const isPast = dateStr < todayStr;
              const isAvailable = isDateInRange(dateStr, ranges);
              const isSelectStart = selectStart === dateStr;
              const isSelectEnd = selectEnd === dateStr;
              const isInSelection =
                selectStart && selectEnd
                  ? dateStr >= selectStart && dateStr <= selectEnd
                  : selectStart === dateStr;

              let cellClass =
                "relative w-full aspect-square flex items-center justify-center rounded-lg text-sm transition-all cursor-pointer ";

              if (isPast) {
                cellClass += "text-gray-300 cursor-not-allowed";
              } else if (isSelectStart || isSelectEnd) {
                cellClass += "bg-blue-600 text-white font-semibold";
              } else if (isInSelection) {
                cellClass += "bg-blue-100 text-blue-700 font-medium";
              } else if (isAvailable) {
                cellClass += "bg-green-100 text-green-700 font-medium hover:bg-green-200";
              } else {
                cellClass += "text-gray-700 hover:bg-gray-100";
              }

              return (
                <button
                  key={day}
                  onClick={() => handleDayClick(dateStr)}
                  disabled={isPast}
                  className={cellClass}
                >
                  {day}
                  {dateStr === todayStr && (
                    <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-500" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <div className="w-3 h-3 rounded bg-green-100 border border-green-200" />
              Available
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <div className="w-3 h-3 rounded bg-blue-100 border border-blue-200" />
              Selected
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <div className="w-3 h-3 rounded bg-gray-50 border border-gray-200" />
              Unavailable
            </div>
          </div>
        </div>

        {/* Add range panel */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200/80 p-5 space-y-4">
            <h3 className="text-sm font-semibold text-gray-900">Add Available Dates</h3>
            <p className="text-xs text-gray-400">
              Click a start date on the calendar, then click an end date to select a range.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
                <div className="px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 bg-gray-50">
                  {selectStart ? formatDate(selectStart) : "Select on calendar"}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">End Date</label>
                <div className="px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 bg-gray-50">
                  {selectEnd ? formatDate(selectEnd) : selectStart ? "Same as start (single day)" : "—"}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Note <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. Wedding season"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-blue-300 focus:outline-none"
                />
              </div>
            </div>

            <button
              onClick={handleAddRange}
              disabled={!selectStart || actionLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <FiPlus className="w-4 h-4" />
              {actionLoading ? "Adding..." : "Add Range"}
            </button>
          </div>

          {/* Existing ranges */}
          <div className="bg-white rounded-xl border border-gray-200/80 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Your Availability</h3>
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : ranges.length === 0 ? (
              <div className="text-center py-6">
                <FiCalendar className="w-6 h-6 text-gray-300 mx-auto mb-2" />
                <p className="text-xs text-gray-400">No availability set yet</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {ranges.map((range) => (
                  <div
                    key={range.id}
                    className="flex items-center justify-between px-3 py-2 rounded-lg bg-green-50 border border-green-100"
                  >
                    <div>
                      <p className="text-xs font-medium text-green-700">
                        {formatDate(range.startDate)} — {formatDate(range.endDate)}
                      </p>
                      {range.note && (
                        <p className="text-[11px] text-green-500 mt-0.5">{range.note}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemove(range.id)}
                      disabled={actionLoading}
                      className="p-1.5 rounded text-green-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                      <FiTrash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
