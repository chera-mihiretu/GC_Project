"use client";

import { useState } from "react";
import { VENDOR_CATEGORIES, type VendorProfile } from "@/types/vendor";

interface Props {
  initialData?: Partial<VendorProfile>;
  onSubmit: (data: {
    businessName: string;
    category: string;
    description: string;
    phoneNumber: string;
    location: string;
  }) => Promise<void>;
  submitLabel?: string;
  disabled?: boolean;
}

export default function VendorProfileForm({
  initialData,
  onSubmit,
  submitLabel = "Save Profile",
  disabled,
}: Props) {
  const [businessName, setBusinessName] = useState(initialData?.businessName ?? "");
  const [category, setCategory] = useState(initialData?.category ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [phoneNumber, setPhoneNumber] = useState(initialData?.phoneNumber ?? "");
  const [location, setLocation] = useState(initialData?.location ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await onSubmit({ businessName, category, description, phoneNumber, location });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Business Name *
        </label>
        <input
          type="text"
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          required
          disabled={disabled}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-rose-300 focus:border-rose-400 outline-none"
          placeholder="e.g. Addis Catering"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Category *
        </label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          required
          disabled={disabled}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-rose-300 focus:border-rose-400 outline-none"
        >
          <option value="">Select a category</option>
          {VENDOR_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={disabled}
          rows={4}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-rose-300 focus:border-rose-400 outline-none resize-none"
          placeholder="Tell couples about your business..."
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number *
          </label>
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            required
            disabled={disabled}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-rose-300 focus:border-rose-400 outline-none"
            placeholder="+251911234567"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Location *
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
            disabled={disabled}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-rose-300 focus:border-rose-400 outline-none"
            placeholder="e.g. Addis Ababa"
          />
        </div>
      </div>

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
