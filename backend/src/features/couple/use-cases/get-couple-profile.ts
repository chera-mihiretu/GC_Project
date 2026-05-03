import * as repo from "../infrastructure/couple-profile.repository.js";
import type { CoupleProfile } from "../domain/types.js";

export async function getCoupleProfile(userId: string): Promise<CoupleProfile | null> {
  return repo.findByUserId(userId);
}
