"use client";

import { useState } from "react";
import { FiStar } from "react-icons/fi";

interface StarRatingProps {
  value: number;
  onChange?: (rating: number) => void;
  readonly?: boolean;
  size?: "sm" | "md" | "lg";
}

const SIZE_MAP = {
  sm: 16,
  md: 24,
  lg: 32,
};

export function StarRating({
  value,
  onChange,
  readonly = false,
  size = "md",
}: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState(0);
  const iconSize = SIZE_MAP[size];

  const displayValue = readonly ? value : hoverValue || value;

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = star <= displayValue;
        return (
          <button
            key={star}
            type="button"
            disabled={readonly}
            className={`transition-colors ${
              readonly ? "cursor-default" : "cursor-pointer hover:scale-110"
            }`}
            onMouseEnter={() => {
              if (!readonly) setHoverValue(star);
            }}
            onMouseLeave={() => {
              if (!readonly) setHoverValue(0);
            }}
            onClick={() => {
              if (!readonly && onChange) onChange(star);
            }}
            aria-label={`${star} star${star > 1 ? "s" : ""}`}
          >
            <FiStar
              size={iconSize}
              className={
                isFilled
                  ? "text-amber-400 fill-amber-400"
                  : "text-gray-300"
              }
            />
          </button>
        );
      })}
    </div>
  );
}
