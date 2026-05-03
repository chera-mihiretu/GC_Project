import { apiFetch } from "./auth.service";
import type { VendorProfile, VendorDocument, DocumentType } from "@/types/vendor";

const BASE = "/api/v1/vendor";

export async function getVendorProfile(): Promise<{
  vendorProfile: VendorProfile;
} | null> {
  const res = await apiFetch(BASE + "/profile");
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to fetch vendor profile");
  return res.json();
}

export async function createVendorProfile(data: {
  businessName?: string;
  category?: string;
  description?: string;
  phoneNumber?: string;
  location?: string;
}): Promise<{ vendorProfile: VendorProfile }> {
  const res = await apiFetch(BASE + "/profile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message ?? "Failed to create profile");
  }
  return res.json();
}

export async function updateVendorProfile(data: {
  businessName?: string;
  category?: string;
  description?: string;
  phoneNumber?: string;
  location?: string;
}): Promise<{ vendorProfile: VendorProfile }> {
  const res = await apiFetch(BASE + "/profile", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message ?? "Failed to update profile");
  }
  return res.json();
}

export async function uploadDocument(
  file: File,
  documentType: DocumentType,
): Promise<{ document: VendorDocument }> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("documentType", documentType);

  const res = await apiFetch(BASE + "/documents", {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message ?? "Failed to upload document");
  }
  return res.json();
}

export async function deleteDocument(documentId: string): Promise<void> {
  const res = await apiFetch(`${BASE}/documents/${documentId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete document");
}

export async function submitForVerification(): Promise<{
  vendorProfile: VendorProfile;
}> {
  const res = await apiFetch(BASE + "/profile/submit", {
    method: "POST",
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message ?? "Failed to submit");
  }
  return res.json();
}

export interface VendorContext {
  vendorOwnerId: string;
  orgRole: "owner" | "member";
  isStaff: boolean;
}

export async function getVendorContext(): Promise<VendorContext> {
  const res = await apiFetch(BASE + "/context");
  if (!res.ok) throw new Error("Failed to fetch vendor context");
  return res.json();
}
