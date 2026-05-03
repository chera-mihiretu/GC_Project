import * as repo from "../infrastructure/portfolio.repository.js";
import type { PortfolioItem } from "../infrastructure/portfolio.repository.js";
import {
  createSignedUploadUrl,
  getPublicUrl,
  deletePortfolioFile,
  extractPortfolioStoragePath,
} from "../infrastructure/portfolio-storage.js";
import { findByUserId as findProfileByUserId } from "../infrastructure/vendor-profile.repository.js";

export async function getPortfolioItems(
  vendorOwnerId: string,
): Promise<Record<string, PortfolioItem[]>> {
  const profile = await findProfileByUserId(vendorOwnerId);
  if (!profile) {
    const err = new Error("Vendor profile not found") as Error & { statusCode: number };
    err.statusCode = 404;
    throw err;
  }

  const items = await repo.findByVendorProfileId(profile.id);

  const grouped: Record<string, PortfolioItem[]> = {};
  for (const item of items) {
    if (!grouped[item.category]) grouped[item.category] = [];
    grouped[item.category].push(item);
  }
  return grouped;
}

export async function getPortfolioByCategory(
  vendorOwnerId: string,
  category: string,
  limit: number,
  offset: number,
): Promise<{ items: PortfolioItem[]; total: number }> {
  const profile = await findProfileByUserId(vendorOwnerId);
  if (!profile) {
    const err = new Error("Vendor profile not found") as Error & { statusCode: number };
    err.statusCode = 404;
    throw err;
  }
  return repo.findByVendorProfileIdPaginated(profile.id, category, limit, offset);
}

export async function getPublicPortfolioByCategory(
  vendorProfileId: string,
  category: string,
  limit: number,
  offset: number,
): Promise<{ items: PortfolioItem[]; total: number }> {
  return repo.findByVendorProfileIdPaginated(vendorProfileId, category, limit, offset);
}

export async function requestUploadUrl(
  vendorOwnerId: string,
  fileName: string,
  contentType: string,
): Promise<{ signedUrl: string; publicUrl: string; path: string }> {
  const profile = await findProfileByUserId(vendorOwnerId);
  if (!profile) {
    const err = new Error("Vendor profile not found") as Error & { statusCode: number };
    err.statusCode = 404;
    throw err;
  }

  const ext = fileName.includes(".") ? fileName.split(".").pop() : "";
  const storagePath = `${profile.id}/${crypto.randomUUID()}${ext ? `.${ext}` : ""}`;

  const { signedUrl, path } = await createSignedUploadUrl(storagePath);
  const publicUrl = getPublicUrl(storagePath);

  return { signedUrl, publicUrl, path };
}

export async function addPortfolioItem(
  vendorOwnerId: string,
  dto: {
    category: string;
    mediaUrl: string;
    mediaType: "image" | "video";
    caption?: string;
  },
): Promise<PortfolioItem> {
  const profile = await findProfileByUserId(vendorOwnerId);
  if (!profile) {
    const err = new Error("Vendor profile not found") as Error & { statusCode: number };
    err.statusCode = 404;
    throw err;
  }

  return repo.create({
    vendorProfileId: profile.id,
    category: dto.category,
    mediaUrl: dto.mediaUrl,
    mediaType: dto.mediaType,
    caption: dto.caption,
  });
}

export async function updatePortfolioItem(
  vendorOwnerId: string,
  itemId: string,
  dto: { caption?: string | null; sortOrder?: number },
): Promise<PortfolioItem> {
  const profile = await findProfileByUserId(vendorOwnerId);
  if (!profile) {
    const err = new Error("Vendor profile not found") as Error & { statusCode: number };
    err.statusCode = 404;
    throw err;
  }

  const item = await repo.findById(itemId);
  if (!item || item.vendorProfileId !== profile.id) {
    const err = new Error("Portfolio item not found") as Error & { statusCode: number };
    err.statusCode = 404;
    throw err;
  }

  const updated = await repo.updateItem(itemId, dto);
  return updated!;
}

export async function deletePortfolioItem(
  vendorOwnerId: string,
  itemId: string,
): Promise<void> {
  const profile = await findProfileByUserId(vendorOwnerId);
  if (!profile) {
    const err = new Error("Vendor profile not found") as Error & { statusCode: number };
    err.statusCode = 404;
    throw err;
  }

  const item = await repo.findById(itemId);
  if (!item || item.vendorProfileId !== profile.id) {
    const err = new Error("Portfolio item not found") as Error & { statusCode: number };
    err.statusCode = 404;
    throw err;
  }

  const storagePath = extractPortfolioStoragePath(item.mediaUrl);
  if (storagePath) {
    await deletePortfolioFile(storagePath).catch(() => {});
  }

  await repo.deleteItem(itemId);
}
