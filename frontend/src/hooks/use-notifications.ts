"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { getSocket, type TypedSocket } from "@/lib/socket-client";
import { apiFetch } from "@/services/auth.service";
import type { Notification } from "@/types/realtime";

const NOTIFICATIONS_PAGE_SIZE = 20;

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
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
      const res = await apiFetch(
        `/api/v1/notifications?limit=${NOTIFICATIONS_PAGE_SIZE}&offset=0`,
      );
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
        setHasMore(data.notifications.length >= NOTIFICATIONS_PAGE_SIZE);
      }
    } catch {
      // Network error — leave current state
    }
  }, []);

  const fetchMoreNotifications = useCallback(async () => {
    setLoadingMore(true);
    try {
      const res = await apiFetch(
        `/api/v1/notifications?limit=${NOTIFICATIONS_PAGE_SIZE}&offset=${notifications.length}`,
      );
      if (res.ok) {
        const data = await res.json();
        const fetched = data.notifications as Notification[];
        setNotifications((prev) => [...prev, ...fetched]);
        setHasMore(fetched.length >= NOTIFICATIONS_PAGE_SIZE);
      }
    } catch {
      // Network error
    } finally {
      setLoadingMore(false);
    }
  }, [notifications.length]);

  const markRead = useCallback((id: string) => {
    socketRef.current?.emit("notification:mark-read", { id });
  }, []);

  const markAllRead = useCallback(() => {
    socketRef.current?.emit("notification:mark-read", { all: true });
  }, []);

  return {
    notifications,
    unreadCount,
    hasMore,
    loadingMore,
    fetchNotifications,
    fetchMoreNotifications,
    markRead,
    markAllRead,
  };
}
