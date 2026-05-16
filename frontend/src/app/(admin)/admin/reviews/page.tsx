"use client";

import { useEffect, useState, useCallback } from "react";
import {
  listReviewsAdmin,
  moderateReview,
} from "@/services/admin-review.service";
import type { ReviewWithAuthor } from "@/types/review";
import { StarRating } from "@/components/review/star-rating";
import {
  FiCheckCircle,
  FiXCircle,
  FiChevronLeft,
  FiChevronRight,
  FiStar,
  FiLoader,
  FiMessageSquare,
  FiUser,
  FiShoppingBag,
} from "react-icons/fi";

type FilterTab = "all" | "approved" | "rejected";

const TABS: { label: string; value: FilterTab }[] = [
  { label: "All Reviews", value: "all" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
];

const PAGE_SIZE = 8;

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<(ReviewWithAuthor & { vendorName?: string })[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [tab, setTab] = useState<FilterTab>("all");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const isApproved =
        tab === "approved" ? true : tab === "rejected" ? false : undefined;
      const result = await listReviewsAdmin({ isApproved, page, limit: PAGE_SIZE });
      setReviews(result.data);
      setTotal(result.total);
    } catch {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, [tab, page]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  async function handleModerate(reviewId: string, action: "approve" | "reject") {
    setActionLoading(reviewId);
    try {
      await moderateReview(reviewId, action);
      await fetchReviews();
    } catch {
      // silently handled
    } finally {
      setActionLoading(null);
    }
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-10">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-editorial text-slate-400 mb-2">
            Moderation
          </p>
          <h1 className="font-display text-3xl font-bold text-slate-900 tracking-headline">
            Review Moderation
          </h1>
          <p className="text-[14px] text-slate-400 font-light mt-2">
            {loading ? "Loading..." : `${total} review${total !== 1 ? "s" : ""} across the platform`}
          </p>
        </div>

        {/* Filter tabs */}
        <div className="rounded-xl bg-warm-50/60 border border-warm-200/30 p-1 flex gap-0.5 w-fit self-start sm:self-auto">
          {TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => { setTab(t.value); setPage(1); }}
              className={`cursor-pointer px-4 py-2 rounded-lg text-[12px] font-medium whitespace-nowrap transition-all duration-500 ${
                tab === t.value
                  ? "bg-white text-slate-900 shadow-[0_1px_4px_rgba(15,23,42,0.06)]"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-warm-200/30 bg-white p-6 sm:p-7 animate-pulse">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-warm-100 rounded-xl shrink-0" />
                <div className="flex-1 space-y-3">
                  <div className="flex gap-3">
                    <div className="h-4 w-28 bg-warm-100 rounded" />
                    <div className="h-4 w-20 bg-warm-100 rounded" />
                  </div>
                  <div className="h-3 w-full max-w-sm bg-warm-100 rounded" />
                  <div className="h-3 w-48 bg-warm-100 rounded" />
                </div>
                <div className="h-7 w-20 bg-warm-100 rounded-lg shrink-0" />
              </div>
            </div>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="rounded-2xl border border-warm-200/50 bg-white py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-warm-50 border border-warm-200/40 flex items-center justify-center mx-auto mb-6">
            <FiStar className="w-7 h-7 text-slate-300" />
          </div>
          <p className="font-display text-lg font-semibold text-slate-500 mb-2">No reviews found</p>
          <p className="text-[13px] text-slate-400 font-light max-w-xs mx-auto">
            {tab === "all"
              ? "Reviews will appear here once couples start rating vendors"
              : `No ${tab} reviews at the moment`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="group rounded-2xl border border-warm-200/40 bg-white hover:border-warm-200/70 hover:shadow-[0_2px_16px_rgba(15,23,42,0.03)] transition-all duration-500"
            >
              <div className="p-5 sm:p-6">
                {/* Top row: reviewer info + status */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-warm-50 border border-warm-200/40 flex items-center justify-center shrink-0">
                      <FiUser className="w-4 h-4 text-slate-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[14px] font-medium text-slate-800 truncate">
                        {review.authorName}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <FiShoppingBag className="w-3 h-3 text-slate-300 shrink-0" />
                        <p className="text-[12px] text-slate-400 font-light truncate">
                          {review.vendorName ?? "Unknown vendor"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Status badge */}
                  {review.isApproved ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-luxury bg-emerald-50 text-emerald-600 border border-emerald-200/40 shrink-0">
                      <FiCheckCircle className="w-3 h-3" /> Approved
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-luxury bg-red-50 text-red-500 border border-red-200/40 shrink-0">
                      <FiXCircle className="w-3 h-3" /> Rejected
                    </span>
                  )}
                </div>

                {/* Rating */}
                <div className="mb-3">
                  <StarRating value={review.rating} readonly size="sm" />
                </div>

                {/* Comment */}
                {review.comment && (
                  <div className="flex gap-2.5 mb-4">
                    <FiMessageSquare className="w-3.5 h-3.5 text-slate-300 mt-0.5 shrink-0" />
                    <p className="text-[13px] text-slate-500 font-light leading-relaxed line-clamp-3">
                      {review.comment}
                    </p>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-warm-200/20">
                  {!review.isApproved && (
                    <button
                      onClick={() => handleModerate(review.id, "approve")}
                      disabled={actionLoading === review.id}
                      className="cursor-pointer inline-flex items-center gap-1.5 px-4 py-2 text-[12px] font-semibold text-emerald-600 bg-emerald-50/50 border border-emerald-200/40 rounded-xl hover:bg-emerald-50 hover:border-emerald-200 disabled:opacity-40 transition-all duration-500"
                    >
                      {actionLoading === review.id ? (
                        <FiLoader className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <FiCheckCircle className="w-3.5 h-3.5" />
                      )}
                      Approve
                    </button>
                  )}
                  {review.isApproved && (
                    <button
                      onClick={() => handleModerate(review.id, "reject")}
                      disabled={actionLoading === review.id}
                      className="cursor-pointer inline-flex items-center gap-1.5 px-4 py-2 text-[12px] font-semibold text-red-500 bg-red-50/50 border border-red-200/40 rounded-xl hover:bg-red-50 hover:border-red-200 disabled:opacity-40 transition-all duration-500"
                    >
                      {actionLoading === review.id ? (
                        <FiLoader className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <FiXCircle className="w-3.5 h-3.5" />
                      )}
                      Reject
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

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
