"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { listVendorsAdmin } from "@/services/admin-vendor.service";
import StatCard from "@/components/ui/stat-card";
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
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 font-display">
          Dashboard
        </h1>
        <p className="text-gray-500 mt-1">
          Welcome back, {firstName}. Here&apos;s what&apos;s happening.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={FiShoppingBag}
          label="Total Vendors"
          value={loading ? "..." : stats.total}
          color="gray"
        />
        <StatCard
          icon={FiClock}
          label="Pending Review"
          value={loading ? "..." : stats.pending}
          subtext={stats.pending > 0 ? "Needs attention" : undefined}
          color="amber"
        />
        <StatCard
          icon={FiCheckCircle}
          label="Verified"
          value={loading ? "..." : stats.verified}
          color="green"
        />
        <StatCard
          icon={FiAlertTriangle}
          label="Suspended"
          value={loading ? "..." : stats.suspended}
          color="rose"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent pending vendors */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Pending Verification
            </h2>
            {stats.pending > 0 && (
              <button
                onClick={() => router.push("/admin/vendors")}
                className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
              >
                View all <FiArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
          <div className="bg-white rounded-xl border border-gray-200/80 overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-gray-400 text-sm animate-pulse">
                Loading...
              </div>
            ) : recentPending.length === 0 ? (
              <div className="p-8 text-center">
                <FiCheckCircle className="w-8 h-8 text-green-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500 font-medium">All caught up</p>
                <p className="text-xs text-gray-400 mt-1">
                  No vendors pending review right now.
                </p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/60">
                    <th className="text-left px-4 py-3 font-medium text-gray-500">
                      Business
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 hidden sm:table-cell">
                      Category
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 hidden sm:table-cell">
                      Date
                    </th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {recentPending.map((vendor) => (
                    <tr
                      key={vendor.id}
                      onClick={() =>
                        router.push(`/admin/vendors/${vendor.id}`)
                      }
                      className="border-b border-gray-50 last:border-0 hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">
                          {vendor.businessName || "Unnamed"}
                        </div>
                        <div className="text-xs text-gray-400 sm:hidden capitalize">
                          {vendor.category || "—"}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 capitalize hidden sm:table-cell">
                        {vendor.category || "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">
                        {new Date(vendor.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-xs text-blue-600 font-medium">
                          Review
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Quick actions + activity */}
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Quick Actions
            </h2>
            <div className="space-y-3">
              {[
                {
                  label: "Review Vendors",
                  icon: FiShoppingBag,
                  href: "/admin/vendors",
                  ready: true,
                },
                {
                  label: "Manage Users",
                  icon: FiUsers,
                  href: "/admin/users",
                  ready: false,
                },
                {
                  label: "View Reports",
                  icon: FiBarChart2,
                  href: "/admin/reports",
                  ready: false,
                },
              ].map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.label}
                    onClick={() => action.ready && router.push(action.href)}
                    className={`w-full flex items-center gap-3 px-4 py-3 bg-white rounded-xl border border-gray-200/80 text-left transition-all ${
                      action.ready
                        ? "hover:border-gray-300 hover:shadow-sm cursor-pointer"
                        : "opacity-60 cursor-default"
                    }`}
                  >
                    <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center">
                      <Icon className="w-4 h-4 text-amber-600" />
                    </div>
                    <div className="flex-1">
                      <span className="text-sm font-medium text-gray-900">
                        {action.label}
                      </span>
                      {!action.ready && (
                        <span className="ml-2 text-[10px] text-gray-400">
                          Coming soon
                        </span>
                      )}
                    </div>
                    {action.ready && (
                      <FiArrowRight className="w-4 h-4 text-gray-300" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Activity
            </h2>
            <div className="bg-white rounded-xl border border-gray-200/80 p-6 text-center">
              <FiActivity className="w-6 h-6 text-gray-300 mx-auto mb-3" />
              <p className="text-xs text-gray-400">
                System activity will appear here.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
