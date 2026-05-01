"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import VendorProfileForm from "@/components/vendor/vendor-profile-form";
import DocumentUpload from "@/components/vendor/document-upload";
import VendorStatusBanner from "@/components/vendor/vendor-status-banner";
import {
  getVendorProfile,
  createVendorProfile,
  updateVendorProfile,
  submitForVerification,
} from "@/services/vendor.service";
import { VendorStatus, type VendorProfile } from "@/types/vendor";

export default function VendorProfileSetup() {
  const router = useRouter();
  const [profile, setProfile] = useState<VendorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

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

  async function handleSaveProfile(data: Record<string, unknown>) {
    if (profile) {
      const result = await updateVendorProfile(data);
      setProfile(result.vendorProfile);
    } else {
      const result = await createVendorProfile(data);
      setProfile(result.vendorProfile);
    }
  }

  async function handleSubmit() {
    setSubmitError("");
    setSubmitting(true);
    try {
      await submitForVerification();
      router.push("/vendor/dashboard");
    } catch (err) {
      setSubmitError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-gray-400">
        <div className="animate-pulse text-sm">Loading...</div>
      </div>
    );
  }

  const canEdit =
    !profile ||
    profile.status === VendorStatus.REGISTERED ||
    profile.status === VendorStatus.REJECTED ||
    profile.status === VendorStatus.VERIFIED;

  const canSubmit =
    profile &&
    (profile.status === VendorStatus.REGISTERED ||
      profile.status === VendorStatus.REJECTED) &&
    profile.businessName &&
    (profile.category?.length ?? 0) > 0 &&
    profile.phoneNumber &&
    profile.location &&
    (profile.documents?.length ?? 0) > 0;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <button
        onClick={() => router.push("/vendor/dashboard")}
        className="text-sm text-gray-500 hover:text-gray-700"
      >
        &larr; Back to Dashboard
      </button>

      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {profile ? "Edit Profile" : "Set Up Your Profile"}
          </h1>
        <p className="text-gray-500 text-sm">
          Fill in your business information and upload required documents.
        </p>
      </div>

      {profile && (
        <VendorStatusBanner
          status={profile.status}
          rejectionReason={profile.rejectionReason}
        />
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Business Information
        </h2>
        <VendorProfileForm
          initialData={profile ?? undefined}
          onSubmit={handleSaveProfile}
          submitLabel={profile ? "Update Profile" : "Save Profile"}
          disabled={!canEdit}
        />
      </div>

      {profile && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <DocumentUpload
            documents={profile.documents ?? []}
            onUpdate={fetchProfile}
            disabled={!canEdit}
          />
        </div>
      )}

      {profile &&
        (profile.status === VendorStatus.REGISTERED ||
          profile.status === VendorStatus.REJECTED) && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Submit for Verification
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Once submitted, your profile will be reviewed by our team.
              Make sure all information is accurate and documents are valid.
            </p>
            {submitError && (
              <p className="text-red-600 text-sm mb-3">{submitError}</p>
            )}
            <button
              onClick={handleSubmit}
              disabled={!canSubmit || submitting}
              className="w-full py-2.5 bg-green-700 text-white rounded-lg text-sm font-medium hover:bg-green-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Submitting..." : "Submit for Verification"}
            </button>
            {!canSubmit && profile && (
              <p className="text-xs text-gray-400 mt-2 text-center">
                Complete all required fields and upload at least one document
              </p>
            )}
          </div>
        )}
    </div>
  );
}
