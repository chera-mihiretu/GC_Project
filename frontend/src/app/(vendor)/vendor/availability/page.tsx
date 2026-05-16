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

const DAY_HEADERS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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
    <div className="space-y-10">
      {/* ── Header ── */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-editorial text-slate-400 mb-2">
          Schedule
        </p>
        <h1 className="font-display text-3xl font-bold text-slate-900 tracking-headline">
          Availability
        </h1>
        <p className="text-[14px] text-slate-400 font-light mt-2 max-w-lg">
          Mark the dates you&apos;re available for bookings. Couples can only request dates you&apos;ve opened.
        </p>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-red-100 bg-red-50/50 px-5 py-4 text-[13px] text-red-600 max-w-3xl">
          <FiAlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* ── Calendar (fixed width, never stretches) ── */}
        <div className="w-full lg:w-auto lg:shrink-0 rounded-2xl border border-warm-200/50 bg-white p-5">
          <div className="w-full lg:w-[320px]">
            {/* Month navigation */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={goPrevMonth}
                disabled={isPrevDisabled}
                className="cursor-pointer w-8 h-8 rounded-lg bg-warm-50 border border-warm-200/40 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:border-warm-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-500"
              >
                <FiChevronLeft className="w-3.5 h-3.5" />
              </button>
              <h2 className="font-display text-base font-semibold text-slate-900 tracking-tight">
                {monthLabel}
              </h2>
              <button
                onClick={goNextMonth}
                className="cursor-pointer w-8 h-8 rounded-lg bg-warm-50 border border-warm-200/40 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:border-warm-200 transition-all duration-500"
              >
                <FiChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 mb-1">
              {DAY_HEADERS.map((d) => (
                <div
                  key={d}
                  className="text-center text-[10px] font-semibold uppercase tracking-editorial text-slate-400 py-1.5"
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Days grid — fixed 44px cells */}
            <div className="grid grid-cols-7">
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} className="h-[44px]" />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dateStr = toDateString(currentYear, currentMonth, day);
                const isPast = dateStr < todayStr;
                const isToday = dateStr === todayStr;
                const isAvailable = isDateInRange(dateStr, ranges);
                const isSelectStart = selectStart === dateStr;
                const isSelectEnd = selectEnd === dateStr;
                const isInSelection =
                  selectStart && selectEnd
                    ? dateStr >= selectStart && dateStr <= selectEnd
                    : selectStart === dateStr;

                return (
                  <button
                    key={day}
                    onClick={() => handleDayClick(dateStr)}
                    disabled={isPast}
                    className={`cursor-pointer relative h-[44px] flex items-center justify-center rounded-lg text-[13px] font-medium transition-all duration-300 ${
                      isPast
                        ? "text-slate-200 cursor-not-allowed"
                        : isSelectStart || isSelectEnd
                          ? "bg-slate-900 text-white font-semibold shadow-[0_2px_12px_rgba(15,23,42,0.15)]"
                          : isInSelection
                            ? "bg-slate-100 text-slate-700 font-semibold"
                            : isAvailable
                              ? "bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200/60 hover:bg-emerald-100"
                              : isToday
                                ? "bg-warm-50 text-slate-900 border border-warm-200/50"
                                : "text-slate-600 hover:bg-warm-50"
                    }`}
                  >
                    {day}
                    {isToday && (
                      <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-gold-500" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mt-4 pt-3 border-t border-warm-200/30">
              <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-400">
                <div className="w-2.5 h-2.5 rounded bg-emerald-50 border border-emerald-200/60" />
                Available
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-400">
                <div className="w-2.5 h-2.5 rounded bg-slate-900" />
                Selected
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-400">
                <span className="w-2.5 h-2.5 rounded border border-warm-200/50 bg-warm-50 relative flex items-center justify-center">
                  <span className="w-0.5 h-0.5 rounded-full bg-gold-500" />
                </span>
                Today
              </div>
            </div>
          </div>
        </div>

        {/* ── Side panel (grows to fill remaining space) ── */}
        <div className="w-full lg:flex-1 lg:min-w-0 space-y-5">
          {/* Add range card */}
          <div className="rounded-2xl border border-warm-200/50 bg-white p-5 sm:p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-lg bg-warm-50 border border-warm-200/40 flex items-center justify-center">
                <FiPlus className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <div>
                <h3 className="text-[14px] font-semibold text-slate-900">Add Dates</h3>
                <p className="text-[11px] text-slate-400 font-light mt-0.5">
                  Select start &amp; end on calendar
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Start date */}
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">
                    Start Date
                  </label>
                  <div className="px-3.5 py-2.5 rounded-lg border border-warm-200/40 text-[13px] bg-warm-50/30">
                    {selectStart ? (
                      <span className="text-slate-800 font-medium">{formatDate(selectStart)}</span>
                    ) : (
                      <span className="text-slate-300">Select on calendar</span>
                    )}
                  </div>
                </div>

                {/* End date */}
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">
                    End Date
                  </label>
                  <div className="px-3.5 py-2.5 rounded-lg border border-warm-200/40 text-[13px] bg-warm-50/30">
                    {selectEnd ? (
                      <span className="text-slate-800 font-medium">{formatDate(selectEnd)}</span>
                    ) : selectStart ? (
                      <span className="text-slate-400">Same as start</span>
                    ) : (
                      <span className="text-slate-300">&mdash;</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Note */}
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">
                  Note <span className="text-slate-300 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. Wedding season"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-warm-200/40 text-[13px] text-slate-800 bg-white outline-none transition-all duration-500 placeholder:text-slate-300 focus:border-slate-300 focus:shadow-[0_0_0_3px_rgba(250,248,245,1),0_0_0_5px_rgba(201,168,76,0.15)]"
                />
              </div>
            </div>

            <button
              onClick={handleAddRange}
              disabled={!selectStart || actionLoading}
              className="cursor-pointer w-full flex items-center justify-center gap-2 mt-5 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-[13px] font-semibold shadow-[0_2px_12px_rgba(15,23,42,0.1)] hover:bg-slate-800 hover:shadow-[0_4px_20px_rgba(15,23,42,0.18)] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-500"
            >
              {actionLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Adding...
                </span>
              ) : (
                <>
                  <FiPlus className="w-3.5 h-3.5" />
                  Add Range
                </>
              )}
            </button>
          </div>

          {/* Existing ranges */}
          <div className="rounded-2xl border border-warm-200/50 bg-white p-5 sm:p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-lg bg-warm-50 border border-warm-200/40 flex items-center justify-center">
                <FiCalendar className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <h3 className="text-[14px] font-semibold text-slate-900">Your Availability</h3>
            </div>

            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-12 bg-warm-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : ranges.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-10 h-10 rounded-lg bg-warm-50 border border-warm-200/40 flex items-center justify-center mx-auto mb-3">
                  <FiCalendar className="w-4 h-4 text-slate-300" />
                </div>
                <p className="text-[12px] text-slate-400 font-light">
                  No availability set yet
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[340px] overflow-y-auto scrollbar-hide">
                {ranges.map((range) => (
                  <div
                    key={range.id}
                    className="group flex items-center justify-between gap-2 px-3.5 py-3 rounded-lg bg-emerald-50/50 border border-emerald-200/30 hover:border-emerald-200/60 transition-all duration-500"
                  >
                    <div className="min-w-0">
                      <p className="text-[12px] font-medium text-emerald-800">
                        {formatDate(range.startDate)} — {formatDate(range.endDate)}
                      </p>
                      {range.note && (
                        <p className="text-[10px] text-emerald-500/70 font-light mt-0.5 truncate">
                          {range.note}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemove(range.id)}
                      disabled={actionLoading}
                      className="cursor-pointer w-7 h-7 rounded-md flex items-center justify-center text-emerald-300 opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-500 transition-all duration-500 disabled:opacity-50 shrink-0"
                    >
                      <FiTrash2 className="w-3 h-3" />
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
