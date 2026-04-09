import {
  markRead,
  markAllRead,
} from "../infrastructure/notification.repository.js";

export async function markNotificationRead(
  id: string,
  userId: string,
): Promise<boolean> {
  return markRead(id, userId);
}

export async function markAllNotificationsRead(
  userId: string,
): Promise<void> {
  await markAllRead(userId);
}
