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
} from "react-icons/fi";

const LocationMapPicker = dynamic(
  () => import("@/components/vendor/location-map-picker"),
  {
    ssr: false,
    loading: () => (
      <div className="h-[300px] rounded-lg border border-gray-300 bg-gray-50 flex items-center justify-center text-sm text-gray-400">
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
      <div className="flex items-center justify-center min-h-[60vh] text-gray-400">
        <div className="animate-pulse text-sm">Loading profile...</div>
      </div>
    );
  }

  const firstName = session?.user?.name?.split(" ")[0] ?? "";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 font-display flex items-center gap-2">
          <FiHeart className="w-7 h-7 text-rose-500" />
          Wedding Profile
        </h1>
        <p className="text-gray-500 mt-1">
          {profile
            ? "Keep your wedding details up to date for personalized recommendations."
            : `${firstName ? `Hi ${firstName}! ` : ""}Tell us about your special day so we can help you plan.`}
        </p>
      </div>

      {success && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-700">
          <FiCheck className="w-4 h-4 shrink-0" />
          {success}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Wedding details */}
        <div className="bg-white rounded-xl border border-gray-200/80 p-6 space-y-5">
          <h2 className="text-lg font-semibold text-gray-900">Wedding Details</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="weddingDate" className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                <FiCalendar className="w-3.5 h-3.5 text-gray-400" />
                Wedding Date
              </label>
              <input
                id="weddingDate"
                type="date"
                value={weddingDate}
                onChange={(e) => setWeddingDate(e.target.value)}
                className="px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 bg-white outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="partnerName" className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                <FiUser className="w-3.5 h-3.5 text-gray-400" />
                Partner&apos;s Name
              </label>
              <input
                id="partnerName"
                type="text"
                value={partnerName}
                onChange={(e) => setPartnerName(e.target.value)}
                placeholder="Your partner's name"
                className="px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 bg-white outline-none placeholder:text-gray-400 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="estimatedGuests" className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                <FiUsers className="w-3.5 h-3.5 text-gray-400" />
                Estimated Guests
              </label>
              <input
                id="estimatedGuests"
                type="number"
                min="1"
                value={estimatedGuests}
                onChange={(e) => setEstimatedGuests(e.target.value)}
                placeholder="e.g. 150"
                className="px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 bg-white outline-none placeholder:text-gray-400 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="weddingTheme" className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                <FiStar className="w-3.5 h-3.5 text-gray-400" />
                Wedding Theme
              </label>
              <select
                id="weddingTheme"
                value={weddingTheme}
                onChange={(e) => setWeddingTheme(e.target.value)}
                className="px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 bg-white outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all"
              >
                <option value="">Select a theme</option>
                {THEME_OPTIONS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="budgetCurrency" className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                <FiDollarSign className="w-3.5 h-3.5 text-gray-400" />
                Budget Currency
              </label>
              <select
                id="budgetCurrency"
                value={budgetCurrency}
                onChange={(e) => setBudgetCurrency(e.target.value)}
                className="px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 bg-white outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all"
              >
                {CURRENCY_OPTIONS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Location section */}
        <div className="bg-white rounded-xl border border-gray-200/80 p-6 space-y-5">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <FiMapPin className="w-5 h-5 text-rose-500" />
            Wedding Location
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="weddingCity" className="text-sm font-medium text-gray-700">
                City
              </label>
              <select
                id="weddingCity"
                value={weddingLocation}
                onChange={(e) => handleCityChange(e.target.value)}
                className="px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 bg-white outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all"
              >
                <option value="">Select a city</option>
                {ETHIOPIAN_CITIES.map((c) => (
                  <option key={c.name} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="weddingLocationCustom" className="text-sm font-medium text-gray-700">
                Or type a custom location
              </label>
              <input
                id="weddingLocationCustom"
                type="text"
                value={weddingLocation}
                onChange={(e) => setWeddingLocation(e.target.value)}
                placeholder="Venue name or address"
                className="px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 bg-white outline-none placeholder:text-gray-400 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pin Your Venue on Map
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Click on the map to set the exact venue location. Selecting a city above will center the map there.
            </p>
            <LocationMapPicker
              latitude={latitude}
              longitude={longitude}
              onChange={handleMapChange}
            />
            <div className="flex gap-4 mt-2">
              <div className="text-xs text-gray-400">
                Lat: <span className="font-mono text-gray-600">{latitude.toFixed(6)}</span>
              </div>
              <div className="text-xs text-gray-400">
                Lng: <span className="font-mono text-gray-600">{longitude.toFixed(6)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="cursor-pointer px-8 py-3 bg-rose-500 text-white rounded-lg text-sm font-semibold transition-all hover:bg-rose-600 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : profile ? "Update Profile" : "Save Profile"}
          </button>
        </div>
      </form>
    </div>
  );
}
