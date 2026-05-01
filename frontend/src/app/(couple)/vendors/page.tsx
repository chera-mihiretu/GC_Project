"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { FiSearch, FiMapPin, FiCheckCircle, FiFilter } from "react-icons/fi";
import { listVendors } from "@/services/public-vendor.service";
import { VENDOR_CATEGORIES } from "@/types/vendor";
import type { VendorProfile } from "@/types/vendor";

export default function VendorBrowsePage() {
  const [vendors, setVendors] = useState<VendorProfile[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [page, setPage] = useState(1);
  const limit = 12;

  const fetchVendors = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listVendors({
        category: category || undefined,
        location: location || undefined,
        page,
        limit,
      });
      setVendors(res.vendors);
      setTotal(res.total);
    } catch {
      setVendors([]);
    } finally {
      setLoading(false);
    }
  }, [category, location, page]);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 font-[family-name:var(--font-display)]">
          Find Vendors
        </h1>
        <p className="text-gray-500 mt-1">
          Browse verified wedding vendors and send booking requests.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200/80 p-5">
        <div className="flex items-center gap-2 mb-4">
          <FiFilter className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-700">Filters</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => { setCategory(e.target.value); setPage(1); }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-rose-300 focus:outline-none"
            >
              <option value="">All Categories</option>
              {VENDOR_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Location
            </label>
            <div className="relative">
              <FiMapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={location}
                onChange={(e) => { setLocation(e.target.value); setPage(1); }}
                placeholder="Search by location..."
                className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-rose-300 focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="text-center py-12">
          <p className="animate-pulse text-sm text-gray-400">Loading vendors...</p>
        </div>
      ) : vendors.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200/80 p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <FiSearch className="w-6 h-6 text-gray-400" />
          </div>
          <h3 className="text-sm font-semibold text-gray-700 mb-1">
            No vendors found
          </h3>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            Try adjusting your filters or check back later for new vendors.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {vendors.map((vendor) => (
              <Link key={vendor.id} href={`/vendors/${vendor.id}`}>
                <div className="bg-white rounded-xl border border-gray-200/80 p-5 hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer h-full flex flex-col">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500 flex-shrink-0">
                      <FiSearch className="w-5 h-5" />
                    </div>
                    <FiCheckCircle className="w-4 h-4 text-green-500" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">
                    {vendor.businessName || "Unnamed Vendor"}
                  </h3>
                  {vendor.category && (
                    <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium bg-rose-50 text-rose-600 mb-2 w-fit">
                      {vendor.category.charAt(0).toUpperCase() + vendor.category.slice(1)}
                    </span>
                  )}
                  {vendor.location && (
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-auto">
                      <FiMapPin className="w-3 h-3" />
                      {vendor.location}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 disabled:opacity-40 hover:bg-gray-50 transition-colors"
              >
                Previous
              </button>
              <span className="text-sm text-gray-500">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 disabled:opacity-40 hover:bg-gray-50 transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
