"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import AuthGuard from "@/components/auth-guard";
import { useSession, signOut } from "@/lib/auth-client";
import { getVendorProfile } from "@/services/vendor.service";
import VendorStatusBanner from "@/components/vendor/vendor-status-banner";
import DocumentUpload from "@/components/vendor/document-upload";
import { VendorStatus, type VendorProfile } from "@/types/vendor";

export default function VendorDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<VendorProfile | null>(null);
  const [loading, setLoading] = useState(true);

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
  }, [fetchProfile]);

  if (loading) {
    return (
      <AuthGuard allowedRoles={["vendor"]}>
        <div className="flex items-center justify-center min-h-screen text-gray-500">
          Loading...
        </div>
      </AuthGuard>
    );
  }

  const status = profile?.status;
  const noProfile = !profile;
  const needsSetup =
    noProfile || status === VendorStatus.REGISTERED || status === VendorStatus.REJECTED;

  return (
    <AuthGuard allowedRoles={["vendor"]}>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Vendor Dashboard
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                Welcome, {session?.user?.name}
              </p>
            </div>
            <button
              onClick={async () => {
                await signOut();
                router.push("/login");
              }}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm hover:bg-gray-800 transition-colors"
            >
              Sign out
            </button>
          </div>

          {profile && (
            <VendorStatusBanner
              status={profile.status}
              rejectionReason={profile.rejectionReason}
            />
          )}

          {noProfile && (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Set Up Your Vendor Profile
              </h2>
              <p className="text-gray-500 mb-6">
                Complete your business profile and upload documents to get
                verified and start receiving bookings.
              </p>
              <button
                onClick={() => router.push("/vendor/profile/setup")}
                className="px-6 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                Get Started
              </button>
            </div>
          )}

          {profile && needsSetup && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {profile.businessName || "Incomplete Profile"}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {status === VendorStatus.REJECTED
                      ? "Fix the issues and resubmit your application."
                      : "Complete your profile to submit for verification."}
                  </p>
                </div>
                <button
                  onClick={() => router.push("/vendor/profile/setup")}
                  className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm hover:bg-gray-800 transition-colors"
                >
                  {status === VendorStatus.REJECTED
                    ? "Update & Resubmit"
                    : "Complete Profile"}
                </button>
              </div>
            </div>
          )}

          {profile && status === VendorStatus.PENDING_VERIFICATION && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
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

          {profile && status === VendorStatus.VERIFIED && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {profile.businessName}
                  </h2>
                  <button
                    onClick={() => router.push("/vendor/profile/setup")}
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    Edit Profile
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
              <div className="grid grid-cols-2 gap-4">
                {["Portfolio", "Pricing", "Schedule", "Messages"].map(
                  (item) => (
                    <div
                      key={item}
                      className="bg-white rounded-xl border border-gray-200 p-6"
                    >
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {item}
                      </h3>
                      <p className="text-sm text-gray-400">Coming soon</p>
                    </div>
                  ),
                )}
              </div>
            </div>
          )}

          {profile && status === VendorStatus.SUSPENDED && (
            <div className="bg-white rounded-xl border border-red-200 p-6 opacity-60">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                {profile.businessName}
              </h2>
              <p className="text-sm text-gray-500">
                All features are locked while your account is suspended. Contact
                support for assistance.
              </p>
            </div>
          )}

          {profile && status === VendorStatus.DEACTIVATED && (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Account Closed
              </h2>
              <p className="text-gray-500">
                This vendor account has been permanently deactivated.
              </p>
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
