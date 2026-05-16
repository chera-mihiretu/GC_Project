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
  getVendorContext,
  type VendorContext,
} from "@/services/vendor.service";
import { VendorStatus, type VendorProfile } from "@/types/vendor";
import type { VendorProfileFormData } from "@/components/vendor/vendor-profile-form";
import {
  FiArrowLeft,
  FiCheckCircle,
  FiShield,
  FiBriefcase,
} from "react-icons/fi";

export default function VendorProfileSetup() {
  const router = useRouter();
  const [profile, setProfile] = useState<VendorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [vendorCtx, setVendorCtx] = useState<VendorContext | null>(null);

  const fetchProfile = useCallback(async () => {
    try {
      const [data, ctx] = await Promise.all([
        getVendorProfile(),
        getVendorContext().catch(() => null),
      ]);
      setProfile(data?.vendorProfile ?? null);
      setVendorCtx(ctx);
    } catch {
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  async function handleSaveProfile(data: VendorProfileFormData) {
    if (profile) {
      const result = await updateVendorProfile(data as unknown as Record<string, unknown>);
      setProfile(result.vendorProfile);
    } else {
      const result = await createVendorProfile(data as unknown as Record<string, unknown>);
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

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="space-y-10">
        <div>
          <div className="h-3 w-20 bg-warm-100 rounded animate-pulse mb-3" />
          <div className="h-9 w-56 bg-warm-100 rounded-lg animate-pulse" />
        </div>
        <div className="rounded-2xl border border-warm-200/30 bg-white p-10 animate-pulse">
          <div className="space-y-6">
            <div className="h-12 bg-warm-100 rounded-xl" />
            <div className="h-12 bg-warm-100 rounded-xl" />
            <div className="h-28 bg-warm-100 rounded-xl" />
            <div className="grid grid-cols-2 gap-5">
              <div className="h-12 bg-warm-100 rounded-xl" />
              <div className="h-12 bg-warm-100 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const staffMember = vendorCtx?.isStaff === true;

  const canEdit =
    !staffMember &&
    (!profile ||
      profile.status === VendorStatus.REGISTERED ||
      profile.status === VendorStatus.REJECTED ||
      profile.status === VendorStatus.VERIFIED);

  const canSubmit =
    !staffMember &&
    profile &&
    (profile.status === VendorStatus.REGISTERED ||
      profile.status === VendorStatus.REJECTED) &&
    profile.businessName &&
    (profile.category?.length ?? 0) > 0 &&
    profile.phoneNumber &&
    profile.location &&
    (profile.documents?.length ?? 0) > 0;

  return (
    <div className="space-y-10">
      {/* ── Back link ── */}
      <button
        onClick={() => router.push("/vendor/dashboard")}
        className="cursor-pointer inline-flex items-center gap-2 text-[13px] font-medium text-slate-400 hover:text-slate-700 transition-colors duration-300"
      >
        <FiArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </button>

      {/* ── Header ── */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-editorial text-slate-400 mb-2">
          {staffMember ? "Read Only" : "Setup"}
        </p>
        <h1 className="font-display text-3xl font-bold text-slate-900 tracking-headline">
          {staffMember
            ? "Business Profile"
            : profile ? "Edit Profile" : "Set Up Your Profile"}
        </h1>
        <p className="text-[14px] text-slate-400 font-light mt-2 max-w-lg">
          {staffMember
            ? "You are viewing the vendor profile as a staff member."
            : "Fill in your business information and upload required documents for verification."}
        </p>
      </div>

      {/* ── Status banner ── */}
      {profile && (
        <VendorStatusBanner
          status={profile.status}
          rejectionReason={profile.rejectionReason}
        />
      )}

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* ── Left: Business Information ── */}
        <div className="w-full lg:flex-1 lg:min-w-0">
          <section className="rounded-2xl border border-warm-200/50 bg-white p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-warm-50 border border-warm-200/40 flex items-center justify-center">
                <FiBriefcase className="w-4.5 h-4.5 text-slate-400" />
              </div>
              <div>
                <h2 className="text-[15px] font-semibold text-slate-900">Business Information</h2>
                <p className="text-[11px] text-slate-400 font-light mt-0.5">
                  Core details about your business
                </p>
              </div>
            </div>

            <VendorProfileForm
              initialData={profile ?? undefined}
              onSubmit={handleSaveProfile}
              submitLabel={profile ? "Update Profile" : "Save Profile"}
              disabled={!canEdit}
            />
          </section>
        </div>

        {/* ── Right: Documents + Submit ── */}
        {profile && (
          <div className="w-full lg:w-[360px] lg:shrink-0 space-y-5 lg:sticky lg:top-24">
            {/* Documents */}
            <section className="rounded-2xl border border-warm-200/50 bg-white p-5 sm:p-6">
              <DocumentUpload
                documents={profile.documents ?? []}
                onUpdate={fetchProfile}
                disabled={!canEdit}
              />
            </section>

            {/* Submit for Verification */}
            {(profile.status === VendorStatus.REGISTERED ||
              profile.status === VendorStatus.REJECTED) && (
              <section className="rounded-2xl border border-emerald-200/30 bg-emerald-50/20 p-5 sm:p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200/40 flex items-center justify-center">
                    <FiShield className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div>
                    <h2 className="text-[14px] font-semibold text-slate-900">
                      Submit for Verification
                    </h2>
                    <p className="text-[11px] text-slate-400 font-light mt-0.5">
                      Final step to go live
                    </p>
                  </div>
                </div>

                <p className="text-[12px] text-slate-500 font-light leading-relaxed mb-5">
                  Once submitted, your profile will be reviewed by our team.
                  Make sure all information is accurate and documents are valid.
                </p>

                {submitError && (
                  <div className="mb-4 rounded-lg border border-red-100 bg-red-50/50 px-4 py-3 text-[12px] text-red-600">
                    {submitError}
                  </div>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={!canSubmit || submitting}
                  className="cursor-pointer w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 text-white rounded-xl text-[13px] font-semibold shadow-[0_2px_12px_rgba(5,150,105,0.15)] hover:bg-emerald-700 hover:shadow-[0_4px_20px_rgba(5,150,105,0.25)] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-500"
                >
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Submitting...
                    </span>
                  ) : (
                    <>
                      <FiCheckCircle className="w-4 h-4" />
                      Submit for Verification
                    </>
                  )}
                </button>

                {!canSubmit && (
                  <p className="text-[10px] text-slate-400 font-light mt-3 text-center leading-relaxed">
                    Complete all required fields and upload at least one document
                  </p>
                )}
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
