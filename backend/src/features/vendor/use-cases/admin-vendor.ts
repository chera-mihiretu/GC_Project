import * as profileRepo from "../infrastructure/vendor-profile.repository.js";
import { getVendorProfileById } from "./get-vendor-profile.js";
import { VendorStatus, type VendorProfile, type VendorListFilters, type PaginatedResult } from "../domain/types.js";
import type { VendorProfileWithDocuments } from "./get-vendor-profile.js";
import { sendNotification } from "../../realtime/use-cases/send-notification.js";

export async function listVendorsAdmin(
  filters: VendorListFilters,
): Promise<PaginatedResult<VendorProfile>> {
  return profileRepo.findByStatus(filters);
}

export async function getVendorDetailAdmin(
  vendorId: string,
): Promise<VendorProfileWithDocuments> {
  const profile = await getVendorProfileById(vendorId);
  if (!profile) {
    throw Object.assign(new Error("Vendor not found"), { statusCode: 404 });
  }
  return profile;
}

export async function approveVendor(
  vendorId: string,
): Promise<VendorProfile> {
  const updated = await profileRepo.updateStatus(vendorId, VendorStatus.VERIFIED);

  sendNotification({
    userId: updated.userId,
    type: "vendor_approved",
    title: "Verification Approved",
    body: "Your business has been verified. You can now receive bookings!",
    metadata: { vendorProfileId: vendorId },
  }).catch(() => {});

  return updated;
}

export async function rejectVendor(
  vendorId: string,
  reason: string,
): Promise<VendorProfile> {
  if (!reason || reason.trim().length < 10) {
    throw Object.assign(
      new Error("Rejection reason must be at least 10 characters"),
      { statusCode: 400 },
    );
  }
  const updated = await profileRepo.updateStatus(vendorId, VendorStatus.REJECTED, reason);

  sendNotification({
    userId: updated.userId,
    type: "vendor_rejected",
    title: "Verification Rejected",
    body: `Your submission was not approved: ${reason}`,
    metadata: { vendorProfileId: vendorId, reason },
  }).catch(() => {});

  return updated;
}

export async function suspendVendor(
  vendorId: string,
  reason: string,
): Promise<VendorProfile> {
  if (!reason || reason.trim().length === 0) {
    throw Object.assign(new Error("Suspension reason is required"), {
      statusCode: 400,
    });
  }
  return profileRepo.updateStatus(vendorId, VendorStatus.SUSPENDED, reason);
}

export async function reinstateVendor(
  vendorId: string,
): Promise<VendorProfile> {
  return profileRepo.updateStatus(vendorId, VendorStatus.VERIFIED);
}

export async function deactivateVendor(
  vendorId: string,
): Promise<VendorProfile> {
  return profileRepo.updateStatus(vendorId, VendorStatus.DEACTIVATED);
}
