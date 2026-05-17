"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useSession } from "@/lib/auth-client";
import { getCoupleProfile, type CoupleProfile } from "@/services/couple.service";
import { getChecklistProgress, listChecklist, type ChecklistProgress, type ChecklistItem } from "@/services/checklist.service";
import { listBookings } from "@/services/booking.service";
import { getBudget, listCategories, getExpenseSummary, type Budget, type BudgetCategorySummary, type ExpenseSummary } from "@/services/budget.service";
import type { Booking } from "@/types/booking";
import {
  FiDollarSign,
  FiCheckSquare,
  FiUsers,
  FiShoppingBag,
  FiArrowRight,
  FiCalendar,
  FiSearch,
  FiHeart,
  FiMessageSquare,
  FiStar,
  FiClock,
  FiMapPin,
  FiArrowUpRight,
  FiSunrise,
} from "react-icons/fi";
import Link from "next/link";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const TOOLTIP_STYLE = {
  borderRadius: "12px",
  border: "1px solid rgba(226,220,210,0.4)",
  boxShadow: "0 8px 30px rgba(15,23,42,0.08)",
  fontSize: "12px",
  padding: "8px 14px",
};

const BOOKING_STATUS: Record<string, { color: string; label: string }> = {
  pending:           { color: "#f59e0b", label: "Pending" },
  accepted:          { color: "#3b82f6", label: "Accepted" },
  declined:          { color: "#ef4444", label: "Declined" },
  payment_requested: { color: "#8b5cf6", label: "Payment Req." },
  deposit_paid:      { color: "#10b981", label: "Deposit Paid" },
  completed:         { color: "#059669", label: "Completed" },
  cancelled:         { color: "#94a3b8", label: "Cancelled" },
};

function KpiCard({ icon: Icon, label, value, sub, accent }: {
  icon: typeof FiHeart;
  label: string;
  value: string;
  sub?: string;
  accent: string;
}) {
  const accentMap: Record<string, string> = {
    rose: "bg-rose-50 border-rose-200/40 text-rose-500",
    emerald: "bg-emerald-50 border-emerald-200/40 text-emerald-500",
    amber: "bg-amber-50 border-amber-200/40 text-amber-500",
    blue: "bg-blue-50 border-blue-200/40 text-blue-500",
  };
  return (
    <div className="rounded-2xl border border-warm-200/50 bg-white p-5 sm:p-6">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${accentMap[accent] ?? accentMap.rose}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="font-display text-2xl font-bold text-slate-900 tracking-tight">{value}</p>
      <p className="text-[12px] text-slate-400 font-light mt-0.5">{label}</p>
      {sub && <p className="text-[11px] text-slate-500 font-medium mt-1.5">{sub}</p>}
    </div>
  );
}

function ChartLoader() {
  return (
    <div className="flex items-center justify-center py-16">
      <span className="w-5 h-5 border-2 border-warm-200 border-t-slate-400 rounded-full animate-spin" />
    </div>
  );
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function CoupleDashboard() {
  const { data: session } = useSession();
  const firstName = session?.user?.name?.split(" ")[0] ?? "there";

  const [loading, setLoading] = useState(true);
  const [coupleProfile, setCoupleProfile] = useState<CoupleProfile | null>(null);
  const [taskProgress, setTaskProgress] = useState<ChecklistProgress>({ total: 0, completed: 0 });
  const [upcomingTasks, setUpcomingTasks] = useState<ChecklistItem[]>([]);
  const [vendorsBooked, setVendorsBooked] = useState(0);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [budgetData, setBudgetData] = useState<Budget | null>(null);
  const [categorySummary, setCategorySummary] = useState<BudgetCategorySummary | null>(null);
  const [expenseSummary, setExpenseSummary] = useState<ExpenseSummary | null>(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      const [profileRes, progressRes, bookingsRes, budgetRes, categoriesRes, expenseRes, checklistRes] =
        await Promise.allSettled([
          getCoupleProfile(),
          getChecklistProgress(),
          listBookings({ limit: 5 }),
          getBudget(),
          listCategories(),
          getExpenseSummary(),
          listChecklist(),
        ]);

      if (profileRes.status === "fulfilled") setCoupleProfile(profileRes.value?.coupleProfile ?? null);
      if (progressRes.status === "fulfilled") setTaskProgress(progressRes.value);
      if (bookingsRes.status === "fulfilled") {
        setVendorsBooked(bookingsRes.value.total);
        setRecentBookings(bookingsRes.value.data ?? []);
      }
      if (budgetRes.status === "fulfilled") setBudgetData(budgetRes.value);
      if (categoriesRes.status === "fulfilled") setCategorySummary(categoriesRes.value);
      if (expenseRes.status === "fulfilled") setExpenseSummary(expenseRes.value);
      if (checklistRes.status === "fulfilled") {
        const pending = (checklistRes.value ?? [])
          .filter((t) => !t.isCompleted && t.dueDate)
          .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
          .slice(0, 4);
        setUpcomingTasks(pending);
      }
    } catch {
      // partial failure fine
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);

  const daysUntilWedding = coupleProfile?.weddingDate
    ? Math.ceil((new Date(coupleProfile.weddingDate).getTime() - Date.now()) / 86400000)
    : null;

  const taskPercent = taskProgress.total > 0 ? Math.round((taskProgress.completed / taskProgress.total) * 100) : 0;

  const budgetSpentPercent = useMemo(() => {
    if (!expenseSummary || !budgetData || budgetData.totalAmount === 0) return 0;
    return Math.min(100, Math.round((expenseSummary.totalSpent / budgetData.totalAmount) * 100));
  }, [expenseSummary, budgetData]);

  const budgetPieData = useMemo(() => {
    if (!categorySummary) return [];
    const cats = categorySummary.categories
      .filter((c) => c.allocatedAmount > 0)
      .map((c) => ({ name: c.name, value: c.allocatedAmount }));
    if (categorySummary.unallocated > 0) cats.push({ name: "Unallocated", value: categorySummary.unallocated });
    return cats;
  }, [categorySummary]);

  const PIE_COLORS = ["#f43f5e", "#3b82f6", "#f59e0b", "#10b981", "#8b5cf6", "#ec4899", "#06b6d4", "#d4d4d8"];

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <div className="h-4 w-24 bg-warm-100 rounded-lg animate-pulse mb-3" />
          <div className="h-8 w-64 bg-warm-100 rounded-lg animate-pulse" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-warm-200/30 bg-white p-6 animate-pulse">
              <div className="w-10 h-10 rounded-xl bg-warm-100 mb-4" />
              <div className="h-7 w-20 bg-warm-100 rounded-lg mb-2" />
              <div className="h-3 w-28 bg-warm-100/60 rounded" />
            </div>
          ))}
        </div>
        <div className="grid lg:grid-cols-2 gap-5">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-warm-200/30 bg-white p-8 h-64 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ── Header ── */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-editorial text-slate-400 mb-2 flex items-center gap-1.5">
            <FiSunrise className="w-3 h-3" />
            {getGreeting()}
          </p>
          <h1 className="font-display text-3xl font-bold text-slate-900 tracking-headline">
            {firstName}&apos;s Wedding
          </h1>
          <p className="text-[13px] text-slate-400 font-light mt-1.5">
            {coupleProfile?.partnerName
              ? `Planning with ${coupleProfile.partnerName}`
              : "Your wedding planning hub"}
          </p>
        </div>
        {daysUntilWedding != null && daysUntilWedding > 0 && (
          <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-gradient-to-r from-rose-50 to-amber-50/50 border border-rose-200/30">
            <div className="w-10 h-10 rounded-xl bg-white border border-rose-200/30 flex items-center justify-center">
              <FiCalendar className="w-4 h-4 text-rose-500" />
            </div>
            <div>
              <p className="font-display text-xl font-bold text-slate-900">{daysUntilWedding}</p>
              <p className="text-[10px] uppercase tracking-luxury text-slate-400 font-medium">days to go</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Profile CTA (if no profile) ── */}
      {!coupleProfile && (
        <Link href="/profile">
          <div className="group rounded-2xl border border-rose-200/40 bg-gradient-to-r from-rose-50/80 to-warm-50 p-6 flex items-center gap-5 hover:border-rose-300/60 hover:shadow-[0_8px_30px_rgba(244,63,94,0.06)] transition-all duration-500 cursor-pointer">
            <div className="w-12 h-12 rounded-xl bg-rose-100 border border-rose-200/40 flex items-center justify-center shrink-0">
              <FiHeart className="w-5 h-5 text-rose-500" />
            </div>
            <div className="flex-1">
              <h3 className="text-[14px] font-semibold text-slate-900 mb-0.5">Complete your wedding profile</h3>
              <p className="text-[12px] text-slate-400 font-light">Set your date, theme, and location for personalized recommendations</p>
            </div>
            <FiArrowRight className="w-5 h-5 text-rose-300 group-hover:text-rose-500 group-hover:translate-x-0.5 transition-all duration-500 shrink-0" />
          </div>
        </Link>
      )}

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <KpiCard
          icon={FiDollarSign}
          label="Total Budget"
          value={budgetData ? `${budgetData.totalAmount.toLocaleString()}` : "—"}
          sub={budgetData ? `${budgetData.currency} · ${budgetSpentPercent}% spent` : "Not set yet"}
          accent="emerald"
        />
        <KpiCard
          icon={FiCheckSquare}
          label="Tasks Done"
          value={`${taskProgress.completed}/${taskProgress.total}`}
          sub={taskProgress.total > 0 ? `${taskPercent}% complete` : "No tasks yet"}
          accent="blue"
        />
        <KpiCard
          icon={FiUsers}
          label="Estimated Guests"
          value={coupleProfile?.estimatedGuests != null ? String(coupleProfile.estimatedGuests) : "—"}
          sub={coupleProfile?.weddingLocation ?? "Location not set"}
          accent="amber"
        />
        <KpiCard
          icon={FiShoppingBag}
          label="Total Bookings"
          value={String(vendorsBooked)}
          sub={vendorsBooked > 0 ? "Vendor bookings" : "Start browsing vendors"}
          accent="rose"
        />
      </div>

      {/* ── Row: Countdown / Wedding Info + Budget Overview ── */}
      <div className="grid lg:grid-cols-2 gap-5">
        {/* Wedding Countdown Card */}
        <section className="rounded-2xl border border-warm-200/50 bg-white p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-200/40 flex items-center justify-center">
              <FiHeart className="w-4 h-4 text-rose-500" />
            </div>
            <div>
              <h2 className="text-[15px] font-semibold text-slate-900">Wedding Details</h2>
              <p className="text-[11px] text-slate-400 font-light">Your big day overview</p>
            </div>
          </div>

          {coupleProfile?.weddingDate ? (
            <div className="space-y-5">
              <div className="rounded-xl bg-gradient-to-br from-rose-50 to-amber-50/40 border border-rose-200/20 p-5 text-center">
                <p className="font-display text-4xl font-bold text-slate-900 tracking-tight">
                  {daysUntilWedding != null && daysUntilWedding > 0
                    ? daysUntilWedding
                    : daysUntilWedding === 0
                      ? "Today!"
                      : "Passed"}
                </p>
                <p className="text-[11px] uppercase tracking-luxury text-slate-400 font-medium mt-1">
                  {daysUntilWedding != null && daysUntilWedding > 0 ? "days until your wedding" : daysUntilWedding === 0 ? "Your wedding is today!" : "Your wedding day has passed"}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-warm-50/60 border border-warm-200/20 px-4 py-3">
                  <p className="text-[10px] uppercase tracking-luxury text-slate-400 font-medium mb-1">Date</p>
                  <p className="text-[13px] font-medium text-slate-700">
                    {new Date(coupleProfile.weddingDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                </div>
                <div className="rounded-xl bg-warm-50/60 border border-warm-200/20 px-4 py-3">
                  <p className="text-[10px] uppercase tracking-luxury text-slate-400 font-medium mb-1">Theme</p>
                  <p className="text-[13px] font-medium text-slate-700 capitalize">{coupleProfile.weddingTheme ?? "Not set"}</p>
                </div>
                {coupleProfile.weddingLocation && (
                  <div className="col-span-2 rounded-xl bg-warm-50/60 border border-warm-200/20 px-4 py-3 flex items-center gap-2">
                    <FiMapPin className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                    <p className="text-[13px] font-medium text-slate-700">{coupleProfile.weddingLocation}</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <Link href="/profile" className="block">
              <div className="rounded-xl border-2 border-dashed border-warm-200/40 p-10 text-center hover:border-rose-200 transition-colors cursor-pointer">
                <div className="w-12 h-12 rounded-xl bg-warm-50 border border-warm-200/30 flex items-center justify-center mx-auto mb-3">
                  <FiCalendar className="w-5 h-5 text-slate-300" />
                </div>
                <p className="text-[13px] font-medium text-slate-600 mb-1">Set your wedding date</p>
                <p className="text-[11px] text-slate-400 font-light">Add it in your Wedding Profile</p>
              </div>
            </Link>
          )}
        </section>

        {/* Budget Overview */}
        <section className="rounded-2xl border border-warm-200/50 bg-white p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200/40 flex items-center justify-center">
                <FiDollarSign className="w-4 h-4 text-emerald-500" />
              </div>
              <div>
                <h2 className="text-[15px] font-semibold text-slate-900">Budget Overview</h2>
                <p className="text-[11px] text-slate-400 font-light">Allocation & spending</p>
              </div>
            </div>
            <Link href="/budget" className="text-[11px] text-slate-400 hover:text-slate-600 font-medium flex items-center gap-1 transition-colors">
              View <FiArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          {budgetData ? (
            <div className="space-y-5">
              {/* Spending bar */}
              <div>
                <div className="flex items-end justify-between mb-2">
                  <p className="font-display text-xl font-bold text-slate-900">
                    {expenseSummary ? expenseSummary.totalSpent.toLocaleString() : "0"} <span className="text-[13px] font-normal text-slate-400">{budgetData.currency}</span>
                  </p>
                  <p className="text-[11px] text-slate-400 font-light">
                    of {budgetData.totalAmount.toLocaleString()} {budgetData.currency}
                  </p>
                </div>
                <div className="h-2 bg-warm-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${
                      budgetSpentPercent > 90 ? "bg-red-500" : budgetSpentPercent > 70 ? "bg-amber-400" : "bg-emerald-400"
                    }`}
                    style={{ width: `${budgetSpentPercent}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-400 font-light mt-1.5">
                  {expenseSummary ? `${expenseSummary.remaining.toLocaleString()} ${budgetData.currency} remaining` : ""}
                </p>
              </div>

              {/* Category breakdown */}
              {budgetPieData.length > 0 ? (
                <div className="flex items-center gap-4">
                  <div className="w-[130px] h-[130px] shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={budgetPieData} cx="50%" cy="50%" innerRadius={32} outerRadius={58} paddingAngle={2} dataKey="value" strokeWidth={0}>
                          {budgetPieData.map((_, i) => (
                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value) => [`${Number(value).toLocaleString()} ${budgetData.currency}`]} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 space-y-1.5 overflow-hidden">
                    {budgetPieData.slice(0, 5).map((cat, i) => (
                      <div key={cat.name} className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                        <span className="text-[11px] text-slate-600 truncate flex-1">{cat.name}</span>
                        <span className="text-[11px] text-slate-400 font-light tabular-nums shrink-0">
                          {cat.value.toLocaleString()}
                        </span>
                      </div>
                    ))}
                    {budgetPieData.length > 5 && (
                      <p className="text-[10px] text-slate-400 font-light pl-4">+{budgetPieData.length - 5} more</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-[12px] text-slate-400 font-light">No categories allocated yet</p>
                </div>
              )}
            </div>
          ) : (
            <Link href="/budget" className="block">
              <div className="rounded-xl border-2 border-dashed border-warm-200/40 p-10 text-center hover:border-emerald-200 transition-colors cursor-pointer">
                <div className="w-12 h-12 rounded-xl bg-warm-50 border border-warm-200/30 flex items-center justify-center mx-auto mb-3">
                  <FiDollarSign className="w-5 h-5 text-slate-300" />
                </div>
                <p className="text-[13px] font-medium text-slate-600 mb-1">Set up your budget</p>
                <p className="text-[11px] text-slate-400 font-light">Track spending across categories</p>
              </div>
            </Link>
          )}
        </section>
      </div>

      {/* ── Row: Checklist Progress + Recent Bookings ── */}
      <div className="grid lg:grid-cols-2 gap-5">
        {/* Checklist */}
        <section className="rounded-2xl border border-warm-200/50 bg-white p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200/40 flex items-center justify-center">
                <FiCheckSquare className="w-4 h-4 text-blue-500" />
              </div>
              <div>
                <h2 className="text-[15px] font-semibold text-slate-900">Checklist</h2>
                <p className="text-[11px] text-slate-400 font-light">{taskProgress.completed} of {taskProgress.total} tasks done</p>
              </div>
            </div>
            <Link href="/checklist" className="text-[11px] text-slate-400 hover:text-slate-600 font-medium flex items-center gap-1 transition-colors">
              View <FiArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          {/* Progress ring */}
          <div className="flex items-center gap-6 mb-5">
            <div className="relative w-20 h-20 shrink-0">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(226,220,210,0.3)" strokeWidth="8" />
                <circle
                  cx="50" cy="50" r="42" fill="none" stroke="#3b82f6" strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={`${taskPercent * 2.64} 264`}
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-display text-lg font-bold text-slate-900">{taskPercent}%</span>
              </div>
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-slate-500">Completed</span>
                <span className="font-medium text-slate-700">{taskProgress.completed}</span>
              </div>
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-slate-500">Remaining</span>
                <span className="font-medium text-slate-700">{taskProgress.total - taskProgress.completed}</span>
              </div>
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-slate-500">Total</span>
                <span className="font-medium text-slate-700">{taskProgress.total}</span>
              </div>
            </div>
          </div>

          {/* Upcoming tasks */}
          {upcomingTasks.length > 0 ? (
            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-luxury text-slate-400 font-medium mb-2">Upcoming</p>
              {upcomingTasks.map((task) => (
                <div key={task.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-warm-50/40 border border-warm-200/20">
                  <div className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
                  <p className="text-[12px] text-slate-600 flex-1 truncate">{task.title}</p>
                  {task.dueDate && (
                    <span className="text-[10px] text-slate-400 font-light shrink-0">
                      {new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : taskProgress.total === 0 ? (
            <Link href="/checklist" className="block">
              <div className="rounded-xl border border-dashed border-warm-200/40 p-6 text-center hover:border-blue-200 transition-colors cursor-pointer">
                <p className="text-[12px] text-slate-400 font-light">Start your wedding checklist</p>
              </div>
            </Link>
          ) : (
            <div className="rounded-xl bg-emerald-50/40 border border-emerald-200/20 p-4 text-center">
              <p className="text-[12px] text-emerald-600 font-medium">All upcoming tasks completed!</p>
            </div>
          )}
        </section>

        {/* Recent Bookings */}
        <section className="rounded-2xl border border-warm-200/50 bg-white p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200/40 flex items-center justify-center">
                <FiShoppingBag className="w-4 h-4 text-amber-500" />
              </div>
              <div>
                <h2 className="text-[15px] font-semibold text-slate-900">Recent Bookings</h2>
                <p className="text-[11px] text-slate-400 font-light">{vendorsBooked} total</p>
              </div>
            </div>
            <Link href="/bookings" className="text-[11px] text-slate-400 hover:text-slate-600 font-medium flex items-center gap-1 transition-colors">
              View <FiArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          {recentBookings.length > 0 ? (
            <div className="space-y-2.5">
              {recentBookings.slice(0, 4).map((b) => {
                const st = BOOKING_STATUS[b.status] ?? { color: "#94a3b8", label: b.status };
                return (
                  <Link key={b.id} href={`/bookings/${b.id}`}>
                    <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-warm-50/30 border border-warm-200/20 hover:border-warm-200/50 hover:bg-warm-50/60 transition-all duration-300 cursor-pointer group">
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-warm-100 to-warm-50 flex items-center justify-center shrink-0">
                        <span className="text-[12px] font-bold text-slate-400">
                          {(b.businessName ?? b.serviceCategory ?? "V").charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-medium text-slate-700 truncate">{b.businessName ?? b.serviceCategory}</p>
                        <p className="text-[10px] text-slate-400 font-light">{b.eventDate ? new Date(b.eventDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "No date"}</p>
                      </div>
                      <span
                        className="px-2 py-0.5 rounded-md text-[9px] font-semibold uppercase tracking-wider"
                        style={{ color: st.color, backgroundColor: st.color + "15" }}
                      >
                        {st.label}
                      </span>
                      <FiArrowRight className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <Link href="/vendors" className="block">
              <div className="rounded-xl border border-dashed border-warm-200/40 p-8 text-center hover:border-amber-200 transition-colors cursor-pointer">
                <div className="w-12 h-12 rounded-xl bg-warm-50 border border-warm-200/30 flex items-center justify-center mx-auto mb-3">
                  <FiSearch className="w-5 h-5 text-slate-300" />
                </div>
                <p className="text-[13px] font-medium text-slate-600 mb-1">Find your first vendor</p>
                <p className="text-[11px] text-slate-400 font-light">Browse verified wedding professionals</p>
              </div>
            </Link>
          )}
        </section>
      </div>

      {/* ── Quick Actions ── */}
      <section>
        <p className="text-[11px] font-semibold uppercase tracking-editorial text-slate-400 mb-4">Quick Actions</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {([
            { icon: FiSearch, label: "Find Vendors", href: "/vendors", color: "rose" },
            { icon: FiMessageSquare, label: "Messages", href: "/messages", color: "blue" },
            { icon: FiStar, label: "AI Agent", href: "/advisor", color: "amber" },
            { icon: FiCalendar, label: "My Bookings", href: "/bookings", color: "emerald" },
          ] as const).map((action) => {
            const Icon = action.icon;
            const colorMap: Record<string, string> = {
              rose: "bg-rose-50 border-rose-200/40 text-rose-500",
              blue: "bg-blue-50 border-blue-200/40 text-blue-500",
              amber: "bg-amber-50 border-amber-200/40 text-amber-500",
              emerald: "bg-emerald-50 border-emerald-200/40 text-emerald-500",
            };
            return (
              <Link key={action.href} href={action.href}>
                <div className="group rounded-2xl border border-warm-200/40 bg-white p-5 text-center hover:border-warm-200/70 hover:shadow-[0_4px_20px_rgba(15,23,42,0.04)] transition-all duration-500 cursor-pointer">
                  <div className={`w-11 h-11 rounded-xl border flex items-center justify-center mx-auto mb-3 ${colorMap[action.color]}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <p className="text-[12px] font-semibold text-slate-700 group-hover:text-slate-900 transition-colors">{action.label}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
