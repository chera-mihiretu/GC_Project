"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import VendorStatusBadge from "@/components/admin/vendor-status-badge";
import ReasonModal from "@/components/admin/reason-modal";
import ConfirmDialog from "@/components/admin/confirm-dialog";
import {
  getVendorDetailAdmin,
  approveVendor,
  rejectVendor,
  suspendVendor,
  reinstateVendor,
  deactivateVendor,
} from "@/services/admin-vendor.service";
import { VendorStatus, type VendorProfile, type VendorDocument } from "@/types/vendor";
import {
  FiFile,
  FiDownload,
  FiX,
  FiEye,
  FiExternalLink,
  FiImage,
  FiArrowLeft,
  FiBriefcase,
  FiFileText,
  FiShield,
  FiCheck,
  FiSlash,
  FiAlertTriangle,
} from "react-icons/fi";

type ModalState =
  | { type: "none" }
  | { type: "approve" }
  | { type: "reject" }
  | { type: "suspend" }
  | { type: "reinstate" }
  | { type: "deactivate" };

function resolveUrl(fileUrl: string) {
  if (fileUrl.startsWith("http")) return fileUrl;
  return `/api${fileUrl}`;
}

function isImage(url: string) {
  return /\.(jpe?g|png|gif|webp)(\?|$)/i.test(url);
}

function isPdf(url: string) {
  return /\.pdf(\?|$)/i.test(url);
}

export default function AdminVendorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const vendorId = params.id as string;

  const [vendor, setVendor] = useState<VendorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalState>({ type: "none" });
  const [previewDoc, setPreviewDoc] = useState<VendorDocument | null>(null);

  const fetchVendor = useCallback(async () => {
    try {
      const data = await getVendorDetailAdmin(vendorId);
      setVendor(data.vendor);
    } catch {
      setVendor(null);
    } finally {
      setLoading(false);
    }
  }, [vendorId]);

  useEffect(() => {
    fetchVendor();
  }, [fetchVendor]);

  async function handleApprove() {
    const updated = await approveVendor(vendorId);
    setVendor(updated);
    setModal({ type: "none" });
  }

  async function handleReject(reason: string) {
    const updated = await rejectVendor(vendorId, reason);
    setVendor(updated);
    setModal({ type: "none" });
  }

  async function handleSuspend(reason: string) {
    const updated = await suspendVendor(vendorId, reason);
    setVendor(updated);
    setModal({ type: "none" });
  }

  async function handleReinstate() {
    const updated = await reinstateVendor(vendorId);
    setVendor(updated);
    setModal({ type: "none" });
  }

  async function handleDeactivate() {
    const updated = await deactivateVendor(vendorId);
    setVendor(updated);
    setModal({ type: "none" });
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="h-4 w-32 bg-warm-100 rounded animate-pulse" />
        <div className="rounded-2xl border border-warm-200/30 bg-white p-8 sm:p-10 animate-pulse space-y-5">
          <div className="h-7 w-48 bg-warm-100 rounded-lg" />
          <div className="h-4 w-64 bg-warm-100 rounded" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-16 bg-warm-100 rounded-xl" />
            <div className="h-16 bg-warm-100 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="space-y-8">
        <button onClick={() => router.push("/admin/vendors")} className="cursor-pointer inline-flex items-center gap-2 text-[13px] text-slate-400 hover:text-slate-600 transition-colors duration-500">
          <FiArrowLeft className="w-3.5 h-3.5" /> Back to Vendors
        </button>
        <div className="rounded-2xl border border-warm-200/30 bg-white py-20 text-center">
          <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center mx-auto mb-5">
            <FiAlertTriangle className="w-6 h-6 text-red-400" />
          </div>
          <p className="text-[15px] font-medium text-slate-600 mb-1">Vendor not found</p>
          <p className="text-[13px] text-slate-400 font-light">This vendor may have been removed</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Back */}
      <button onClick={() => router.push("/admin/vendors")} className="cursor-pointer inline-flex items-center gap-2 text-[13px] text-slate-400 hover:text-slate-600 transition-colors duration-500">
        <FiArrowLeft className="w-3.5 h-3.5" /> Back to Vendors
      </button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-editorial text-slate-400 mb-2">Vendor Detail</p>
          <h1 className="font-display text-2xl font-bold text-slate-900 tracking-headline">
            {vendor.businessName || "Unnamed Vendor"}
          </h1>
          <p className="text-[13px] text-slate-400 font-light mt-1 capitalize">{vendor.category || "No category"}</p>
        </div>
        <VendorStatusBadge status={vendor.status} />
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* ── Left: Info + Documents ── */}
        <div className="w-full lg:flex-1 lg:min-w-0 space-y-6">
          {/* Business Info */}
          <section className="rounded-2xl border border-warm-200/50 bg-white p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-xl bg-warm-50 border border-warm-200/40 flex items-center justify-center">
                <FiBriefcase className="w-4 h-4 text-slate-400" />
              </div>
              <h2 className="text-[15px] font-semibold text-slate-900">Business Information</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: "Business Name", value: vendor.businessName },
                { label: "Category", value: vendor.category, capitalize: true },
                { label: "Phone", value: vendor.phoneNumber },
                { label: "Location", value: vendor.location },
              ].map((item) => (
                <div key={item.label} className="rounded-xl bg-warm-50/60 border border-warm-200/20 px-4 py-3.5">
                  <p className="text-[11px] text-slate-400 font-light">{item.label}</p>
                  <p className={`text-[14px] font-medium text-slate-700 mt-0.5 ${item.capitalize ? "capitalize" : ""}`}>
                    {item.value || "—"}
                  </p>
                </div>
              ))}
            </div>

            {vendor.description && (
              <div className="mt-4 rounded-xl bg-warm-50/60 border border-warm-200/20 px-4 py-3.5">
                <p className="text-[11px] text-slate-400 font-light mb-1">Description</p>
                <p className="text-[13px] text-slate-600 font-light leading-relaxed">{vendor.description}</p>
              </div>
            )}

            <div className="flex gap-6 mt-4 pt-4 border-t border-warm-200/30 text-[11px] text-slate-400 font-light">
              <span>Registered: <span className="text-slate-500 font-medium">{new Date(vendor.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span></span>
              <span>Updated: <span className="text-slate-500 font-medium">{new Date(vendor.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span></span>
            </div>
          </section>

          {/* Documents */}
          <section className="rounded-2xl border border-warm-200/50 bg-white p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-xl bg-warm-50 border border-warm-200/40 flex items-center justify-center">
                <FiFileText className="w-4 h-4 text-slate-400" />
              </div>
              <h2 className="text-[15px] font-semibold text-slate-900">Uploaded Documents</h2>
            </div>

            {(!vendor.documents || vendor.documents.length === 0) ? (
              <div className="text-center py-10">
                <div className="w-12 h-12 rounded-xl bg-warm-50 border border-warm-200/40 flex items-center justify-center mx-auto mb-3">
                  <FiFile className="w-5 h-5 text-slate-300" />
                </div>
                <p className="text-[13px] text-slate-400 font-light">No documents uploaded</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {vendor.documents.map((doc) => {
                  const url = resolveUrl(doc.fileUrl);
                  const imageFile = isImage(doc.fileUrl);
                  return (
                    <div key={doc.id} className="group rounded-xl border border-warm-200/40 overflow-hidden hover:border-warm-200 transition-all duration-500">
                      <button
                        onClick={() => setPreviewDoc(doc)}
                        className="cursor-pointer w-full relative aspect-4/3 bg-warm-50 flex items-center justify-center overflow-hidden"
                      >
                        {imageFile ? (
                          <Image src={url} alt={doc.documentType} fill className="object-cover" unoptimized />
                        ) : (
                          <div className="flex flex-col items-center gap-2 text-slate-300">
                            <FiFile className="w-8 h-8" />
                            <span className="text-[10px] font-semibold uppercase tracking-luxury">PDF</span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-500 flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-white/90 rounded-xl p-2.5 shadow-sm">
                            <FiEye className="w-4 h-4 text-slate-700" />
                          </div>
                        </div>
                      </button>
                      <div className="flex items-center justify-between px-4 py-3">
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium text-slate-700 capitalize truncate">
                            {doc.documentType.replace(/_/g, " ")}
                          </p>
                          <p className="text-[11px] text-slate-400 font-light">
                            {new Date(doc.uploadedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </p>
                        </div>
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-slate-600 hover:bg-warm-50 transition-all duration-300 shrink-0"
                          title="Download"
                        >
                          <FiDownload className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* ── Right: Actions + Rejection ── */}
        <div className="w-full lg:w-[340px] lg:shrink-0 space-y-5 lg:sticky lg:top-24">
          {/* Rejection reason */}
          {vendor.rejectionReason && (
            <section className="rounded-2xl border border-orange-200/40 bg-orange-50/30 p-5 sm:p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-orange-100 border border-orange-200/40 flex items-center justify-center">
                  <FiAlertTriangle className="w-3.5 h-3.5 text-orange-500" />
                </div>
                <h3 className="text-[14px] font-semibold text-orange-800">Rejection Reason</h3>
              </div>
              <p className="text-[13px] text-orange-700 font-light leading-relaxed">{vendor.rejectionReason}</p>
            </section>
          )}

          {/* Actions */}
          <section className="rounded-2xl border border-warm-200/50 bg-white p-5 sm:p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-lg bg-warm-50 border border-warm-200/40 flex items-center justify-center">
                <FiShield className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <h3 className="text-[14px] font-semibold text-slate-900">Actions</h3>
            </div>

            <div className="space-y-2.5">
              {vendor.status === VendorStatus.PENDING_VERIFICATION && (
                <>
                  <button
                    onClick={() => setModal({ type: "approve" })}
                    className="cursor-pointer w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 text-white rounded-xl text-[13px] font-semibold shadow-[0_2px_12px_rgba(5,150,105,0.15)] hover:bg-emerald-700 hover:shadow-[0_4px_20px_rgba(5,150,105,0.25)] transition-all duration-500"
                  >
                    <FiCheck className="w-3.5 h-3.5" />
                    Approve Vendor
                  </button>
                  <button
                    onClick={() => setModal({ type: "reject" })}
                    className="cursor-pointer w-full flex items-center justify-center gap-2 py-3 text-orange-600 border border-orange-200/60 rounded-xl text-[13px] font-semibold hover:bg-orange-50 hover:border-orange-300 transition-all duration-500"
                  >
                    <FiX className="w-3.5 h-3.5" />
                    Reject
                  </button>
                </>
              )}
              {vendor.status === VendorStatus.VERIFIED && (
                <button
                  onClick={() => setModal({ type: "suspend" })}
                  className="cursor-pointer w-full flex items-center justify-center gap-2 py-3 text-red-500 border border-red-200/60 rounded-xl text-[13px] font-semibold hover:bg-red-50 hover:border-red-300 transition-all duration-500"
                >
                  <FiSlash className="w-3.5 h-3.5" />
                  Suspend Vendor
                </button>
              )}
              {vendor.status === VendorStatus.SUSPENDED && (
                <>
                  <button
                    onClick={() => setModal({ type: "reinstate" })}
                    className="cursor-pointer w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 text-white rounded-xl text-[13px] font-semibold shadow-[0_2px_12px_rgba(5,150,105,0.15)] hover:bg-emerald-700 transition-all duration-500"
                  >
                    <FiCheck className="w-3.5 h-3.5" />
                    Reinstate
                  </button>
                  <button
                    onClick={() => setModal({ type: "deactivate" })}
                    className="cursor-pointer w-full flex items-center justify-center gap-2 py-3 bg-slate-900 text-white rounded-xl text-[13px] font-semibold shadow-[0_2px_12px_rgba(15,23,42,0.1)] hover:bg-slate-800 transition-all duration-500"
                  >
                    <FiSlash className="w-3.5 h-3.5" />
                    Permanently Ban
                  </button>
                </>
              )}
              {vendor.status === VendorStatus.REJECTED && (
                <p className="text-[12px] text-slate-400 font-light text-center py-4">
                  Waiting for vendor to resubmit documents
                </p>
              )}
              {vendor.status === VendorStatus.DEACTIVATED && (
                <p className="text-[12px] text-slate-400 font-light text-center py-4">
                  This account is permanently deactivated
                </p>
              )}
              {vendor.status === VendorStatus.REGISTERED && (
                <p className="text-[12px] text-slate-400 font-light text-center py-4">
                  Vendor has not yet submitted for verification
                </p>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* ── Modals ── */}
      {modal.type === "approve" && (
        <ConfirmDialog
          title="Approve Vendor"
          description="This vendor will become visible to couples and can start receiving bookings."
          confirmLabel="Approve"
          confirmColor="bg-emerald-600 hover:bg-emerald-700"
          onConfirm={handleApprove}
          onCancel={() => setModal({ type: "none" })}
        />
      )}
      {modal.type === "reject" && (
        <ReasonModal
          title="Reject Vendor"
          description="Provide a reason for rejection. The vendor will be able to see this and resubmit."
          confirmLabel="Reject Vendor"
          confirmColor="bg-orange-600 hover:bg-orange-700"
          onConfirm={handleReject}
          onCancel={() => setModal({ type: "none" })}
        />
      )}
      {modal.type === "suspend" && (
        <ReasonModal
          title="Suspend Vendor"
          description="The vendor will be hidden from couples and all features will be locked."
          confirmLabel="Suspend Vendor"
          onConfirm={handleSuspend}
          onCancel={() => setModal({ type: "none" })}
        />
      )}
      {modal.type === "reinstate" && (
        <ConfirmDialog
          title="Reinstate Vendor"
          description="The vendor will be restored to verified status and become visible to couples again."
          confirmLabel="Reinstate"
          confirmColor="bg-emerald-600 hover:bg-emerald-700"
          onConfirm={handleReinstate}
          onCancel={() => setModal({ type: "none" })}
        />
      )}
      {modal.type === "deactivate" && (
        <ConfirmDialog
          title="Permanently Ban Vendor"
          description="This action is irreversible. The vendor account will be permanently deactivated and cannot be restored."
          confirmLabel="Permanently Ban"
          confirmColor="bg-red-700 hover:bg-red-800"
          onConfirm={handleDeactivate}
          onCancel={() => setModal({ type: "none" })}
        />
      )}

      {/* ── Document preview lightbox ── */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-black/80 flex flex-col" onClick={() => setPreviewDoc(null)}>
          <div className="flex items-center justify-between px-5 sm:px-8 py-4 bg-black/40 backdrop-blur-sm" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 text-white min-w-0">
              <FiImage className="w-4 h-4 shrink-0 opacity-60" />
              <span className="text-[13px] font-medium capitalize truncate">{previewDoc.documentType.replace(/_/g, " ")}</span>
              <span className="text-[11px] opacity-40 shrink-0">{new Date(previewDoc.uploadedAt).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <a href={resolveUrl(previewDoc.fileUrl)} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-lg flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all duration-300">
                <FiExternalLink className="w-4 h-4" />
              </a>
              <a href={resolveUrl(previewDoc.fileUrl)} download className="w-9 h-9 rounded-lg flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all duration-300">
                <FiDownload className="w-4 h-4" />
              </a>
              <button onClick={() => setPreviewDoc(null)} className="cursor-pointer w-9 h-9 rounded-lg flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all duration-300">
                <FiX className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center p-4 overflow-auto" onClick={(e) => e.stopPropagation()}>
            {isImage(previewDoc.fileUrl) ? (
              <div className="relative w-full h-full max-w-4xl">
                <Image src={resolveUrl(previewDoc.fileUrl)} alt={previewDoc.documentType} fill sizes="100vw" className="object-contain rounded-xl" />
              </div>
            ) : isPdf(previewDoc.fileUrl) ? (
              <iframe src={resolveUrl(previewDoc.fileUrl)} title={previewDoc.documentType} className="w-full max-w-4xl h-full rounded-xl bg-white" />
            ) : (
              <div className="text-center text-white">
                <FiFile className="w-16 h-16 mx-auto mb-4 opacity-40" />
                <p className="text-[13px] opacity-60 mb-4">Preview not available for this file type.</p>
                <a href={resolveUrl(previewDoc.fileUrl)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-[13px] transition-colors duration-300">
                  <FiDownload className="w-4 h-4" /> Download File
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
