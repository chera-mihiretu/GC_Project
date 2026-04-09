"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import VendorStatusBadge from "@/components/admin/vendor-status-badge";
import { listVendorsAdmin } from "@/services/admin-vendor.service";
import { VendorStatus, type VendorProfile } from "@/types/vendor";

const STATUS_TABS = [
  { label: "All", value: "" },
  { label: "Pending", value: VendorStatus.PENDING_VERIFICATION },
  { label: "Verified", value: VendorStatus.VERIFIED },
  { label: "Rejected", value: VendorStatus.REJECTED },
  { label: "Suspended", value: VendorStatus.SUSPENDED },
  { label: "Deactivated", value: VendorStatus.DEACTIVATED },
];

export default function AdminVendorsPage() {
  const router = useRouter();
  const [vendors, setVendors] = useState<VendorProfile[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchVendors = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listVendorsAdmin({
        status: statusFilter ? (statusFilter as VendorStatus) : undefined,
        search: search || undefined,
        page,
        limit: 20,
      });
      setVendors(data.vendors);
      setTotal(data.total);
    } catch {
      setVendors([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search, page]);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Vendor Management
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Review and manage vendor applications
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => {
              setStatusFilter(tab.value);
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              statusFilter === tab.value
                ? "bg-gray-900 text-white"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-100"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div>
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search by business name..."
          className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-rose-300 outline-none"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200/80 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm animate-pulse">Loading...</div>
        ) : vendors.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            No vendors found
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                <th className="text-left px-4 py-3 font-medium text-gray-500">
                  Business
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">
                  Category
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">
                  Status
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">
                  Date
                </th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {vendors.map((vendor) => (
                <tr
                  key={vendor.id}
                  className="border-b border-gray-50 last:border-0 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() =>
                    router.push(`/admin/vendors/${vendor.id}`)
                  }
                >
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {vendor.businessName || "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-600 capitalize">
                    {vendor.category || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <VendorStatusBadge status={vendor.status} />
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(vendor.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-gray-400 text-xs">
                      View &rarr;
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-sm text-gray-500">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
