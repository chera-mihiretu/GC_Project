"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  FiSearch,
  FiChevronLeft,
  FiChevronRight,
  FiShoppingBag,
  FiArrowRight,
  FiX,
} from "react-icons/fi";
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

const PAGE_SIZE = 10;

export default function AdminVendorsPage() {
  const router = useRouter();
  const [vendors, setVendors] = useState<VendorProfile[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchVendors = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listVendorsAdmin({
        status: statusFilter ? (statusFilter as VendorStatus) : undefined,
        search: search || undefined,
        page,
        limit: PAGE_SIZE,
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

  function handleSearchInput(value: string) {
    setSearchInput(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearch(value);
      setPage(1);
    }, 400);
  }

  function clearSearch() {
    setSearchInput("");
    setSearch("");
    setPage(1);
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-10">
      {/* ── Header ── */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-editorial text-slate-400 mb-2">
          Administration
        </p>
        <h1 className="font-display text-3xl font-bold text-slate-900 tracking-headline">
          Vendor Management
        </h1>
        <p className="text-[14px] text-slate-400 font-light mt-2">
          Review applications, manage vendor status, and monitor compliance
        </p>
      </div>

      {/* ── Filters row ── */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => handleSearchInput(e.target.value)}
            placeholder="Search by business name..."
            className="w-full pl-11 pr-10 py-3 border border-warm-200/60 rounded-xl text-[13px] text-slate-800 bg-white outline-none transition-all duration-500 placeholder:text-slate-300 focus:border-slate-300 focus:shadow-[0_0_0_3px_rgba(250,248,245,1),0_0_0_5px_rgba(201,168,76,0.15)]"
          />
          {searchInput && (
            <button
              onClick={clearSearch}
              className="cursor-pointer absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-md flex items-center justify-center text-slate-300 hover:text-slate-500 transition-colors duration-300"
            >
              <FiX className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status tabs */}
        <div className="rounded-xl bg-warm-50/60 border border-warm-200/30 p-1 flex gap-0.5 overflow-x-auto">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => { setStatusFilter(tab.value); setPage(1); }}
              className={`cursor-pointer px-3.5 py-2 rounded-lg text-[12px] font-medium whitespace-nowrap transition-all duration-500 ${
                statusFilter === tab.value
                  ? "bg-white text-slate-900 shadow-[0_1px_4px_rgba(15,23,42,0.06)]"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="rounded-2xl border border-warm-200/50 bg-white overflow-hidden">
        {loading ? (
          <div className="divide-y divide-warm-200/20">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-6 sm:px-8 py-5 animate-pulse">
                <div className="w-10 h-10 bg-warm-100 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-40 bg-warm-100 rounded" />
                  <div className="h-3 w-24 bg-warm-100 rounded" />
                </div>
                <div className="h-6 w-20 bg-warm-100 rounded-lg" />
              </div>
            ))}
          </div>
        ) : vendors.length === 0 ? (
          <div className="py-20 text-center">
            <div className="w-14 h-14 rounded-2xl bg-warm-50 border border-warm-200/40 flex items-center justify-center mx-auto mb-5">
              <FiShoppingBag className="w-6 h-6 text-slate-300" />
            </div>
            <p className="text-[15px] font-medium text-slate-500 mb-1">No vendors found</p>
            <p className="text-[13px] text-slate-400 font-light">
              {search ? "Try a different search term" : "No vendors match the selected filter"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-warm-200/30">
            {vendors.map((vendor) => {
              const categories = Array.isArray(vendor.category) ? vendor.category : vendor.category ? [vendor.category] : [];
              return (
                <button
                  key={vendor.id}
                  onClick={() => router.push(`/admin/vendors/${vendor.id}`)}
                  className="cursor-pointer w-full text-left px-6 sm:px-8 py-5 sm:py-6 hover:bg-warm-50/30 transition-all duration-500 group"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-warm-50 border border-warm-200/40 flex items-center justify-center shrink-0">
                      <span className="text-[13px] font-bold text-slate-400">
                        {(vendor.businessName ?? "?").charAt(0).toUpperCase()}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <p className="text-[14px] font-medium text-slate-800">
                          {vendor.businessName || "Unnamed"}
                        </p>
                        <VendorStatusBadge status={vendor.status} />
                      </div>

                      {categories.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2.5">
                          {categories.map((cat) => (
                            <span
                              key={cat}
                              className="px-2.5 py-0.5 rounded-lg bg-warm-50 border border-warm-200/30 text-[11px] font-medium text-slate-500 capitalize"
                            >
                              {cat.replace(/_/g, " ")}
                            </span>
                          ))}
                        </div>
                      )}

                      <p className="text-[11px] text-slate-400 font-light mt-2">
                        Registered {new Date(vendor.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </div>

                    <FiArrowRight className="w-4 h-4 text-slate-200 shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-all duration-500 group-hover:translate-x-0.5" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Pagination ── */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between rounded-2xl border border-warm-200/30 bg-white px-6 sm:px-8 py-4">
          <span className="text-[13px] text-slate-400 font-light">
            Page <span className="text-slate-600 font-medium">{page}</span> of{" "}
            <span className="text-slate-600 font-medium">{totalPages}</span>
            <span className="hidden sm:inline ml-1.5">· {total} total</span>
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="cursor-pointer flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-medium text-slate-600 border border-warm-200/60 hover:border-warm-200 hover:bg-warm-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-500"
            >
              <FiChevronLeft className="w-3.5 h-3.5" /> Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="cursor-pointer flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-medium text-slate-600 border border-warm-200/60 hover:border-warm-200 hover:bg-warm-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-500"
            >
              Next <FiChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
