"use client";

import { useEffect, useCallback } from "react";
import { useConversations } from "@/hooks/use-chat";
import type { Conversation, ChatMessage } from "@/types/realtime";
import { useSocketContext } from "./socket-provider";
import PresenceDot from "./presence-dot";
import Image from "next/image";

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
    fetchConversations,
    updateConversationFromMessage,
  } = useConversations();
  const { socket } = useSocketContext();

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const handleNewMessage = useCallback(
    (msg: ChatMessage) => {
      const exists = conversations.some((c) => c.id === msg.conversationId);
      if (exists) {
        updateConversationFromMessage(msg, currentUserId);
      } else {
        fetchConversations();
      }
    },
    [conversations, currentUserId, updateConversationFromMessage, fetchConversations],
  );

  useEffect(() => {
    if (!socket) return;

    socket.on("chat:message", handleNewMessage);
    return () => {
      socket.off("chat:message", handleNewMessage);
    };
  }, [socket, handleNewMessage]);

  if (loading) {
    return (
      <div className="p-4 space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 animate-pulse">
            <div className="w-10 h-10 rounded-full bg-gray-100" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 bg-gray-100 rounded w-24" />
              <div className="h-3 bg-gray-100 rounded w-36" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm text-gray-400">No conversations yet</p>
        <p className="text-xs text-gray-300 mt-1">
          Start a chat from a vendor&apos;s profile
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {conversations.map((conv) => {
        const other = getOtherParticipant(conv, currentUserId);
        const isSelected = conv.id === selectedId;
        const isOnline = onlineUsers.has(other.id);
        const unread = conv.unreadCount ?? 0;

        return (
          <button
            key={conv.id}
            onClick={() => onSelect(conv)}
            className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
              isSelected ? "bg-rose-50/60" : "hover:bg-gray-50"
            }`}
          >
            <div className="relative flex-shrink-0">
              {other.image ? (
                <Image
                  src={other.image}
                  alt={other.name}
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded-full object-cover"
                  unoptimized
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-sm font-semibold text-slate-600">
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
                <p
                  className={`text-sm truncate ${
                    unread > 0
                      ? "font-semibold text-gray-900"
                      : "font-medium text-gray-700"
                  }`}
                >
                  {other.name}
                </p>
                <span className="text-[10px] text-gray-400 flex-shrink-0">
                  {formatTime(conv.lastMessageAt)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 mt-0.5">
                <p
                  className={`text-xs truncate ${
                    unread > 0 ? "text-gray-600" : "text-gray-400"
                  }`}
                >
                  {conv.lastMessageContent ?? "No messages yet"}
                </p>
                {unread > 0 && (
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
