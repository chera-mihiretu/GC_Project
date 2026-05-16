"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { listVendorsAdmin } from "@/services/admin-vendor.service";
import StatCard from "@/components/ui/stat-card";
import VendorStatusBadge from "@/components/admin/vendor-status-badge";
import { VendorStatus, type VendorProfile } from "@/types/vendor";
import {
  FiShoppingBag,
  FiClock,
  FiCheckCircle,
  FiAlertTriangle,
  FiArrowRight,
  FiUsers,
  FiBarChart2,
  FiActivity,
} from "react-icons/fi";

export default function AdminDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    verified: 0,
    suspended: 0,
  });
  const [recentPending, setRecentPending] = useState<VendorProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [allRes, pendingRes, verifiedRes, suspendedRes] =
          await Promise.all([
            listVendorsAdmin({ limit: 1 }),
            listVendorsAdmin({
              status: VendorStatus.PENDING_VERIFICATION,
              limit: 5,
            }),
            listVendorsAdmin({ status: VendorStatus.VERIFIED, limit: 1 }),
            listVendorsAdmin({ status: VendorStatus.SUSPENDED, limit: 1 }),
          ]);

        setStats({
          total: allRes.total,
          pending: pendingRes.total,
          verified: verifiedRes.total,
          suspended: suspendedRes.total,
        });
        setRecentPending(pendingRes.vendors);
      } catch {
        /* stats stay at 0 */
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  const firstName = session?.user?.name?.split(" ")[0] ?? "Admin";

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

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={FiShoppingBag}
          label="Total Vendors"
          value={loading ? "—" : stats.total}
          color="gray"
        />
        <StatCard
          icon={FiClock}
          label="Pending Review"
          value={loading ? "—" : stats.pending}
          subtext={stats.pending > 0 ? "Needs attention" : undefined}
          color="amber"
        />
        <StatCard
          icon={FiCheckCircle}
          label="Verified"
          value={loading ? "—" : stats.verified}
          color="green"
        />
        <StatCard
          icon={FiAlertTriangle}
          label="Suspended"
          value={loading ? "—" : stats.suspended}
          color="rose"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* ── Recent pending vendors ── */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[15px] font-semibold text-slate-900">
              Pending Verification
            </h2>
            {stats.pending > 0 && (
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
                <p className="text-[12px] text-slate-400 font-light">No vendors pending review right now</p>
              </div>
            ) : (
              <>
                {/* Table header */}
                <div className="hidden sm:grid grid-cols-[1fr,100px,80px,60px] gap-4 px-6 py-3 border-b border-warm-200/30 bg-warm-50/40">
                  <span className="text-[11px] font-semibold uppercase tracking-editorial text-slate-400">Business</span>
                  <span className="text-[11px] font-semibold uppercase tracking-editorial text-slate-400">Category</span>
                  <span className="text-[11px] font-semibold uppercase tracking-editorial text-slate-400">Date</span>
                  <span />
                </div>

                <div className="divide-y divide-warm-200/20">
                  {recentPending.map((vendor) => (
                    <button
                      key={vendor.id}
                      onClick={() => router.push(`/admin/vendors/${vendor.id}`)}
                      className="cursor-pointer w-full grid grid-cols-1 sm:grid-cols-[1fr,100px,80px,60px] gap-2 sm:gap-4 items-center px-6 py-4 text-left hover:bg-warm-50/30 transition-all duration-300 group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200/40 flex items-center justify-center shrink-0">
                          <span className="text-[11px] font-bold text-amber-500">
                            {(vendor.businessName ?? "?").charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-[14px] font-medium text-slate-800 truncate">
                            {vendor.businessName || "Unnamed"}
                          </p>
                          <p className="text-[11px] text-slate-400 font-light sm:hidden capitalize">
                            {vendor.category || "—"}
                          </p>
                        </div>
                      </div>
                      <p className="hidden sm:block text-[12px] text-slate-500 capitalize truncate">{vendor.category || "—"}</p>
                      <p className="hidden sm:block text-[12px] text-slate-400 font-light">{new Date(vendor.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
                      <span className="hidden sm:block text-[11px] text-amber-500 font-medium text-right opacity-0 group-hover:opacity-100 transition-opacity duration-500">Review</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Quick actions + activity ── */}
        <div className="space-y-6">
          <div>
            <h2 className="text-[15px] font-semibold text-slate-900 mb-4">
              Quick Actions
            </h2>
            <div className="space-y-2.5">
              {[
                { label: "Review Vendors", icon: FiShoppingBag, href: "/admin/vendors", ready: true },
                { label: "Manage Users", icon: FiUsers, href: "/admin/users", ready: true },
                { label: "View Reports", icon: FiBarChart2, href: "/admin/reports", ready: false },
              ].map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.label}
                    onClick={() => action.ready && router.push(action.href)}
                    className={`cursor-pointer w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl border text-left transition-all duration-500 ${
                      action.ready
                        ? "border-warm-200/50 bg-white hover:border-warm-200 hover:shadow-[0_2px_12px_rgba(15,23,42,0.04)] group"
                        : "border-warm-200/30 bg-warm-50/30 opacity-60 cursor-default"
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200/40 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-amber-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[13px] font-medium text-slate-800">{action.label}</span>
                      {!action.ready && (
                        <span className="ml-2 text-[10px] text-slate-400 uppercase tracking-luxury font-semibold">
                          Soon
                        </span>
                      )}
                    </div>
                    {action.ready && (
                      <FiArrowRight className="w-3.5 h-3.5 text-slate-200 group-hover:text-slate-400 transition-all duration-500 group-hover:translate-x-0.5" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <h2 className="text-[15px] font-semibold text-slate-900 mb-4">
              Activity
            </h2>
            <div className="rounded-2xl border border-warm-200/50 bg-white py-10 text-center">
              <div className="w-10 h-10 rounded-xl bg-warm-50 border border-warm-200/40 flex items-center justify-center mx-auto mb-3">
                <FiActivity className="w-4 h-4 text-slate-300" />
              </div>
              <p className="text-[12px] text-slate-400 font-light">
                System activity will appear here
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
