"use client";

import { FiStar, FiMapPin } from "react-icons/fi";
import type { VendorCard as VendorCardType } from "@/services/ai.service";

interface Props {
  vendor: VendorCardType;
  onClick?: (vendorId: string) => void;
}

export default function VendorCard({ vendor, onClick }: Props) {
  const priceLabel =
    vendor.priceRangeMin && vendor.priceRangeMax
      ? `${vendor.priceRangeMin.toLocaleString()} - ${vendor.priceRangeMax.toLocaleString()} ETB`
      : vendor.priceRangeMin
        ? `From ${vendor.priceRangeMin.toLocaleString()} ETB`
        : null;

  return (
    <button
      onClick={() => onClick?.(vendor.id)}
      className="flex gap-3 p-3 rounded-xl border border-gray-200 hover:border-rose-300 hover:shadow-sm transition-all bg-white group text-left w-full cursor-pointer"
    >
      {vendor.thumbnail && (
        <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
          <img
            src={vendor.thumbnail}
            alt={vendor.businessName}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-sm text-gray-900 truncate group-hover:text-rose-600 transition-colors">
          {vendor.businessName}
        </h4>
        <div className="flex items-center gap-2 mt-0.5">
          <div className="flex items-center gap-0.5 text-amber-500">
            <FiStar className="w-3 h-3 fill-current" />
            <span className="text-xs font-medium">{vendor.rating.toFixed(1)}</span>
          </div>
          <span className="text-xs text-gray-400">({vendor.reviewCount})</span>
          {vendor.location && (
            <span className="flex items-center gap-0.5 text-xs text-gray-500">
              <FiMapPin className="w-3 h-3" />
              {vendor.location}
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-1 mt-1">
          {vendor.category.slice(0, 2).map((cat) => (
            <span
              key={cat}
              className="px-1.5 py-0.5 text-[10px] font-medium rounded-full bg-rose-50 text-rose-600"
            >
              {cat}
            </span>
          ))}
        </div>
        {priceLabel && (
          <p className="text-xs text-gray-500 mt-1">{priceLabel}</p>
        )}
      </div>
    </button>
  );
}
