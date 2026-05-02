"use client";

import { useEffect, useState, useCallback } from "react";
import { getVendorReviews } from "@/services/review.service";
import type { ReviewWithAuthor } from "@/types/review";
import { StarRating } from "./star-rating";
import { FiMessageSquare, FiChevronDown } from "react-icons/fi";

interface ReviewListProps {
  vendorProfileId: string;
}

const PAGE_SIZE = 5;

export function ReviewList({ vendorProfileId }: ReviewListProps) {
  const [reviews, setReviews] = useState<ReviewWithAuthor[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchReviews = useCallback(async (pageNum: number, append: boolean) => {
    if (append) setLoadingMore(true); else setLoading(true);
    try {
      const result = await getVendorReviews(vendorProfileId, {
        page: pageNum,
        limit: PAGE_SIZE,
      });
      setReviews((prev) => append ? [...prev, ...result.data] : result.data);
      setTotal(result.total);
      setPage(pageNum);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [vendorProfileId]);

  useEffect(() => {
    fetchReviews(1, false);
  }, [fetchReviews]);

  const hasMore = reviews.length < total;

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-gray-100 rounded-lg" />
        ))}
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-8">
        <FiMessageSquare className="w-8 h-8 text-gray-300 mx-auto mb-3" />
        <p className="text-sm text-gray-500">No reviews yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <div
          key={review.id}
          className="border border-gray-100 rounded-lg p-4 space-y-2"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 text-xs font-bold">
                {review.authorName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {review.authorName}
                </p>
                <p className="text-xs text-gray-400">
                  {new Date(review.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
            <StarRating value={review.rating} readonly size="sm" />
          </div>
          {review.comment && (
            <p className="text-sm text-gray-600 leading-relaxed">
              {review.comment}
            </p>
          )}
        </div>
      ))}

      {hasMore && (
        <button
          onClick={() => fetchReviews(page + 1, true)}
          disabled={loadingMore}
          className="w-full flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          {loadingMore ? "Loading..." : (
            <>
              Show more reviews <FiChevronDown className="w-4 h-4" />
            </>
          )}
        </button>
      )}
    </div>
  );
}
