"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { VendorImage, VendorImgTag } from "@/components/ui/vendor-image";
import {
  getVendorDetail,
  startConversation,
  getVendorPortfolio,
  getVendorPortfolioByCategory,
  type PublicPortfolioItem,
} from "@/services/public-vendor.service";
import BookingRequestForm from "@/components/booking/booking-request-form";
import type { VendorProfile } from "@/types/vendor";
import dynamic from "next/dynamic";
import {
  FiArrowLeft,
  FiMapPin,
  FiPhone,
  FiMessageSquare,
  FiCheckCircle,
  FiExternalLink,
  FiDollarSign,
  FiBriefcase,
  FiAlertCircle,
  FiX,
  FiFilm,
  FiImage,
  FiNavigation,
  FiStar,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import { StarRating } from "@/components/review/star-rating";
import { ReviewList } from "@/components/review/review-list";

const VendorLocationMap = dynamic(() => import("@/components/vendor/vendor-location-map"), {
  ssr: false,
  loading: () => (
    <div className="rounded-xl bg-warm-50 border border-warm-200/30 flex items-center justify-center text-[12px] text-slate-300 font-light" style={{ height: 220 }}>
      Loading map...
    </div>
  ),
});

function formatPrice(min: number | null, max: number | null) {
  if (min == null && max == null) return null;
  const fmt = (v: number) =>
    v.toLocaleString("en-US", { style: "currency", currency: "ETB", maximumFractionDigits: 0 });
  if (min != null && max != null) return `${fmt(min)} – ${fmt(max)}`;
  if (min != null) return `From ${fmt(min)}`;
  return `Up to ${fmt(max!)}`;
}

export default function VendorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const vendorId = params.id as string;

  const [vendor, setVendor] = useState<VendorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [lightboxItems, setLightboxItems] = useState<PublicPortfolioItem[]>([]);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [portfolioItems, setPortfolioItems] = useState<Record<string, PublicPortfolioItem[]>>({});
  const [portfolioTotals, setPortfolioTotals] = useState<Record<string, number>>({});
  const [loadingMorePortfolio, setLoadingMorePortfolio] = useState(false);
  const [activePortfolioTab, setActivePortfolioTab] = useState("");

  const fetchVendor = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [data, pItems] = await Promise.all([getVendorDetail(vendorId), getVendorPortfolio(vendorId)]);
      setVendor(data);
      setPortfolioItems(pItems);
      const newTotals: Record<string, number> = {};
      for (const [cat, items] of Object.entries(pItems)) newTotals[cat] = items.length;
      setPortfolioTotals(newTotals);
      const tabKeys = Object.keys(pItems);
      if (tabKeys.length > 0) setActivePortfolioTab(tabKeys[0]);
    } catch { setError("Failed to load vendor details."); }
    finally { setLoading(false); }
  }, [vendorId]);

  const loadMorePortfolio = useCallback(async () => {
    if (!activePortfolioTab || loadingMorePortfolio) return;
    setLoadingMorePortfolio(true);
    try {
      const currentItems = portfolioItems[activePortfolioTab] ?? [];
      const result = await getVendorPortfolioByCategory(vendorId, activePortfolioTab, 12, currentItems.length);
      setPortfolioItems((prev) => ({ ...prev, [activePortfolioTab]: [...(prev[activePortfolioTab] ?? []), ...result.items] }));
      setPortfolioTotals((prev) => ({ ...prev, [activePortfolioTab]: result.total }));
    } catch { /* ignore */ }
    finally { setLoadingMorePortfolio(false); }
  }, [activePortfolioTab, portfolioItems, vendorId, loadingMorePortfolio]);

  useEffect(() => { fetchVendor(); }, [fetchVendor]);

  async function handleChat() {
    if (!vendor) return;
    setChatLoading(true);
    try { const conv = await startConversation(vendor.userId); router.push(`/messages?cid=${conv.id}`); }
    catch { setError("Failed to start conversation. Please try again."); }
    finally { setChatLoading(false); }
  }

  /* ── Loading state ── */
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-5 w-32 bg-warm-100/60 rounded-lg animate-pulse" />
        <div className="rounded-2xl border border-warm-200/40 bg-white overflow-hidden animate-pulse">
          <div className="h-56 bg-warm-100/40" />
          <div className="p-6 sm:p-8 space-y-4">
            <div className="h-6 bg-warm-100/50 rounded-lg w-2/3" />
            <div className="h-4 bg-warm-100/40 rounded-lg w-1/2" />
            <div className="h-4 bg-warm-100/30 rounded-lg w-3/4" />
          </div>
        </div>
      </div>
    );
  }

  /* ── Error state ── */
  if (error && !vendor) {
    return (
      <div>
        <Link href="/vendors" className="inline-flex items-center gap-1.5 text-[12px] text-slate-400 hover:text-slate-600 transition-colors mb-6 font-light">
          <FiArrowLeft className="w-3.5 h-3.5" /> Back to Vendors
        </Link>
        <div className="rounded-2xl border border-warm-200/50 bg-white p-16 text-center">
          <div className="w-14 h-14 rounded-xl bg-red-50 border border-red-200/40 flex items-center justify-center mx-auto mb-4">
            <FiAlertCircle className="w-6 h-6 text-red-400" />
          </div>
          <h3 className="text-[14px] font-semibold text-slate-700 mb-1">Could not load vendor</h3>
          <p className="text-[12px] text-slate-400 font-light">{error}</p>
        </div>
      </div>
    );
  }

  if (!vendor) return null;

  const cats = vendor.category ?? [];
  const price = formatPrice(vendor.priceRangeMin, vendor.priceRangeMax);
  const socialMedia = vendor.socialMedia ?? {};
  const portfolioTabs = Object.keys(portfolioItems);
  const allPortfolioFlat = Object.values(portfolioItems).flat();
  const firstImage = allPortfolioFlat.find((i) => i.mediaType === "image");
  const currentTabItems = portfolioItems[activePortfolioTab] ?? [];

  return (
    <div className="space-y-6">
      {/* ── Back link ── */}
      <Link href="/vendors" className="inline-flex items-center gap-1.5 text-[12px] text-slate-400 hover:text-slate-600 transition-colors font-light group">
        <FiArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform duration-500" /> Back to Vendors
      </Link>

      {/* ── Error banner ── */}
      {error && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-red-200/40 bg-red-50/80 px-4 py-3 text-[12px] text-red-600">
          <div className="w-7 h-7 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
            <FiAlertCircle className="w-3.5 h-3.5 text-red-500" />
          </div>
          <span className="flex-1">{error}</span>
        </div>
      )}

      {/* ── Hero / Header Card ── */}
      <div className="rounded-2xl border border-warm-200/50 bg-white overflow-hidden">
        {/* Cover image */}
        {firstImage && (
          <div className="relative h-48 sm:h-56 bg-warm-50 overflow-hidden">
            <VendorImage src={firstImage.mediaUrl} alt={vendor.businessName ?? ""} className="object-cover" fallbackInitial={(vendor.businessName ?? "V").charAt(0)} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          </div>
        )}

        <div className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-start gap-5">
            {/* Avatar */}
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-gradient-to-br from-warm-50 to-warm-100 border border-warm-200/40 overflow-hidden shrink-0 shadow-sm">
              <VendorImage
                src={firstImage?.mediaUrl}
                alt={vendor.businessName ?? "Vendor"}
                className="object-cover"
                fallbackInitial={(vendor.businessName ?? "V").charAt(0)}
                fallbackClassName="flex flex-col items-center justify-center h-full w-full font-display text-2xl font-bold text-slate-400"
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap mb-2">
                <h1 className="font-display text-xl sm:text-2xl font-bold text-slate-900 tracking-headline">
                  {vendor.businessName ?? "Unnamed Vendor"}
                </h1>
                {vendor.status === "verified" && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200/40 text-[10px] font-semibold uppercase tracking-luxury text-emerald-600">
                    <FiCheckCircle className="w-3 h-3" /> Verified
                  </span>
                )}
              </div>

              {cats.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {cats.map((c) => (
                    <span key={c} className="px-2.5 py-0.5 rounded-lg bg-warm-50 border border-warm-200/30 text-[10px] font-medium text-slate-500 capitalize">
                      {c}
                    </span>
                  ))}
                </div>
              )}

              {vendor.location && (
                <div className="flex items-center gap-1.5 text-[12px] text-slate-400 font-light mb-2">
                  <FiMapPin className="w-3.5 h-3.5 text-slate-300" /> {vendor.location}
                </div>
              )}

              {vendor.rating > 0 && (
                <div className="flex items-center gap-2 mt-1">
                  <StarRating value={vendor.rating} readonly size="sm" />
                  <span className="text-[13px] font-semibold text-slate-700">{vendor.rating.toFixed(1)}</span>
                  <span className="text-[12px] text-slate-400 font-light">({vendor.reviewCount} review{vendor.reviewCount !== 1 ? "s" : ""})</span>
                </div>
              )}
            </div>

            {/* CTA */}
            <button
              onClick={handleChat}
              disabled={chatLoading}
              className="cursor-pointer flex items-center gap-2 px-6 py-3 rounded-full bg-slate-900 text-white text-[13px] font-medium hover:bg-slate-800 disabled:opacity-50 transition-all duration-500 shrink-0"
            >
              {chatLoading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <FiMessageSquare className="w-4 h-4" />
              )}
              Chat with Vendor
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Main Content ── */}
        <div className="lg:col-span-2 space-y-6">
          {/* About */}
          {vendor.description && (
            <div className="rounded-2xl border border-warm-200/50 bg-white p-6 sm:p-8">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-lg bg-warm-50 border border-warm-200/30 flex items-center justify-center">
                  <FiBriefcase className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <h2 className="text-[14px] font-semibold text-slate-900">About</h2>
              </div>
              <p className="text-[13px] text-slate-500 font-light whitespace-pre-wrap leading-relaxed">{vendor.description}</p>
            </div>
          )}

          {/* Portfolio */}
          <div className="rounded-2xl border border-warm-200/50 bg-white p-6 sm:p-8">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-8 h-8 rounded-lg bg-warm-50 border border-warm-200/30 flex items-center justify-center">
                <FiImage className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <h2 className="text-[14px] font-semibold text-slate-900">Portfolio</h2>
            </div>

            {portfolioTabs.length > 0 ? (
              <>
                <div className="flex gap-1.5 overflow-x-auto pb-1 mb-5 scrollbar-hide">
                  {portfolioTabs.map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActivePortfolioTab(tab)}
                      className={`cursor-pointer px-3.5 py-2 rounded-xl text-[11px] font-medium whitespace-nowrap transition-all duration-500 capitalize ${
                        activePortfolioTab === tab
                          ? "bg-slate-900 text-white"
                          : "bg-warm-50 border border-warm-200/30 text-slate-500 hover:bg-warm-100/60"
                      }`}
                    >
                      {tab}
                      <span className={`ml-1.5 text-[9px] px-1.5 py-0.5 rounded-md ${activePortfolioTab === tab ? "bg-white/20" : "bg-warm-100 text-slate-400"}`}>
                        {portfolioTotals[tab] ?? (portfolioItems[tab] ?? []).length}
                      </span>
                    </button>
                  ))}
                </div>

                {currentTabItems.length > 0 ? (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {currentTabItems.map((item, i) => (
                        <button
                          key={item.id}
                          onClick={() => { setLightboxItems(currentTabItems); setLightboxIdx(i); }}
                          className="cursor-pointer relative aspect-square rounded-xl overflow-hidden bg-warm-50 group"
                        >
                          {item.mediaType === "video" ? (
                            <video src={item.mediaUrl} className="w-full h-full object-cover" muted preload="metadata" />
                          ) : (
                            <VendorImage src={item.mediaUrl} alt={item.caption ?? `Portfolio ${i + 1}`} className="object-cover group-hover:scale-[1.04] transition-transform duration-700 ease-out" fallbackInitial="" />
                          )}
                          {item.mediaType === "video" && (
                            <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-sm text-white text-[9px] font-medium flex items-center gap-1">
                              <FiFilm className="w-2.5 h-2.5" /> Video
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors duration-500" />
                          {item.caption && (
                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3 pt-8 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                              <p className="text-white text-[11px] font-light line-clamp-1">{item.caption}</p>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                    {currentTabItems.length < (portfolioTotals[activePortfolioTab] ?? 0) && (
                      <div className="flex justify-center pt-5">
                        <button
                          onClick={loadMorePortfolio}
                          disabled={loadingMorePortfolio}
                          className="cursor-pointer flex items-center gap-1.5 px-5 py-2.5 text-[11px] font-medium text-slate-500 border border-warm-200/40 rounded-full hover:bg-warm-50 disabled:opacity-40 transition-all duration-500"
                        >
                          {loadingMorePortfolio && <span className="w-3 h-3 border-2 border-slate-200 border-t-slate-500 rounded-full animate-spin" />}
                          {loadingMorePortfolio ? "Loading..." : "Load more"}
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-[12px] text-slate-400 font-light text-center py-8">No items in this category yet.</p>
                )}
              </>
            ) : (
              <div className="text-center py-10">
                <div className="w-12 h-12 rounded-xl bg-warm-50 border border-warm-200/30 flex items-center justify-center mx-auto mb-3">
                  <FiImage className="w-5 h-5 text-slate-300" />
                </div>
                <p className="text-[12px] text-slate-400 font-light">No portfolio items yet.</p>
              </div>
            )}
          </div>

          {/* Reviews */}
          <div className="rounded-2xl border border-warm-200/50 bg-white p-6 sm:p-8">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-8 h-8 rounded-lg bg-warm-50 border border-warm-200/30 flex items-center justify-center">
                <FiStar className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <h2 className="text-[14px] font-semibold text-slate-900">Reviews</h2>
            </div>
            <ReviewList vendorProfileId={vendor.id} />
          </div>

          {/* Booking Request */}
          <div className="rounded-2xl border border-warm-200/50 bg-white p-6 sm:p-8">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-8 h-8 rounded-lg bg-warm-50 border border-warm-200/30 flex items-center justify-center">
                <FiCheckCircle className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <h2 className="text-[14px] font-semibold text-slate-900">Request a Booking</h2>
            </div>
            {bookingSuccess ? (
              <div className="rounded-xl border border-emerald-200/40 bg-emerald-50/60 p-6 text-center">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 border border-emerald-200/40 flex items-center justify-center mx-auto mb-3">
                  <FiCheckCircle className="w-5 h-5 text-emerald-500" />
                </div>
                <h3 className="text-[14px] font-semibold text-emerald-800 mb-1">Booking request sent!</h3>
                <p className="text-[12px] text-emerald-600 font-light">
                  The vendor will respond soon. Track your bookings in your dashboard.
                </p>
              </div>
            ) : (
              <BookingRequestForm
                vendorProfileId={vendor.id}
                vendorId={vendor.userId}
                serviceCategory={Array.isArray(vendor.category) && vendor.category.length > 0 ? vendor.category[0] : "general"}
                onSuccess={() => setBookingSuccess(true)}
              />
            )}
          </div>
        </div>

        {/* ── Sidebar ── */}
        <div className="space-y-5">
          {/* Details Card */}
          <div className="rounded-2xl border border-warm-200/50 bg-white p-6 sm:p-7">
            <p className="text-[11px] font-semibold uppercase tracking-luxury text-slate-400 mb-4">Details</p>
            <div className="space-y-3.5">
              {vendor.phoneNumber && (
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-warm-50 border border-warm-200/30 flex items-center justify-center shrink-0">
                    <FiPhone className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <span className="text-[13px] text-slate-600">{vendor.phoneNumber}</span>
                </div>
              )}
              {vendor.location && (
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-warm-50 border border-warm-200/30 flex items-center justify-center shrink-0">
                    <FiMapPin className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <span className="text-[13px] text-slate-600">{vendor.location}</span>
                </div>
              )}
              {price && (
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-warm-50 border border-warm-200/30 flex items-center justify-center shrink-0">
                    <FiDollarSign className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <span className="text-[13px] font-medium text-slate-700">{price}</span>
                </div>
              )}
              {vendor.yearsOfExperience != null && (
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-warm-50 border border-warm-200/30 flex items-center justify-center shrink-0">
                    <FiBriefcase className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <span className="text-[13px] text-slate-600">
                    {vendor.yearsOfExperience} year{vendor.yearsOfExperience !== 1 ? "s" : ""} experience
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Location Map */}
          {vendor.latitude != null && vendor.longitude != null && (
            <div className="rounded-2xl border border-warm-200/50 bg-white p-6 sm:p-7">
              <p className="text-[11px] font-semibold uppercase tracking-luxury text-slate-400 mb-4">Location</p>
              <div className="rounded-xl overflow-hidden border border-warm-200/20">
                <VendorLocationMap latitude={vendor.latitude} longitude={vendor.longitude} />
              </div>
              <a
                href={`https://www.google.com/maps?q=${vendor.latitude},${vendor.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-[11px] text-gold-500 hover:text-gold-600 font-medium transition-colors mt-3"
              >
                <FiNavigation className="w-3 h-3" /> Open in Google Maps
              </a>
            </div>
          )}

          {/* Social Media */}
          {Object.keys(socialMedia).length > 0 && (
            <div className="rounded-2xl border border-warm-200/50 bg-white p-6 sm:p-7">
              <p className="text-[11px] font-semibold uppercase tracking-luxury text-slate-400 mb-4">Social Media</p>
              <div className="space-y-2.5">
                {Object.entries(socialMedia).map(([platform, url]) => (
                  <a
                    key={platform}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 text-[12px] text-gold-500 hover:text-gold-600 font-medium transition-colors capitalize group"
                  >
                    <div className="w-7 h-7 rounded-lg bg-warm-50 border border-warm-200/30 flex items-center justify-center group-hover:bg-warm-100/60 transition-colors">
                      <FiExternalLink className="w-3 h-3 text-slate-400" />
                    </div>
                    {platform}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Mobile CTA */}
          <button
            onClick={handleChat}
            disabled={chatLoading}
            className="cursor-pointer w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-slate-900 text-white text-[13px] font-medium hover:bg-slate-800 disabled:opacity-50 transition-all duration-500 lg:hidden"
          >
            {chatLoading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <FiMessageSquare className="w-4 h-4" />
            )}
            Chat with Vendor
          </button>
        </div>
      </div>

      {/* ── Lightbox ── */}
      {lightboxIdx !== null && lightboxItems.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setLightboxIdx(null)}>
          <button
            onClick={() => setLightboxIdx(null)}
            className="cursor-pointer absolute top-5 right-5 w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all duration-500 z-10"
          >
            <FiX className="w-5 h-5" />
          </button>

          {lightboxItems.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); setLightboxIdx((prev) => prev! > 0 ? prev! - 1 : lightboxItems.length - 1); }}
                className="cursor-pointer absolute left-4 w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all duration-500 z-10"
              >
                <FiChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setLightboxIdx((prev) => prev! < lightboxItems.length - 1 ? prev! + 1 : 0); }}
                className="cursor-pointer absolute right-4 w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all duration-500 z-10"
              >
                <FiChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

          {lightboxItems[lightboxIdx].mediaType === "video" ? (
            <video
              src={lightboxItems[lightboxIdx].mediaUrl}
              className="max-w-full max-h-full rounded-2xl shadow-2xl"
              controls
              autoPlay
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <div className="max-w-full max-h-full" onClick={(e) => e.stopPropagation()}>
              <VendorImgTag
                src={lightboxItems[lightboxIdx].mediaUrl}
                alt={lightboxItems[lightboxIdx].caption ?? `Portfolio ${lightboxIdx + 1}`}
                className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"
                fallbackClassName="flex flex-col items-center justify-center w-64 h-64 rounded-2xl bg-slate-800/80"
              />
            </div>
          )}

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center">
            {lightboxItems[lightboxIdx].caption && (
              <p className="text-white/90 text-[13px] font-light mb-1.5">{lightboxItems[lightboxIdx].caption}</p>
            )}
            <span className="text-white/40 text-[11px] font-light">
              {lightboxIdx + 1} / {lightboxItems.length}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
