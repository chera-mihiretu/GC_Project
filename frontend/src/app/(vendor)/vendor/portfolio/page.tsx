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
  FiLoader,
} from "react-icons/fi";
import Link from "next/link";

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-gray-400">
        <div className="animate-pulse text-sm">Loading portfolio...</div>
      </div>
    );
  }

  if (noProfile) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900 font-display flex items-center gap-2">
          <FiImage className="w-7 h-7 text-rose-500" />
          Portfolio
        </h1>
        <div className="bg-white rounded-xl border border-gray-200/80 border-dashed p-12 text-center">
          <FiAlertCircle className="w-10 h-10 text-gray-300 mx-auto mb-4" />
          <h3 className="text-sm font-semibold text-gray-700 mb-1">
            Complete your profile first
          </h3>
          <p className="text-xs text-gray-400 max-w-sm mx-auto mb-4">
            Set up your vendor profile with at least one service category to start building your portfolio.
          </p>
          <Link
            href="/vendor/profile/setup"
            className="inline-block px-5 py-2.5 bg-rose-500 text-white text-sm font-semibold rounded-lg hover:bg-rose-600 transition-colors"
          >
            Go to Profile Setup
          </Link>
        </div>
      </div>
    );
  }

  const currentItems = portfolio[activeTab] ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 font-display flex items-center gap-2">
            <FiImage className="w-7 h-7 text-rose-500" />
            Portfolio
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Showcase your work across each service you offer.
          </p>
        </div>
        {!isStaff && (
          <button
            onClick={openUploadDialog}
            className="flex items-center gap-2 px-5 py-2.5 bg-rose-500 text-white text-sm font-semibold rounded-lg hover:bg-rose-600 transition-colors cursor-pointer"
          >
            <FiPlus className="w-4 h-4" />
            Add Media
          </button>
        )}
      </div>

      {/* Category tabs */}
      <div className="flex gap-1 overflow-x-auto border-b border-gray-200 pb-px scrollbar-hide" style={{ WebkitOverflowScrolling: "touch" }}>
        {categories.map((cat) => {
          const count = totals[cat] ?? (portfolio[cat] ?? []).length;
          return (
            <button
              key={cat}
              onClick={() => setActiveTab(cat)}
              className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors cursor-pointer ${
                activeTab === cat
                  ? "border-rose-500 text-rose-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {CATEGORY_LABELS[cat] ?? cat}
              {count > 0 && (
                <span className="ml-1.5 text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Media grid */}
      {loadingCategory && currentItems.length === 0 ? (
        <div className="flex justify-center py-12">
          <FiLoader className="w-5 h-5 text-gray-400 animate-spin" />
        </div>
      ) : currentItems.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200/80 border-dashed p-12 text-center">
          <FiImage className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-gray-700 mb-1">
            No {CATEGORY_LABELS[activeTab] ?? activeTab} items yet
          </h3>
          <p className="text-xs text-gray-400">
            {isStaff
              ? "The vendor owner hasn't added any items to this category yet."
              : "Upload photos or videos to showcase your work."}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {currentItems.map((item) => (
              <div
                key={item.id}
                className={`group relative rounded-xl overflow-hidden border border-gray-200/80 bg-gray-50 aspect-square ${
                  deleting.has(item.id) ? "opacity-40 pointer-events-none" : ""
                }`}
              >
                {item.mediaType === "video" ? (
                  <video
                    src={item.mediaUrl}
                    className="w-full h-full object-cover"
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
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.mediaUrl}
                    alt={item.caption ?? "Portfolio item"}
                    className="w-full h-full object-cover"
                  />
                )}

                {item.mediaType === "video" && (
                  <div className="absolute top-2 left-2 bg-black/60 text-white rounded-md px-1.5 py-0.5 text-[10px] font-medium flex items-center gap-1">
                    <FiFilm className="w-3 h-3" /> Video
                  </div>
                )}

                {/* Caption + delete overlay */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 pt-8 opacity-0 group-hover:opacity-100 transition-opacity">
                  {item.caption && (
                    <p className="text-white text-xs line-clamp-2">{item.caption}</p>
                  )}
                </div>

                {!isStaff && (
                  <button
                    onClick={() => setDeleteConfirm(item.id)}
                    className="absolute top-2 right-2 bg-white/90 text-red-500 rounded-lg p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 cursor-pointer"
                  >
                    <FiTrash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {currentItems.length < (totals[activeTab] ?? 0) && (
            <div className="flex justify-center pt-4">
              <button
                onClick={() => fetchCategoryItems(activeTab, true)}
                disabled={loadingMore}
                className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 disabled:opacity-50 transition-colors cursor-pointer"
              >
                {loadingMore ? <FiLoader className="w-4 h-4 animate-spin" /> : null}
                {loadingMore ? "Loading..." : `Load more (${currentItems.length} of ${totals[activeTab]})`}
              </button>
            </div>
          )}
        </>
      )}

      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="text-base font-semibold text-gray-900 mb-2">Delete this item?</h3>
            <p className="text-sm text-gray-500 mb-5">
              This will permanently remove the media file from your portfolio.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload dialog */}
      {showUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-900">
                Upload to {CATEGORY_LABELS[activeTab] ?? activeTab}
              </h3>
              <button
                onClick={() => setShowUpload(false)}
                disabled={uploading}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {!uploadFile ? (
              <div
                ref={dropRef}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-rose-400 transition-colors"
              >
                <FiUploadCloud className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-600">
                  Drag & drop or click to browse
                </p>
                <p className="text-xs text-gray-400 mt-1">
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
              <div className="space-y-4">
                {/* Preview */}
                <div className="rounded-lg overflow-hidden border border-gray-200 bg-gray-50 aspect-video flex items-center justify-center">
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

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className="truncate max-w-[200px]">{uploadFile.name}</span>
                  <span>{(uploadFile.size / (1024 * 1024)).toFixed(1)} MB</span>
                </div>

                {/* Caption */}
                <input
                  type="text"
                  value={uploadCaption}
                  onChange={(e) => setUploadCaption(e.target.value)}
                  placeholder="Add a caption (optional)"
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 bg-white outline-none placeholder:text-gray-400 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all"
                />

                {/* Progress bar */}
                {uploadProgress !== null && (
                  <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-rose-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                )}

                {uploadError && (
                  <p className="text-xs text-red-500">{uploadError}</p>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setUploadFile(null);
                      setUploadPreview(null);
                    }}
                    disabled={uploading}
                    className="flex-1 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Change File
                  </button>
                  <button
                    onClick={handleUpload}
                    disabled={uploading}
                    className="flex-1 py-2.5 text-sm font-semibold text-white bg-rose-500 rounded-lg hover:bg-rose-600 transition-colors cursor-pointer disabled:opacity-60"
                  >
                    {uploading
                      ? uploadProgress !== null
                        ? `Uploading ${uploadProgress}%`
                        : "Uploading..."
                      : "Upload"}
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
