import * as profileRepo from "../infrastructure/vendor-profile.repository.js";
import * as documentRepo from "../infrastructure/vendor-document.repository.js";
import type { VendorProfile, VendorDocument } from "../domain/types.js";

export interface VendorProfileWithDocuments extends VendorProfile {
  documents: VendorDocument[];
}

export async function getVendorProfile(
  userId: string,
): Promise<VendorProfileWithDocuments | null> {
  const profile = await profileRepo.findByUserId(userId);
  if (!profile) return null;

  const documents = await documentRepo.findByVendorId(profile.id);
  return { ...profile, documents };
}

export async function getVendorProfileById(
  id: string,
): Promise<VendorProfileWithDocuments | null> {
  const profile = await profileRepo.findById(id);
  if (!profile) return null;

  const documents = await documentRepo.findByVendorId(profile.id);
  return { ...profile, documents };
}
