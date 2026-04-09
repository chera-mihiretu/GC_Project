"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import AuthGuard from "@/components/auth-guard";
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
import { VendorStatus, type VendorProfile } from "@/types/vendor";
import { FiFile, FiDownload } from "react-icons/fi";

type ModalState =
  | { type: "none" }
  | { type: "approve" }
  | { type: "reject" }
  | { type: "suspend" }
  | { type: "reinstate" }
  | { type: "deactivate" };

export default function AdminVendorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const vendorId = params.id as string;

  const [vendor, setVendor] = useState<VendorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalState>({ type: "none" });

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
      <AuthGuard allowedRoles={["admin"]}>
        <div className="flex items-center justify-center min-h-screen text-gray-500">
          Loading...
        </div>
      </AuthGuard>
    );
  }

  if (!vendor) {
    return (
      <AuthGuard allowedRoles={["admin"]}>
        <div className="flex items-center justify-center min-h-screen text-gray-500">
          Vendor not found
        </div>
      </AuthGuard>
    );
  }

  const isAbsoluteUrl = (url: string) => url.startsWith("http");

  return (
    <AuthGuard allowedRoles={["admin"]}>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <button
            onClick={() => router.push("/admin/vendors")}
            className="text-sm text-gray-500 hover:text-gray-700 mb-6 inline-block"
          >
            &larr; Back to Vendors
          </button>

          <div className="flex items-start justify-between mb-6">
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
            {/* Profile Info */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
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

            {/* Documents */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Uploaded Documents
              </h2>
              {(!vendor.documents || vendor.documents.length === 0) ? (
                <p className="text-sm text-gray-400">No documents uploaded</p>
              ) : (
                <div className="space-y-2">
                  {vendor.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100"
                    >
                      <div className="flex items-center gap-3">
                        <FiFile className="text-gray-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-700 capitalize">
                            {doc.documentType.replace("_", " ")}
                          </p>
                          <p className="text-xs text-gray-400">
                            {new Date(doc.uploadedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <a
                        href={isAbsoluteUrl(doc.fileUrl) ? doc.fileUrl : `/api${doc.fileUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <FiDownload size={16} />
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Rejection Reason */}
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

            {/* Actions */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
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
    </AuthGuard>
  );
}
