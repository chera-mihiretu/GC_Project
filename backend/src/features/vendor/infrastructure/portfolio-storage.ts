import { supabase, VENDOR_PORTFOLIO_BUCKET } from "../../../config/supabase.js";

export async function ensurePortfolioBucketExists(): Promise<void> {
  const { data } = await supabase.storage.getBucket(VENDOR_PORTFOLIO_BUCKET);
  if (!data) {
    await supabase.storage.createBucket(VENDOR_PORTFOLIO_BUCKET, {
      public: true,
      fileSizeLimit: 10 * 1024 * 1024,
      allowedMimeTypes: [
        "image/jpeg",
        "image/png",
        "image/webp",
        "video/mp4",
        "video/quicktime",
      ],
    });
  }
}

export async function createSignedUploadUrl(
  filePath: string,
): Promise<{ signedUrl: string; path: string }> {
  const { data, error } = await supabase.storage
    .from(VENDOR_PORTFOLIO_BUCKET)
    .createSignedUploadUrl(filePath);

  if (error || !data) {
    throw new Error(`Failed to create signed upload URL: ${error?.message}`);
  }

  return { signedUrl: data.signedUrl, path: data.path };
}

export function getPublicUrl(filePath: string): string {
  const { data } = supabase.storage
    .from(VENDOR_PORTFOLIO_BUCKET)
    .getPublicUrl(filePath);
  return data.publicUrl;
}

export async function deletePortfolioFile(filePath: string): Promise<void> {
  const { error } = await supabase.storage
    .from(VENDOR_PORTFOLIO_BUCKET)
    .remove([filePath]);
  if (error) {
    throw new Error(`Supabase delete failed: ${error.message}`);
  }
}

export function extractPortfolioStoragePath(publicUrl: string): string | null {
  const marker = `/object/public/${VENDOR_PORTFOLIO_BUCKET}/`;
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return null;
  return publicUrl.substring(idx + marker.length);
}
