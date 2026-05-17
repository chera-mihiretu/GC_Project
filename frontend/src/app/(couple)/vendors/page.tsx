"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { listVendors, type VendorListParams } from "@/services/public-vendor.service";
import { VendorImage } from "@/components/ui/vendor-image";
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
  FiFilter,
  FiDollarSign,
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
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-editorial text-slate-400 mb-2">
            Discover
          </p>
          <h1 className="font-display text-3xl font-bold text-slate-900 tracking-headline">
            Wedding Vendors
          </h1>
          <p className="text-[13px] text-slate-400 font-light mt-2">
            Curated professionals to bring your vision to life
          </p>
        </div>
        {!loading && (
          <p className="text-[12px] text-slate-300 font-light shrink-0 pb-0.5">
            {total} vendor{total !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      {/* ── Filters ── */}
      <div className="rounded-2xl border border-warm-200/50 bg-white p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-warm-50 border border-warm-200/30 flex items-center justify-center">
            <FiFilter className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <p className="text-[12px] font-medium text-slate-600">Filter & Search</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative sm:col-span-2 lg:col-span-1">
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
                className="cursor-pointer absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-warm-100 flex items-center justify-center hover:bg-warm-200/60 transition-colors"
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
          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-warm-200/20">
            <span className="text-[11px] text-slate-400 font-light">
              {total} result{total !== 1 ? "s" : ""}
            </span>
            <button
              onClick={() => {
                setSearchInput(""); setSearch(""); setCategory(""); setLocation("");
                setSortIdx(0); setPage(1);
              }}
              className="cursor-pointer ml-auto text-[11px] text-gold-500 hover:text-gold-600 font-medium transition-colors"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* ── Vendor Grid ── */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-warm-200/30 bg-white overflow-hidden animate-pulse">
              <div className="aspect-[4/3] bg-warm-100/60" />
              <div className="p-5 space-y-3">
                <div className="h-4 bg-warm-100/60 rounded-lg w-3/4" />
                <div className="flex gap-1.5">
                  <div className="h-5 bg-warm-100/40 rounded-lg w-16" />
                  <div className="h-5 bg-warm-100/40 rounded-lg w-14" />
                </div>
                <div className="h-3 bg-warm-100/40 rounded-lg w-1/2" />
                <div className="h-3 bg-warm-100/40 rounded-lg w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : vendors.length === 0 ? (
        <div className="rounded-2xl border border-warm-200/50 border-dashed bg-white p-16 text-center">
          <div className="w-14 h-14 rounded-xl bg-warm-50 border border-warm-200/40 flex items-center justify-center mx-auto mb-4">
            <FiShoppingBag className="w-6 h-6 text-slate-300" />
          </div>
          <h3 className="text-[15px] font-semibold text-slate-700 mb-1">No vendors found</h3>
          <p className="text-[13px] text-slate-400 font-light max-w-sm mx-auto mb-5">
            Try adjusting your filters or search terms to discover wedding vendors.
          </p>
          {activeFilters > 0 && (
            <button
              onClick={() => {
                setSearchInput(""); setSearch(""); setCategory(""); setLocation("");
                setSortIdx(0); setPage(1);
              }}
              className="cursor-pointer px-5 py-2.5 text-[12px] font-medium text-slate-500 border border-warm-200/50 rounded-full hover:bg-warm-50 transition-all duration-500"
            >
              Clear all filters
            </button>
          )}
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
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="cursor-pointer flex items-center gap-1.5 px-4 py-2.5 text-[12px] font-medium rounded-xl border border-warm-200/50 bg-white disabled:opacity-30 hover:border-warm-200 hover:shadow-[0_2px_12px_rgba(15,23,42,0.04)] transition-all duration-500"
          >
            <FiChevronLeft className="w-3.5 h-3.5" /> Previous
          </button>

          <div className="flex items-center gap-1 px-2">
            {Array.from({ length: totalPages }).map((_, i) => {
              const p = i + 1;
              if (totalPages > 7 && p !== 1 && p !== totalPages && Math.abs(p - page) > 1) {
                if (p === 2 || p === totalPages - 1) return <span key={p} className="text-[11px] text-slate-300 px-1">...</span>;
                return null;
              }
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`cursor-pointer w-8 h-8 rounded-lg text-[12px] font-medium transition-all duration-500 ${
                    p === page
                      ? "bg-slate-900 text-white"
                      : "text-slate-400 hover:bg-warm-50"
                  }`}
                >
                  {p}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="cursor-pointer flex items-center gap-1.5 px-4 py-2.5 text-[12px] font-medium rounded-xl border border-warm-200/50 bg-white disabled:opacity-30 hover:border-warm-200 hover:shadow-[0_2px_12px_rgba(15,23,42,0.04)] transition-all duration-500"
          >
            Next <FiChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Vendor Card ── */

function VendorCard({ vendor }: { vendor: VendorProfile }) {
  const thumb = vendor.portfolio?.[0];
  const cats = vendor.category ?? [];
  const price = formatPrice(vendor.priceRangeMin, vendor.priceRangeMax);

  return (
    <Link href={`/vendors/${vendor.id}`} className="block h-full">
      <div className="group rounded-2xl border border-warm-200/40 bg-white overflow-hidden hover:border-warm-200/70 hover:shadow-[0_12px_40px_rgba(15,23,42,0.06)] transition-all duration-700 cursor-pointer h-full flex flex-col">
        {/* ── Image ── */}
        <div className="relative aspect-[4/3] bg-warm-50 overflow-hidden">
          <VendorImage
            src={thumb}
            alt={vendor.businessName ?? "Vendor"}
            className="object-cover group-hover:scale-[1.04] transition-transform duration-[900ms] ease-out"
            fallbackInitial={(vendor.businessName ?? "V").charAt(0)}
            fallbackClassName="flex flex-col items-center justify-center h-full w-full bg-gradient-to-br from-warm-50 to-warm-100/60"
          />

          {/* Gradient overlay at bottom */}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />

          {/* Rating badge */}
          {vendor.rating > 0 && (
            <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/95 backdrop-blur-sm shadow-sm">
              <FiStar className="w-3 h-3 text-amber-400 fill-amber-400" />
              <span className="text-[11px] font-bold text-slate-700">{vendor.rating.toFixed(1)}</span>
              {vendor.reviewCount > 0 && (
                <span className="text-[10px] text-slate-400 font-light">({vendor.reviewCount})</span>
              )}
            </div>
          )}

          {/* Category overlay */}
          {cats.length > 0 && (
            <div className="absolute bottom-3 left-3 flex flex-wrap gap-1">
              {cats.slice(0, 2).map((c) => (
                <span key={c} className="px-2 py-0.5 rounded-md bg-white/90 backdrop-blur-sm text-[10px] font-semibold text-slate-600 capitalize shadow-sm">
                  {c}
                </span>
              ))}
              {cats.length > 2 && (
                <span className="px-2 py-0.5 rounded-md bg-white/90 backdrop-blur-sm text-[10px] font-medium text-slate-400">
                  +{cats.length - 2}
                </span>
              )}
            </div>
          )}
        </div>

        {/* ── Content ── */}
        <div className="p-5 flex-1 flex flex-col">
          <h3 className="text-[14px] font-semibold text-slate-900 group-hover:text-slate-700 transition-colors duration-500 line-clamp-1 mb-1.5">
            {vendor.businessName ?? "Unnamed Vendor"}
          </h3>

          {vendor.description && (
            <p className="text-[11px] text-slate-400 font-light line-clamp-2 mb-3 leading-relaxed">
              {vendor.description}
            </p>
          )}

          <div className="mt-auto space-y-2">
            {vendor.location && (
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-light">
                <FiMapPin className="w-3 h-3 shrink-0 text-slate-300" />
                <span className="truncate">{vendor.location}</span>
              </div>
            )}
            {price && (
              <div className="flex items-center gap-1.5 text-[12px] font-medium text-slate-600">
                <FiDollarSign className="w-3 h-3 shrink-0 text-slate-300" />
                <span>{price}</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between mt-4 pt-3.5 border-t border-warm-200/20">
            <span className="text-[10px] uppercase tracking-luxury text-slate-300 font-medium">
              {vendor.yearsOfExperience
                ? `${vendor.yearsOfExperience} yr${vendor.yearsOfExperience > 1 ? "s" : ""} exp`
                : "View details"}
            </span>
            <span className="w-7 h-7 rounded-lg bg-warm-50 border border-warm-200/30 flex items-center justify-center group-hover:bg-slate-900 group-hover:border-slate-900 transition-all duration-500">
              <FiArrowRight className="w-3 h-3 text-slate-400 group-hover:text-white transition-colors duration-500" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
