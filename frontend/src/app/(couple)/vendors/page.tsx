"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { listVendors, type VendorListParams } from "@/services/public-vendor.service";
import type { VendorProfile } from "@/types/vendor";
import { VENDOR_CATEGORIES } from "@/types/vendor";
import {
  FiSearch,
  FiMapPin,
  FiStar,
  FiArrowRight,
  FiChevronLeft,
  FiChevronRight,
  FiShoppingBag,
} from "react-icons/fi";

const SORT_OPTIONS = [
  { label: "Newest", sortBy: "createdAt" as const, order: "desc" as const },
  { label: "Name A–Z", sortBy: "businessName" as const, order: "asc" as const },
  { label: "Name Z–A", sortBy: "businessName" as const, order: "desc" as const },
];

const LIMIT = 12;

function formatPrice(min: number | null, max: number | null) {
  if (min == null && max == null) return null;
  const fmt = (v: number) =>
    v.toLocaleString("en-US", { style: "currency", currency: "ETB", maximumFractionDigits: 0 });
  if (min != null && max != null) return `${fmt(min)} – ${fmt(max)}`;
  if (min != null) return `From ${fmt(min)}`;
  return `Up to ${fmt(max!)}`;
}

export default function VendorListingPage() {
  const [vendors, setVendors] = useState<VendorProfile[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [sortIdx, setSortIdx] = useState(0);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchVendors = useCallback(
    async (params: VendorListParams) => {
      setLoading(true);
      try {
        const data = await listVendors(params);
        setVendors(data.vendors);
        setTotal(data.total);
      } catch {
        setVendors([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    const sort = SORT_OPTIONS[sortIdx];
    fetchVendors({
      search: search || undefined,
      category: category || undefined,
      location: location || undefined,
      page,
      limit: LIMIT,
      sortBy: sort.sortBy,
      order: sort.order,
    });
  }, [search, category, location, page, sortIdx, fetchVendors]);

  function handleSearchInput(value: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearch(value);
      setPage(1);
    }, 300);
  }

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 font-display">
          Find Vendors
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Browse verified wedding vendors for your special day
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200/80 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search vendors..."
              defaultValue={search}
              onChange={(e) => handleSearchInput(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-300 transition-all"
            />
          </div>

          {/* Category */}
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-300 transition-all capitalize"
          >
            <option value="">All Categories</option>
            {VENDOR_CATEGORIES.map((cat) => (
              <option key={cat} value={cat} className="capitalize">
                {cat}
              </option>
            ))}
          </select>

          {/* Location */}
          <div className="relative">
            <FiMapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Location..."
              value={location}
              onChange={(e) => {
                setLocation(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-300 transition-all"
            />
          </div>

          {/* Sort */}
          <select
            value={sortIdx}
            onChange={(e) => {
              setSortIdx(Number(e.target.value));
              setPage(1);
            }}
            className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-300 transition-all"
          >
            {SORT_OPTIONS.map((opt, i) => (
              <option key={i} value={i}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results count */}
      {!loading && (
        <p className="text-sm text-gray-500">
          {total} vendor{total !== 1 ? "s" : ""} found
        </p>
      )}

      {/* Vendor grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-gray-200/80 overflow-hidden animate-pulse"
            >
              <div className="aspect-16/10 bg-gray-100" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-100 rounded w-3/4" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
                <div className="h-3 bg-gray-100 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : vendors.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200/80 border-dashed p-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <FiShoppingBag className="w-6 h-6 text-gray-400" />
          </div>
          <h3 className="text-sm font-semibold text-gray-700 mb-1">
            No vendors found
          </h3>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            Try adjusting your filters or search terms to find wedding vendors.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {vendors.map((vendor) => (
            <VendorCard key={vendor.id} vendor={vendor} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="flex items-center gap-1.5 px-3.5 py-2 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
          >
            <FiChevronLeft className="w-4 h-4" /> Previous
          </button>
          <span className="text-sm text-gray-500">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="flex items-center gap-1.5 px-3.5 py-2 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
          >
            Next <FiChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

function VendorCard({ vendor }: { vendor: VendorProfile }) {
  const thumb = vendor.portfolio?.[0];
  const cats = vendor.category ?? [];
  const price = formatPrice(vendor.priceRangeMin, vendor.priceRangeMax);

  return (
    <Link href={`/vendors/${vendor.id}`}>
      <div className="group bg-white rounded-xl border border-gray-200/80 overflow-hidden hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer h-full flex flex-col">
        {/* Image */}
        <div className="relative aspect-16/10 bg-gray-100 overflow-hidden">
          {thumb ? (
            <Image
              src={thumb}
              alt={vendor.businessName ?? "Vendor"}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              unoptimized
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <FiShoppingBag className="w-8 h-8 text-gray-300" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 flex-1 flex flex-col">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="text-sm font-semibold text-gray-900 group-hover:text-rose-600 transition-colors line-clamp-1">
              {vendor.businessName ?? "Unnamed Vendor"}
            </h3>
            {vendor.rating > 0 && (
              <div className="flex items-center gap-1 shrink-0">
                <FiStar className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span className="text-xs font-medium text-gray-700">
                  {vendor.rating.toFixed(1)}
                </span>
              </div>
            )}
          </div>

          {/* Category badges */}
          {cats.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {cats.slice(0, 3).map((c) => (
                <span
                  key={c}
                  className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-rose-50 text-rose-600 capitalize"
                >
                  {c}
                </span>
              ))}
              {cats.length > 3 && (
                <span className="text-[10px] text-gray-400">
                  +{cats.length - 3}
                </span>
              )}
            </div>
          )}

          <div className="mt-auto pt-2 space-y-1">
            {vendor.location && (
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <FiMapPin className="w-3 h-3 shrink-0" />
                <span className="truncate">{vendor.location}</span>
              </div>
            )}
            {price && (
              <p className="text-xs font-medium text-gray-600">{price}</p>
            )}
          </div>

          <div className="flex items-center justify-end mt-3 pt-3 border-t border-gray-100">
            <span className="text-xs font-medium text-rose-500 group-hover:text-rose-600 flex items-center gap-1 transition-colors">
              View Profile <FiArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
