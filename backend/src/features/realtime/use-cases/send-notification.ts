import type { Notification } from "../domain/types.js";
import { createNotification } from "../infrastructure/notification.repository.js";
import { getIO } from "../infrastructure/socket-server.js";

export interface SendNotificationInput {
  userId: string;
  type: string;
  title: string;
  body: string;
  metadata?: Record<string, unknown>;
}

export async function sendNotification(
  input: SendNotificationInput,
): Promise<Notification> {
  const notification = await createNotification({
    userId: input.userId,
    type: input.type,
    title: input.title,
    body: input.body,
    metadata: input.metadata ?? {},
  });

  try {
    getIO().to(`user:${input.userId}`).emit("notification:new", notification);
  } catch {
    // Socket.IO not initialised yet (e.g. during table init) — skip emit
  }

  return notification;
}
