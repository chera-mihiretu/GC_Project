"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { getSocket, type TypedSocket } from "@/lib/socket-client";
import { apiFetch } from "@/services/auth.service";
import type { Notification } from "@/types/realtime";

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const socketRef = useRef<TypedSocket | null>(null);

  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;

    function onNewNotification(notification: Notification) {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);
    }

    function onNotificationRead(data: { id: string } | { all: true }) {
      if ("all" in data) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);
      } else {
        setNotifications((prev) =>
          prev.map((n) => (n.id === data.id ? { ...n, read: true } : n)),
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    }

    socket.on("notification:new", onNewNotification);
    socket.on("notification:read", onNotificationRead);

    return () => {
      socket.off("notification:new", onNewNotification);
      socket.off("notification:read", onNotificationRead);
    };
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await apiFetch("/api/v1/notifications?limit=20&offset=0");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch {
      // Network error — leave current state
    }
  }, []);

  const markRead = useCallback((id: string) => {
    socketRef.current?.emit("notification:mark-read", { id });
  }, []);

  const markAllRead = useCallback(() => {
    socketRef.current?.emit("notification:mark-read", { all: true });
  }, []);

  return {
    notifications,
    unreadCount,
    fetchNotifications,
    markRead,
    markAllRead,
  };
}
