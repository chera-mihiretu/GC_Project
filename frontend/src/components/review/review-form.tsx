"use client";

import { useState } from "react";
import { StarRating } from "./star-rating";
import { createReview } from "@/services/review.service";

interface ReviewFormProps {
  bookingId: string;
  onSuccess: () => void;
}

export function ReviewForm({ bookingId, onSuccess }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const maxChars = 1000;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (rating === 0) {
      setError("Please select a rating");
      return;
    }

    setLoading(true);
    try {
      await createReview({
        bookingId,
        rating,
        comment: comment.trim() || undefined,
      });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit review");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Your Rating
        </label>
        <StarRating value={rating} onChange={setRating} size="lg" />
      </div>

      <div>
        <label
          htmlFor="review-comment"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Comment (optional)
        </label>
        <textarea
          id="review-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value.slice(0, maxChars))}
          rows={4}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
                     focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent
                     resize-none"
          placeholder="Tell us about your experience..."
        />
        <p className="text-xs text-gray-400 text-right mt-1">
          {comment.length}/{maxChars}
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading || rating === 0}
        className="w-full bg-rose-600 text-white font-medium py-2.5 px-4 rounded-lg
                   hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed
                   transition-colors"
      >
        {loading ? "Submitting..." : "Submit Review"}
      </button>
    </form>
  );
}
