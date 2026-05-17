"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { VendorImage, VendorImgTag } from "@/components/ui/vendor-image";
import {
  FiX,
  FiMapPin,
  FiPhone,
  FiDollarSign,
  FiBriefcase,
  FiCheckCircle,
  FiExternalLink,
  FiLoader,
  FiMessageSquare,
  FiFilm,
  FiImage,
  FiChevronLeft,
  FiChevronRight,
  FiCalendar,
} from "react-icons/fi";
import {
  getVendorDetail,
  getVendorPortfolio,
  startConversation,
  type PublicPortfolioItem,
} from "@/services/public-vendor.service";
import {
  getVendorAvailability,
  type AvailabilityRange,
} from "@/services/availability.service";
import { StarRating } from "@/components/review/star-rating";
import { ReviewList } from "@/components/review/review-list";
import type { VendorProfile } from "@/types/vendor";
import { useRouter } from "next/navigation";

interface Props {
  vendorId: string | null;
  onClose: () => void;
}

function formatPrice(min: number | null, max: number | null) {
  if (min == null && max == null) return null;
  const fmt = (v: number) =>
    v.toLocaleString("en-US", { style: "currency", currency: "ETB", maximumFractionDigits: 0 });
  if (min != null && max != null) return `${fmt(min)} – ${fmt(max)}`;
  if (min != null) return `From ${fmt(min)}`;
  return `Up to ${fmt(max!)}`;
}

function toDateStr(y: number, m: number, d: number) {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function AvailabilityCalendar({ vendorProfileId }: { vendorProfileId: string }) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [ranges, setRanges] = useState<AvailabilityRange[]>([]);
  const [loading, setLoading] = useState(true);

  const monthKey = `${year}-${String(month).padStart(2, "0")}`;
  const monthLabel = new Date(year, month - 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDow = new Date(year, month - 1, 1).getDay();
  const todayStr = toDateStr(today.getFullYear(), today.getMonth() + 1, today.getDate());
  const isPrevDisabled = year === today.getFullYear() && month === today.getMonth() + 1;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getVendorAvailability(vendorProfileId, monthKey)
      .then((data) => { if (!cancelled) setRanges(data); })
      .catch(() => { if (!cancelled) setRanges([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [vendorProfileId, monthKey]);

  function goNext() {
    if (month === 12) { setYear((y) => y + 1); setMonth(1); }
    else setMonth((m) => m + 1);
  }
  function goPrev() {
    if (isPrevDisabled) return;
    if (month === 1) { setYear((y) => y - 1); setMonth(12); }
    else setMonth((m) => m - 1);
  }

  function isAvailable(dateStr: string) {
    return ranges.some((r) => dateStr >= r.startDate && dateStr <= r.endDate);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <button onClick={goPrev} disabled={isPrevDisabled} className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 transition-colors">
          <FiChevronLeft className="w-4 h-4 text-gray-600" />
        </button>
        <span className="text-xs font-semibold text-gray-900">{monthLabel}</span>
        <button onClick={goNext} className="p-1 rounded hover:bg-gray-100 transition-colors">
          <FiChevronRight className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-0.5 mb-0.5">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div key={i} className="text-center text-[10px] font-medium text-gray-400 py-1">{d}</div>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <FiLoader className="w-4 h-4 text-gray-300 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-0.5">
          {Array.from({ length: firstDow }).map((_, i) => <div key={`e-${i}`} />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateStr = toDateStr(year, month, day);
            const isPast = dateStr < todayStr;
            const avail = isAvailable(dateStr);
            const isToday = dateStr === todayStr;

            return (
              <div
                key={day}
                className={`relative w-full aspect-square flex items-center justify-center rounded text-[11px] ${
                  isPast
                    ? "text-gray-300"
                    : avail
                      ? "bg-green-100 text-green-700 font-medium"
                      : "text-gray-600"
                }`}
              >
                {day}
                {isToday && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-rose-500" />
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="flex items-center gap-3 mt-2 pt-2 border-t border-gray-100">
        <div className="flex items-center gap-1 text-[10px] text-gray-500">
          <div className="w-2.5 h-2.5 rounded bg-green-100 border border-green-200" />
          Available
        </div>
        <div className="flex items-center gap-1 text-[10px] text-gray-500">
          <div className="w-2.5 h-2.5 rounded bg-white border border-gray-200" />
          Not set
        </div>
      </div>
    </div>
  );
}

export default function VendorDetailPanel({ vendorId, onClose }: Props) {
  const router = useRouter();
  const [vendor, setVendor] = useState<VendorProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [portfolioItems, setPortfolioItems] = useState<Record<string, PublicPortfolioItem[]>>({});
  const [activeTab, setActiveTab] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  const fetchData = useCallback(async (id: string) => {
    setLoading(true);
    setVendor(null);
    setPortfolioItems({});
    setActiveTab("");
    try {
      const [v, p] = await Promise.all([
        getVendorDetail(id),
        getVendorPortfolio(id),
      ]);
      setVendor(v);
      setPortfolioItems(p);
      const tabs = Object.keys(p);
      if (tabs.length > 0) setActiveTab(tabs[0]);
    } catch {
      // keep empty state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (vendorId) {
      fetchData(vendorId);
    }
  }, [vendorId, fetchData]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (vendorId) {
      document.addEventListener("keydown", onKey);
      return () => document.removeEventListener("keydown", onKey);
    }
  }, [vendorId, onClose]);

  async function handleChat() {
    if (!vendor) return;
    setChatLoading(true);
    try {
      const conv = await startConversation(vendor.userId);
      router.push(`/messages?cid=${conv.id}`);
    } catch {
      // ignore
    } finally {
      setChatLoading(false);
    }
  }

  const isOpen = vendorId !== null;
  const cats = vendor?.category ?? [];
  const price = vendor ? formatPrice(vendor.priceRangeMin, vendor.priceRangeMax) : null;
  const socialMedia = vendor?.socialMedia ?? {};
  const portfolioTabs = Object.keys(portfolioItems);
  const currentTabItems = portfolioItems[activeTab] ?? [];

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/30 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-lg bg-white shadow-2xl transform transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Vendor Details</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <FiX className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto h-[calc(100%-57px)] px-5 py-4 space-y-5">
          {loading && (
            <div className="flex items-center justify-center py-20">
              <FiLoader className="w-6 h-6 text-rose-400 animate-spin" />
            </div>
          )}

          {!loading && !vendor && (
            <div className="text-center py-20 text-sm text-gray-400">
              Vendor not found.
            </div>
          )}

          {!loading && vendor && (
            <>
              {/* Profile header */}
              <div className="flex gap-4">
                <div className="relative w-16 h-16 rounded-xl bg-gray-100 overflow-hidden shrink-0">
                  <VendorImage
                    src={vendor.portfolio?.[0]}
                    alt={vendor.businessName ?? "Vendor"}
                    className="object-cover"
                    fallbackInitial={(vendor.businessName ?? "V").charAt(0)}
                    fallbackClassName="flex flex-col items-center justify-center h-full w-full bg-gradient-to-br from-gray-50 to-gray-100"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg font-bold text-gray-900 font-display truncate">
                      {vendor.businessName ?? "Unnamed Vendor"}
                    </h3>
                    {vendor.status === "verified" && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-50 text-green-600">
                        <FiCheckCircle className="w-3 h-3" /> Verified
                      </span>
                    )}
                  </div>
                  {cats.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {cats.map((c) => (
                        <span key={c} className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-rose-50 text-rose-600 capitalize">
                          {c}
                        </span>
                      ))}
                    </div>
                  )}
                  {vendor.rating > 0 && (
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <StarRating value={vendor.rating} readonly size="sm" />
                      <span className="text-xs font-medium text-gray-700">{vendor.rating.toFixed(1)}</span>
                      <span className="text-xs text-gray-400">({vendor.reviewCount})</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick actions */}
              <div className="flex gap-2">
                <button
                  onClick={handleChat}
                  disabled={chatLoading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-rose-500 text-white text-sm font-medium hover:bg-rose-600 disabled:opacity-60 transition-colors"
                >
                  {chatLoading ? <FiLoader className="w-4 h-4 animate-spin" /> : <FiMessageSquare className="w-4 h-4" />}
                  Chat with Vendor
                </button>
                <Link
                  href={`/vendors/${vendor.id}`}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <FiExternalLink className="w-4 h-4" />
                  Full Page
                </Link>
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-2 gap-3">
                {vendor.location && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                    <FiMapPin className="w-4 h-4 text-gray-400 shrink-0" />
                    <span className="truncate">{vendor.location}</span>
                  </div>
                )}
                {price && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                    <FiDollarSign className="w-4 h-4 text-gray-400 shrink-0" />
                    <span className="truncate">{price}</span>
                  </div>
                )}
                {vendor.phoneNumber && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                    <FiPhone className="w-4 h-4 text-gray-400 shrink-0" />
                    <span className="truncate">{vendor.phoneNumber}</span>
                  </div>
                )}
                {vendor.yearsOfExperience != null && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                    <FiBriefcase className="w-4 h-4 text-gray-400 shrink-0" />
                    {vendor.yearsOfExperience} yr{vendor.yearsOfExperience !== 1 ? "s" : ""} exp
                  </div>
                )}
              </div>

              {/* Description */}
              {vendor.description && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-2">About</h4>
                  <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                    {vendor.description}
                  </p>
                </div>
              )}

              {/* Availability Calendar */}
              <div>
                <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <FiCalendar className="w-3.5 h-3.5" />
                  Availability
                </h4>
                <AvailabilityCalendar vendorProfileId={vendor.id} />
              </div>

              {/* Portfolio */}
              <div>
                <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-2">Portfolio</h4>
                {portfolioTabs.length > 0 ? (
                  <>
                    <div className="flex gap-1 overflow-x-auto border-b border-gray-200 mb-3 pb-px scrollbar-hide">
                      {portfolioTabs.map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setActiveTab(tab)}
                          className={`px-2.5 py-1.5 text-xs font-medium whitespace-nowrap border-b-2 transition-colors capitalize cursor-pointer ${
                            activeTab === tab
                              ? "border-rose-500 text-rose-600"
                              : "border-transparent text-gray-500 hover:text-gray-700"
                          }`}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>
                    {currentTabItems.length > 0 ? (
                      <div className="grid grid-cols-3 gap-2">
                        {currentTabItems.slice(0, 9).map((item, i) => (
                          <button
                            key={item.id}
                            onClick={() => setLightboxIdx(i)}
                            className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 group cursor-pointer"
                          >
                            {item.mediaType === "video" ? (
                              <video src={item.mediaUrl} className="w-full h-full object-cover" muted preload="metadata" />
                            ) : (
                              <VendorImage
                                src={item.mediaUrl}
                                alt={item.caption ?? `Portfolio ${i + 1}`}
                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                                fallbackInitial=""
                              />
                            )}
                            {item.mediaType === "video" && (
                              <div className="absolute top-1 left-1 bg-black/60 text-white rounded px-1 py-0.5 text-[9px] font-medium flex items-center gap-0.5">
                                <FiFilm className="w-2.5 h-2.5" /> Video
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 text-center py-4">No items in this category.</p>
                    )}
                  </>
                ) : (
                  <div className="text-center py-6">
                    <FiImage className="w-6 h-6 text-gray-300 mx-auto mb-1" />
                    <p className="text-xs text-gray-400">No portfolio items yet.</p>
                  </div>
                )}
              </div>

              {/* Social media */}
              {Object.keys(socialMedia).length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-2">Social Media</h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(socialMedia).map(([platform, url]) => (
                      <a
                        key={platform}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-gray-50 text-rose-500 hover:bg-rose-50 transition-colors capitalize"
                      >
                        <FiExternalLink className="w-3 h-3" />
                        {platform}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Reviews */}
              <div>
                <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-2">Reviews</h4>
                <ReviewList vendorProfileId={vendor.id} />
              </div>
            </>
          )}
        </div>

        {/* Lightbox */}
        {lightboxIdx !== null && currentTabItems.length > 0 && (
          <div
            className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4"
            onClick={() => setLightboxIdx(null)}
          >
            <button
              onClick={() => setLightboxIdx(null)}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors z-10"
            >
              <FiX className="w-5 h-5" />
            </button>
            {currentTabItems.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); setLightboxIdx((p) => p! > 0 ? p! - 1 : currentTabItems.length - 1); }}
                  className="absolute left-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white z-10"
                >
                  ‹
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setLightboxIdx((p) => p! < currentTabItems.length - 1 ? p! + 1 : 0); }}
                  className="absolute right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white z-10"
                >
                  ›
                </button>
              </>
            )}
            {currentTabItems[lightboxIdx].mediaType === "video" ? (
              <video
                src={currentTabItems[lightboxIdx].mediaUrl}
                className="max-w-full max-h-full rounded-lg shadow-2xl"
                controls autoPlay
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <div className="max-w-full max-h-full" onClick={(e) => e.stopPropagation()}>
                <VendorImgTag
                  src={currentTabItems[lightboxIdx].mediaUrl}
                  alt={currentTabItems[lightboxIdx].caption ?? ""}
                  className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                  fallbackClassName="flex flex-col items-center justify-center w-48 h-48 rounded-lg bg-gray-800/80"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
