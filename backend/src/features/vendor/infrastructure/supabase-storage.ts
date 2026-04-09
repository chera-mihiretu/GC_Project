import { supabase, VENDOR_DOCS_BUCKET } from "../../../config/supabase.js";

export async function ensureBucketExists(): Promise<void> {
  const { data } = await supabase.storage.getBucket(VENDOR_DOCS_BUCKET);
  if (!data) {
    await supabase.storage.createBucket(VENDOR_DOCS_BUCKET, {
      public: true,
      fileSizeLimit: 5 * 1024 * 1024,
      allowedMimeTypes: [
        "application/pdf",
        "image/jpeg",
        "image/png",
        "image/jpg",
      ],
    });
  }
}

export async function uploadFile(
  filePath: string,
  fileBuffer: Buffer,
  contentType: string,
): Promise<string> {
  const { error } = await supabase.storage
    .from(VENDOR_DOCS_BUCKET)
    .upload(filePath, fileBuffer, {
      contentType,
      upsert: true,
    });

  if (error) {
    throw new Error(`Supabase upload failed: ${error.message}`);
  }

  const { data: urlData } = supabase.storage
    .from(VENDOR_DOCS_BUCKET)
    .getPublicUrl(filePath);

  return urlData.publicUrl;
}

export async function deleteFile(filePath: string): Promise<void> {
  const { error } = await supabase.storage
    .from(VENDOR_DOCS_BUCKET)
    .remove([filePath]);

  if (error) {
    throw new Error(`Supabase delete failed: ${error.message}`);
  }
}

export function extractStoragePath(publicUrl: string): string | null {
  const marker = `/object/public/${VENDOR_DOCS_BUCKET}/`;
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return null;
  return publicUrl.substring(idx + marker.length);
}
