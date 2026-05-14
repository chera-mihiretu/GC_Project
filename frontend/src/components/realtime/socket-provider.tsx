/**
 * @fileoverview Socket.IO React context provider for real-time features.
 * 
 * This module provides a React context that manages the socket connection
 * lifecycle and notification state. It centralizes real-time functionality
 * making it accessible throughout the component tree.
 * 
 * @module components/realtime/socket-provider
 */
"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";
import { useSocket } from "@/hooks/use-socket";
import { useNotifications } from "@/hooks/use-notifications";
import type { TypedSocket } from "@/lib/socket-client";
import type { Notification, PresencePayload } from "@/types/realtime";

/**
 * Shape of the socket context value.
 * Provides access to socket instance, connection state, and notification features.
 */
interface SocketContextValue {
  /** The Socket.IO client instance, null if not initialized */
  socket: TypedSocket | null;
  /** Whether the socket is currently connected to the server */
  connected: boolean;
  reconnecting: boolean;
  /** Array of user's notifications */
  notifications: Notification[];
  /** Count of unread notifications */
  unreadCount: number;
  /** Whether there are more notifications to load */
  hasMoreNotifications: boolean;
  /** Whether notifications are currently being fetched */
  loadingMoreNotifications: boolean;
  /** Marks a specific notification as read */
  markNotificationRead: (id: string) => void;
  /** Marks all notifications as read */
  markAllNotificationsRead: () => void;
  /** Loads the next page of notifications */
  fetchMoreNotifications: () => void;
  onlineUsers: Set<string>;
  isUserOnline: (userId: string) => boolean;
}

/**
 * React context for socket and notification state.
 * Initialized as null; provider must be mounted before use.
 */
const SocketContext = createContext<SocketContextValue | null>(null);

/**
 * Provider component that manages socket connection and notifications.
 * 
 * Should be mounted high in the component tree to make real-time
 * features available throughout the app. Automatically fetches
 * notifications when the socket connects.
 * 
 * @param props - Component props with children
 * @returns Provider component wrapping children
 */
export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { socket, connected, reconnecting } = useSocket();
  const {
    notifications,
    unreadCount,
    hasMore,
    loadingMore,
    fetchNotifications,
    fetchMoreNotifications,
    markRead,
    markAllRead,
  } = useNotifications();
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (connected) {
      fetchNotifications();
    }
  }, [connected, fetchNotifications]);

  useEffect(() => {
    if (!socket) return;

    function onSnapshot(userIds: string[]) {
      setOnlineUsers(new Set(userIds));
    }

    function onPresenceUpdate(data: PresencePayload) {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        if (data.online) next.add(data.userId);
        else next.delete(data.userId);
        return next;
      });
    }

    socket.on("presence:snapshot", onSnapshot);
    socket.on("presence:update", onPresenceUpdate);

    return () => {
      socket.off("presence:snapshot", onSnapshot);
      socket.off("presence:update", onPresenceUpdate);
    };
  }, [socket]);

  const isUserOnline = useCallback(
    (userId: string) => onlineUsers.has(userId),
    [onlineUsers],
  );

  const value = useMemo(
    () => ({
      socket,
      connected,
      reconnecting,
      notifications,
      unreadCount,
      hasMoreNotifications: hasMore,
      loadingMoreNotifications: loadingMore,
      markNotificationRead: markRead,
      markAllNotificationsRead: markAllRead,
      fetchMoreNotifications,
      onlineUsers,
      isUserOnline,
    }),
    [socket, connected, reconnecting, notifications, unreadCount, hasMore, loadingMore, markRead, markAllRead, fetchMoreNotifications, onlineUsers, isUserOnline],
  );

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
}

/**
 * Hook to access the socket context.
 * 
 * Provides access to socket connection state and notification
 * management functions. Must be called within a SocketProvider.
 * 
 * @returns The socket context value
 * @throws Error if used outside of SocketProvider
 */
export function useSocketContext() {
  const ctx = useContext(SocketContext);
  if (!ctx) {
    throw new Error("useSocketContext must be used inside <SocketProvider>");
  }
  return ctx;
}