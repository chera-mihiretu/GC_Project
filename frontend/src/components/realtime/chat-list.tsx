"use client";

import { useEffect } from "react";
import { useConversations } from "@/hooks/use-chat";
import type { Conversation } from "@/types/realtime";
import PresenceDot from "./presence-dot";

interface ChatListProps {
  currentUserId: string;
  selectedId: string | null;
  onSelect: (conversation: Conversation) => void;
  onlineUsers: Set<string>;
}

function getOtherParticipant(
  conv: Conversation,
  currentUserId: string,
): string {
  return conv.participantOne === currentUserId
    ? conv.participantTwo
    : conv.participantOne;
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
  const { conversations, loading, fetchConversations } = useConversations();

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  if (loading) {
    return (
      <div className="p-4 text-center text-sm text-gray-400">
        Loading conversations...
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="p-6 text-center text-sm text-gray-400">
        No conversations yet
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {conversations.map((conv) => {
        const otherId = getOtherParticipant(conv, currentUserId);
        const isSelected = conv.id === selectedId;
        const isOnline = onlineUsers.has(otherId);

        return (
          <button
            key={conv.id}
            onClick={() => onSelect(conv)}
            className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
              isSelected
                ? "bg-rose-50/60"
                : "hover:bg-gray-50"
            }`}
          >
            <div className="relative flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-sm font-semibold text-slate-600">
                {otherId.charAt(0).toUpperCase()}
              </div>
              <PresenceDot
                online={isOnline}
                className="absolute -bottom-0.5 -right-0.5"
              />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {otherId}
              </p>
              <p className="text-xs text-gray-400">
                {formatTime(conv.lastMessageAt)}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
