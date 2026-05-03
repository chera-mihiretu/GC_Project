"use client";

import { createContext, useContext, useEffect, useMemo } from "react";
import { useSocket } from "@/hooks/use-socket";
import { useNotifications } from "@/hooks/use-notifications";
import type { TypedSocket } from "@/lib/socket-client";
import type { Notification } from "@/types/realtime";

interface SocketContextValue {
  socket: TypedSocket | null;
  connected: boolean;
  notifications: Notification[];
  unreadCount: number;
  hasMoreNotifications: boolean;
  loadingMoreNotifications: boolean;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  fetchMoreNotifications: () => void;
}

const SocketContext = createContext<SocketContextValue | null>(null);

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

export function useSocketContext() {
  const ctx = useContext(SocketContext);
  if (!ctx) {
    throw new Error("useSocketContext must be used inside <SocketProvider>");
  }
  return ctx;
}
