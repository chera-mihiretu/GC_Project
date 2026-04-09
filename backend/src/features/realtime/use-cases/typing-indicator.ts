import type { Socket } from "socket.io";
import type { TypedIO } from "../infrastructure/socket-server.js";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  SocketData,
} from "../domain/types.js";

type TypedSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  Record<string, never>,
  SocketData
>;

export function broadcastTyping(
  io: TypedIO,
  socket: TypedSocket,
  conversationId: string,
  typing: boolean,
): void {
  socket.to(`conversation:${conversationId}`).emit("chat:typing", {
    conversationId,
    userId: socket.data.userId,
    typing,
  });
}
