/**
 * @fileoverview Socket.IO client singleton for real-time communication.
 * 
 * This module provides a typed Socket.IO client that maintains a single
 * connection throughout the application lifecycle. It supports real-time
 * features like notifications, chat messages, and live updates.
 * 
 * @module lib/socket-client
 */
import { io, Socket } from "socket.io-client";
import type { ServerToClientEvents, ClientToServerEvents } from "@/types/realtime";

/**
 * Typed socket interface combining server-to-client and client-to-server events.
 * This ensures type safety when emitting or listening to socket events.
 */
export type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

/**
 * Singleton socket instance. Null until getSocket() is called.
 */
let socket: TypedSocket | null = null;

/**
 * Returns the singleton socket instance, creating it if necessary.
 * 
 * The socket is configured with:
 * - Credentials included for session cookie authentication
 * - WebSocket transport preferred, with polling fallback
 * - Auto-connect disabled for manual connection control
 * 
 * @returns The typed Socket.IO client instance
 */
export function getSocket(): TypedSocket {
  if (!socket) {
    const url =
      process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000";
    socket = io(url, {
      withCredentials: true,
      transports: ["websocket", "polling"],
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 15000,
      randomizationFactor: 0.5,
      timeout: 10000,
    });
  }
  return socket;
}

/**
 * Disconnects and clears the socket instance.
 * 
 * Should be called when the user logs out or the connection
 * needs to be fully reset. After calling this, getSocket()
 * will create a fresh connection.
 */
export function disconnectSocket(): void {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}