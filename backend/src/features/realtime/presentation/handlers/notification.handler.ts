import type { Socket } from "socket.io";
import type { TypedIO } from "../../infrastructure/socket-server.js";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  SocketData,
} from "../../domain/types.js";
import {
  markNotificationRead,
  markAllNotificationsRead,
} from "../../use-cases/mark-notification-read.js";

type TypedSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  Record<string, never>,
  SocketData
>;

export function registerNotificationHandlers(
  _io: TypedIO,
  socket: TypedSocket,
): void {
  socket.on("notification:mark-read", async (data, ack) => {
    const { userId } = socket.data;

    try {
      if ("all" in data && data.all) {
        await markAllNotificationsRead(userId);
        socket.emit("notification:read", { all: true });
      } else if ("id" in data) {
        await markNotificationRead(data.id, userId);
        socket.emit("notification:read", { id: data.id });
      }
      ack?.(true);
    } catch {
      ack?.(false);
    }
  });
}
