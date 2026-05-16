"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import { VENDOR_CATEGORIES, type VendorProfile } from "@/types/vendor";
import { FiChevronDown, FiCheck } from "react-icons/fi";

const LocationMapPicker = dynamic(() => import("./location-map-picker"), {
  ssr: false,
  loading: () => (
    <div className="h-[320px] rounded-2xl border border-warm-200/40 bg-warm-50/30 flex items-center justify-center text-[13px] text-slate-400 font-light">
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
  "w-full px-4 py-3.5 border border-warm-200/60 rounded-xl text-[14px] text-slate-800 bg-white outline-none transition-all duration-500 placeholder:text-slate-300 focus:border-slate-300 focus:shadow-[0_0_0_3px_rgba(250,248,245,1),0_0_0_5px_rgba(201,168,76,0.15)] disabled:bg-warm-50/50 disabled:cursor-not-allowed disabled:opacity-70";

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
      {/* Row 1: Business Name + Categories */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className="block text-[12px] font-medium text-slate-500 mb-2">
            Business Name <span className="text-red-400">*</span>
          </label>
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

        <div className="relative" ref={catRef}>
          <label className="block text-[12px] font-medium text-slate-500 mb-2">
            Categories <span className="text-red-400">*</span>
          </label>
          <button
            type="button"
            disabled={disabled}
            onClick={() => setCatDropdownOpen((o) => !o)}
            className={`${INPUT_CLS} bg-white text-left flex items-center justify-between cursor-pointer`}
          >
            <span className={`truncate ${categories.length > 0 ? "text-slate-800" : "text-slate-300"}`}>
              {categories.length > 0
                ? categories.map((c) => c.charAt(0).toUpperCase() + c.slice(1)).join(", ")
                : "Select categories"}
            </span>
            <FiChevronDown className={`w-4 h-4 text-slate-400 shrink-0 ml-2 transition-transform duration-300 ${catDropdownOpen ? "rotate-180" : ""}`} />
          </button>
          {catDropdownOpen && !disabled && (
            <div className="absolute z-20 mt-2 w-full bg-white border border-warm-200/60 rounded-xl shadow-[0_8px_30px_rgba(15,23,42,0.08)] max-h-60 overflow-y-auto scrollbar-hide">
              {VENDOR_CATEGORIES.map((cat) => {
                const checked = categories.includes(cat);
                return (
                  <label
                    key={cat}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-warm-50/50 cursor-pointer text-[13px] text-slate-700 transition-colors duration-300"
                  >
                    <span className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all duration-300 ${
                      checked
                        ? "bg-slate-900 border-slate-900"
                        : "border-warm-200 bg-white"
                    }`}>
                      {checked && <FiCheck className="w-3 h-3 text-white" strokeWidth={3} />}
                    </span>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleCategory(cat)}
                      className="hidden"
                    />
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </label>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Row 2: Description (full width) */}
      <div>
        <label className="block text-[12px] font-medium text-slate-500 mb-2">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={disabled}
          rows={3}
          className={`${INPUT_CLS} resize-none`}
          placeholder="Tell couples about your business, style, and what makes you unique..."
        />
      </div>

      {/* Row 3: Phone + Location + Years of Experience */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div>
          <label className="block text-[12px] font-medium text-slate-500 mb-2">
            Phone Number <span className="text-red-400">*</span>
          </label>
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
          <label className="block text-[12px] font-medium text-slate-500 mb-2">
            Location <span className="text-red-400">*</span>
          </label>
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
        <div>
          <label className="block text-[12px] font-medium text-slate-500 mb-2">Years of Experience</label>
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
      </div>

      {/* Row 4: Social Media */}
      <div>
        <label className="block text-[12px] font-medium text-slate-500 mb-2">Social Media</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[12px] text-slate-400">
              instagram.com/
            </span>
            <input
              type="text"
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              disabled={disabled}
              className={`${INPUT_CLS} !pl-[120px]`}
              placeholder="username"
            />
          </div>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[12px] text-slate-400">
              t.me/
            </span>
            <input
              type="text"
              value={telegram}
              onChange={(e) => setTelegram(e.target.value)}
              disabled={disabled}
              className={`${INPUT_CLS} !pl-[60px]`}
              placeholder="username"
            />
          </div>
        </div>
      </div>

      {/* Row 5: Map Picker (full width) */}
      <div>
        <label className="block text-[12px] font-medium text-slate-500 mb-1.5">
          Pin Your Location on Map <span className="text-red-400">*</span>
        </label>
        <p className="text-[11px] text-slate-400 font-light mb-3">
          Click on the map to set your exact business location.
        </p>
        <div className="rounded-2xl overflow-hidden border border-warm-200/40">
          <LocationMapPicker
            latitude={latitude}
            longitude={longitude}
            onChange={handleMapChange}
            disabled={disabled}
          />
        </div>
        <div className="grid grid-cols-2 gap-4 mt-3">
          <div>
            <label className="block text-[11px] text-slate-400 font-light mb-1">Latitude</label>
            <input
              type="number"
              step="0.00000001"
              value={latitude}
              onChange={(e) => setLatitude(Number(e.target.value))}
              disabled={disabled}
              className={`${INPUT_CLS} !py-2.5 !text-[12px]`}
            />
          </div>
          <div>
            <label className="block text-[11px] text-slate-400 font-light mb-1">Longitude</label>
            <input
              type="number"
              step="0.00000001"
              value={longitude}
              onChange={(e) => setLongitude(Number(e.target.value))}
              disabled={disabled}
              className={`${INPUT_CLS} !py-2.5 !text-[12px]`}
            />
          </div>
        </div>
      </div>

      {/* Portfolio links (read-only) */}
      {portfolio.length > 0 && (
        <div>
          <label className="block text-[12px] font-medium text-slate-500 mb-2">Portfolio</label>
          <div className="flex flex-wrap gap-2">
            {portfolio.map((url, i) => (
              <a
                key={i}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[12px] text-slate-500 hover:text-slate-900 underline underline-offset-2 truncate max-w-[200px] transition-colors duration-300"
              >
                {url.split("/").pop()}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-100 bg-red-50/50 px-4 py-3.5 text-[13px] text-red-600 leading-relaxed">
          {error}
        </div>
      )}

      {/* Submit */}
      {!disabled && (
        <button
          type="submit"
          disabled={loading}
          className="cursor-pointer w-full flex items-center justify-center gap-2 py-3.5 bg-slate-900 text-white rounded-xl text-[13px] font-semibold shadow-[0_2px_12px_rgba(15,23,42,0.1)] hover:bg-slate-800 hover:shadow-[0_4px_20px_rgba(15,23,42,0.18)] transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Saving...
            </span>
          ) : (
            submitLabel
          )}
        </button>
      )}
    </form>
  );
}
