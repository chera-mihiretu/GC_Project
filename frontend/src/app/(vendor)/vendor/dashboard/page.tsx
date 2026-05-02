"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { getVendorProfile } from "@/services/vendor.service";
import { listBookings } from "@/services/booking.service";
import VendorStatusBanner from "@/components/vendor/vendor-status-banner";
import DocumentUpload from "@/components/vendor/document-upload";
import StatCard from "@/components/ui/stat-card";
import { VendorStatus, type VendorProfile } from "@/types/vendor";
import {
  FiEye,
  FiMessageSquare,
  FiCalendar,
  FiStar,
  FiArrowRight,
  FiUser,
  FiFileText,
  FiSend,
} from "react-icons/fi";

export default function VendorDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<VendorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookingCount, setBookingCount] = useState(0);

  const fetchProfile = useCallback(async () => {
    try {
      const data = await getVendorProfile();
      setProfile(data?.vendorProfile ?? null);
    } catch {
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
    listBookings({ limit: 1 })
      .then((res) => setBookingCount(res.total))
      .catch(() => {});
  }, [fetchProfile]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-gray-400">
        <div className="animate-pulse text-sm">Loading dashboard...</div>
      </div>
    );
  }

  const status = profile?.status;
  const noProfile = !profile;
  const needsSetup =
    noProfile || status === VendorStatus.REGISTERED || status === VendorStatus.REJECTED;
  const firstName = session?.user?.name?.split(" ")[0] ?? "there";

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 font-display">
          Welcome, {firstName}
        </h1>
        <p className="text-gray-500 mt-1">
          {noProfile
            ? "Set up your vendor profile to start receiving bookings."
            : "Manage your business and track performance."}
        </p>
      </div>

      {profile && (
        <VendorStatusBanner
          status={profile.status}
          rejectionReason={profile.rejectionReason}
        />
      )}

      {/* No profile — onboarding steps */}
      {noProfile && (
        <div className="bg-white rounded-xl border border-gray-200/80 p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Get Started in 3 Steps
          </h2>
          <p className="text-sm text-gray-500 mb-8">
            Complete these steps to get verified and start receiving bookings
            from couples.
          </p>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                step: 1,
                icon: FiUser,
                title: "Complete Profile",
                desc: "Add your business name, category, and contact info",
              },
              {
                step: 2,
                icon: FiFileText,
                title: "Upload Documents",
                desc: "Business license, national ID, and other verification docs",
              },
              {
                step: 3,
                icon: FiSend,
                title: "Submit for Review",
                desc: "Our team will verify your profile within 48 hours",
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.step} className="text-center">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-3">
                    <Icon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="text-xs font-semibold text-blue-600 mb-1">
                    Step {item.step}
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">
                    {item.title}
                  </h3>
                  <p className="text-xs text-gray-500">{item.desc}</p>
                </div>
              );
            })}
          </div>
          <div className="mt-8 text-center">
            <button
              onClick={() => router.push("/vendor/profile/setup")}
              className="px-6 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors inline-flex items-center gap-2"
            >
              Get Started
              <FiArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Needs setup (has profile but incomplete or rejected) */}
      {profile && needsSetup && (
        <div className="bg-white rounded-xl border border-gray-200/80 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {profile.businessName || "Incomplete Profile"}
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                {status === VendorStatus.REJECTED
                  ? "Fix the issues and resubmit your application."
                  : "Complete your profile to submit for verification."}
              </p>
            </div>
            <button
              onClick={() => router.push("/vendor/profile/setup")}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm hover:bg-gray-800 transition-colors flex items-center gap-2"
            >
              {status === VendorStatus.REJECTED
                ? "Update & Resubmit"
                : "Complete Profile"}
              <FiArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Pending verification */}
      {profile && status === VendorStatus.PENDING_VERIFICATION && (
        <div className="bg-white rounded-xl border border-gray-200/80 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Profile Summary
          </h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Business:</span>{" "}
              <span className="text-gray-900 font-medium">
                {profile.businessName}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Category:</span>{" "}
              <span className="text-gray-900 font-medium capitalize">
                {profile.category}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Phone:</span>{" "}
              <span className="text-gray-900">{profile.phoneNumber}</span>
            </div>
            <div>
              <span className="text-gray-500">Location:</span>{" "}
              <span className="text-gray-900">{profile.location}</span>
            </div>
          </div>
          {profile.description && (
            <p className="text-sm text-gray-600">{profile.description}</p>
          )}
          <DocumentUpload
            documents={profile.documents ?? []}
            onUpdate={fetchProfile}
            disabled
          />
        </div>
      )}

      {/* Verified — full dashboard */}
      {profile && status === VendorStatus.VERIFIED && (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={FiEye}
              label="Profile Views"
              value="0"
              subtext="This month"
              color="blue"
            />
            <StatCard
              icon={FiMessageSquare}
              label="Inquiries"
              value="0"
              subtext="New messages"
              color="green"
            />
            <StatCard
              icon={FiCalendar}
              label="Bookings"
              value={bookingCount.toString()}
              subtext="Total"
              color="amber"
            />
            <StatCard
              icon={FiStar}
              label="Rating"
              value="N/A"
              subtext="No reviews yet"
              color="rose"
            />
          </div>

          {/* Profile summary */}
          <div className="bg-white rounded-xl border border-gray-200/80 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {profile.businessName}
              </h2>
              <button
                onClick={() => router.push("/vendor/profile/setup")}
                className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
              >
                Edit Profile <FiArrowRight className="w-3 h-3" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Category:</span>{" "}
                <span className="capitalize">{profile.category}</span>
              </div>
              <div>
                <span className="text-gray-500">Phone:</span>{" "}
                {profile.phoneNumber}
              </div>
              <div>
                <span className="text-gray-500">Location:</span>{" "}
                {profile.location}
              </div>
            </div>
          </div>

          {/* Feature cards */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Portfolio", icon: FiEye },
              { label: "Pricing", icon: FiCalendar },
              { label: "Schedule", icon: FiCalendar },
              { label: "Messages", icon: FiMessageSquare },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="bg-white rounded-xl border border-gray-200/80 p-6 flex items-center gap-4"
                >
                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-gray-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">
                      {item.label}
                    </h3>
                    <p className="text-xs text-gray-400">Coming soon</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Suspended */}
      {profile && status === VendorStatus.SUSPENDED && (
        <div className="bg-white rounded-xl border border-red-200 p-8 text-center">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Account Suspended
          </h2>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            Your account has been suspended due to a policy violation. All
            features are locked. Contact support for assistance.
          </p>
        </div>
      )}

      {/* Deactivated */}
      {profile && status === VendorStatus.DEACTIVATED && (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Account Closed
          </h2>
          <p className="text-sm text-gray-500">
            This vendor account has been permanently deactivated.
          </p>
        </div>
      )}
    </div>
  );
}
