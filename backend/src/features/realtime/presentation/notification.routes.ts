import { Router, type Request, type Response } from "express";
import { requireAuth } from "../../auth/presentation/auth.middleware.js";
import {
  getNotificationsByUser,
  getUnreadCount,
} from "../infrastructure/notification.repository.js";
import {
  markNotificationRead,
  markAllNotificationsRead,
} from "../use-cases/mark-notification-read.js";

const router = Router();

router.use(requireAuth());

router.get("/", async (req: Request, res: Response) => {
  const userId = req.authContext!.user.id;
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const offset = Number(req.query.offset) || 0;

  const [notifications, unreadCount] = await Promise.all([
    getNotificationsByUser(userId, limit, offset),
    getUnreadCount(userId),
  ]);

  res.json({ notifications, unreadCount, limit, offset });
});

router.patch("/:id/read", async (req: Request<{ id: string }>, res: Response) => {
  const userId = req.authContext!.user.id;
  const success = await markNotificationRead(req.params.id, userId);

  if (!success) {
    res.status(404).json({ error: { code: "NOT_FOUND", message: "Notification not found" } });
    return;
  }
  res.json({ success: true });
});

router.patch("/read-all", async (req: Request, res: Response) => {
  const userId = req.authContext!.user.id;
  await markAllNotificationsRead(userId);
  res.json({ success: true });
});

export default router;
