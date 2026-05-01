"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  FiArrowLeft,
  FiMapPin,
  FiCheckCircle,
  FiPhone,
  FiTag,
} from "react-icons/fi";
import { getVendorDetail } from "@/services/public-vendor.service";
import BookingRequestForm from "@/components/booking/booking-request-form";
import type { VendorProfile } from "@/types/vendor";

export default function VendorDetailPage() {
  const params = useParams();
  const vendorId = params.id as string;
  const [vendor, setVendor] = useState<VendorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const fetchVendor = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getVendorDetail(vendorId);
      setVendor(res.vendor);
    } catch {
      setError("Could not load vendor details.");
    } finally {
      setLoading(false);
    }
  }, [vendorId]);

  useEffect(() => {
    fetchVendor();
  }, [fetchVendor]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-12 text-center">
        <p className="animate-pulse text-sm text-gray-400">Loading vendor...</p>
      </div>
    );
  }

  if (error || !vendor) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <Link
          href="/vendors"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <FiArrowLeft className="w-4 h-4" />
          Back to Vendors
        </Link>
        <div className="bg-white rounded-xl border border-gray-200/80 p-12 text-center">
          <p className="text-sm text-red-500">{error || "Vendor not found"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Back link */}
      <Link
        href="/vendors"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <FiArrowLeft className="w-4 h-4" />
        Back to Vendors
      </Link>

      {/* Header section */}
      <div className="bg-white rounded-xl border border-gray-200/80 p-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-500 shrink-0">
            <FiTag className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-gray-900">
                {vendor.businessName || "Unnamed Vendor"}
              </h1>
              <FiCheckCircle className="w-5 h-5 text-green-500 shrink-0" />
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
              {vendor.category && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-600 text-xs font-medium">
                  {vendor.category.charAt(0).toUpperCase() + vendor.category.slice(1)}
                </span>
              )}
              {vendor.location && (
                <span className="inline-flex items-center gap-1">
                  <FiMapPin className="w-3.5 h-3.5" />
                  {vendor.location}
                </span>
              )}
              {vendor.phoneNumber && (
                <span className="inline-flex items-center gap-1">
                  <FiPhone className="w-3.5 h-3.5" />
                  {vendor.phoneNumber}
                </span>
              )}
            </div>
          </div>
        </div>

        {vendor.description && (
          <div className="mt-5 pt-5 border-t border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900 mb-2">About</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              {vendor.description}
            </p>
          </div>
        )}
      </div>

      {/* Portfolio/Documents section */}
      {vendor.documents && vendor.documents.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Portfolio</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {vendor.documents.map((doc) => (
              <a
                key={doc.id}
                href={doc.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="aspect-square rounded-xl border border-gray-200/80 overflow-hidden hover:border-gray-300 hover:shadow-sm transition-all"
              >
                <img
                  src={doc.fileUrl}
                  alt="Portfolio"
                  className="w-full h-full object-cover"
                />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Booking Request section */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Request a Booking
        </h2>
        {bookingSuccess ? (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
            <FiCheckCircle className="w-8 h-8 text-green-500 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-green-800 mb-1">
              Booking request sent!
            </h3>
            <p className="text-xs text-green-600">
              The vendor will respond soon. You can track your bookings in your
              dashboard.
            </p>
          </div>
        ) : (
          <BookingRequestForm
            vendorProfileId={vendor.id}
            vendorId={vendor.userId}
            serviceCategory={vendor.category || ""}
            onSuccess={() => setBookingSuccess(true)}
          />
        )}
      </div>
    </div>
  );
}
