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
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
}

const SocketContext = createContext<SocketContextValue | null>(null);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { socket, connected } = useSocket();
  const {
    notifications,
    unreadCount,
    fetchNotifications,
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
      markNotificationRead: markRead,
      markAllNotificationsRead: markAllRead,
    }),
    [socket, connected, notifications, unreadCount, markRead, markAllRead],
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
