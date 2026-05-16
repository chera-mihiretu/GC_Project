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
  FiArrowRight,
  FiChevronLeft,
  FiChevronRight,
  FiShoppingBag,
  FiX,
  FiStar,
} from "react-icons/fi";

const SORT_OPTIONS = [
  { label: "Newest", sortBy: "createdAt" as const, order: "desc" as const },
  { label: "Name A–Z", sortBy: "businessName" as const, order: "asc" as const },
  { label: "Name Z–A", sortBy: "businessName" as const, order: "desc" as const },
];

const LIMIT = 12;

const INPUT_CLS =
  "w-full px-4 py-3 rounded-xl bg-warm-50/60 border border-warm-200/40 text-[13px] text-slate-800 placeholder:text-slate-300 outline-none transition-all duration-500 focus:border-gold-400/50 focus:ring-2 focus:ring-gold-400/10";

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
  const [searchInput, setSearchInput] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [sortIdx, setSortIdx] = useState(0);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchVendors = useCallback(async (params: VendorListParams) => {
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
  }, []);

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
    setSearchInput(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearch(value);
      setPage(1);
    }, 300);
  }

  const totalPages = Math.ceil(total / LIMIT);
  const activeFilters = [search, category, location].filter(Boolean).length;

  return (
    <div className="space-y-8">
      {/* ── Header ── */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-editorial text-slate-400 mb-2">
          Discover
        </p>
        <h1 className="font-display text-3xl font-bold text-slate-900 tracking-headline">
          Find Your Vendors
        </h1>
        <p className="text-[14px] text-slate-400 font-light mt-2">
          Browse verified wedding vendors for your special day
        </p>
      </div>

      {/* ── Filters ── */}
      <div className="rounded-2xl border border-warm-200/50 bg-white p-5 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
            <input
              type="text"
              placeholder="Search vendors..."
              value={searchInput}
              onChange={(e) => handleSearchInput(e.target.value)}
              className={`${INPUT_CLS} pl-10`}
            />
            {searchInput && (
              <button
                onClick={() => { setSearchInput(""); setSearch(""); setPage(1); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-warm-100 flex items-center justify-center hover:bg-warm-200/60 transition-colors cursor-pointer"
              >
                <FiX className="w-3 h-3 text-slate-400" />
              </button>
            )}
          </div>

          <select
            value={category}
            onChange={(e) => { setCategory(e.target.value); setPage(1); }}
            className={`${INPUT_CLS} capitalize appearance-none cursor-pointer`}
          >
            <option value="">All Categories</option>
            {VENDOR_CATEGORIES.map((cat) => (
              <option key={cat} value={cat} className="capitalize">{cat}</option>
            ))}
          </select>

          <div className="relative">
            <FiMapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
            <input
              type="text"
              placeholder="Location..."
              value={location}
              onChange={(e) => { setLocation(e.target.value); setPage(1); }}
              className={`${INPUT_CLS} pl-10`}
            />
          </div>

          <select
            value={sortIdx}
            onChange={(e) => { setSortIdx(Number(e.target.value)); setPage(1); }}
            className={`${INPUT_CLS} appearance-none cursor-pointer`}
          >
            {SORT_OPTIONS.map((opt, i) => (
              <option key={i} value={i}>{opt.label}</option>
            ))}
          </select>
        </div>

        {activeFilters > 0 && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-warm-200/20">
            <span className="text-[11px] text-slate-400 font-light">
              {total} result{total !== 1 ? "s" : ""}
            </span>
            <button
              onClick={() => {
                setSearchInput(""); setSearch(""); setCategory(""); setLocation("");
                setSortIdx(0); setPage(1);
              }}
              className="ml-auto text-[11px] text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* ── Results count (no filters) ── */}
      {!loading && activeFilters === 0 && (
        <p className="text-[12px] text-slate-400 font-light">
          {total} vendor{total !== 1 ? "s" : ""} available
        </p>
      )}

      {/* ── Vendor grid ── */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-warm-200/50 bg-white overflow-hidden animate-pulse">
              <div className="aspect-[4/3] bg-warm-100" />
              <div className="p-5 space-y-3">
                <div className="h-4 bg-warm-100 rounded w-3/4" />
                <div className="h-3 bg-warm-100 rounded w-1/2" />
                <div className="h-3 bg-warm-100 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : vendors.length === 0 ? (
        <div className="rounded-2xl border border-warm-200/50 border-dashed bg-white p-16 text-center">
          <div className="w-14 h-14 rounded-xl bg-warm-50 border border-warm-200/40 flex items-center justify-center mx-auto mb-4">
            <FiShoppingBag className="w-6 h-6 text-slate-300" />
          </div>
          <h3 className="text-[14px] font-semibold text-slate-700 mb-1">No vendors found</h3>
          <p className="text-[12px] text-slate-400 font-light max-w-sm mx-auto">
            Try adjusting your filters or search terms to discover wedding vendors.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {vendors.map((vendor) => (
            <VendorCard key={vendor.id} vendor={vendor} />
          ))}
        </div>
      )}

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="flex items-center gap-1.5 px-4 py-2.5 text-[12px] font-medium rounded-xl border border-warm-200/50 bg-white disabled:opacity-40 hover:border-warm-200 hover:shadow-[0_2px_12px_rgba(15,23,42,0.04)] transition-all duration-500 cursor-pointer"
          >
            <FiChevronLeft className="w-3.5 h-3.5" /> Previous
          </button>
          <span className="text-[12px] text-slate-400 font-light">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="flex items-center gap-1.5 px-4 py-2.5 text-[12px] font-medium rounded-xl border border-warm-200/50 bg-white disabled:opacity-40 hover:border-warm-200 hover:shadow-[0_2px_12px_rgba(15,23,42,0.04)] transition-all duration-500 cursor-pointer"
          >
            Next <FiChevronRight className="w-3.5 h-3.5" />
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
      <div className="group rounded-2xl border border-warm-200/50 bg-white overflow-hidden hover:border-warm-200 hover:shadow-[0_8px_30px_rgba(15,23,42,0.06)] transition-all duration-500 cursor-pointer h-full flex flex-col">
        {/* Image */}
        <div className="relative aspect-[4/3] bg-warm-50 overflow-hidden">
          {thumb ? (
            <Image
              src={thumb}
              alt={vendor.businessName ?? "Vendor"}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-700"
              unoptimized
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <FiShoppingBag className="w-8 h-8 text-slate-200" />
            </div>
          )}

          {/* Rating overlay */}
          {vendor.rating > 0 && (
            <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/90 backdrop-blur-sm border border-warm-200/30 shadow-sm">
              <FiStar className="w-3 h-3 text-amber-400 fill-amber-400" />
              <span className="text-[11px] font-semibold text-slate-700">{vendor.rating.toFixed(1)}</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-5 flex-1 flex flex-col">
          <h3 className="text-[14px] font-semibold text-slate-900 group-hover:text-slate-700 transition-colors duration-500 line-clamp-1 mb-2">
            {vendor.businessName ?? "Unnamed Vendor"}
          </h3>

          {cats.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {cats.slice(0, 3).map((c) => (
                <span key={c} className="px-2.5 py-0.5 rounded-lg bg-warm-50 border border-warm-200/30 text-[10px] font-medium text-slate-500 capitalize">
                  {c}
                </span>
              ))}
              {cats.length > 3 && (
                <span className="text-[10px] text-slate-300 font-light self-center">+{cats.length - 3}</span>
              )}
            </div>
          )}

          <div className="mt-auto pt-2 space-y-1.5">
            {vendor.location && (
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-light">
                <FiMapPin className="w-3 h-3 shrink-0 text-slate-300" />
                <span className="truncate">{vendor.location}</span>
              </div>
            )}
            {price && (
              <p className="text-[12px] font-medium text-slate-600">{price}</p>
            )}
          </div>

          <div className="flex items-center justify-end mt-4 pt-4 border-t border-warm-200/20">
            <span className="text-[11px] font-medium text-slate-400 group-hover:text-slate-600 flex items-center gap-1 transition-all duration-500 group-hover:translate-x-0.5">
              View Profile <FiArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
