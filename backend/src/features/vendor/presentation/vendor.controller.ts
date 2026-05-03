import type { Request, Response } from "express";
import path from "path";
import { createVendorProfile } from "../use-cases/create-vendor-profile.js";
import { updateVendorProfile } from "../use-cases/update-vendor-profile.js";
import { getVendorProfile } from "../use-cases/get-vendor-profile.js";
import { uploadDocument } from "../use-cases/upload-document.js";
import { deleteDocument } from "../use-cases/delete-document.js";
import { submitForVerification } from "../use-cases/submit-for-verification.js";
import { uploadFile } from "../infrastructure/supabase-storage.js";
import type { DocumentType } from "../domain/types.js";

function getVendorOwnerId(req: Request): string {
  return req.authContext!.vendorOwnerId ?? req.authContext!.user.id;
}

function isStaff(req: Request): boolean {
  return req.authContext!.orgRole === "member";
}

function handleError(res: Response, err: unknown): void {
  const error = err as Error & { statusCode?: number };
  const status = error.statusCode ?? 500;
  res.status(status).json({
    error: { message: error.message },
  });
}

export async function handleCreateProfile(
  req: Request,
  res: Response,
): Promise<void> {
  if (isStaff(req)) {
    res.status(403).json({ error: { message: "Staff cannot create vendor profiles" } });
    return;
  }
  try {
    const profile = await createVendorProfile({
      userId: getVendorOwnerId(req),
      ...req.body,
    });
    res.status(201).json({ vendorProfile: profile });
  } catch (err) {
    handleError(res, err);
  }
}

export async function handleUpdateProfile(
  req: Request,
  res: Response,
): Promise<void> {
  if (isStaff(req)) {
    res.status(403).json({ error: { message: "Staff cannot edit vendor profiles" } });
    return;
  }
  try {
    const profile = await updateVendorProfile(getVendorOwnerId(req), req.body);
    res.status(200).json({ vendorProfile: profile });
  } catch (err) {
    handleError(res, err);
  }
}

export async function handleGetProfile(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const profile = await getVendorProfile(getVendorOwnerId(req));
    if (!profile) {
      res.status(404).json({
        error: { message: "Vendor profile not found" },
      });
      return;
    }
    res.status(200).json({ vendorProfile: profile });
  } catch (err) {
    handleError(res, err);
  }
}

export async function handleUploadDocument(
  req: Request,
  res: Response,
): Promise<void> {
  if (isStaff(req)) {
    res.status(403).json({ error: { message: "Staff cannot upload documents" } });
    return;
  }
  try {
    const file = req.file;
    if (!file) {
      res.status(400).json({
        error: { message: "No file uploaded" },
      });
      return;
    }

    const documentType = req.body.documentType as DocumentType;
    if (!documentType) {
      res.status(400).json({
        error: { message: "documentType is required" },
      });
      return;
    }

    const ownerId = getVendorOwnerId(req);
    const ext = path.extname(file.originalname);
    const storagePath = `${ownerId}/${Date.now()}-${crypto.randomUUID()}${ext}`;

    const publicUrl = await uploadFile(
      storagePath,
      file.buffer,
      file.mimetype,
    );

    const document = await uploadDocument(ownerId, documentType, publicUrl);
    res.status(201).json({ document });
  } catch (err) {
    handleError(res, err);
  }
}

export async function handleDeleteDocument(
  req: Request,
  res: Response,
): Promise<void> {
  if (isStaff(req)) {
    res.status(403).json({ error: { message: "Staff cannot delete documents" } });
    return;
  }
  try {
    const docId = req.params.documentId;
    await deleteDocument(getVendorOwnerId(req), Array.isArray(docId) ? docId[0] : docId);
    res.status(200).json({ success: true });
  } catch (err) {
    handleError(res, err);
  }
}

export async function handleSubmitForVerification(
  req: Request,
  res: Response,
): Promise<void> {
  if (isStaff(req)) {
    res.status(403).json({ error: { message: "Staff cannot submit for verification" } });
    return;
  }
  try {
    const profile = await submitForVerification(getVendorOwnerId(req));
    res.status(200).json({ vendorProfile: profile });
  } catch (err) {
    handleError(res, err);
  }
}
