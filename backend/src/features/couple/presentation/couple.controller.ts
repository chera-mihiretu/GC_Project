import type { Request, Response } from "express";
import { getCoupleProfile } from "../use-cases/get-couple-profile.js";
import {
  createCoupleProfile,
  updateCoupleProfile,
} from "../use-cases/upsert-couple-profile.js";

function handleError(res: Response, err: unknown): void {
  const error = err as Error & { statusCode?: number };
  const status = error.statusCode ?? 500;
  res.status(status).json({ error: { message: error.message } });
}

export async function handleGetProfile(req: Request, res: Response): Promise<void> {
  try {
    const profile = await getCoupleProfile(req.authContext!.user.id);
    if (!profile) {
      res.status(404).json({ error: { message: "Couple profile not found" } });
      return;
    }
    res.json({ coupleProfile: profile });
  } catch (err) {
    handleError(res, err);
  }
}

export async function handleCreateProfile(req: Request, res: Response): Promise<void> {
  try {
    const profile = await createCoupleProfile({
      userId: req.authContext!.user.id,
      ...req.body,
    });
    res.status(201).json({ coupleProfile: profile });
  } catch (err) {
    handleError(res, err);
  }
}

export async function handleUpdateProfile(req: Request, res: Response): Promise<void> {
  try {
    const profile = await updateCoupleProfile(req.authContext!.user.id, req.body);
    res.json({ coupleProfile: profile });
  } catch (err) {
    handleError(res, err);
  }
}
