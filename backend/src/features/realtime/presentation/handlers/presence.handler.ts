import type { Socket } from "socket.io";
import type { TypedIO } from "../../infrastructure/socket-server.js";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  SocketData,
} from "../../domain/types.js";

type TypedSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  Record<string, never>,
  SocketData
>;

const onlineUsers = new Set<string>();

export function isUserOnline(userId: string): boolean {
  return onlineUsers.has(userId);
}

export function registerPresenceHandlers(
  io: TypedIO,
  socket: TypedSocket,
): void {
  const { userId } = socket.data;

  onlineUsers.add(userId);
  io.emit("presence:update", { userId, online: true });

  socket.on("disconnect", async () => {
    const sockets = await io.in(`user:${userId}`).fetchSockets();
    if (sockets.length === 0) {
      onlineUsers.delete(userId);
      io.emit("presence:update", { userId, online: false });
    }
  });
}
