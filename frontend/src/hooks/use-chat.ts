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

export function useChat(conversationId: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const socketRef = useRef<TypedSocket | null>(null);

  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;

    if (!conversationId) return;

    socket.emit("chat:join", { conversationId });

    function onMessage(message: ChatMessage) {
      if (message.conversationId === conversationId) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === message.id)) return prev;
          return [...prev, message];
        });
      }
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
      socket.off("chat:message", onMessage);
      socket.off("chat:typing", onTyping);
      socket.off("chat:read", onReadReceipt);
      socket.emit("chat:leave", { conversationId });
    };
  }, [conversationId]);

  const fetchMessages = useCallback(
    async (limit = 50, offset = 0) => {
      if (!conversationId) return;
      try {
        const res = await apiFetch(
          `/api/v1/conversations/${conversationId}/messages?limit=${limit}&offset=${offset}`,
        );
        if (res.ok) {
          const data = await res.json();
          setMessages(data.messages.reverse());
        }
      } catch {
        // Network error
      }
    },
    [conversationId],
  );

  const sendMessage = useCallback(
    (content: string) => {
      if (!conversationId || !content.trim()) return;
      socketRef.current?.emit("chat:send", { conversationId, content });
    },
    [conversationId],
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
    sendMessage,
    sendTyping,
    markRead,
  };
}

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const hasFetchedRef = useRef(false);

  const fetchConversations = useCallback(async () => {
    if (!hasFetchedRef.current) {
      setInitialLoading(true);
    }
    try {
      const res = await apiFetch("/api/v1/conversations");
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations);
      }
    } catch {
      // Network error
    } finally {
      hasFetchedRef.current = true;
      setInitialLoading(false);
    }
  }, []);

  const updateConversationFromMessage = useCallback(
    (msg: ChatMessage, currentUserId: string) => {
      setConversations((prev) => {
        const idx = prev.findIndex((c) => c.id === msg.conversationId);
        if (idx === -1) return prev;

        const updated = { ...prev[idx] };
        updated.lastMessageContent = msg.content;
        updated.lastMessageAt = msg.createdAt;
        if (msg.senderId !== currentUserId) {
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
    fetchConversations,
    updateConversationFromMessage,
    clearUnread,
  };
}
