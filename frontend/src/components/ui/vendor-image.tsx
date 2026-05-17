"use client";

import { useState, type CSSProperties } from "react";
import Image from "next/image";
import { FiCamera } from "react-icons/fi";

interface VendorImageProps {
  src: string | null | undefined;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
  style?: CSSProperties;
  fallbackInitial?: string;
  fallbackClassName?: string;
  unoptimized?: boolean;
}

export function VendorImage({
  src,
  alt,
  fill = true,
  width,
  height,
  className = "object-cover",
  style,
  fallbackInitial,
  fallbackClassName,
  unoptimized = true,
}: VendorImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    const initial = fallbackInitial ?? (alt ? alt.charAt(0).toUpperCase() : "");
    return (
      <div
        className={
          fallbackClassName ??
          "flex flex-col items-center justify-center h-full w-full bg-gradient-to-br from-warm-50 to-warm-100/80"
        }
      >
        {initial ? (
          <span className="font-display text-xl font-bold text-slate-300 select-none">
            {initial}
          </span>
        ) : (
          <FiCamera className="w-6 h-6 text-slate-200" />
        )}
      </div>
    );
  }

  return fill ? (
    <Image
      src={src}
      alt={alt}
      fill
      className={className}
      style={style}
      unoptimized={unoptimized}
      onError={() => setFailed(true)}
    />
  ) : (
    <Image
      src={src}
      alt={alt}
      width={width ?? 200}
      height={height ?? 200}
      className={className}
      style={style}
      unoptimized={unoptimized}
      onError={() => setFailed(true)}
    />
  );
}

export function VendorImgTag({
  src,
  alt,
  className = "w-full h-full object-cover",
  fallbackInitial,
  fallbackClassName,
}: {
  src: string | null | undefined;
  alt: string;
  className?: string;
  fallbackInitial?: string;
  fallbackClassName?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    const initial = fallbackInitial ?? (alt ? alt.charAt(0).toUpperCase() : "");
    return (
      <div
        className={
          fallbackClassName ??
          "flex flex-col items-center justify-center h-full w-full bg-gradient-to-br from-warm-50 to-warm-100/80"
        }
      >
        {initial ? (
          <span className="font-display text-xl font-bold text-slate-300 select-none">
            {initial}
          </span>
        ) : (
          <FiCamera className="w-6 h-6 text-slate-200" />
        )}
      </div>
    );
  }

  /* eslint-disable @next/next/no-img-element */
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
