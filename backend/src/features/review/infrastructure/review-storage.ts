import { supabase } from "../../../config/supabase.js";
import { randomUUID } from "crypto";

const REVIEW_PHOTOS_BUCKET = "review-photos";

export async function ensureReviewBucketExists(): Promise<void> {
  const { data } = await supabase.storage.getBucket(REVIEW_PHOTOS_BUCKET);
  if (!data) {
    await supabase.storage.createBucket(REVIEW_PHOTOS_BUCKET, {
      public: true,
      fileSizeLimit: 5 * 1024 * 1024,
      allowedMimeTypes: ["image/jpeg", "image/png", "image/jpg", "image/webp"],
    });
  }
}

export async function uploadReviewPhoto(
  reviewId: string,
  fileBuffer: Buffer,
  contentType: string,
): Promise<string> {
  const ext = contentType.split("/")[1] ?? "jpg";
  const filePath = `reviews/${reviewId}/${randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from(REVIEW_PHOTOS_BUCKET)
    .upload(filePath, fileBuffer, { contentType, upsert: false });

  if (error) {
    throw new Error(`Review photo upload failed: ${error.message}`);
  }

  const { data: urlData } = supabase.storage
    .from(REVIEW_PHOTOS_BUCKET)
    .getPublicUrl(filePath);

  return urlData.publicUrl;
}
