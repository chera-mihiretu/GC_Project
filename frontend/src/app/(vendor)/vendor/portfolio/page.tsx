"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { getVendorProfile, getVendorContext } from "@/services/vendor.service";
import {
  getPortfolioByCategory,
  requestUploadUrl,
  addPortfolioItem,
  deletePortfolioItem,
  uploadWithProgress,
  type PortfolioItem,
} from "@/services/portfolio.service";
import { VENDOR_CATEGORIES } from "@/types/vendor";
import {
  FiImage,
  FiPlus,
  FiTrash2,
  FiX,
  FiUploadCloud,
  FiFilm,
  FiAlertCircle,
  FiArrowRight,
} from "react-icons/fi";
import Link from "next/link";
import { VendorImgTag } from "@/components/ui/vendor-image";

const CATEGORY_LABELS: Record<string, string> = {};
for (const c of VENDOR_CATEGORIES) {
  CATEGORY_LABELS[c] = c.charAt(0).toUpperCase() + c.slice(1);
}

const ACCEPTED_TYPES = "image/jpeg,image/png,image/webp,video/mp4,video/quicktime";

const PORTFOLIO_PAGE_SIZE = 12;

export default function PortfolioPage() {
  const [categories, setCategories] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("");
  const [portfolio, setPortfolio] = useState<Record<string, PortfolioItem[]>>({});
  const [totals, setTotals] = useState<Record<string, number>>({});
  const [loadingCategory, setLoadingCategory] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isStaff, setIsStaff] = useState(false);
  const [noProfile, setNoProfile] = useState(false);

  const [showUpload, setShowUpload] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [uploadCaption, setUploadCaption] = useState("");
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<Set<string>>(new Set());
  const [dragOver, setDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  const fetchCategoryItems = useCallback(async (category: string, append = false) => {
    if (append) setLoadingMore(true); else setLoadingCategory(true);
    try {
      const offset = append ? (portfolio[category] ?? []).length : 0;
      const result = await getPortfolioByCategory(category, PORTFOLIO_PAGE_SIZE, offset);
      setPortfolio((prev) => ({
        ...prev,
        [category]: append ? [...(prev[category] ?? []), ...result.items] : result.items,
      }));
      setTotals((prev) => ({ ...prev, [category]: result.total }));
    } catch {
      // ignore
    } finally {
      setLoadingCategory(false);
      setLoadingMore(false);
    }
  }, [portfolio]);

  const fetchData = useCallback(async () => {
    try {
      const [profileData, ctx] = await Promise.all([
        getVendorProfile(),
        getVendorContext(),
      ]);

      if (!profileData?.vendorProfile?.category?.length) {
        setNoProfile(true);
        return;
      }

      setIsStaff(ctx.isStaff);
      setCategories(profileData.vendorProfile.category);
      setActiveTab(profileData.vendorProfile.category[0]);
    } catch {
      setNoProfile(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (activeTab && !(activeTab in portfolio)) {
      fetchCategoryItems(activeTab);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  function openUploadDialog() {
    setUploadFile(null);
    setUploadPreview(null);
    setUploadCaption("");
    setUploadProgress(null);
    setUploadError("");
    setShowUpload(true);
  }

  function handleFileSelect(file: File) {
    if (file.size > 10 * 1024 * 1024) {
      setUploadError("File must be under 10 MB");
      return;
    }
    setUploadFile(file);
    setUploadError("");
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => setUploadPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else if (file.type.startsWith("video/")) {
      setUploadPreview(URL.createObjectURL(file));
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  }

  async function handleUpload() {
    if (!uploadFile || !activeTab) return;
    setUploading(true);
    setUploadError("");
    setUploadProgress(0);

    try {
      const { signedUrl, publicUrl } = await requestUploadUrl(
        uploadFile.name,
        uploadFile.type,
      );

      await uploadWithProgress(signedUrl, uploadFile, setUploadProgress);

      const mediaType: "image" | "video" = uploadFile.type.startsWith("video/")
        ? "video"
        : "image";

      const item = await addPortfolioItem({
        category: activeTab,
        mediaUrl: publicUrl,
        mediaType,
        caption: uploadCaption || undefined,
      });

      setPortfolio((prev) => ({
        ...prev,
        [activeTab]: [...(prev[activeTab] ?? []), item],
      }));
      setTotals((prev) => ({ ...prev, [activeTab]: (prev[activeTab] ?? 0) + 1 }));
      setShowUpload(false);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      setUploadProgress(null);
    }
  }

  async function handleDelete(itemId: string) {
    setDeleting((prev) => new Set(prev).add(itemId));
    setDeleteConfirm(null);
    try {
      await deletePortfolioItem(itemId);
      setPortfolio((prev) => {
        const updated = { ...prev };
        for (const cat of Object.keys(updated)) {
          const before = updated[cat].length;
          updated[cat] = updated[cat].filter((i) => i.id !== itemId);
          if (updated[cat].length < before) {
            setTotals((t) => ({ ...t, [cat]: Math.max(0, (t[cat] ?? 0) - 1) }));
          }
        }
        return updated;
      });
    } catch {
      // Revert will show the item again on next fetch
    } finally {
      setDeleting((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  }

  /* ── Loading state ── */
  if (loading) {
    return (
      <div className="space-y-10">
        <div>
          <div className="h-3 w-20 bg-warm-100 rounded animate-pulse mb-3" />
          <div className="h-9 w-48 bg-warm-100 rounded-lg animate-pulse" />
        </div>
        <div className="flex gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-10 w-28 bg-warm-100 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-square bg-warm-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  /* ── No profile ── */
  if (noProfile) {
    return (
      <div className="space-y-10">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-editorial text-slate-400 mb-2">
            Showcase
          </p>
          <h1 className="font-display text-3xl font-bold text-slate-900 tracking-headline">
            Portfolio
          </h1>
        </div>
        <div className="rounded-2xl border border-dashed border-warm-200 bg-white p-16 text-center max-w-2xl">
          <div className="w-14 h-14 rounded-2xl bg-warm-50 border border-warm-200/40 flex items-center justify-center mx-auto mb-6">
            <FiAlertCircle className="w-6 h-6 text-slate-300" />
          </div>
          <h3 className="font-display text-lg font-semibold text-slate-900 mb-2">
            Complete your profile first
          </h3>
          <p className="text-[14px] text-slate-400 font-light leading-relaxed max-w-sm mx-auto mb-8">
            Set up your vendor profile with at least one service category to start
            building your portfolio.
          </p>
          <Link
            href="/vendor/profile/setup"
            className="cursor-pointer group inline-flex items-center gap-2 px-7 py-3.5 bg-slate-900 text-white rounded-full text-[13px] font-semibold shadow-[0_2px_20px_rgba(15,23,42,0.12)] hover:bg-slate-800 hover:shadow-[0_4px_30px_rgba(15,23,42,0.2)] transition-all duration-500"
          >
            Go to Profile Setup
            <FiArrowRight className="w-4 h-4 transition-transform duration-500 group-hover:translate-x-0.5" aria-hidden />
          </Link>
        </div>
      </div>
    );
  }

  const currentItems = portfolio[activeTab] ?? [];

  return (
    <div className="space-y-10">
      {/* ── Header ── */}
      <div className="flex items-end justify-between flex-wrap gap-6">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-editorial text-slate-400 mb-2">
            Showcase
          </p>
          <h1 className="font-display text-3xl font-bold text-slate-900 tracking-headline">
            Portfolio
          </h1>
          <p className="text-[14px] text-slate-400 font-light mt-2">
            Showcase your finest work across each service you offer.
          </p>
        </div>
        {!isStaff && (
          <button
            onClick={openUploadDialog}
            className="cursor-pointer group flex items-center gap-2.5 px-6 py-3 bg-slate-900 text-white rounded-full text-[13px] font-semibold shadow-[0_2px_20px_rgba(15,23,42,0.12)] hover:bg-slate-800 hover:shadow-[0_4px_30px_rgba(15,23,42,0.2)] transition-all duration-500"
          >
            <FiPlus className="w-4 h-4" />
            Add Media
          </button>
        )}
      </div>

      {/* ── Category tabs ── */}
      <div
        className="flex gap-2 overflow-x-auto pb-px scrollbar-hide"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {categories.map((cat) => {
          const count = totals[cat] ?? (portfolio[cat] ?? []).length;
          const active = activeTab === cat;
          return (
            <button
              key={cat}
              onClick={() => setActiveTab(cat)}
              className={`cursor-pointer px-5 py-2.5 rounded-full text-[13px] font-semibold whitespace-nowrap border transition-all duration-500 ${
                active
                  ? "bg-slate-900 text-white border-slate-900 shadow-[0_2px_12px_rgba(15,23,42,0.12)]"
                  : "bg-white text-slate-500 border-warm-200/50 hover:border-warm-200 hover:text-slate-700"
              }`}
            >
              {CATEGORY_LABELS[cat] ?? cat}
              {count > 0 && (
                <span
                  className={`ml-2 text-[11px] px-2 py-0.5 rounded-full transition-colors duration-500 ${
                    active
                      ? "bg-white/15 text-white/70"
                      : "bg-warm-100 text-slate-400"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Media grid ── */}
      {loadingCategory && currentItems.length === 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-[4/5] bg-warm-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : currentItems.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-warm-200 bg-white p-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-warm-50 border border-warm-200/40 flex items-center justify-center mx-auto mb-6">
            <FiImage className="w-6 h-6 text-slate-300" />
          </div>
          <h3 className="font-display text-lg font-semibold text-slate-900 mb-2">
            No {CATEGORY_LABELS[activeTab] ?? activeTab} items yet
          </h3>
          <p className="text-[14px] text-slate-400 font-light max-w-xs mx-auto">
            {isStaff
              ? "The vendor owner hasn't added any items to this category yet."
              : "Upload photos or videos to showcase your work in this category."}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {currentItems.map((item) => (
              <div
                key={item.id}
                className={`group relative rounded-2xl overflow-hidden border border-warm-200/40 bg-warm-50 aspect-[4/5] hover:shadow-[0_8px_40px_rgba(15,23,42,0.06)] hover:border-warm-200 transition-all duration-700 ${
                  deleting.has(item.id) ? "opacity-30 pointer-events-none scale-95" : ""
                }`}
              >
                {item.mediaType === "video" ? (
                  <video
                    src={item.mediaUrl}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                    muted
                    preload="metadata"
                    onMouseEnter={(e) => (e.target as HTMLVideoElement).play()}
                    onMouseLeave={(e) => {
                      const v = e.target as HTMLVideoElement;
                      v.pause();
                      v.currentTime = 0;
                    }}
                  />
                ) : (
                  <VendorImgTag
                    src={item.mediaUrl}
                    alt={item.caption ?? "Portfolio item"}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                    fallbackInitial=""
                  />
                )}

                {/* Video badge */}
                {item.mediaType === "video" && (
                  <div className="absolute top-3 left-3 bg-black/50 backdrop-blur-sm text-white rounded-lg px-2.5 py-1 text-[10px] font-semibold uppercase tracking-luxury flex items-center gap-1.5">
                    <FiFilm className="w-3 h-3" /> Video
                  </div>
                )}

                {/* Bottom overlay — caption */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent p-5 pt-14 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                  {item.caption && (
                    <p className="text-white text-[13px] font-light line-clamp-2 leading-relaxed">
                      {item.caption}
                    </p>
                  )}
                </div>

                {/* Delete button */}
                {!isStaff && (
                  <button
                    onClick={() => setDeleteConfirm(item.id)}
                    className="cursor-pointer absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur-sm text-slate-400 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-500 transition-all duration-500"
                  >
                    <FiTrash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Load more */}
          {currentItems.length < (totals[activeTab] ?? 0) && (
            <div className="flex justify-center pt-4">
              <button
                onClick={() => fetchCategoryItems(activeTab, true)}
                disabled={loadingMore}
                className="cursor-pointer flex items-center gap-2.5 px-7 py-3 text-[13px] font-semibold text-slate-600 bg-white border border-warm-200/50 rounded-full hover:border-warm-200 hover:shadow-[0_4px_16px_rgba(15,23,42,0.04)] disabled:opacity-50 transition-all duration-500"
              >
                {loadingMore && (
                  <span className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                )}
                {loadingMore
                  ? "Loading..."
                  : `Load more (${currentItems.length} of ${totals[activeTab]})`}
              </button>
            </div>
          )}
        </>
      )}

      {/* ── Delete confirmation modal ── */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div
            className="bg-white rounded-2xl p-8 sm:p-10 max-w-sm w-full mx-4 shadow-[0_20px_60px_rgba(15,23,42,0.15)] animate-scale-reveal"
          >
            <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center mx-auto mb-6">
              <FiTrash2 className="w-5 h-5 text-red-400" />
            </div>
            <h3 className="font-display text-lg font-semibold text-slate-900 text-center mb-2">
              Delete this item?
            </h3>
            <p className="text-[13px] text-slate-400 font-light text-center leading-relaxed mb-8">
              This will permanently remove the media file from your portfolio.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="cursor-pointer flex-1 py-3 text-[13px] font-semibold text-slate-600 border border-warm-200/60 rounded-xl hover:bg-warm-50 hover:border-warm-200 transition-all duration-500"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="cursor-pointer flex-1 py-3 text-[13px] font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 shadow-[0_2px_12px_rgba(220,38,38,0.15)] hover:shadow-[0_4px_20px_rgba(220,38,38,0.25)] transition-all duration-500"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Upload dialog ── */}
      {showUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 sm:p-10 max-w-md w-full mx-4 shadow-[0_20px_60px_rgba(15,23,42,0.15)] animate-scale-reveal">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="font-display text-lg font-semibold text-slate-900">
                  Upload Media
                </h3>
                <p className="text-[12px] text-slate-400 font-light mt-0.5">
                  Adding to {CATEGORY_LABELS[activeTab] ?? activeTab}
                </p>
              </div>
              <button
                onClick={() => setShowUpload(false)}
                disabled={uploading}
                className="cursor-pointer w-8 h-8 rounded-xl bg-warm-50 border border-warm-200/40 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:border-warm-200 transition-all duration-500 disabled:opacity-50"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>

            {!uploadFile ? (
              <div
                ref={dropRef}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`cursor-pointer rounded-2xl border-2 border-dashed p-12 text-center transition-all duration-500 ${
                  dragOver
                    ? "border-gold-400 bg-gold-50/30"
                    : "border-warm-200 bg-warm-50/30 hover:border-warm-200/80 hover:bg-warm-50/60"
                }`}
              >
                <div className="w-14 h-14 rounded-2xl bg-white border border-warm-200/40 flex items-center justify-center mx-auto mb-5">
                  <FiUploadCloud className={`w-6 h-6 transition-colors duration-500 ${dragOver ? "text-gold-500" : "text-slate-300"}`} />
                </div>
                <p className="text-[14px] font-medium text-slate-600 mb-1">
                  Drag &amp; drop or click to browse
                </p>
                <p className="text-[12px] text-slate-400 font-light">
                  JPEG, PNG, WebP, MP4, MOV — max 10 MB
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPTED_TYPES}
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFileSelect(f);
                  }}
                />
              </div>
            ) : (
              <div className="space-y-5">
                {/* Preview */}
                <div className="rounded-2xl overflow-hidden border border-warm-200/40 bg-warm-50 aspect-video flex items-center justify-center">
                  {uploadFile.type.startsWith("video/") ? (
                    <video
                      src={uploadPreview ?? undefined}
                      className="max-h-full max-w-full object-contain"
                      controls
                      muted
                    />
                  ) : (
                    uploadPreview && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={uploadPreview}
                        alt="Preview"
                        className="max-h-full max-w-full object-contain"
                      />
                    )
                  )}
                </div>

                {/* File info */}
                <div className="flex items-center justify-between px-1">
                  <span className="text-[12px] text-slate-500 truncate max-w-[220px]">
                    {uploadFile.name}
                  </span>
                  <span className="text-[12px] text-slate-400 font-light">
                    {(uploadFile.size / (1024 * 1024)).toFixed(1)} MB
                  </span>
                </div>

                {/* Caption */}
                <input
                  type="text"
                  value={uploadCaption}
                  onChange={(e) => setUploadCaption(e.target.value)}
                  placeholder="Add a caption (optional)"
                  className="w-full px-4 py-3.5 border border-warm-200/60 rounded-2xl text-[14px] text-slate-800 bg-white outline-none transition-all duration-500 placeholder:text-slate-300 focus:border-slate-300 focus:shadow-[0_0_0_3px_rgba(250,248,245,1),0_0_0_5px_rgba(201,168,76,0.15)]"
                />

                {/* Progress bar */}
                {uploadProgress !== null && (
                  <div className="w-full bg-warm-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-gold-400 to-gold-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                )}

                {/* Error */}
                {uploadError && (
                  <div className="rounded-xl border border-red-100 bg-red-50/50 px-4 py-3 text-[13px] text-red-600">
                    {uploadError}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-1">
                  <button
                    onClick={() => {
                      setUploadFile(null);
                      setUploadPreview(null);
                    }}
                    disabled={uploading}
                    className="cursor-pointer flex-1 py-3 text-[13px] font-semibold text-slate-600 border border-warm-200/60 rounded-xl hover:bg-warm-50 hover:border-warm-200 transition-all duration-500 disabled:opacity-50"
                  >
                    Change File
                  </button>
                  <button
                    onClick={handleUpload}
                    disabled={uploading}
                    className="cursor-pointer flex-1 py-3 text-[13px] font-semibold text-white bg-slate-900 rounded-xl hover:bg-slate-800 shadow-[0_2px_12px_rgba(15,23,42,0.12)] hover:shadow-[0_4px_20px_rgba(15,23,42,0.2)] transition-all duration-500 disabled:opacity-50"
                  >
                    {uploading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        {uploadProgress !== null ? `${uploadProgress}%` : "Uploading..."}
                      </span>
                    ) : (
                      "Upload"
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
