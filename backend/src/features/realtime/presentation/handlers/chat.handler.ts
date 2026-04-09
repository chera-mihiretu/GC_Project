import type { Socket } from "socket.io";
import type { TypedIO } from "../../infrastructure/socket-server.js";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  SocketData,
} from "../../domain/types.js";
import { sendChatMessage } from "../../use-cases/send-chat-message.js";
import { broadcastTyping } from "../../use-cases/typing-indicator.js";

type TypedSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  Record<string, never>,
  SocketData
>;

export function registerChatHandlers(io: TypedIO, socket: TypedSocket): void {
  socket.on("chat:join", ({ conversationId }) => {
    socket.join(`conversation:${conversationId}`);
  });

  socket.on("chat:leave", ({ conversationId }) => {
    socket.leave(`conversation:${conversationId}`);
  });

  socket.on("chat:send", async (data, ack) => {
    try {
      const message = await sendChatMessage({
        conversationId: data.conversationId,
        senderId: socket.data.userId,
        content: data.content,
      });
      io.to(`conversation:${data.conversationId}`).emit(
        "chat:message",
        message,
      );
      ack?.(message);
    } catch {
      ack?.(null);
    }
  });

  socket.on("chat:typing", ({ conversationId, typing }) => {
    broadcastTyping(io, socket, conversationId, typing);
  });

  socket.on("chat:mark-read", async ({ conversationId }) => {
    const { markConversationRead } = await import(
      "../../use-cases/send-chat-message.js"
    );
    await markConversationRead(conversationId, socket.data.userId);
    io.to(`conversation:${conversationId}`).emit("chat:read", {
      conversationId,
      readBy: socket.data.userId,
    });
  });
}
