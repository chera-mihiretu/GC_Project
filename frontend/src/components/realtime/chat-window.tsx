"use client";

import { useEffect, useRef, useState, useCallback, memo } from "react";
import { useChat } from "@/hooks/use-chat";
import { FiSend, FiLoader, FiClock, FiAlertCircle } from "react-icons/fi";
import type { MessageStatus } from "@/types/realtime";
import PresenceDot from "./presence-dot";
import Image from "next/image";

interface ChatWindowProps {
  conversationId: string;
  currentUserId: string;
  contactName?: string;
  contactImage?: string | null;
  contactOnline?: boolean;
}

const MessageBubble = memo(function MessageBubble({
  content,
  createdAt,
  isMine,
  read,
  status,
  isNew,
  onRetry,
}: {
  content: string;
  createdAt: string;
  isMine: boolean;
  read: boolean;
  status?: MessageStatus;
  isNew: boolean;
  onRetry?: () => void;
}) {
  const isFailed = status === "failed";

  return (
    <div
      className={`flex ${isMine ? "justify-end" : "justify-start"} ${
        isNew
          ? isMine
            ? "animate-slide-in-right"
            : "animate-slide-in-left"
          : ""
      }`}
    >
      <div
        className={`max-w-[75%] px-3.5 py-2 rounded-2xl text-sm ${
          isMine
            ? isFailed
              ? "bg-rose-400/80 text-white rounded-br-md"
              : "bg-rose-500 text-white rounded-br-md"
            : "bg-gray-100 text-gray-800 rounded-bl-md"
        }`}
      >
        <p className="whitespace-pre-wrap wrap-break-word">{content}</p>
        <div
          className={`flex items-center gap-1.5 mt-1 ${
            isMine ? "justify-end" : ""
          }`}
        >
          <p
            className={`text-[10px] ${
              isMine ? "text-rose-200" : "text-gray-400"
            }`}
          >
            {new Date(createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
          {isMine && (
            <span className="text-[10px] flex items-center gap-0.5">
              {status === "sending" && (
                <FiClock className="w-2.5 h-2.5 text-rose-200/70" />
              )}
              {status === "failed" && (
                <button
                  onClick={onRetry}
                  className="flex items-center gap-0.5 text-white/90 hover:text-white cursor-pointer"
                  title="Tap to retry"
                >
                  <FiAlertCircle className="w-2.5 h-2.5" />
                  <span className="text-[9px]">Retry</span>
                </button>
              )}
              {(status === "sent" || !status) && (
                <span className={read ? "text-rose-200" : "text-rose-300/50"}>
                  {read ? "✓✓" : "✓"}
                </span>
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
});

export default function ChatWindow({
  conversationId,
  currentUserId,
  contactName,
  contactImage,
  contactOnline = false,
}: ChatWindowProps) {
  const {
    messages,
    typingUsers,
    fetchMessages,
    fetchOlderMessages,
    hasOlderMessages,
    loadingOlder,
    sendMessage,
    retryMessage,
    sendTyping,
    markRead,
  } = useChat(conversationId);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const knownIdsRef = useRef<Set<string>>(new Set());
  const initialLoadDoneRef = useRef(false);

  useEffect(() => {
    initialLoadDoneRef.current = false;
    knownIdsRef.current = new Set();
    fetchMessages().then(() => {
      initialLoadDoneRef.current = true;
    });
    markRead();
  }, [fetchMessages, markRead]);

  useEffect(() => {
    if (initialLoadDoneRef.current) {
      messages.forEach((m) => knownIdsRef.current.add(m.id));
    }
  });

  const prevMessageCountRef = useRef(0);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    if (messages.length > prevMessageCountRef.current) {
      const newest = messages[messages.length - 1];
      if (newest && newest.senderId !== currentUserId && newest.status !== "sending") {
        markRead();
      }
    }
    prevMessageCountRef.current = messages.length;
  }, [messages, currentUserId, markRead]);

  const handleInputChange = useCallback(
    (value: string) => {
      setInput(value);
      sendTyping(true);
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => sendTyping(false), 2000);
    },
    [sendTyping],
  );

  const handleSend = useCallback(() => {
    if (!input.trim()) return;
    sendMessage(input.trim(), currentUserId);
    setInput("");
    sendTyping(false);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
  }, [input, sendMessage, currentUserId, sendTyping]);

  return (
    <div className="flex flex-col h-full">
      {contactName && (
        <div className="px-4 py-3 border-b border-gray-200/80 flex items-center gap-3 bg-white shrink-0">
          <div className="relative shrink-0">
            {contactImage ? (
              <Image
                src={contactImage}
                alt={contactName}
                width={36}
                height={36}
                className="w-9 h-9 rounded-full object-cover"
                unoptimized
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-linear-to-br from-slate-200 to-slate-300 flex items-center justify-center text-sm font-semibold text-slate-600">
                {contactName.charAt(0).toUpperCase()}
              </div>
            )}
            <PresenceDot
              online={contactOnline}
              className="absolute -bottom-0.5 -right-0.5"
            />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">
              {contactName}
            </p>
            <p className="text-[11px] text-gray-400">
              {contactOnline ? "Online" : "Offline"}
            </p>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {hasOlderMessages && (
          <div className="flex justify-center pb-2">
            <button
              onClick={() => fetchOlderMessages()}
              disabled={loadingOlder}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-500 bg-gray-100 rounded-full hover:bg-gray-200 disabled:opacity-50 transition-colors cursor-pointer"
            >
              {loadingOlder ? <FiLoader className="w-3 h-3 animate-spin" /> : null}
              {loadingOlder ? "Loading..." : "Load older messages"}
            </button>
          </div>
        )}
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-sm text-gray-400">
            No messages yet — start the conversation!
          </div>
        )}
        {messages.map((msg) => {
          const isNew =
            initialLoadDoneRef.current && !knownIdsRef.current.has(msg.id);
          return (
            <MessageBubble
              key={msg.tempId ?? msg.id}
              content={msg.content}
              createdAt={msg.createdAt}
              isMine={msg.senderId === currentUserId}
              read={msg.read}
              status={msg.status}
              isNew={isNew}
              onRetry={
                msg.tempId ? () => retryMessage(msg.tempId!) : undefined
              }
            />
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {typingUsers.length > 0 && (
        <div className="px-4 py-1.5 text-xs text-gray-400 italic shrink-0 animate-fade-in">
          {contactName ?? "Someone"} is typing…
        </div>
      )}

      <div className="border-t border-gray-200 p-3 flex gap-2 shrink-0">
        <input
          type="text"
          value={input}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Type a message..."
          className="flex-1 px-4 py-2.5 bg-gray-50 rounded-full text-sm outline-none focus:ring-2 focus:ring-rose-500/30 transition-shadow"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim()}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-rose-500 text-white hover:bg-rose-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          <FiSend className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
