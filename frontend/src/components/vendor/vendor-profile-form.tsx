"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import { VENDOR_CATEGORIES, type VendorProfile } from "@/types/vendor";

const LocationMapPicker = dynamic(() => import("./location-map-picker"), {
  ssr: false,
  loading: () => (
    <div className="h-[300px] rounded-lg border border-gray-300 bg-gray-50 flex items-center justify-center text-sm text-gray-400">
      Loading map...
    </div>
  ),
});

export interface VendorProfileFormData {
  businessName: string;
  category: string[];
  description: string;
  phoneNumber: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  yearsOfExperience: number | null;
  socialMedia: Record<string, string>;
}

interface Props {
  initialData?: Partial<VendorProfile>;
  onSubmit: (data: VendorProfileFormData) => Promise<void>;
  submitLabel?: string;
  disabled?: boolean;
}

const ADDIS_ABABA_LAT = 9.005401;
const ADDIS_ABABA_LNG = 38.764142;
const INPUT_CLS =
  "w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-rose-300 focus:border-rose-400 outline-none";

export default function VendorProfileForm({
  initialData,
  onSubmit,
  submitLabel = "Save Profile",
  disabled,
}: Props) {
  const [businessName, setBusinessName] = useState(initialData?.businessName ?? "");
  const [categories, setCategories] = useState<string[]>(initialData?.category ?? []);
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [phoneNumber, setPhoneNumber] = useState(initialData?.phoneNumber ?? "");
  const [location, setLocation] = useState(initialData?.location ?? "");
  const [latitude, setLatitude] = useState<number>(initialData?.latitude ?? ADDIS_ABABA_LAT);
  const [longitude, setLongitude] = useState<number>(initialData?.longitude ?? ADDIS_ABABA_LNG);
  const [yearsExp, setYearsExp] = useState(initialData?.yearsOfExperience?.toString() ?? "");
  const [instagram, setInstagram] = useState(initialData?.socialMedia?.instagram ?? "");
  const [telegram, setTelegram] = useState(initialData?.socialMedia?.telegram ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const portfolio = useMemo(() => initialData?.portfolio ?? [], [initialData?.portfolio]);

  function handleMapChange(lat: number, lng: number) {
    setLatitude(lat);
    setLongitude(lng);
  }

  const [catDropdownOpen, setCatDropdownOpen] = useState(false);
  const catRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (catRef.current && !catRef.current.contains(e.target as Node)) {
        setCatDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function toggleCategory(cat: string) {
    setCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat],
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (categories.length === 0) {
      setError("Please select at least one category.");
      return;
    }

    setLoading(true);
    try {
      const socialMedia: Record<string, string> = {};
      if (instagram.trim()) socialMedia.instagram = instagram.trim();
      if (telegram.trim()) socialMedia.telegram = telegram.trim();

      await onSubmit({
        businessName,
        category: categories,
        description,
        phoneNumber,
        location,
        latitude,
        longitude,
        yearsOfExperience: yearsExp ? Number(yearsExp) : null,
        socialMedia,
      });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Business Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Business Name *</label>
        <input
          type="text"
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          required
          disabled={disabled}
          className={INPUT_CLS}
          placeholder="e.g. Addis Catering"
        />
      </div>

      {/* Categories (multi-select dropdown) */}
      <div className="relative" ref={catRef}>
        <label className="block text-sm font-medium text-gray-700 mb-1">Categories *</label>
        <button
          type="button"
          disabled={disabled}
          onClick={() => setCatDropdownOpen((o) => !o)}
          className={`${INPUT_CLS} bg-white text-left flex items-center justify-between`}
        >
          <span className={categories.length > 0 ? "text-gray-800" : "text-gray-400"}>
            {categories.length > 0
              ? categories.map((c) => c.charAt(0).toUpperCase() + c.slice(1)).join(", ")
              : "Select categories"}
          </span>
          <svg className="w-4 h-4 text-gray-400 shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {catDropdownOpen && !disabled && (
          <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {VENDOR_CATEGORIES.map((cat) => (
              <label
                key={cat}
                className="flex items-center gap-2.5 px-4 py-2 hover:bg-gray-50 cursor-pointer text-sm text-gray-700"
              >
                <input
                  type="checkbox"
                  checked={categories.includes(cat)}
                  onChange={() => toggleCategory(cat)}
                  className="rounded border-gray-300 text-rose-500 focus:ring-rose-400"
                />
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={disabled}
          rows={4}
          className={`${INPUT_CLS} resize-none`}
          placeholder="Tell couples about your business..."
        />
      </div>

      {/* Phone + Location text */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            required
            disabled={disabled}
            className={INPUT_CLS}
            placeholder="+251911234567"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
            disabled={disabled}
            className={INPUT_CLS}
            placeholder="e.g. Bole, Addis Ababa"
          />
        </div>
      </div>

      {/* Map Picker */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Pin Your Location on Map *
        </label>
        <p className="text-xs text-gray-500 mb-2">Click on the map to set your exact location.</p>
        <LocationMapPicker
          latitude={latitude}
          longitude={longitude}
          onChange={handleMapChange}
          disabled={disabled}
        />
        <div className="grid grid-cols-2 gap-4 mt-2">
          <div>
            <label className="block text-xs text-gray-500 mb-0.5">Latitude</label>
            <input
              type="number"
              step="0.00000001"
              value={latitude}
              onChange={(e) => setLatitude(Number(e.target.value))}
              disabled={disabled}
              className={`${INPUT_CLS} text-xs`}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-0.5">Longitude</label>
            <input
              type="number"
              step="0.00000001"
              value={longitude}
              onChange={(e) => setLongitude(Number(e.target.value))}
              disabled={disabled}
              className={`${INPUT_CLS} text-xs`}
            />
          </div>
        </div>
      </div>

      {/* Years of Experience */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Years of Experience</label>
        <input
          type="number"
          min={0}
          value={yearsExp}
          onChange={(e) => setYearsExp(e.target.value)}
          disabled={disabled}
          className={INPUT_CLS}
          placeholder="e.g. 5"
        />
      </div>

      {/* Social Media */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Social Media</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input
            type="url"
            value={instagram}
            onChange={(e) => setInstagram(e.target.value)}
            disabled={disabled}
            className={INPUT_CLS}
            placeholder="Instagram URL"
          />
          <input
            type="url"
            value={telegram}
            onChange={(e) => setTelegram(e.target.value)}
            disabled={disabled}
            className={INPUT_CLS}
            placeholder="Telegram URL"
          />
        </div>
      </div>

      {/* Portfolio (read-only display) */}
      {portfolio.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Portfolio</label>
          <div className="flex flex-wrap gap-2">
            {portfolio.map((url, i) => (
              <a
                key={i}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-rose-600 underline truncate max-w-[200px]"
              >
                {url.split("/").pop()}
              </a>
            ))}
          </div>
        </div>
      )}

      {error && <p className="text-red-600 text-sm">{error}</p>}

      {!disabled && (
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          {loading ? "Saving..." : submitLabel}
        </button>
      )}
    </form>
  );
}
