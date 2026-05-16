"use client";

import { useEffect, useCallback } from "react";
import { useConversations } from "@/hooks/use-chat";
import type { Conversation, ChatMessage } from "@/types/realtime";
import { useSocketContext } from "./socket-provider";
import PresenceDot from "./presence-dot";
import Image from "next/image";
import { FiMessageSquare } from "react-icons/fi";

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

  if (diffDays === 0) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: "short" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

export default function ChatList({ currentUserId, selectedId, onSelect, onlineUsers }: ChatListProps) {
  const {
    conversations, loading, loadingMore, hasMoreConversations,
    fetchConversations, fetchMoreConversations, updateConversationFromMessage, clearUnread,
  } = useConversations();
  const { socket } = useSocketContext();

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  const handleNewMessage = useCallback(
    (msg: ChatMessage) => {
      const exists = conversations.some((c) => c.id === msg.conversationId);
      if (exists) updateConversationFromMessage(msg, currentUserId, selectedId);
      else fetchConversations();
    },
    [conversations, currentUserId, selectedId, updateConversationFromMessage, fetchConversations],
  );

  const handleReadReceipt = useCallback(
    (data: { conversationId: string; readBy: string }) => {
      if (data.readBy === currentUserId) clearUnread(data.conversationId);
    },
    [currentUserId, clearUnread],
  );

  useEffect(() => { if (selectedId) clearUnread(selectedId); }, [selectedId, clearUnread]);

  useEffect(() => {
    if (!socket) return;
    socket.on("chat:message", handleNewMessage);
    socket.on("chat:read", handleReadReceipt);
    return () => { socket.off("chat:message", handleNewMessage); socket.off("chat:read", handleReadReceipt); };
  }, [socket, handleNewMessage, handleReadReceipt]);

  if (loading) {
    return (
      <div className="p-4 space-y-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
            <div className="w-11 h-11 rounded-xl bg-warm-100/50" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 bg-warm-100/50 rounded-lg w-24" />
              <div className="h-3 bg-warm-100/30 rounded-lg w-36" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="p-10 text-center">
        <div className="w-11 h-11 rounded-xl bg-warm-50 border border-warm-200/30 flex items-center justify-center mx-auto mb-3">
          <FiMessageSquare className="w-4.5 h-4.5 text-slate-300" />
        </div>
        <p className="text-[12px] text-slate-400 font-light">No conversations yet</p>
        <p className="text-[11px] text-slate-300 font-light mt-1">Start a chat from a vendor&apos;s profile</p>
      </div>
    );
  }

  return (
    <div className="p-2 space-y-0.5">
      {conversations.map((conv) => {
        const other = getOtherParticipant(conv, currentUserId);
        const isSelected = conv.id === selectedId;
        const isOnline = onlineUsers.has(other.id);
        const unread = conv.unreadCount ?? 0;

        return (
          <button
            key={conv.id}
            onClick={() => onSelect(conv)}
            className={`cursor-pointer w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-left transition-all duration-500 ${
              isSelected
                ? "bg-warm-50/80 border border-warm-200/30 shadow-[0_2px_8px_rgba(15,23,42,0.02)]"
                : "hover:bg-warm-50/40 border border-transparent"
            }`}
          >
            <div className="relative shrink-0">
              {other.image ? (
                <Image
                  src={other.image}
                  alt={other.name}
                  width={44}
                  height={44}
                  className="w-11 h-11 rounded-xl object-cover"
                  unoptimized
                />
              ) : (
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-[14px] font-semibold ${
                  isSelected
                    ? "bg-slate-900 text-white"
                    : "bg-gradient-to-br from-warm-100 to-warm-50 border border-warm-200/30 text-slate-400"
                }`}>
                  {other.name.charAt(0).toUpperCase()}
                </div>
              )}
              <PresenceDot online={isOnline} className="absolute -bottom-0.5 -right-0.5" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className={`text-[13px] truncate ${unread > 0 ? "font-semibold text-slate-900" : "font-medium text-slate-700"}`}>
                  {other.name}
                </p>
                <span className="text-[10px] text-slate-300 font-light shrink-0">{formatTime(conv.lastMessageAt)}</span>
              </div>
              <div className="flex items-center justify-between gap-2 mt-0.5">
                <p className={`text-[11px] truncate ${unread > 0 ? "text-slate-600" : "text-slate-400 font-light"}`}>
                  {conv.lastMessageContent ?? "No messages yet"}
                </p>
                {unread > 0 && (
                  <span className="shrink-0 min-w-[20px] h-5 px-1.5 rounded-lg bg-gold-400 text-white text-[10px] font-bold flex items-center justify-center">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </div>
            </div>
          </button>
        );
      })}
      {hasMoreConversations && (
        <div className="p-3 flex justify-center">
          <button
            onClick={fetchMoreConversations}
            disabled={loadingMore}
            className="cursor-pointer flex items-center gap-1.5 px-5 py-2.5 text-[11px] font-medium text-slate-400 border border-warm-200/30 rounded-full hover:bg-warm-50 disabled:opacity-40 transition-all duration-500"
          >
            {loadingMore && <span className="w-3 h-3 border-2 border-warm-200/40 border-t-slate-400 rounded-full animate-spin" />}
            {loadingMore ? "Loading..." : "Load more"}
          </button>
        </div>
      )}
    </div>
  );
}
