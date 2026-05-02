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
import { FiFile, FiDownload, FiX, FiEye, FiExternalLink, FiImage } from "react-icons/fi";

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
      <div className="flex items-center justify-center min-h-[60vh] text-gray-400">
        <div className="animate-pulse text-sm">Loading...</div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-gray-500">
        Vendor not found
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => router.push("/admin/vendors")}
        className="text-sm text-gray-500 hover:text-gray-700"
      >
        &larr; Back to Vendors
      </button>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {vendor.businessName || "Unnamed Vendor"}
          </h1>
          <p className="text-gray-500 text-sm mt-1 capitalize">
            {vendor.category || "No category"}
          </p>
        </div>
        <VendorStatusBadge status={vendor.status} />
      </div>

      <div className="grid gap-6">
        <div className="bg-white rounded-xl border border-gray-200/80 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Business Information
          </h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500 block mb-0.5">Business Name</span>
              <span className="text-gray-900 font-medium">
                {vendor.businessName || "—"}
              </span>
            </div>
            <div>
              <span className="text-gray-500 block mb-0.5">Category</span>
              <span className="text-gray-900 capitalize">
                {vendor.category || "—"}
              </span>
            </div>
            <div>
              <span className="text-gray-500 block mb-0.5">Phone</span>
              <span className="text-gray-900">
                {vendor.phoneNumber || "—"}
              </span>
            </div>
            <div>
              <span className="text-gray-500 block mb-0.5">Location</span>
              <span className="text-gray-900">
                {vendor.location || "—"}
              </span>
            </div>
          </div>
          {vendor.description && (
            <div className="mt-4">
              <span className="text-gray-500 text-sm block mb-0.5">Description</span>
              <p className="text-sm text-gray-700">{vendor.description}</p>
            </div>
          )}
          <div className="mt-4 text-xs text-gray-400">
            Registered: {new Date(vendor.createdAt).toLocaleDateString()} |
            Updated: {new Date(vendor.updatedAt).toLocaleDateString()}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200/80 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Uploaded Documents
          </h2>
          {(!vendor.documents || vendor.documents.length === 0) ? (
            <p className="text-sm text-gray-400">No documents uploaded</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {vendor.documents.map((doc) => {
                const url = resolveUrl(doc.fileUrl);
                const imageFile = isImage(doc.fileUrl);
                return (
                  <div
                    key={doc.id}
                    className="group bg-gray-50 rounded-xl border border-gray-100 overflow-hidden hover:border-gray-300 transition-colors"
                  >
                    {/* Thumbnail / preview area */}
                    <button
                      onClick={() => setPreviewDoc(doc)}
                      className="w-full relative aspect-4/3 bg-gray-100 flex items-center justify-center overflow-hidden cursor-pointer"
                    >
                      {imageFile ? (
                        <Image
                          src={url}
                          alt={doc.documentType}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-gray-400">
                          <FiFile className="w-10 h-10" />
                          <span className="text-xs font-medium uppercase">PDF</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-full p-2.5 shadow-sm">
                          <FiEye className="w-5 h-5 text-gray-700" />
                        </div>
                      </div>
                    </button>

                    {/* Info row */}
                    <div className="flex items-center justify-between px-3.5 py-2.5">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-700 capitalize truncate">
                          {doc.documentType.replace(/_/g, " ")}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(doc.uploadedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-gray-700 p-1 shrink-0"
                        title="Download"
                      >
                        <FiDownload size={15} />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {vendor.rejectionReason && (
          <div className="bg-orange-50 rounded-xl border border-orange-200 p-6">
            <h2 className="text-lg font-semibold text-orange-900 mb-2">
              Rejection Reason
            </h2>
            <p className="text-sm text-orange-800">
              {vendor.rejectionReason}
            </p>
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-200/80 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Actions
          </h2>
          <div className="flex flex-wrap gap-3">
            {vendor.status === VendorStatus.PENDING_VERIFICATION && (
              <>
                <button
                  onClick={() => setModal({ type: "approve" })}
                  className="px-4 py-2 bg-green-700 text-white rounded-lg text-sm font-medium hover:bg-green-800 transition-colors"
                >
                  Approve
                </button>
                <button
                  onClick={() => setModal({ type: "reject" })}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors"
                >
                  Reject
                </button>
              </>
            )}
            {vendor.status === VendorStatus.VERIFIED && (
              <button
                onClick={() => setModal({ type: "suspend" })}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
              >
                Suspend
              </button>
            )}
            {vendor.status === VendorStatus.SUSPENDED && (
              <>
                <button
                  onClick={() => setModal({ type: "reinstate" })}
                  className="px-4 py-2 bg-green-700 text-white rounded-lg text-sm font-medium hover:bg-green-800 transition-colors"
                >
                  Reinstate
                </button>
                <button
                  onClick={() => setModal({ type: "deactivate" })}
                  className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
                >
                  Permanently Ban
                </button>
              </>
            )}
            {vendor.status === VendorStatus.REJECTED && (
              <p className="text-sm text-gray-400 italic">
                Waiting for vendor to resubmit documents.
              </p>
            )}
            {vendor.status === VendorStatus.DEACTIVATED && (
              <p className="text-sm text-gray-400 italic">
                This account is permanently deactivated. No actions
                available.
              </p>
            )}
            {vendor.status === VendorStatus.REGISTERED && (
              <p className="text-sm text-gray-400 italic">
                Vendor has not yet submitted for verification.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {modal.type === "approve" && (
        <ConfirmDialog
          title="Approve Vendor"
          description="This vendor will become visible to couples and can start receiving bookings."
          confirmLabel="Approve"
          confirmColor="bg-green-700 hover:bg-green-800"
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
          confirmColor="bg-green-700 hover:bg-green-800"
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

      {/* Document preview lightbox */}
      {previewDoc && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex flex-col"
          onClick={() => setPreviewDoc(null)}
        >
          {/* Top bar */}
          <div
            className="flex items-center justify-between px-4 sm:px-6 py-3 bg-black/40 backdrop-blur-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 text-white min-w-0">
              <FiImage className="w-4 h-4 shrink-0 opacity-60" />
              <span className="text-sm font-medium capitalize truncate">
                {previewDoc.documentType.replace(/_/g, " ")}
              </span>
              <span className="text-xs opacity-40 shrink-0">
                {new Date(previewDoc.uploadedAt).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <a
                href={resolveUrl(previewDoc.fileUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/70 hover:text-white p-2 transition-colors"
                title="Open in new tab"
              >
                <FiExternalLink className="w-4 h-4" />
              </a>
              <a
                href={resolveUrl(previewDoc.fileUrl)}
                download
                className="text-white/70 hover:text-white p-2 transition-colors"
                title="Download"
              >
                <FiDownload className="w-4 h-4" />
              </a>
              <button
                onClick={() => setPreviewDoc(null)}
                className="text-white/70 hover:text-white p-2 transition-colors"
                title="Close"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Preview content */}
          <div
            className="flex-1 flex items-center justify-center p-4 overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {isImage(previewDoc.fileUrl) ? (
              <div className="relative w-full h-full max-w-4xl">
                <Image
                  src={resolveUrl(previewDoc.fileUrl)}
                  alt={previewDoc.documentType}
                  fill
                  sizes="100vw"
                  className="object-contain rounded-lg shadow-2xl"
                />
              </div>
            ) : isPdf(previewDoc.fileUrl) ? (
              <iframe
                src={resolveUrl(previewDoc.fileUrl)}
                title={previewDoc.documentType}
                className="w-full max-w-4xl h-full rounded-lg bg-white shadow-2xl"
              />
            ) : (
              <div className="text-center text-white">
                <FiFile className="w-16 h-16 mx-auto mb-4 opacity-40" />
                <p className="text-sm opacity-60 mb-4">
                  Preview not available for this file type.
                </p>
                <a
                  href={resolveUrl(previewDoc.fileUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors"
                >
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
