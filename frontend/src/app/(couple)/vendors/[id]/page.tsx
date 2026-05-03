"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  getVendorDetail,
  startConversation,
  getVendorPortfolio,
  getVendorPortfolioByCategory,
  type PublicPortfolioItem,
} from "@/services/public-vendor.service";
import BookingRequestForm from "@/components/booking/booking-request-form";
import type { VendorProfile } from "@/types/vendor";
import {
  FiArrowLeft,
  FiMapPin,
  FiPhone,
  FiMessageSquare,
  FiCheckCircle,
  FiExternalLink,
  FiDollarSign,
  FiBriefcase,
  FiLoader,
  FiAlertCircle,
  FiX,
  FiFilm,
  FiImage,
} from "react-icons/fi";
import { StarRating } from "@/components/review/star-rating";
import { ReviewList } from "@/components/review/review-list";

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
    setLoading(true);
    setError("");
    try {
      const [data, pItems] = await Promise.all([
        getVendorDetail(vendorId),
        getVendorPortfolio(vendorId),
      ]);
      setVendor(data);
      setPortfolioItems(pItems);
      const newTotals: Record<string, number> = {};
      for (const [cat, items] of Object.entries(pItems)) {
        newTotals[cat] = items.length;
      }
      setPortfolioTotals(newTotals);
      const tabKeys = Object.keys(pItems);
      if (tabKeys.length > 0) setActivePortfolioTab(tabKeys[0]);
    } catch {
      setError("Failed to load vendor details.");
    } finally {
      setLoading(false);
    }
  }, [vendorId]);

  const loadMorePortfolio = useCallback(async () => {
    if (!activePortfolioTab || loadingMorePortfolio) return;
    setLoadingMorePortfolio(true);
    try {
      const currentItems = portfolioItems[activePortfolioTab] ?? [];
      const result = await getVendorPortfolioByCategory(vendorId, activePortfolioTab, 12, currentItems.length);
      setPortfolioItems((prev) => ({
        ...prev,
        [activePortfolioTab]: [...(prev[activePortfolioTab] ?? []), ...result.items],
      }));
      setPortfolioTotals((prev) => ({ ...prev, [activePortfolioTab]: result.total }));
    } catch {
      // ignore
    } finally {
      setLoadingMorePortfolio(false);
    }
  }, [activePortfolioTab, portfolioItems, vendorId, loadingMorePortfolio]);

  useEffect(() => {
    fetchVendor();
  }, [fetchVendor]);

  async function handleChat() {
    if (!vendor) return;
    setChatLoading(true);
    try {
      const conv = await startConversation(vendor.userId);
      router.push(`/messages?cid=${conv.id}`);
    } catch {
      setError("Failed to start conversation. Please try again.");
    } finally {
      setChatLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-6 w-40 bg-gray-100 rounded animate-pulse" />
        <div className="bg-white rounded-xl border border-gray-200/80 overflow-hidden animate-pulse">
          <div className="h-64 bg-gray-100" />
          <div className="p-6 space-y-4">
            <div className="h-6 bg-gray-100 rounded w-2/3" />
            <div className="h-4 bg-gray-100 rounded w-1/2" />
            <div className="h-4 bg-gray-100 rounded w-3/4" />
          </div>
        </div>
      </div>
    );
  }

  if (error && !vendor) {
    return (
      <div>
        <Link
          href="/vendors"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6"
        >
          <FiArrowLeft className="w-4 h-4" /> Back to Vendors
        </Link>
        <div className="bg-white rounded-xl border border-gray-200/80 p-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
            <FiAlertCircle className="w-6 h-6 text-red-400" />
          </div>
          <h3 className="text-sm font-semibold text-gray-700 mb-1">
            Could not load vendor
          </h3>
          <p className="text-xs text-gray-400">{error}</p>
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
      {/* Back link */}
      <Link
        href="/vendors"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <FiArrowLeft className="w-4 h-4" /> Back to Vendors
      </Link>

      {error && (
        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Header card */}
      <div className="bg-white rounded-xl border border-gray-200/80 p-6">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <div className="relative w-20 h-20 rounded-xl bg-gray-100 overflow-hidden shrink-0">
            {firstImage ? (
              <Image
                src={firstImage.mediaUrl}
                alt={vendor.businessName ?? "Vendor"}
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-300 text-2xl font-bold">
                {(vendor.businessName ?? "V").charAt(0)}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-gray-900 font-display">
                {vendor.businessName ?? "Unnamed Vendor"}
              </h1>
              {vendor.status === "verified" && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-600">
                  <FiCheckCircle className="w-3 h-3" /> Verified
                </span>
              )}
            </div>

            {cats.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {cats.map((c) => (
                  <span
                    key={c}
                    className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-600 capitalize"
                  >
                    {c}
                  </span>
                ))}
              </div>
            )}

            {vendor.location && (
              <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-2">
                <FiMapPin className="w-3.5 h-3.5" />
                {vendor.location}
              </div>
            )}

            {vendor.rating > 0 && (
              <div className="flex items-center gap-1.5 mt-2">
                <StarRating value={vendor.rating} readonly size="sm" />
                <span className="text-sm font-medium text-gray-700">
                  {vendor.rating.toFixed(1)}
                </span>
                <span className="text-sm text-gray-400">
                  ({vendor.reviewCount} review{vendor.reviewCount !== 1 ? "s" : ""})
                </span>
              </div>
            )}
          </div>

          <button
            onClick={handleChat}
            disabled={chatLoading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-rose-500 text-white font-medium text-sm hover:bg-rose-600 disabled:opacity-60 transition-colors shrink-0"
          >
            {chatLoading ? (
              <FiLoader className="w-4 h-4 animate-spin" />
            ) : (
              <FiMessageSquare className="w-4 h-4" />
            )}
            Chat with Vendor
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {vendor.description && (
            <div className="bg-white rounded-xl border border-gray-200/80 p-6">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">About</h2>
              <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
                {vendor.description}
              </p>
            </div>
          )}

          {/* Portfolio gallery with category tabs */}
          <div className="bg-white rounded-xl border border-gray-200/80 p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Portfolio</h2>

            {portfolioTabs.length > 0 ? (
              <>
                {portfolioTabs.length > 1 && (
                  <div className="flex gap-1 overflow-x-auto border-b border-gray-200 mb-4 pb-px scrollbar-hide" style={{ WebkitOverflowScrolling: "touch" }}>
                    {portfolioTabs.map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActivePortfolioTab(tab)}
                        className={`px-3 py-2 text-xs font-medium whitespace-nowrap border-b-2 transition-colors capitalize cursor-pointer ${
                          activePortfolioTab === tab
                            ? "border-rose-500 text-rose-600"
                            : "border-transparent text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        {tab}
                        <span className="ml-1 text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">
                          {portfolioTotals[tab] ?? (portfolioItems[tab] ?? []).length}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {currentTabItems.length > 0 ? (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {currentTabItems.map((item, i) => (
                        <button
                          key={item.id}
                          onClick={() => {
                            setLightboxItems(currentTabItems);
                            setLightboxIdx(i);
                          }}
                          className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 group cursor-pointer"
                        >
                          {item.mediaType === "video" ? (
                            <video
                              src={item.mediaUrl}
                              className="w-full h-full object-cover"
                              muted
                              preload="metadata"
                            />
                          ) : (
                            <Image
                              src={item.mediaUrl}
                              alt={item.caption ?? `Portfolio ${i + 1}`}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                              unoptimized
                            />
                          )}
                          {item.mediaType === "video" && (
                            <div className="absolute top-2 left-2 bg-black/60 text-white rounded-md px-1.5 py-0.5 text-[10px] font-medium flex items-center gap-1">
                              <FiFilm className="w-3 h-3" /> Video
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                            <FiExternalLink className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          {item.caption && (
                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2 pt-6 opacity-0 group-hover:opacity-100 transition-opacity">
                              <p className="text-white text-[11px] line-clamp-1">{item.caption}</p>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                    {currentTabItems.length < (portfolioTotals[activePortfolioTab] ?? 0) && (
                      <div className="flex justify-center pt-4">
                        <button
                          onClick={loadMorePortfolio}
                          disabled={loadingMorePortfolio}
                          className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-gray-500 bg-gray-50 rounded-lg hover:bg-gray-100 disabled:opacity-50 transition-colors cursor-pointer"
                        >
                          {loadingMorePortfolio ? <FiLoader className="w-3.5 h-3.5 animate-spin" /> : null}
                          {loadingMorePortfolio ? "Loading..." : "Load more"}
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-gray-400 text-center py-6">
                    No items in this category yet.
                  </p>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <FiImage className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400">
                  No portfolio items yet.
                </p>
              </div>
            )}
          </div>

          {/* Reviews section */}
          <div className="bg-white rounded-xl border border-gray-200/80 p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Reviews</h2>
            <ReviewList vendorProfileId={vendor.id} />
          </div>

          {/* Booking Request section */}
          <div className="bg-white rounded-xl border border-gray-200/80 p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">
              Request a Booking
            </h2>
            {bookingSuccess ? (
              <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
                <FiCheckCircle className="w-8 h-8 text-green-500 mx-auto mb-3" />
                <h3 className="text-sm font-semibold text-green-800 mb-1">
                  Booking request sent!
                </h3>
                <p className="text-xs text-green-600">
                  The vendor will respond soon. You can track your bookings in your dashboard.
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

        {/* Sidebar details */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200/80 p-6 space-y-4">
            <h2 className="text-sm font-semibold text-gray-900">Details</h2>

            {vendor.phoneNumber && (
              <div className="flex items-center gap-2.5 text-sm text-gray-600">
                <FiPhone className="w-4 h-4 text-gray-400 shrink-0" />
                {vendor.phoneNumber}
              </div>
            )}

            {vendor.location && (
              <div className="flex items-center gap-2.5 text-sm text-gray-600">
                <FiMapPin className="w-4 h-4 text-gray-400 shrink-0" />
                {vendor.location}
              </div>
            )}

            {price && (
              <div className="flex items-center gap-2.5 text-sm text-gray-600">
                <FiDollarSign className="w-4 h-4 text-gray-400 shrink-0" />
                {price}
              </div>
            )}

            {vendor.yearsOfExperience != null && (
              <div className="flex items-center gap-2.5 text-sm text-gray-600">
                <FiBriefcase className="w-4 h-4 text-gray-400 shrink-0" />
                {vendor.yearsOfExperience} year{vendor.yearsOfExperience !== 1 ? "s" : ""} of experience
              </div>
            )}
          </div>

          {Object.keys(socialMedia).length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200/80 p-6 space-y-3">
              <h2 className="text-sm font-semibold text-gray-900">Social Media</h2>
              {Object.entries(socialMedia).map(([platform, url]) => (
                <a
                  key={platform}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-rose-500 hover:text-rose-600 transition-colors capitalize"
                >
                  <FiExternalLink className="w-3.5 h-3.5" />
                  {platform}
                </a>
              ))}
            </div>
          )}

          <button
            onClick={handleChat}
            disabled={chatLoading}
            className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-rose-500 text-white font-medium text-sm hover:bg-rose-600 disabled:opacity-60 transition-colors lg:hidden"
          >
            {chatLoading ? (
              <FiLoader className="w-4 h-4 animate-spin" />
            ) : (
              <FiMessageSquare className="w-4 h-4" />
            )}
            Chat with Vendor
          </button>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxIdx !== null && lightboxItems.length > 0 && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setLightboxIdx(null)}
        >
          <button
            onClick={() => setLightboxIdx(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors z-10"
          >
            <FiX className="w-5 h-5" />
          </button>

          {lightboxItems.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIdx((prev) =>
                    prev! > 0 ? prev! - 1 : lightboxItems.length - 1,
                  );
                }}
                className="absolute left-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors z-10"
              >
                ‹
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIdx((prev) =>
                    prev! < lightboxItems.length - 1 ? prev! + 1 : 0,
                  );
                }}
                className="absolute right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors z-10"
              >
                ›
              </button>
            </>
          )}

          {lightboxItems[lightboxIdx].mediaType === "video" ? (
            <video
              src={lightboxItems[lightboxIdx].mediaUrl}
              className="max-w-full max-h-full rounded-lg shadow-2xl"
              controls
              autoPlay
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={lightboxItems[lightboxIdx].mediaUrl}
              alt={lightboxItems[lightboxIdx].caption ?? `Portfolio ${lightboxIdx + 1}`}
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          )}

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center">
            {lightboxItems[lightboxIdx].caption && (
              <p className="text-white/90 text-sm mb-1">{lightboxItems[lightboxIdx].caption}</p>
            )}
            <span className="text-white/50 text-xs">
              {lightboxIdx + 1} / {lightboxItems.length}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
