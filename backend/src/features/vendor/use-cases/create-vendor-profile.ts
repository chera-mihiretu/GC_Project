import * as profileRepo from "../infrastructure/vendor-profile.repository.js";
import type {
  VendorProfile,
  CreateVendorProfileDTO,
} from "../domain/types.js";

export async function createVendorProfile(
  dto: CreateVendorProfileDTO,
): Promise<VendorProfile> {
  const existing = await profileRepo.findByUserId(dto.userId);
  if (existing) {
    throw Object.assign(new Error("Vendor profile already exists"), {
      statusCode: 409,
    });
  }
  return profileRepo.createProfile(dto);
}
