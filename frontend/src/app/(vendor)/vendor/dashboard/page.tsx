"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { getVendorProfile, getVendorContext, type VendorContext } from "@/services/vendor.service";
import { listBookings } from "@/services/booking.service";
import { getEarningsSummary } from "@/services/earnings.service";
import { getVendorAnalytics, type VendorAnalytics } from "@/services/vendor-analytics.service";
import VendorStatusBanner from "@/components/vendor/vendor-status-banner";
import DocumentUpload from "@/components/vendor/document-upload";
import { VendorStatus, type VendorProfile } from "@/types/vendor";
import type { EarningsSummary } from "@/types/payment";
import {
  FiCalendar,
  FiStar,
  FiArrowRight,
  FiUser,
  FiFileText,
  FiSend,
  FiUsers,
  FiMessageSquare,
  FiDollarSign,
  FiTrendingUp,
  FiCheckCircle,
  FiClock,
  FiXCircle,
  FiEye,
  FiCreditCard,
  FiArrowUpRight,
} from "react-icons/fi";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const BOOKING_STATUS_COLORS: Record<string, { color: string; label: string }> = {
  pending:           { color: "#f59e0b", label: "Pending" },
  accepted:          { color: "#3b82f6", label: "Accepted" },
  declined:          { color: "#ef4444", label: "Declined" },
  payment_requested: { color: "#8b5cf6", label: "Payment Req." },
  deposit_paid:      { color: "#10b981", label: "Deposit Paid" },
  completed:         { color: "#059669", label: "Completed" },
  cancelled:         { color: "#94a3b8", label: "Cancelled" },
};

const TOOLTIP_STYLE = {
  borderRadius: "12px",
  border: "1px solid rgba(226,220,210,0.4)",
  boxShadow: "0 8px 30px rgba(15,23,42,0.08)",
  fontSize: "12px",
  padding: "8px 14px",
};

export default function VendorDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<VendorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [vendorCtx, setVendorCtx] = useState<VendorContext | null>(null);
  const [analytics, setAnalytics] = useState<VendorAnalytics | null>(null);
  const [earnings, setEarnings] = useState<EarningsSummary | null>(null);
  const [bookingCounts, setBookingCounts] = useState({ total: 0, pending: 0 });

  const fetchProfile = useCallback(async () => {
    try {
      const [data, ctx] = await Promise.all([
        getVendorProfile(),
        getVendorContext().catch(() => null),
      ]);
      setProfile(data?.vendorProfile ?? null);
      setVendorCtx(ctx);
    } catch {
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAnalytics = useCallback(async () => {
    try {
      const [analyticsData, earningsData, allBookings, pendingBookings] = await Promise.all([
        getVendorAnalytics().catch(() => null),
        getEarningsSummary().catch(() => null),
        listBookings({ limit: 1 }).catch(() => null),
        listBookings({ status: "pending", limit: 1 }).catch(() => null),
      ]);
      setAnalytics(analyticsData);
      setEarnings(earningsData);
      setBookingCounts({
        total: allBookings?.total ?? 0,
        pending: pendingBookings?.total ?? 0,
      });
    } catch { /* non-critical */ }
  }, []);

  useEffect(() => {
    fetchProfile();
    fetchAnalytics();
  }, [fetchProfile, fetchAnalytics]);

  const firstName = session?.user?.name?.split(" ")[0] ?? "there";
  const status = profile?.status;
  const noProfile = !profile;
  const staffMember = vendorCtx?.isStaff === true;
  const needsSetup = !staffMember && (noProfile || status === VendorStatus.REGISTERED || status === VendorStatus.REJECTED);

  const dailyBookingData = useMemo(() => {
    if (!analytics) return [];
    return analytics.dailyBookings.map((d) => ({
      day: new Date(d.day).toLocaleDateString("en-US", { weekday: "short" }),
      bookings: d.count,
    }));
  }, [analytics]);

  const dailyEarningsData = useMemo(() => {
    if (!analytics) return [];
    return analytics.dailyEarnings.map((d) => ({
      day: new Date(d.day).toLocaleDateString("en-US", { weekday: "short" }),
      earnings: d.total,
    }));
  }, [analytics]);

  const bookingPieData = useMemo(() => {
    if (!analytics) return [];
    return Object.entries(analytics.bookingsByStatus)
      .map(([status, count]) => ({
        name: BOOKING_STATUS_COLORS[status]?.label ?? status,
        value: count,
        color: BOOKING_STATUS_COLORS[status]?.color ?? "#94a3b8",
      }))
      .filter((d) => d.value > 0);
  }, [analytics]);

  const totalBookingsFromStatus = useMemo(() => {
    if (!analytics) return 0;
    return Object.values(analytics.bookingsByStatus).reduce((a, b) => a + b, 0);
  }, [analytics]);

  const conversionRate = useMemo(() => {
    if (!analytics || totalBookingsFromStatus === 0) return 0;
    const completed = (analytics.bookingsByStatus.completed ?? 0) + (analytics.bookingsByStatus.deposit_paid ?? 0);
    return Math.round((completed / totalBookingsFromStatus) * 100);
  }, [analytics, totalBookingsFromStatus]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-warm-200/40 border-t-gold-400 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[13px] text-slate-400 font-light">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* ── Header ── */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-editorial text-slate-400 mb-2">
          Dashboard
        </p>
        <h1 className="font-display text-3xl font-bold text-slate-900 tracking-headline">
          Welcome back, {firstName}
        </h1>
        <p className="text-[14px] text-slate-400 font-light mt-2">
          {noProfile
            ? "Set up your vendor profile to start receiving bookings."
            : "Here\u2019s how your business is performing"}
        </p>
      </div>

      {profile && (
        <VendorStatusBanner status={profile.status} rejectionReason={profile.rejectionReason} />
      )}

      {/* Staff: no profile yet */}
      {staffMember && noProfile && (
        <div className="rounded-2xl border border-warm-200/50 bg-white p-8 sm:p-10 text-center">
          <div className="w-12 h-12 rounded-xl bg-warm-50 border border-warm-200/40 flex items-center justify-center mx-auto mb-4">
            <FiUser className="w-5 h-5 text-slate-300" />
          </div>
          <h2 className="text-[16px] font-semibold text-slate-900 mb-2">Profile Not Set Up Yet</h2>
          <p className="text-[13px] text-slate-400 font-light max-w-md mx-auto">
            The vendor owner hasn&apos;t completed the business profile yet. You&apos;ll see all data once it&apos;s set up.
          </p>
        </div>
      )}

      {/* Staff: profile pending */}
      {staffMember && profile && status !== VendorStatus.VERIFIED && status !== VendorStatus.SUSPENDED && status !== VendorStatus.DEACTIVATED && (
        <div className="rounded-2xl border border-warm-200/50 bg-white p-6 sm:p-8">
          <h2 className="text-[16px] font-semibold text-slate-900">{profile.businessName || "Business Profile"}</h2>
          <p className="text-[13px] text-slate-400 font-light mt-1">
            The vendor profile is currently <span className="font-medium text-slate-600">{status?.replace(/_/g, " ").toLowerCase()}</span>. Full features available once verified.
          </p>
        </div>
      )}

      {/* No profile — onboarding (owner only) */}
      {!staffMember && noProfile && (
        <div className="rounded-2xl border border-warm-200/50 bg-white p-8 sm:p-10">
          <h2 className="font-display text-xl font-bold text-slate-900 tracking-tight mb-2">Get Started in 3 Steps</h2>
          <p className="text-[13px] text-slate-400 font-light mb-8">
            Complete these steps to get verified and start receiving bookings from couples.
          </p>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { step: 1, icon: FiUser, title: "Complete Profile", desc: "Add your business name, category, and contact info" },
              { step: 2, icon: FiFileText, title: "Upload Documents", desc: "Business license, national ID, and verification docs" },
              { step: 3, icon: FiSend, title: "Submit for Review", desc: "Our team will verify your profile within 48 hours" },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.step} className="text-center">
                  <div className="w-12 h-12 rounded-xl bg-warm-50 border border-warm-200/40 flex items-center justify-center mx-auto mb-3">
                    <Icon className="w-5 h-5 text-slate-400" />
                  </div>
                  <div className="text-[10px] font-semibold text-amber-500 uppercase tracking-luxury mb-1">Step {item.step}</div>
                  <h3 className="text-[13px] font-semibold text-slate-900 mb-1">{item.title}</h3>
                  <p className="text-[11px] text-slate-400 font-light">{item.desc}</p>
                </div>
              );
            })}
          </div>
          <div className="mt-8 text-center">
            <button onClick={() => router.push("/vendor/profile/setup")} className="cursor-pointer px-6 py-3 bg-slate-900 text-white rounded-full text-[13px] font-medium hover:bg-slate-800 transition-all duration-500 inline-flex items-center gap-2">
              Get Started <FiArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Has profile but needs setup (owner only) */}
      {!staffMember && profile && needsSetup && (
        <div className="rounded-2xl border border-warm-200/50 bg-white p-6 sm:p-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[16px] font-semibold text-slate-900">{profile.businessName || "Incomplete Profile"}</h2>
              <p className="text-[13px] text-slate-400 font-light mt-1">
                {status === VendorStatus.REJECTED ? "Fix the issues and resubmit." : "Complete your profile to submit for verification."}
              </p>
            </div>
            <button onClick={() => router.push("/vendor/profile/setup")} className="cursor-pointer px-5 py-2.5 bg-slate-900 text-white rounded-full text-[12px] font-medium hover:bg-slate-800 transition-all duration-500 flex items-center gap-2">
              {status === VendorStatus.REJECTED ? "Update & Resubmit" : "Complete Profile"} <FiArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Pending verification */}
      {profile && status === VendorStatus.PENDING_VERIFICATION && (
        <div className="rounded-2xl border border-warm-200/50 bg-white p-6 sm:p-8 space-y-4">
          <h2 className="text-[16px] font-semibold text-slate-900">Profile Summary</h2>
          <div className="grid grid-cols-2 gap-4 text-[13px]">
            <div><span className="text-slate-400">Business:</span> <span className="text-slate-800 font-medium">{profile.businessName}</span></div>
            <div><span className="text-slate-400">Category:</span> <span className="text-slate-800 font-medium capitalize">{profile.category}</span></div>
            <div><span className="text-slate-400">Phone:</span> <span className="text-slate-800">{profile.phoneNumber}</span></div>
            <div><span className="text-slate-400">Location:</span> <span className="text-slate-800">{profile.location}</span></div>
          </div>
          {profile.description && <p className="text-[13px] text-slate-500 font-light">{profile.description}</p>}
          <DocumentUpload documents={profile.documents ?? []} onUpdate={fetchProfile} disabled />
        </div>
      )}

      {/* ═══════════════════════ VERIFIED — FULL ANALYTICS DASHBOARD ═══════════════════════ */}
      {profile && status === VendorStatus.VERIFIED && (
        <div className="space-y-8">
          {/* ── KPI Row ── */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <KpiCard icon={FiCalendar} label="Total Bookings" value={bookingCounts.total} iconBg="bg-blue-50 border-blue-200/40" iconColor="text-blue-500" />
            <KpiCard icon={FiClock} label="Pending" value={bookingCounts.pending} subtext={bookingCounts.pending > 0 ? "Awaiting response" : undefined} iconBg="bg-amber-50 border-amber-200/40" iconColor="text-amber-500" />
            <KpiCard icon={FiDollarSign} label="Total Earned" value={earnings ? `${earnings.totalEarned.toLocaleString()} ${earnings.currency}` : "—"} iconBg="bg-emerald-50 border-emerald-200/40" iconColor="text-emerald-500" />
            <KpiCard icon={FiTrendingUp} label="Conversion" value={`${conversionRate}%`} subtext="Completed / Total" iconBg="bg-violet-50 border-violet-200/40" iconColor="text-violet-500" />
            <KpiCard icon={FiStar} label="Rating" value={profile.rating ? `${profile.rating.toFixed(1)}` : "N/A"} subtext={profile.reviewCount ? `${profile.reviewCount} reviews` : "No reviews"} iconBg="bg-rose-50 border-rose-200/40" iconColor="text-rose-500" />
          </div>

          {/* ── Charts Row 1: Daily Bookings (area) + Booking Funnel (donut) ── */}
          <div className="grid lg:grid-cols-3 gap-6">
            <section className="lg:col-span-2 rounded-2xl border border-warm-200/50 bg-white p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200/40 flex items-center justify-center">
                  <FiCalendar className="w-4 h-4 text-blue-500" />
                </div>
                <div>
                  <h2 className="text-[15px] font-semibold text-slate-900">Booking Activity</h2>
                  <p className="text-[11px] text-slate-400 font-light">Past 7 days</p>
                </div>
              </div>
              {!analytics ? (
                <ChartLoader />
              ) : dailyBookingData.every((d) => d.bookings === 0) ? (
                <ChartEmpty icon={FiCalendar} message="No bookings this week" />
              ) : (
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dailyBookingData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="bookingGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(226,220,210,0.3)" vertical={false} />
                      <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} allowDecimals={false} />
                      <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value) => [`${value}`, "Bookings"]} />
                      <Area type="monotone" dataKey="bookings" stroke="#3b82f6" strokeWidth={2.5} fill="url(#bookingGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-warm-200/50 bg-white p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-9 h-9 rounded-xl bg-warm-50 border border-warm-200/40 flex items-center justify-center">
                  <FiEye className="w-4 h-4 text-slate-400" />
                </div>
                <div>
                  <h2 className="text-[15px] font-semibold text-slate-900">Booking Funnel</h2>
                  <p className="text-[11px] text-slate-400 font-light">Status breakdown</p>
                </div>
              </div>
              {!analytics ? (
                <ChartLoader />
              ) : bookingPieData.length === 0 ? (
                <ChartEmpty icon={FiCalendar} message="No bookings yet" />
              ) : (
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={bookingPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={3} dataKey="value" strokeWidth={0}>
                        {bookingPieData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value) => [`${value}`]} />
                      <Legend verticalAlign="bottom" iconType="circle" iconSize={7} wrapperStyle={{ fontSize: "10px", color: "#94a3b8" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </section>
          </div>

          {/* ── Charts Row 2: Daily Earnings (bar) + Earnings Snapshot ── */}
          <div className="grid lg:grid-cols-3 gap-6">
            <section className="lg:col-span-2 rounded-2xl border border-warm-200/50 bg-white p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200/40 flex items-center justify-center">
                  <FiDollarSign className="w-4 h-4 text-emerald-500" />
                </div>
                <div>
                  <h2 className="text-[15px] font-semibold text-slate-900">Revenue Trend</h2>
                  <p className="text-[11px] text-slate-400 font-light">Past 7 days (net)</p>
                </div>
              </div>
              {!analytics ? (
                <ChartLoader />
              ) : dailyEarningsData.every((d) => d.earnings === 0) ? (
                <ChartEmpty icon={FiDollarSign} message="No revenue this week" />
              ) : (
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dailyEarningsData} barSize={28} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(226,220,210,0.3)" vertical={false} />
                      <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                      <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value) => [`${Number(value).toLocaleString()}`, "Revenue"]} cursor={{ fill: "rgba(250,248,245,0.5)" }} />
                      <Bar dataKey="earnings" fill="#10b981" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-warm-200/50 bg-white p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200/40 flex items-center justify-center">
                  <FiCreditCard className="w-4 h-4 text-emerald-500" />
                </div>
                <div>
                  <h2 className="text-[15px] font-semibold text-slate-900">Earnings Snapshot</h2>
                  <p className="text-[11px] text-slate-400 font-light">All time</p>
                </div>
              </div>
              {!earnings ? (
                <ChartLoader />
              ) : (
                <div className="space-y-5">
                  <div className="text-center py-2">
                    <p className="font-display text-3xl font-bold text-slate-900 tracking-tight">
                      {earnings.availableBalance.toLocaleString()}
                    </p>
                    <p className="text-[12px] text-slate-400 font-light mt-1">Available Balance ({earnings.currency})</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-4 border-t border-warm-200/20">
                    <div className="text-center">
                      <div className="w-8 h-8 rounded-lg border bg-emerald-50 border-emerald-200/40 flex items-center justify-center mx-auto mb-2">
                        <FiArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
                      </div>
                      <p className="font-display text-lg font-bold text-slate-800">{earnings.totalEarned.toLocaleString()}</p>
                      <p className="text-[10px] text-slate-400 font-light uppercase tracking-luxury">Earned</p>
                    </div>
                    <div className="text-center">
                      <div className="w-8 h-8 rounded-lg border bg-amber-50 border-amber-200/40 flex items-center justify-center mx-auto mb-2">
                        <FiDollarSign className="w-3.5 h-3.5 text-amber-500" />
                      </div>
                      <p className="font-display text-lg font-bold text-slate-800">{earnings.totalWithdrawn.toLocaleString()}</p>
                      <p className="text-[10px] text-slate-400 font-light uppercase tracking-luxury">Withdrawn</p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-warm-200/20">
                    <div className="flex justify-between text-[11px] text-slate-400 font-light mb-2">
                      <span>Payments</span>
                      <span className="font-semibold text-slate-600">{earnings.paymentCount}</span>
                    </div>
                  </div>
                </div>
              )}
            </section>
          </div>

          {/* ── Booking Status Breakdown (horizontal bar) ── */}
          {analytics && totalBookingsFromStatus > 0 && (
            <section className="rounded-2xl border border-warm-200/50 bg-white p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-9 h-9 rounded-xl bg-warm-50 border border-warm-200/40 flex items-center justify-center">
                  <FiTrendingUp className="w-4 h-4 text-slate-400" />
                </div>
                <div>
                  <h2 className="text-[15px] font-semibold text-slate-900">Status Overview</h2>
                  <p className="text-[11px] text-slate-400 font-light">{totalBookingsFromStatus} total bookings</p>
                </div>
              </div>
              <div className="space-y-3">
                {Object.entries(analytics.bookingsByStatus)
                  .sort(([, a], [, b]) => b - a)
                  .map(([statusKey, count]) => {
                    const info = BOOKING_STATUS_COLORS[statusKey] ?? { color: "#94a3b8", label: statusKey };
                    const pct = Math.round((count / totalBookingsFromStatus) * 100);
                    return (
                      <div key={statusKey}>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: info.color }} />
                            <span className="text-[12px] font-medium text-slate-700">{info.label}</span>
                          </div>
                          <span className="text-[12px] text-slate-400 font-light">{count} ({pct}%)</span>
                        </div>
                        <div className="h-2 rounded-full bg-warm-100 overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${pct}%`, backgroundColor: info.color }} />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </section>
          )}

          {/* ── Profile Summary + Quick Actions ── */}
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 rounded-2xl border border-warm-200/50 bg-white p-6 sm:p-8">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-[15px] font-semibold text-slate-900">{profile.businessName}</h2>
                {!staffMember && (
                  <button onClick={() => router.push("/vendor/profile/setup")} className="cursor-pointer text-[12px] text-slate-400 hover:text-slate-600 flex items-center gap-1 transition-colors duration-500">
                    Edit Profile <FiArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4 text-[13px]">
                <div><span className="text-slate-400">Category:</span> <span className="capitalize text-slate-700">{profile.category}</span></div>
                <div><span className="text-slate-400">Phone:</span> <span className="text-slate-700">{profile.phoneNumber}</span></div>
                <div><span className="text-slate-400">Location:</span> <span className="text-slate-700">{profile.location}</span></div>
                {profile.yearsOfExperience && (
                  <div><span className="text-slate-400">Experience:</span> <span className="text-slate-700">{profile.yearsOfExperience} years</span></div>
                )}
              </div>
            </div>

            <div>
              <h2 className="text-[15px] font-semibold text-slate-900 mb-4">Quick Actions</h2>
              <div className="space-y-2.5">
                {[
                  { label: "Bookings", icon: FiCalendar, href: "/vendor/bookings", count: bookingCounts.pending > 0 ? bookingCounts.pending : undefined },
                  { label: "Availability", icon: FiEye, href: "/vendor/availability" },
                  { label: "Earnings", icon: FiDollarSign, href: "/vendor/earnings" },
                  { label: "Team", icon: FiUsers, href: "/vendor/team" },
                  { label: "Messages", icon: FiMessageSquare, href: "/vendor/messages" },
                ].map((action) => {
                  const Icon = action.icon;
                  return (
                    <button key={action.label} onClick={() => router.push(action.href)} className="cursor-pointer w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl border border-warm-200/50 bg-white text-left hover:border-warm-200 hover:shadow-[0_2px_12px_rgba(15,23,42,0.04)] transition-all duration-500 group">
                      <div className="w-9 h-9 rounded-xl bg-warm-50 border border-warm-200/40 flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-slate-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-[13px] font-medium text-slate-800">{action.label}</span>
                        {action.count !== undefined && (
                          <span className="ml-2 px-1.5 py-0.5 rounded-md bg-amber-50 text-[10px] font-semibold text-amber-500 border border-amber-200/40">{action.count}</span>
                        )}
                      </div>
                      <FiArrowRight className="w-3.5 h-3.5 text-slate-200 group-hover:text-slate-400 transition-all duration-500 group-hover:translate-x-0.5" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Suspended */}
      {profile && status === VendorStatus.SUSPENDED && (
        <div className="rounded-2xl border border-red-200/60 bg-white p-8 sm:p-10 text-center">
          <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-200/40 flex items-center justify-center mx-auto mb-4">
            <FiXCircle className="w-5 h-5 text-red-400" />
          </div>
          <h2 className="text-[16px] font-semibold text-slate-900 mb-2">Account Suspended</h2>
          <p className="text-[13px] text-slate-400 font-light max-w-md mx-auto">
            Your account has been suspended due to a policy violation. All features are locked. Contact support for assistance.
          </p>
        </div>
      )}

      {/* Deactivated */}
      {profile && status === VendorStatus.DEACTIVATED && (
        <div className="rounded-2xl border border-warm-200/50 bg-white p-8 sm:p-10 text-center">
          <div className="w-12 h-12 rounded-xl bg-warm-50 border border-warm-200/40 flex items-center justify-center mx-auto mb-4">
            <FiCheckCircle className="w-5 h-5 text-slate-300" />
          </div>
          <h2 className="text-[16px] font-semibold text-slate-900 mb-2">Account Closed</h2>
          <p className="text-[13px] text-slate-400 font-light">This vendor account has been permanently deactivated.</p>
        </div>
      )}
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, subtext, iconBg, iconColor }: {
  icon: typeof FiCalendar;
  label: string;
  value: string | number;
  subtext?: string;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <div className="rounded-2xl border border-warm-200/50 bg-white p-5 sm:p-6 flex items-start gap-4">
      <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${iconBg}`}>
        <Icon className={`w-4.5 h-4.5 ${iconColor}`} />
      </div>
      <div className="min-w-0">
        <p className="font-display text-2xl font-bold text-slate-900 tracking-tight leading-tight">{value}</p>
        <p className="text-[12px] text-slate-400 font-light mt-1">{label}</p>
        {subtext && <p className="text-[11px] text-amber-500 font-medium mt-1">{subtext}</p>}
      </div>
    </div>
  );
}

function ChartLoader() {
  return (
    <div className="h-[220px] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-warm-200/40 border-t-gold-400 rounded-full animate-spin" />
    </div>
  );
}

function ChartEmpty({ icon: Icon, message }: { icon: typeof FiCalendar; message: string }) {
  return (
    <div className="h-[220px] flex items-center justify-center flex-col gap-3">
      <div className="w-12 h-12 rounded-xl bg-warm-50 border border-warm-200/40 flex items-center justify-center">
        <Icon className="w-5 h-5 text-slate-300" />
      </div>
      <p className="text-[13px] text-slate-400 font-light">{message}</p>
    </div>
  );
}
