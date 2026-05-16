import * as profileRepo from "../infrastructure/vendor-profile.repository.js";
import * as documentRepo from "../infrastructure/vendor-document.repository.js";
import { VendorStatus, type DocumentType, type VendorDocument } from "../domain/types.js";

export async function uploadDocument(
  userId: string,
  documentType: DocumentType,
  fileUrl: string,
): Promise<VendorDocument> {
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
      new Error("Cannot upload documents in current status"),
      { statusCode: 403 },
    );
  }

  const doc = await documentRepo.create(profile.id, documentType, fileUrl);

  if (profile.status === VendorStatus.VERIFIED) {
    await profileRepo.updateStatus(
      profile.id,
      VendorStatus.PENDING_VERIFICATION,
    );
  }

  return doc;
}
