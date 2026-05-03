import * as repo from "../infrastructure/couple-profile.repository.js";
import type {
  CoupleProfile,
  CreateCoupleProfileDTO,
  UpdateCoupleProfileDTO,
} from "../domain/types.js";

export async function createCoupleProfile(
  dto: CreateCoupleProfileDTO,
): Promise<CoupleProfile> {
  const existing = await repo.findByUserId(dto.userId);
  if (existing) {
    const error = new Error("Couple profile already exists") as Error & { statusCode: number };
    error.statusCode = 409;
    throw error;
  }
  return repo.create(dto);
}

export async function updateCoupleProfile(
  userId: string,
  dto: UpdateCoupleProfileDTO,
): Promise<CoupleProfile> {
  const existing = await repo.findByUserId(userId);
  if (!existing) {
    const error = new Error("Couple profile not found") as Error & { statusCode: number };
    error.statusCode = 404;
    throw error;
  }
  const updated = await repo.update(userId, dto);
  return updated!;
}
