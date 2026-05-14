import { Router, type Request, type Response } from "express";
import { requireAuth, requireRole } from "../../auth/presentation/auth.middleware.js";
import * as repo from "../infrastructure/checklist.repository.js";

const router = Router();

router.get("/", requireAuth(), requireRole("couple"), async (req: Request, res: Response) => {
  const userId = req.authContext!.user.id;
  const category = req.query.category as string | undefined;
  try {
    const items = await repo.findByUserId(userId, category || undefined);
    res.json({ items });
  } catch (err) {
    console.error("[Checklist] List error:", err);
    res.status(500).json({ error: { code: "SERVER_ERROR", message: "Failed to list checklist items" } });
  }
});

router.get("/progress", requireAuth(), requireRole("couple"), async (req: Request, res: Response) => {
  const userId = req.authContext!.user.id;
  try {
    const progress = await repo.getProgress(userId);
    res.json(progress);
  } catch (err) {
    console.error("[Checklist] Progress error:", err);
    res.status(500).json({ error: { code: "SERVER_ERROR", message: "Failed to get progress" } });
  }
});

router.post("/", requireAuth(), requireRole("couple"), async (req: Request, res: Response) => {
  const userId = req.authContext!.user.id;
  const { title, category, dueDate, sortOrder, notes } = req.body ?? {};

  if (!title || typeof title !== "string" || !title.trim()) {
    res.status(400).json({ error: { code: "BAD_REQUEST", message: "title is required" } });
    return;
  }

  try {
    const item = await repo.create({
      userId,
      title: title.trim(),
      category: category || undefined,
      dueDate: dueDate || undefined,
      sortOrder: sortOrder ?? 0,
      notes: notes || undefined,
    });
    res.status(201).json({ item });
  } catch (err) {
    console.error("[Checklist] Create error:", err);
    res.status(500).json({ error: { code: "SERVER_ERROR", message: "Failed to create checklist item" } });
  }
});

router.post("/seed", requireAuth(), requireRole("couple"), async (req: Request, res: Response) => {
  const userId = req.authContext!.user.id;
  try {
    const items = await repo.seedDefaults(userId);
    if (items.length === 0) {
      res.json({ seeded: false, message: "Checklist already has items" });
      return;
    }
    res.status(201).json({ seeded: true, count: items.length, items });
  } catch (err) {
    console.error("[Checklist] Seed error:", err);
    res.status(500).json({ error: { code: "SERVER_ERROR", message: "Failed to seed checklist" } });
  }
});

router.patch("/:id", requireAuth(), requireRole("couple"), async (req: Request, res: Response) => {
  const userId = req.authContext!.user.id;
  const id = req.params.id as string;
  const { title, category, dueDate, sortOrder, notes, isCompleted } = req.body ?? {};

  try {
    const item = await repo.update(id, userId, {
      title,
      category,
      dueDate,
      sortOrder,
      notes,
      isCompleted,
    });
    if (!item) {
      res.status(404).json({ error: { code: "NOT_FOUND", message: "Checklist item not found" } });
      return;
    }
    res.json({ item });
  } catch (err) {
    console.error("[Checklist] Update error:", err);
    res.status(500).json({ error: { code: "SERVER_ERROR", message: "Failed to update checklist item" } });
  }
});

router.patch("/:id/toggle", requireAuth(), requireRole("couple"), async (req: Request, res: Response) => {
  const userId = req.authContext!.user.id;
  const id = req.params.id as string;

  try {
    const item = await repo.toggleComplete(id, userId);
    if (!item) {
      res.status(404).json({ error: { code: "NOT_FOUND", message: "Checklist item not found" } });
      return;
    }
    res.json({ item });
  } catch (err) {
    console.error("[Checklist] Toggle error:", err);
    res.status(500).json({ error: { code: "SERVER_ERROR", message: "Failed to toggle checklist item" } });
  }
});

router.delete("/:id", requireAuth(), requireRole("couple"), async (req: Request, res: Response) => {
  const userId = req.authContext!.user.id;
  const id = req.params.id as string;

  try {
    const deleted = await repo.deleteById(id, userId);
    if (!deleted) {
      res.status(404).json({ error: { code: "NOT_FOUND", message: "Checklist item not found" } });
      return;
    }
    res.json({ success: true });
  } catch (err) {
    console.error("[Checklist] Delete error:", err);
    res.status(500).json({ error: { code: "SERVER_ERROR", message: "Failed to delete checklist item" } });
  }
});

export default router;
