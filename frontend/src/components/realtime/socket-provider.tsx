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

import { createContext, useContext, useEffect, useMemo } from "react";
import { useSocket } from "@/hooks/use-socket";
import { useNotifications } from "@/hooks/use-notifications";
import type { TypedSocket } from "@/lib/socket-client";
import type { Notification } from "@/types/realtime";

/**
 * Shape of the socket context value.
 * Provides access to socket instance, connection state, and notification features.
 */
interface SocketContextValue {
  /** The Socket.IO client instance, null if not initialized */
  socket: TypedSocket | null;
  /** Whether the socket is currently connected to the server */
  connected: boolean;
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
  const { socket, connected } = useSocket();
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

  useEffect(() => {
    if (connected) {
      fetchNotifications();
    }
  }, [connected, fetchNotifications]);

  const value = useMemo(
    () => ({
      socket,
      connected,
      notifications,
      unreadCount,
      hasMoreNotifications: hasMore,
      loadingMoreNotifications: loadingMore,
      markNotificationRead: markRead,
      markAllNotificationsRead: markAllRead,
      fetchMoreNotifications,
    }),
    [socket, connected, notifications, unreadCount, hasMore, loadingMore, markRead, markAllRead, fetchMoreNotifications],
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