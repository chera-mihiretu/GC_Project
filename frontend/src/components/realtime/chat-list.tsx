"use client";

import { useEffect, useCallback } from "react";
import { useConversations } from "@/hooks/use-chat";
import type { Conversation, ChatMessage } from "@/types/realtime";
import { useSocketContext } from "./socket-provider";
import PresenceDot from "./presence-dot";
import Image from "next/image";
import { FiLoader } from "react-icons/fi";

interface ChatListProps {
  currentUserId: string;
  selectedId: string | null;
  onSelect: (conversation: Conversation) => void;
  onlineUsers: Set<string>;
}

function getOtherParticipant(conv: Conversation, currentUserId: string) {
  const isP1 = conv.participantOne === currentUserId;
  return {
    id: isP1 ? conv.participantTwo : conv.participantOne,
    name: isP1
      ? conv.participantTwoName ?? conv.participantTwo
      : conv.participantOneName ?? conv.participantOne,
    image: isP1 ? conv.participantTwoImage : conv.participantOneImage,
  };
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays === 0) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) {
    return d.toLocaleDateString([], { weekday: "short" });
  }
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

export default function ChatList({
  currentUserId,
  selectedId,
  onSelect,
  onlineUsers,
}: ChatListProps) {
  const {
    conversations,
    loading,
    loadingMore,
    hasMoreConversations,
    fetchConversations,
    fetchMoreConversations,
    updateConversationFromMessage,
    clearUnread,
  } = useConversations();
  const { socket } = useSocketContext();

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const handleNewMessage = useCallback(
    (msg: ChatMessage) => {
      const exists = conversations.some((c) => c.id === msg.conversationId);
      if (exists) {
        updateConversationFromMessage(msg, currentUserId, selectedId);
      } else {
        fetchConversations();
      }
    },
    [conversations, currentUserId, selectedId, updateConversationFromMessage, fetchConversations],
  );

  const handleReadReceipt = useCallback(
    (data: { conversationId: string; readBy: string }) => {
      if (data.readBy === currentUserId) {
        clearUnread(data.conversationId);
      }
    },
    [currentUserId, clearUnread],
  );

  useEffect(() => {
    if (selectedId) {
      clearUnread(selectedId);
    }
  }, [selectedId, clearUnread]);

  useEffect(() => {
    if (!socket) return;

    socket.on("chat:message", handleNewMessage);
    socket.on("chat:read", handleReadReceipt);
    return () => {
      socket.off("chat:message", handleNewMessage);
      socket.off("chat:read", handleReadReceipt);
    };
  }, [socket, handleNewMessage, handleReadReceipt]);

  if (loading) {
    return (
      <div className="p-5 space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3.5 animate-pulse">
            <div className="w-10 h-10 rounded-xl bg-warm-100 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 bg-warm-100 rounded w-24" />
              <div className="h-3 bg-warm-100 rounded w-36" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-[13px] text-slate-400 font-light">No conversations yet</p>
        <p className="text-[11px] text-slate-300 font-light mt-1">
          Start a chat from a vendor&apos;s profile
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-warm-200/15">
      {conversations.map((conv) => {
        const other = getOtherParticipant(conv, currentUserId);
        const isSelected = conv.id === selectedId;
        const isOnline = onlineUsers.has(other.id);
        const unread = conv.unreadCount ?? 0;

        return (
          <button
            key={conv.id}
            onClick={() => onSelect(conv)}
            className={`w-full flex items-center gap-3.5 px-5 py-3.5 text-left transition-all duration-300 cursor-pointer ${
              isSelected
                ? "bg-warm-50/60"
                : "hover:bg-warm-50/30"
            }`}
          >
            <div className="relative shrink-0">
              {other.image ? (
                <Image
                  src={other.image}
                  alt={other.name}
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded-xl object-cover"
                  unoptimized
                />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-warm-100 border border-warm-200/30 flex items-center justify-center text-[13px] font-semibold text-slate-400">
                  {other.name.charAt(0).toUpperCase()}
                </div>
              )}
              <PresenceDot
                online={isOnline}
                className="absolute -bottom-0.5 -right-0.5"
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className={`text-[13px] truncate ${unread > 0 ? "font-semibold text-slate-900" : "font-medium text-slate-700"}`}>
                  {other.name}
                </p>
                <span className="text-[10px] text-slate-300 font-light shrink-0">
                  {formatTime(conv.lastMessageAt)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 mt-0.5">
                <p className={`text-[11px] truncate ${unread > 0 ? "text-slate-500" : "text-slate-400 font-light"}`}>
                  {conv.lastMessageContent ?? "No messages yet"}
                </p>
                {unread > 0 && (
                  <span className="shrink-0 w-5 h-5 rounded-lg bg-gold-400 text-white text-[10px] font-bold flex items-center justify-center">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </div>
            </div>
          </button>
        );
      })}
      {hasMoreConversations && (
        <div className="p-4 flex justify-center">
          <button
            onClick={fetchMoreConversations}
            disabled={loadingMore}
            className="flex items-center gap-1.5 px-4 py-2 text-[11px] font-medium text-slate-400 bg-warm-50 border border-warm-200/30 rounded-xl hover:bg-warm-100/60 disabled:opacity-50 transition-all duration-500 cursor-pointer"
          >
            {loadingMore ? <FiLoader className="w-3 h-3 animate-spin" /> : null}
            {loadingMore ? "Loading..." : "Load more"}
          </button>
        </div>
      )}
    </div>
  );
}
