"use client";

import { useEffect, useState, useCallback } from "react";
import {
  listReviewsAdmin,
  moderateReview,
} from "@/services/admin-review.service";
import type { ReviewWithAuthor } from "@/types/review";
import { StarRating } from "@/components/review/star-rating";
import { FiCheckCircle, FiXCircle, FiChevronLeft, FiChevronRight } from "react-icons/fi";

type FilterTab = "all" | "approved" | "rejected";

const TABS: { label: string; value: FilterTab }[] = [
  { label: "All", value: "all" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
];

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
      const result = await listReviewsAdmin({ isApproved, page, limit: 20 });
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
      // error silently handled
    } finally {
      setActionLoading(null);
    }
  }

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Review Moderation</h1>
        <p className="text-gray-500 text-sm mt-1">
          Manage and moderate user reviews
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => {
              setTab(t.value);
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              tab === t.value
                ? "bg-gray-900 text-white"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-100"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200/80 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm animate-pulse">
            Loading...
          </div>
        ) : reviews.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            No reviews found
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                <th className="text-left px-4 py-3 font-medium text-gray-500">Reviewer</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Vendor</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Rating</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 hidden md:table-cell">Comment</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                <th className="px-4 py-3 font-medium text-gray-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((review) => (
                <tr
                  key={review.id}
                  className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {review.authorName}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {review.vendorName ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <StarRating value={review.rating} readonly size="sm" />
                  </td>
                  <td className="px-4 py-3 text-gray-500 hidden md:table-cell max-w-xs truncate">
                    {review.comment ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    {review.isApproved ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-600">
                        <FiCheckCircle className="w-3 h-3" /> Approved
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-600">
                        <FiXCircle className="w-3 h-3" /> Rejected
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {!review.isApproved && (
                        <button
                          onClick={() => handleModerate(review.id, "approve")}
                          disabled={actionLoading === review.id}
                          className="px-2.5 py-1 text-xs font-medium text-green-600 border border-green-200 rounded-md hover:bg-green-50 disabled:opacity-50 transition-colors"
                        >
                          Approve
                        </button>
                      )}
                      {review.isApproved && (
                        <button
                          onClick={() => handleModerate(review.id, "reject")}
                          disabled={actionLoading === review.id}
                          className="px-2.5 py-1 text-xs font-medium text-red-600 border border-red-200 rounded-md hover:bg-red-50 disabled:opacity-50 transition-colors"
                        >
                          Reject
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
          >
            <FiChevronLeft className="w-4 h-4" /> Previous
          </button>
          <span className="text-sm text-gray-500">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
          >
            Next <FiChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
