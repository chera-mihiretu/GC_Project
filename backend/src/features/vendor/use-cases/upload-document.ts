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
    profile.status === VendorStatus.DEACTIVATED ||
    profile.status === VendorStatus.PENDING_VERIFICATION
  ) {
    throw Object.assign(
      new Error("Cannot upload documents in current status"),
      { statusCode: 403 },
    );
  }

  return documentRepo.create(profile.id, documentType, fileUrl);
}
