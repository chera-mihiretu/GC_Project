import * as profileRepo from "../infrastructure/vendor-profile.repository.js";
import * as documentRepo from "../infrastructure/vendor-document.repository.js";
import { deleteFile, extractStoragePath } from "../infrastructure/supabase-storage.js";

export async function deleteDocument(
  userId: string,
  documentId: string,
): Promise<void> {
  const profile = await profileRepo.findByUserId(userId);
  if (!profile) {
    throw Object.assign(new Error("Vendor profile not found"), {
      statusCode: 404,
    });
  }

  const doc = await documentRepo.findById(documentId);
  if (!doc || doc.vendorProfileId !== profile.id) {
    throw Object.assign(new Error("Document not found"), {
      statusCode: 404,
    });
  }

  const storagePath = extractStoragePath(doc.fileUrl);
  if (storagePath) {
    await deleteFile(storagePath).catch(() => {});
  }

  await documentRepo.remove(documentId);
}
