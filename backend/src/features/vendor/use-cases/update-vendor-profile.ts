import * as profileRepo from "../infrastructure/vendor-profile.repository.js";
import {
  VendorStatus,
  RE_VERIFICATION_FIELDS,
  type UpdateVendorProfileDTO,
  type VendorProfile,
} from "../domain/types.js";

function touchesCriticalField(dto: UpdateVendorProfileDTO): boolean {
  return RE_VERIFICATION_FIELDS.some(
    (key) => dto[key] !== undefined,
  );
}

export async function updateVendorProfile(
  userId: string,
  dto: UpdateVendorProfileDTO,
): Promise<VendorProfile> {
  const profile = await profileRepo.findByUserId(userId);
  if (!profile) {
    throw Object.assign(new Error("Vendor profile not found"), {
      statusCode: 404,
    });
  }

  if (
    profile.status === VendorStatus.SUSPENDED ||
    profile.status === VendorStatus.DEACTIVATED
  ) {
    throw Object.assign(
      new Error("Cannot update profile in current status"),
      { statusCode: 403 },
    );
  }

  const updated = await profileRepo.update(profile.id, dto);
  if (!updated) {
    throw Object.assign(new Error("Failed to update profile"), {
      statusCode: 500,
    });
  }

  if (
    profile.status === VendorStatus.VERIFIED &&
    touchesCriticalField(dto)
  ) {
    return profileRepo.updateStatus(
      profile.id,
      VendorStatus.PENDING_VERIFICATION,
    );
  }

  return updated;
}
