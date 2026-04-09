import * as profileRepo from "../infrastructure/vendor-profile.repository.js";
import { VendorStatus, type VendorListFilters, type PaginatedResult, type VendorProfile } from "../domain/types.js";
import { getVendorProfileById } from "./get-vendor-profile.js";
import type { VendorProfileWithDocuments } from "./get-vendor-profile.js";

export async function listVerifiedVendors(
  filters: VendorListFilters,
): Promise<PaginatedResult<VendorProfile>> {
  return profileRepo.findVerified(filters);
}

export async function getVerifiedVendor(
  vendorId: string,
): Promise<VendorProfileWithDocuments> {
  const profile = await getVendorProfileById(vendorId);
  if (!profile || profile.status !== VendorStatus.VERIFIED) {
    throw Object.assign(new Error("Vendor not found"), { statusCode: 404 });
  }
  return profile;
}
