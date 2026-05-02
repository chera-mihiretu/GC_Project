import * as reviewRepo from "../infrastructure/review.repository.js";
import * as photoRepo from "../infrastructure/review-photo.repository.js";
import { uploadReviewPhoto } from "../infrastructure/review-storage.js";

const MAX_PHOTOS_PER_REVIEW = 5;

export interface UploadPhotosInput {
  reviewId: string;
  coupleId: string;
  files: { buffer: Buffer; mimetype: string }[];
}

export async function uploadReviewPhotos(input: UploadPhotosInput) {
  const { reviewId, coupleId, files } = input;

  const review = await reviewRepo.findById(reviewId);
  if (!review) {
    throw Object.assign(new Error("Review not found"), { statusCode: 404 });
  }

  if (review.coupleId !== coupleId) {
    throw Object.assign(new Error("You do not own this review"), { statusCode: 403 });
  }

  const existingCount = await photoRepo.countByReviewId(reviewId);
  if (existingCount + files.length > MAX_PHOTOS_PER_REVIEW) {
    throw Object.assign(
      new Error(`Maximum ${MAX_PHOTOS_PER_REVIEW} photos per review. You already have ${existingCount}.`),
      { statusCode: 400 },
    );
  }

  const urls: string[] = [];
  for (const file of files) {
    const url = await uploadReviewPhoto(reviewId, file.buffer, file.mimetype);
    urls.push(url);
  }

  return photoRepo.addPhotos(reviewId, urls);
}
