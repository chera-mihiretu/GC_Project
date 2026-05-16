"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSession, authClient } from "@/lib/auth-client";
import { listVendorsAdmin } from "@/services/admin-vendor.service";
import { listReviewsAdmin } from "@/services/admin-review.service";
import { VendorStatus, type VendorProfile } from "@/types/vendor";
import {
  FiShoppingBag,
  FiClock,
  FiCheckCircle,
  FiAlertTriangle,
  FiArrowRight,
  FiUsers,
  FiStar,
  FiTrendingUp,
  FiShield,
  FiUser,
  FiXCircle,
} from "react-icons/fi";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface VendorStats {
  total: number;
  pending: number;
  verified: number;
  rejected: number;
  suspended: number;
  deactivated: number;
  registered: number;
}

interface ReviewStats {
  total: number;
  approved: number;
  rejected: number;
}

interface UserStats {
  total: number;
  couples: number;
  vendors: number;
  admins: number;
}

const PIE_COLORS = ["#10b981", "#f59e0b", "#f97316", "#ef4444", "#94a3b8", "#cbd5e1"];

export default function AdminDashboard() {
  const { data: session } = useSession();
  const router = useRouter();

  const [vendorStats, setVendorStats] = useState<VendorStats | null>(null);
  const [reviewStats, setReviewStats] = useState<ReviewStats | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [recentPending, setRecentPending] = useState<VendorProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAll() {
      try {
        const [
          allVendors,
          pendingVendors,
          verifiedVendors,
          rejectedVendors,
          suspendedVendors,
          deactivatedVendors,
          registeredVendors,
          allReviews,
          approvedReviews,
          rejectedReviews,
        ] = await Promise.all([
          listVendorsAdmin({ limit: 1 }),
          listVendorsAdmin({ status: VendorStatus.PENDING_VERIFICATION, limit: 5 }),
          listVendorsAdmin({ status: VendorStatus.VERIFIED, limit: 1 }),
          listVendorsAdmin({ status: VendorStatus.REJECTED, limit: 1 }),
          listVendorsAdmin({ status: VendorStatus.SUSPENDED, limit: 1 }),
          listVendorsAdmin({ status: VendorStatus.DEACTIVATED, limit: 1 }),
          listVendorsAdmin({ status: VendorStatus.REGISTERED, limit: 1 }),
          listReviewsAdmin({ limit: 1 }),
          listReviewsAdmin({ isApproved: true, limit: 1 }),
          listReviewsAdmin({ isApproved: false, limit: 1 }),
        ]);

        setVendorStats({
          total: allVendors.total,
          pending: pendingVendors.total,
          verified: verifiedVendors.total,
          rejected: rejectedVendors.total,
          suspended: suspendedVendors.total,
          deactivated: deactivatedVendors.total,
          registered: registeredVendors.total,
        });

        setRecentPending(pendingVendors.vendors);

        setReviewStats({
          total: allReviews.total,
          approved: approvedReviews.total,
          rejected: rejectedReviews.total,
        });

        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const [allUsers, coupleUsers, vendorUsers, adminUsers] = await Promise.all([
            authClient.admin.listUsers({ query: { limit: 1, offset: 0 } as any }),
            authClient.admin.listUsers({ query: { limit: 1, offset: 0, filterField: "role", filterValue: "couple", filterOperator: "eq" } as any }),
            authClient.admin.listUsers({ query: { limit: 1, offset: 0, filterField: "role", filterValue: "vendor", filterOperator: "eq" } as any }),
            authClient.admin.listUsers({ query: { limit: 1, offset: 0, filterField: "role", filterValue: "admin", filterOperator: "eq" } as any }),
          ]);
          setUserStats({
            total: (allUsers.data?.total as number) ?? 0,
            couples: (coupleUsers.data?.total as number) ?? 0,
            vendors: (vendorUsers.data?.total as number) ?? 0,
            admins: (adminUsers.data?.total as number) ?? 0,
          });
        } catch {
          setUserStats(null);
        }
      } catch {
        /* stats stay null */
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []);

  const firstName = session?.user?.name?.split(" ")[0] ?? "Admin";

  const vendorPieData = useMemo(() => {
    if (!vendorStats) return [];
    return [
      { name: "Verified", value: vendorStats.verified, color: "#10b981" },
      { name: "Pending", value: vendorStats.pending, color: "#f59e0b" },
      { name: "Rejected", value: vendorStats.rejected, color: "#f97316" },
      { name: "Suspended", value: vendorStats.suspended, color: "#ef4444" },
      { name: "Registered", value: vendorStats.registered, color: "#94a3b8" },
      { name: "Deactivated", value: vendorStats.deactivated, color: "#cbd5e1" },
    ].filter((d) => d.value > 0);
  }, [vendorStats]);

  const vendorBarData = useMemo(() => {
    if (!vendorStats) return [];
    return [
      { name: "Verified", count: vendorStats.verified, fill: "#10b981" },
      { name: "Pending", count: vendorStats.pending, fill: "#f59e0b" },
      { name: "Rejected", count: vendorStats.rejected, fill: "#f97316" },
      { name: "Suspended", count: vendorStats.suspended, fill: "#ef4444" },
      { name: "Registered", count: vendorStats.registered, fill: "#94a3b8" },
    ].filter((d) => d.count > 0);
  }, [vendorStats]);

  const userBarData = useMemo(() => {
    if (!userStats) return [];
    return [
      { name: "Couples", count: userStats.couples, fill: "#f43f5e" },
      { name: "Vendors", count: userStats.vendors, fill: "#3b82f6" },
      { name: "Admins", count: userStats.admins, fill: "#f59e0b" },
    ];
  }, [userStats]);

  const reviewRate = reviewStats && reviewStats.total > 0
    ? Math.round((reviewStats.approved / reviewStats.total) * 100)
    : 0;

  return (
    <div className="space-y-10">
      {/* ── Header ── */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-editorial text-slate-400 mb-2">
          Overview
        </p>
        <h1 className="font-display text-3xl font-bold text-slate-900 tracking-headline">
          Welcome back, {firstName}
        </h1>
        <p className="text-[14px] text-slate-400 font-light mt-2">
          Here&apos;s what&apos;s happening across the platform
        </p>
      </div>

      {/* ── Top KPI row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={FiShoppingBag}
          label="Total Vendors"
          value={loading ? "—" : (vendorStats?.total ?? 0)}
          iconBg="bg-warm-50 border-warm-200/40"
          iconColor="text-slate-400"
        />
        <KpiCard
          icon={FiClock}
          label="Pending Review"
          value={loading ? "—" : (vendorStats?.pending ?? 0)}
          subtext={vendorStats && vendorStats.pending > 0 ? "Needs attention" : undefined}
          iconBg="bg-amber-50 border-amber-200/40"
          iconColor="text-amber-500"
        />
        <KpiCard
          icon={FiUsers}
          label="Total Users"
          value={loading ? "—" : (userStats?.total ?? 0)}
          iconBg="bg-blue-50 border-blue-200/40"
          iconColor="text-blue-500"
        />
        <KpiCard
          icon={FiStar}
          label="Total Reviews"
          value={loading ? "—" : (reviewStats?.total ?? 0)}
          subtext={reviewStats && reviewStats.total > 0 ? `${reviewRate}% approved` : undefined}
          iconBg="bg-emerald-50 border-emerald-200/40"
          iconColor="text-emerald-500"
        />
      </div>

      {/* ── Charts row ── */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Vendor status pie chart */}
        <section className="rounded-2xl border border-warm-200/50 bg-white p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-xl bg-warm-50 border border-warm-200/40 flex items-center justify-center">
              <FiShoppingBag className="w-4 h-4 text-slate-400" />
            </div>
            <div>
              <h2 className="text-[15px] font-semibold text-slate-900">Vendor Distribution</h2>
              <p className="text-[11px] text-slate-400 font-light">By verification status</p>
            </div>
          </div>

          {loading ? (
            <div className="h-[260px] flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-warm-200/40 border-t-gold-400 rounded-full animate-spin" />
            </div>
          ) : vendorPieData.length === 0 ? (
            <div className="h-[260px] flex items-center justify-center">
              <p className="text-[13px] text-slate-400 font-light">No vendor data yet</p>
            </div>
          ) : (
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={vendorPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {vendorPieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid rgba(226,220,210,0.4)",
                      boxShadow: "0 8px 30px rgba(15,23,42,0.08)",
                      fontSize: "12px",
                      padding: "8px 14px",
                    }}
                    formatter={(value) => [`${value}`]}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: "11px", color: "#94a3b8" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        {/* Vendor status bar chart */}
        <section className="rounded-2xl border border-warm-200/50 bg-white p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-xl bg-warm-50 border border-warm-200/40 flex items-center justify-center">
              <FiTrendingUp className="w-4 h-4 text-slate-400" />
            </div>
            <div>
              <h2 className="text-[15px] font-semibold text-slate-900">Vendor Pipeline</h2>
              <p className="text-[11px] text-slate-400 font-light">Status breakdown</p>
            </div>
          </div>

          {loading ? (
            <div className="h-[260px] flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-warm-200/40 border-t-gold-400 rounded-full animate-spin" />
            </div>
          ) : vendorBarData.length === 0 ? (
            <div className="h-[260px] flex items-center justify-center">
              <p className="text-[13px] text-slate-400 font-light">No vendor data yet</p>
            </div>
          ) : (
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={vendorBarData} barSize={32} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(226,220,210,0.3)" vertical={false} />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid rgba(226,220,210,0.4)",
                      boxShadow: "0 8px 30px rgba(15,23,42,0.08)",
                      fontSize: "12px",
                      padding: "8px 14px",
                    }}
                    formatter={(value) => [`${value}`, "Count"]}
                    cursor={{ fill: "rgba(250,248,245,0.5)" }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {vendorBarData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>
      </div>

      {/* ── Second row: Users + Reviews ── */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Users by role */}
        <section className="rounded-2xl border border-warm-200/50 bg-white p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200/40 flex items-center justify-center">
              <FiUsers className="w-4 h-4 text-blue-500" />
            </div>
            <div>
              <h2 className="text-[15px] font-semibold text-slate-900">User Breakdown</h2>
              <p className="text-[11px] text-slate-400 font-light">By role</p>
            </div>
          </div>

          {loading || !userStats ? (
            <div className="h-[200px] flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-warm-200/40 border-t-gold-400 rounded-full animate-spin" />
            </div>
          ) : (
            <>
              <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={userBarData} barSize={40} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(226,220,210,0.3)" vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ borderRadius: "12px", border: "1px solid rgba(226,220,210,0.4)", boxShadow: "0 8px 30px rgba(15,23,42,0.08)", fontSize: "12px", padding: "8px 14px" }}
                      formatter={(value) => [`${value}`, "Users"]}
                      cursor={{ fill: "rgba(250,248,245,0.5)" }}
                    />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      {userBarData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-warm-200/20">
                {[
                  { icon: FiUser, label: "Couples", value: userStats.couples, color: "text-rose-500", bg: "bg-rose-50 border-rose-200/40" },
                  { icon: FiShoppingBag, label: "Vendors", value: userStats.vendors, color: "text-blue-500", bg: "bg-blue-50 border-blue-200/40" },
                  { icon: FiShield, label: "Admins", value: userStats.admins, color: "text-amber-500", bg: "bg-amber-50 border-amber-200/40" },
                ].map((item) => (
                  <div key={item.label} className="text-center">
                    <div className={`w-8 h-8 rounded-lg border flex items-center justify-center mx-auto mb-2 ${item.bg}`}>
                      <item.icon className={`w-3.5 h-3.5 ${item.color}`} />
                    </div>
                    <p className="font-display text-lg font-bold text-slate-800">{item.value}</p>
                    <p className="text-[10px] text-slate-400 font-light uppercase tracking-luxury">{item.label}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>

        {/* Review health */}
        <section className="rounded-2xl border border-warm-200/50 bg-white p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200/40 flex items-center justify-center">
              <FiStar className="w-4 h-4 text-emerald-500" />
            </div>
            <div>
              <h2 className="text-[15px] font-semibold text-slate-900">Review Health</h2>
              <p className="text-[11px] text-slate-400 font-light">Moderation overview</p>
            </div>
          </div>

          {loading || !reviewStats ? (
            <div className="h-[200px] flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-warm-200/40 border-t-gold-400 rounded-full animate-spin" />
            </div>
          ) : reviewStats.total === 0 ? (
            <div className="h-[200px] flex items-center justify-center flex-col gap-3">
              <div className="w-12 h-12 rounded-xl bg-warm-50 border border-warm-200/40 flex items-center justify-center">
                <FiStar className="w-5 h-5 text-slate-300" />
              </div>
              <p className="text-[13px] text-slate-400 font-light">No reviews submitted yet</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Big approval rate */}
              <div className="text-center py-4">
                <p className="font-display text-5xl font-bold text-slate-900 tracking-tight">{reviewRate}%</p>
                <p className="text-[12px] text-slate-400 font-light mt-1">Approval Rate</p>
              </div>

              {/* Progress bar */}
              <div>
                <div className="flex justify-between text-[11px] text-slate-400 font-light mb-2">
                  <span>Approved</span>
                  <span>Rejected</span>
                </div>
                <div className="h-3 rounded-full bg-warm-100 overflow-hidden flex">
                  <div
                    className="h-full bg-emerald-400 rounded-l-full transition-all duration-1000"
                    style={{ width: `${reviewRate}%` }}
                  />
                  <div
                    className="h-full bg-red-400 rounded-r-full transition-all duration-1000"
                    style={{ width: `${100 - reviewRate}%` }}
                  />
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-3 pt-4 border-t border-warm-200/20">
                {[
                  { icon: FiStar, label: "Total", value: reviewStats.total, color: "text-slate-400", bg: "bg-warm-50 border-warm-200/40" },
                  { icon: FiCheckCircle, label: "Approved", value: reviewStats.approved, color: "text-emerald-500", bg: "bg-emerald-50 border-emerald-200/40" },
                  { icon: FiXCircle, label: "Rejected", value: reviewStats.rejected, color: "text-red-400", bg: "bg-red-50 border-red-200/40" },
                ].map((item) => (
                  <div key={item.label} className="text-center">
                    <div className={`w-8 h-8 rounded-lg border flex items-center justify-center mx-auto mb-2 ${item.bg}`}>
                      <item.icon className={`w-3.5 h-3.5 ${item.color}`} />
                    </div>
                    <p className="font-display text-lg font-bold text-slate-800">{item.value}</p>
                    <p className="text-[10px] text-slate-400 font-light uppercase tracking-luxury">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>

      {/* ── Bottom: Pending + Quick actions ── */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent pending */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[15px] font-semibold text-slate-900">Pending Verification</h2>
            {vendorStats && vendorStats.pending > 0 && (
              <button
                onClick={() => router.push("/admin/vendors")}
                className="cursor-pointer text-[12px] text-slate-400 hover:text-slate-600 flex items-center gap-1 transition-colors duration-500"
              >
                View all <FiArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="rounded-2xl border border-warm-200/50 bg-white overflow-hidden">
            {loading ? (
              <div className="divide-y divide-warm-200/20">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 px-6 py-4 animate-pulse">
                    <div className="w-9 h-9 bg-warm-100 rounded-xl shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-4 w-32 bg-warm-100 rounded" />
                      <div className="h-3 w-20 bg-warm-100 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentPending.length === 0 ? (
              <div className="py-14 text-center">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200/40 flex items-center justify-center mx-auto mb-4">
                  <FiCheckCircle className="w-5 h-5 text-emerald-400" />
                </div>
                <p className="text-[14px] font-medium text-slate-500 mb-1">All caught up</p>
                <p className="text-[12px] text-slate-400 font-light">No vendors pending review</p>
              </div>
            ) : (
              <div className="divide-y divide-warm-200/20">
                {recentPending.map((vendor) => (
                  <button
                    key={vendor.id}
                    onClick={() => router.push(`/admin/vendors/${vendor.id}`)}
                    className="cursor-pointer w-full flex items-center gap-3.5 px-6 py-4 text-left hover:bg-warm-50/30 transition-all duration-300 group"
                  >
                    <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200/40 flex items-center justify-center shrink-0">
                      <span className="text-[11px] font-bold text-amber-500">
                        {(vendor.businessName ?? "?").charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-medium text-slate-800 truncate">
                        {vendor.businessName || "Unnamed"}
                      </p>
                      <p className="text-[11px] text-slate-400 font-light">
                        {new Date(vendor.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </div>
                    <span className="text-[11px] text-amber-500 font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-500 shrink-0">
                      Review
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div>
          <h2 className="text-[15px] font-semibold text-slate-900 mb-4">Quick Actions</h2>
          <div className="space-y-2.5">
            {[
              { label: "Review Vendors", icon: FiShoppingBag, href: "/admin/vendors", count: vendorStats?.pending },
              { label: "Manage Users", icon: FiUsers, href: "/admin/users", count: userStats?.total },
              { label: "Moderate Reviews", icon: FiStar, href: "/admin/reviews", count: reviewStats?.total },
            ].map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.label}
                  onClick={() => router.push(action.href)}
                  className="cursor-pointer w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl border border-warm-200/50 bg-white text-left hover:border-warm-200 hover:shadow-[0_2px_12px_rgba(15,23,42,0.04)] transition-all duration-500 group"
                >
                  <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200/40 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[13px] font-medium text-slate-800">{action.label}</span>
                    {!loading && action.count !== undefined && action.count > 0 && (
                      <span className="ml-2 px-1.5 py-0.5 rounded-md bg-amber-50 text-[10px] font-semibold text-amber-500 border border-amber-200/40">
                        {action.count}
                      </span>
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
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  subtext,
  iconBg,
  iconColor,
}: {
  icon: typeof FiShoppingBag;
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
