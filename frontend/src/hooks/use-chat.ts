"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { getSocket, type TypedSocket } from "@/lib/socket-client";
import { apiFetch } from "@/services/auth.service";
import type {
  ChatMessage,
  Conversation,
  TypingPayload,
  ReadReceiptPayload,
} from "@/types/realtime";

const ACK_TIMEOUT_MS = 5000;

export function useChat(conversationId: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const socketRef = useRef<TypedSocket | null>(null);
  const confirmedIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;

    if (!conversationId) return;

    if (socket.connected) {
      socket.emit("chat:join", { conversationId });
    }
    function onReconnect() {
      if (conversationId) socket.emit("chat:join", { conversationId });
    }
    socket.on("connect", onReconnect);

    function onMessage(message: ChatMessage) {
      if (message.conversationId !== conversationId) return;

      if (confirmedIdsRef.current.has(message.id)) {
        confirmedIdsRef.current.delete(message.id);
        return;
      }

      setMessages((prev) => {
        if (prev.some((m) => m.id === message.id)) return prev;
        const pendingTemp = prev.find(
          (m) => m.tempId && m.status === "sending" && m.senderId === message.senderId,
        );
        if (pendingTemp) {
          confirmedIdsRef.current.add(message.id);
          return prev.map((m) =>
            m.tempId === pendingTemp.tempId
              ? { ...message, status: "sent" as const, tempId: pendingTemp.tempId }
              : m,
          );
        }
        return [...prev, { ...message, status: "sent" as const }];
      });
    }

    function onTyping(data: TypingPayload) {
      if (data.conversationId === conversationId) {
        setTypingUsers((prev) => {
          const next = new Set(prev);
          if (data.typing) next.add(data.userId);
          else next.delete(data.userId);
          return next;
        });
      }
    }

    function onReadReceipt(data: ReadReceiptPayload) {
      if (data.conversationId === conversationId) {
        setMessages((prev) =>
          prev.map((m) =>
            m.senderId !== data.readBy && !m.read ? { ...m, read: true } : m,
          ),
        );
      }
    }

    socket.on("chat:message", onMessage);
    socket.on("chat:typing", onTyping);
    socket.on("chat:read", onReadReceipt);

    return () => {
      socket.off("connect", onReconnect);
      socket.off("chat:message", onMessage);
      socket.off("chat:typing", onTyping);
      socket.off("chat:read", onReadReceipt);
      if (socket.connected) {
        socket.emit("chat:leave", { conversationId });
      }
    };
  }, [conversationId]);

  const [hasOlderMessages, setHasOlderMessages] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);

  const fetchMessages = useCallback(
    async (limit = 50, offset = 0) => {
      if (!conversationId) return;
      try {
        const res = await apiFetch(
          `/api/v1/conversations/${conversationId}/messages?limit=${limit}&offset=${offset}`,
        );
        if (res.ok) {
          const data = await res.json();
          const fetched = (data.messages as ChatMessage[]).reverse();
          setMessages((prev) => {
            const pending = prev.filter((m) => m.status === "sending" || m.status === "failed");
            return [...fetched, ...pending];
          });
          setHasOlderMessages(fetched.length >= limit);
        }
      } catch {
        // Network error
      }
    },
    [conversationId],
  );

  const fetchOlderMessages = useCallback(
    async (limit = 50) => {
      if (!conversationId || loadingOlder) return;
      setLoadingOlder(true);
      try {
        const res = await apiFetch(
          `/api/v1/conversations/${conversationId}/messages?limit=${limit}&offset=${messages.filter((m) => !m.tempId).length}`,
        );
        if (res.ok) {
          const data = await res.json();
          const older = (data.messages as ChatMessage[]).reverse();
          if (older.length > 0) {
            setMessages((prev) => [...older, ...prev]);
          }
          setHasOlderMessages(older.length >= limit);
        }
      } catch {
        // Network error
      } finally {
        setLoadingOlder(false);
      }
    },
    [conversationId, messages, loadingOlder],
  );

  const emitWithAck = useCallback(
    (tempId: string, content: string) => {
      if (!conversationId) return;
      const socket = socketRef.current;
      if (!socket) return;

      const timeout = setTimeout(() => {
        setMessages((prev) =>
          prev.map((m) =>
            m.tempId === tempId ? { ...m, status: "failed" as const } : m,
          ),
        );
      }, ACK_TIMEOUT_MS);

      socket.emit(
        "chat:send",
        { conversationId, content },
        (serverMsg: ChatMessage | null) => {
          clearTimeout(timeout);
          if (serverMsg) {
            confirmedIdsRef.current.add(serverMsg.id);
            setMessages((prev) =>
              prev.map((m) =>
                m.tempId === tempId
                  ? { ...serverMsg, status: "sent" as const, tempId }
                  : m,
              ),
            );
          } else {
            setMessages((prev) =>
              prev.map((m) =>
                m.tempId === tempId ? { ...m, status: "failed" as const } : m,
              ),
            );
          }
        },
      );
    },
    [conversationId],
  );

  const sendMessage = useCallback(
    (content: string, currentUserId: string) => {
      if (!conversationId || !content.trim()) return;
      const tempId = crypto.randomUUID();
      const optimistic: ChatMessage = {
        id: tempId,
        conversationId,
        senderId: currentUserId,
        content: content.trim(),
        read: false,
        createdAt: new Date().toISOString(),
        status: "sending",
        tempId,
      };
      setMessages((prev) => [...prev, optimistic]);
      emitWithAck(tempId, content.trim());
    },
    [conversationId, emitWithAck],
  );

  const retryMessage = useCallback(
    (tempId: string) => {
      setMessages((prev) => {
        const msg = prev.find((m) => m.tempId === tempId);
        if (!msg || msg.status !== "failed") return prev;
        return prev.map((m) =>
          m.tempId === tempId ? { ...m, status: "sending" as const } : m,
        );
      });
      const msg = messages.find((m) => m.tempId === tempId);
      if (msg) {
        emitWithAck(tempId, msg.content);
      }
    },
    [messages, emitWithAck],
  );

  const sendTyping = useCallback(
    (typing: boolean) => {
      if (!conversationId) return;
      socketRef.current?.emit("chat:typing", { conversationId, typing });
    },
    [conversationId],
  );

  const markRead = useCallback(() => {
    if (!conversationId) return;
    socketRef.current?.emit("chat:mark-read", { conversationId });
  }, [conversationId]);

  const typingUsersList = useMemo(() => Array.from(typingUsers), [typingUsers]);

  return {
    messages,
    typingUsers: typingUsersList,
    fetchMessages,
    fetchOlderMessages,
    hasOlderMessages,
    loadingOlder,
    sendMessage,
    retryMessage,
    sendTyping,
    markRead,
  };
}

const CONVERSATIONS_PAGE_SIZE = 20;

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [total, setTotal] = useState(0);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const hasFetchedRef = useRef(false);

  const fetchConversations = useCallback(async () => {
    if (!hasFetchedRef.current) {
      setInitialLoading(true);
    }
    try {
      const res = await apiFetch(
        `/api/v1/conversations?limit=${CONVERSATIONS_PAGE_SIZE}&offset=0`,
      );
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations);
        setTotal(data.total ?? data.conversations.length);
      }
    } catch {
      // Network error
    } finally {
      hasFetchedRef.current = true;
      setInitialLoading(false);
    }
  }, []);

  const fetchMoreConversations = useCallback(async () => {
    setLoadingMore(true);
    try {
      const res = await apiFetch(
        `/api/v1/conversations?limit=${CONVERSATIONS_PAGE_SIZE}&offset=${conversations.length}`,
      );
      if (res.ok) {
        const data = await res.json();
        setConversations((prev) => [...prev, ...data.conversations]);
        setTotal(data.total ?? conversations.length + data.conversations.length);
      }
    } catch {
      // Network error
    } finally {
      setLoadingMore(false);
    }
  }, [conversations.length]);

  const hasMoreConversations = conversations.length < total;

  const updateConversationFromMessage = useCallback(
    (msg: ChatMessage, currentUserId: string, activeConversationId?: string | null) => {
      setConversations((prev) => {
        const idx = prev.findIndex((c) => c.id === msg.conversationId);
        if (idx === -1) return prev;

        const updated = { ...prev[idx] };
        updated.lastMessageContent = msg.content;
        updated.lastMessageAt = msg.createdAt;
        if (msg.senderId !== currentUserId && msg.conversationId !== activeConversationId) {
          updated.unreadCount = (updated.unreadCount ?? 0) + 1;
        }

        const next = [...prev];
        next.splice(idx, 1);
        return [updated, ...next];
      });
    },
    [],
  );

  const clearUnread = useCallback((conversationId: string) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === conversationId ? { ...c, unreadCount: 0 } : c,
      ),
    );
  }, []);

  return {
    conversations,
    loading: initialLoading,
    loadingMore,
    hasMoreConversations,
    fetchConversations,
    fetchMoreConversations,
    updateConversationFromMessage,
    clearUnread,
  };
}
