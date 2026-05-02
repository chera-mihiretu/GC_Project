import { Server as HttpServer } from "http";
import { Server } from "socket.io";
import { fromNodeHeaders } from "better-auth/node";
import { env } from "../../../config/env.js";
import { auth } from "../../../lib/auth.js";
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  SocketData,
} from "../domain/types.js";
import { registerNotificationHandlers } from "../presentation/handlers/notification.handler.js";
import { registerChatHandlers } from "../presentation/handlers/chat.handler.js";
import { registerPresenceHandlers } from "../presentation/handlers/presence.handler.js";

export type TypedIO = Server<
  ClientToServerEvents,
  ServerToClientEvents,
  Record<string, never>,
  SocketData
>;

let io: TypedIO;

export function getIO(): TypedIO {
  if (!io) throw new Error("Socket.IO not initialised — call createSocketServer first");
  return io;
}

export function createSocketServer(httpServer: HttpServer): TypedIO {
  io = new Server<
    ClientToServerEvents,
    ServerToClientEvents,
    Record<string, never>,
    SocketData
  >(httpServer, {
    cors: {
      origin: [env.FRONTEND_URL, "http://localhost:3000"].filter(Boolean),
      credentials: true,
      methods: ["GET", "POST"],
    },
    transports: ["websocket", "polling"],
  });

  io.use(async (socket, next) => {
    try {
      const headers = socket.request.headers as Record<
        string,
        string | string[] | undefined
      >;
      const session = await auth.api.getSession({
        headers: fromNodeHeaders(headers),
      });

      if (!session?.user) {
        return next(new Error("UNAUTHORIZED"));
      }

      socket.data.userId = session.user.id;
      socket.data.userRole = (session.user as Record<string, unknown>).role as string ?? "couple";
      socket.data.userName = session.user.name;
      next();
    } catch {
      next(new Error("UNAUTHORIZED"));
    }
  });

  io.on("connection", (socket) => {
    const { userId } = socket.data;

    socket.join(`user:${userId}`);

    registerNotificationHandlers(io, socket);
    registerChatHandlers(io, socket);
    registerPresenceHandlers(io, socket);
  });

  return io;
}
