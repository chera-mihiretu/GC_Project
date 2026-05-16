"use client";

import { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { useSession } from "@/lib/auth-client";
import {
  getCoupleProfile,
  createCoupleProfile,
  updateCoupleProfile,
  type CoupleProfile,
  type CoupleProfilePayload,
} from "@/services/couple.service";
import {
  FiHeart,
  FiCalendar,
  FiUsers,
  FiMapPin,
  FiStar,
  FiDollarSign,
  FiUser,
  FiCheck,
  FiAlertCircle,
} from "react-icons/fi";

const LocationMapPicker = dynamic(
  () => import("@/components/vendor/location-map-picker"),
  {
    ssr: false,
    loading: () => (
      <div className="h-[300px] rounded-2xl border border-warm-200/40 bg-warm-50/30 flex items-center justify-center text-[13px] text-slate-300 font-light">
        Loading map...
      </div>
    ),
  },
);

const ETHIOPIAN_CITIES: { name: string; lat: number; lng: number }[] = [
  { name: "Addis Ababa", lat: 9.005401, lng: 38.764142 },
  { name: "Adama (Nazret)", lat: 8.54, lng: 39.27 },
  { name: "Dire Dawa", lat: 9.6, lng: 41.85 },
  { name: "Hawassa", lat: 7.06, lng: 38.48 },
  { name: "Bahir Dar", lat: 11.6, lng: 37.38 },
  { name: "Gondar", lat: 12.6, lng: 37.47 },
  { name: "Mekelle", lat: 13.5, lng: 39.47 },
  { name: "Jimma", lat: 7.67, lng: 36.83 },
  { name: "Harar", lat: 9.31, lng: 42.12 },
  { name: "Dessie", lat: 11.13, lng: 39.63 },
  { name: "Debre Markos", lat: 10.35, lng: 37.73 },
  { name: "Shashamane", lat: 7.2, lng: 38.6 },
  { name: "Bishoftu (Debre Zeit)", lat: 8.75, lng: 38.98 },
  { name: "Arba Minch", lat: 6.04, lng: 37.55 },
  { name: "Nekemte", lat: 9.09, lng: 36.55 },
  { name: "Asella", lat: 7.95, lng: 39.13 },
  { name: "Woldia", lat: 11.83, lng: 39.6 },
  { name: "Debre Birhan", lat: 9.68, lng: 39.53 },
  { name: "Axum", lat: 14.13, lng: 38.72 },
  { name: "Lalibela", lat: 12.03, lng: 39.04 },
];

const THEME_OPTIONS = [
  "Traditional",
  "Modern",
  "Traditional + Modern",
  "Outdoor",
  "Minimalist",
  "Rustic",
  "Cultural",
  "Other",
];

const CURRENCY_OPTIONS = ["ETB", "USD"];

const ADDIS_LAT = 9.005401;
const ADDIS_LNG = 38.764142;

const INPUT_CLS =
  "w-full px-4 py-3 rounded-xl bg-warm-50/60 border border-warm-200/40 text-[13px] text-slate-800 placeholder:text-slate-300 outline-none transition-all duration-500 focus:border-gold-400/50 focus:ring-2 focus:ring-gold-400/10";

export default function CoupleProfilePage() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<CoupleProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const [weddingDate, setWeddingDate] = useState("");
  const [partnerName, setPartnerName] = useState("");
  const [estimatedGuests, setEstimatedGuests] = useState("");
  const [weddingTheme, setWeddingTheme] = useState("");
  const [weddingLocation, setWeddingLocation] = useState("");
  const [latitude, setLatitude] = useState(ADDIS_LAT);
  const [longitude, setLongitude] = useState(ADDIS_LNG);
  const [budgetCurrency, setBudgetCurrency] = useState("ETB");

  const fetchProfile = useCallback(async () => {
    try {
      const data = await getCoupleProfile();
      if (data?.coupleProfile) {
        const p = data.coupleProfile;
        setProfile(p);
        setWeddingDate(p.weddingDate ? p.weddingDate.split("T")[0] : "");
        setPartnerName(p.partnerName ?? "");
        setEstimatedGuests(p.estimatedGuests != null ? String(p.estimatedGuests) : "");
        setWeddingTheme(p.weddingTheme ?? "");
        setWeddingLocation(p.weddingLocation ?? "");
        setLatitude(p.latitude ?? ADDIS_LAT);
        setLongitude(p.longitude ?? ADDIS_LNG);
        setBudgetCurrency(p.budgetCurrency || "ETB");
      }
    } catch {
      // No profile yet
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  function handleCityChange(cityName: string) {
    setWeddingLocation(cityName);
    const city = ETHIOPIAN_CITIES.find((c) => c.name === cityName);
    if (city) {
      setLatitude(city.lat);
      setLongitude(city.lng);
    }
  }

  function handleMapChange(lat: number, lng: number) {
    setLatitude(lat);
    setLongitude(lng);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    const payload: CoupleProfilePayload = {
      weddingDate: weddingDate || null,
      partnerName: partnerName || null,
      estimatedGuests: estimatedGuests ? parseInt(estimatedGuests, 10) : null,
      weddingTheme: weddingTheme || null,
      weddingLocation: weddingLocation || null,
      latitude,
      longitude,
      budgetCurrency,
    };

    try {
      if (profile) {
        const result = await updateCoupleProfile(payload);
        setProfile(result.coupleProfile);
        setSuccess("Profile updated successfully!");
      } else {
        const result = await createCoupleProfile(payload);
        setProfile(result.coupleProfile);
        setSuccess("Profile created successfully!");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save profile");
    } finally {
      setSaving(false);
      setTimeout(() => setSuccess(""), 4000);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-warm-200/40 border-t-gold-400 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[13px] text-slate-400 font-light">Loading profile...</p>
        </div>
      </div>
    );
  }

  const firstName = session?.user?.name?.split(" ")[0] ?? "";

  return (
    <div className="space-y-8">
      {/* ── Header ── */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-editorial text-slate-400 mb-2">
          Your Wedding
        </p>
        <h1 className="font-display text-3xl font-bold text-slate-900 tracking-headline flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200/40 flex items-center justify-center shrink-0">
            <FiHeart className="w-4.5 h-4.5 text-rose-500" />
          </div>
          Wedding Profile
        </h1>
        <p className="text-[14px] text-slate-400 font-light mt-2">
          {profile
            ? "Keep your wedding details up to date for personalized recommendations."
            : `${firstName ? `Hi ${firstName}! ` : ""}Tell us about your special day so we can help you plan.`}
        </p>
      </div>

      {/* ── Alerts ── */}
      {success && (
        <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 border border-emerald-200/40 px-5 py-4 text-[13px] text-emerald-700">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 border border-emerald-200/40 flex items-center justify-center shrink-0">
            <FiCheck className="w-4 h-4 text-emerald-500" />
          </div>
          {success}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-3 rounded-2xl bg-red-50 border border-red-200/40 px-5 py-4 text-[13px] text-red-600">
          <div className="w-8 h-8 rounded-lg bg-red-100 border border-red-200/40 flex items-center justify-center shrink-0">
            <FiAlertCircle className="w-4 h-4 text-red-400" />
          </div>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* ── Wedding Details ── */}
        <div className="rounded-2xl border border-warm-200/50 bg-white p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-warm-50 border border-warm-200/40 flex items-center justify-center">
              <FiCalendar className="w-4 h-4 text-slate-400" />
            </div>
            <div>
              <h2 className="text-[15px] font-semibold text-slate-900">Wedding Details</h2>
              <p className="text-[11px] text-slate-400 font-light">Essential information about your big day</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="weddingDate" className="text-[12px] font-medium text-slate-600 flex items-center gap-1.5">
                <FiCalendar className="w-3 h-3 text-slate-300" />
                Wedding Date
              </label>
              <input
                id="weddingDate"
                type="date"
                value={weddingDate}
                onChange={(e) => setWeddingDate(e.target.value)}
                className={INPUT_CLS}
              />
              {weddingDate && (
                <p className="text-[11px] text-rose-500 font-medium">
                  {new Date(weddingDate + "T00:00:00").toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="partnerName" className="text-[12px] font-medium text-slate-600 flex items-center gap-1.5">
                <FiUser className="w-3 h-3 text-slate-300" />
                Partner&apos;s Name
              </label>
              <input
                id="partnerName"
                type="text"
                value={partnerName}
                onChange={(e) => setPartnerName(e.target.value)}
                placeholder="Your partner's name"
                className={INPUT_CLS}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="estimatedGuests" className="text-[12px] font-medium text-slate-600 flex items-center gap-1.5">
                <FiUsers className="w-3 h-3 text-slate-300" />
                Estimated Guests
              </label>
              <input
                id="estimatedGuests"
                type="number"
                min="1"
                value={estimatedGuests}
                onChange={(e) => setEstimatedGuests(e.target.value)}
                placeholder="e.g. 150"
                className={INPUT_CLS}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="weddingTheme" className="text-[12px] font-medium text-slate-600 flex items-center gap-1.5">
                <FiStar className="w-3 h-3 text-slate-300" />
                Wedding Theme
              </label>
              <select
                id="weddingTheme"
                value={weddingTheme}
                onChange={(e) => setWeddingTheme(e.target.value)}
                className={`${INPUT_CLS} appearance-none cursor-pointer`}
              >
                <option value="">Select a theme</option>
                {THEME_OPTIONS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="budgetCurrency" className="text-[12px] font-medium text-slate-600 flex items-center gap-1.5">
                <FiDollarSign className="w-3 h-3 text-slate-300" />
                Budget Currency
              </label>
              <select
                id="budgetCurrency"
                value={budgetCurrency}
                onChange={(e) => setBudgetCurrency(e.target.value)}
                className={`${INPUT_CLS} appearance-none cursor-pointer`}
              >
                {CURRENCY_OPTIONS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* ── Location ── */}
        <div className="rounded-2xl border border-warm-200/50 bg-white p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-200/40 flex items-center justify-center">
              <FiMapPin className="w-4 h-4 text-rose-500" />
            </div>
            <div>
              <h2 className="text-[15px] font-semibold text-slate-900">Wedding Location</h2>
              <p className="text-[11px] text-slate-400 font-light">Where will the celebration take place?</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="weddingCity" className="text-[12px] font-medium text-slate-600">City</label>
              <select
                id="weddingCity"
                value={weddingLocation}
                onChange={(e) => handleCityChange(e.target.value)}
                className={`${INPUT_CLS} appearance-none cursor-pointer`}
              >
                <option value="">Select a city</option>
                {ETHIOPIAN_CITIES.map((c) => (
                  <option key={c.name} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="weddingLocationCustom" className="text-[12px] font-medium text-slate-600">Or type a custom location</label>
              <input
                id="weddingLocationCustom"
                type="text"
                value={weddingLocation}
                onChange={(e) => setWeddingLocation(e.target.value)}
                placeholder="Venue name or address"
                className={INPUT_CLS}
              />
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-medium text-slate-600 mb-1.5">Pin Your Venue on Map</label>
            <p className="text-[11px] text-slate-400 font-light mb-3">
              Click on the map to set the exact venue location. Selecting a city above will center the map there.
            </p>
            <div className="rounded-2xl overflow-hidden border border-warm-200/40">
              <LocationMapPicker
                latitude={latitude}
                longitude={longitude}
                onChange={handleMapChange}
              />
            </div>
            <div className="flex gap-6 mt-3">
              <div className="text-[11px] text-slate-300 font-light">
                Lat: <span className="font-mono text-slate-500">{latitude.toFixed(6)}</span>
              </div>
              <div className="text-[11px] text-slate-300 font-light">
                Lng: <span className="font-mono text-slate-500">{longitude.toFixed(6)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Submit ── */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="cursor-pointer px-8 py-3 bg-slate-900 text-white rounded-full text-[13px] font-medium transition-all duration-500 hover:bg-slate-800 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                Saving...
              </span>
            ) : (
              profile ? "Update Profile" : "Save Profile"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
