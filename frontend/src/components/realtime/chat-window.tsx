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
        isNew ? (isMine ? "animate-slide-in-right" : "animate-slide-in-left") : ""
      }`}
    >
      <div
        className={`max-w-[75%] px-4 py-2.5 text-[13px] leading-relaxed ${
          isMine
            ? isFailed
              ? "bg-red-400/90 text-white rounded-2xl rounded-br-md"
              : "bg-slate-900 text-white rounded-2xl rounded-br-md"
            : "bg-warm-50 border border-warm-200/30 text-slate-800 rounded-2xl rounded-bl-md"
        }`}
      >
        <p className="whitespace-pre-wrap wrap-break-word">{content}</p>
        <div className={`flex items-center gap-1.5 mt-1 ${isMine ? "justify-end" : ""}`}>
          <p className={`text-[10px] ${isMine ? "text-white/40" : "text-slate-300"}`}>
            {new Date(createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </p>
          {isMine && (
            <span className="text-[10px] flex items-center gap-0.5">
              {status === "sending" && (
                <FiClock className="w-2.5 h-2.5 text-white/30" />
              )}
              {status === "failed" && (
                <button
                  onClick={onRetry}
                  className="flex items-center gap-0.5 text-white/80 hover:text-white cursor-pointer"
                  title="Tap to retry"
                >
                  <FiAlertCircle className="w-2.5 h-2.5" />
                  <span className="text-[9px]">Retry</span>
                </button>
              )}
              {(status === "sent" || !status) && (
                <span className={read ? "text-white/50" : "text-white/20"}>
                  {read ? "\u2713\u2713" : "\u2713"}
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
      {/* Contact header */}
      {contactName && (
        <div className="px-5 py-3.5 border-b border-warm-200/20 flex items-center gap-3.5 bg-white shrink-0">
          <div className="relative shrink-0">
            {contactImage ? (
              <Image
                src={contactImage}
                alt={contactName}
                width={36}
                height={36}
                className="w-9 h-9 rounded-xl object-cover"
                unoptimized
              />
            ) : (
              <div className="w-9 h-9 rounded-xl bg-warm-100 border border-warm-200/30 flex items-center justify-center text-[12px] font-semibold text-slate-400">
                {contactName.charAt(0).toUpperCase()}
              </div>
            )}
            <PresenceDot online={contactOnline} className="absolute -bottom-0.5 -right-0.5" />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-slate-900">{contactName}</p>
            <p className="text-[10px] text-slate-300 font-light">
              {contactOnline ? "Online" : "Offline"}
            </p>
          </div>
        </div>
      )}

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-warm-50/20">
        {hasOlderMessages && (
          <div className="flex justify-center pb-2">
            <button
              onClick={() => fetchOlderMessages()}
              disabled={loadingOlder}
              className="flex items-center gap-1.5 px-4 py-2 text-[11px] font-medium text-slate-400 bg-white border border-warm-200/30 rounded-xl hover:bg-warm-50 disabled:opacity-50 transition-all duration-500 cursor-pointer"
            >
              {loadingOlder ? <FiLoader className="w-3 h-3 animate-spin" /> : null}
              {loadingOlder ? "Loading..." : "Load older messages"}
            </button>
          </div>
        )}
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className="text-[13px] text-slate-300 font-light">
              No messages yet — start the conversation!
            </p>
          </div>
        )}
        {messages.map((msg) => {
          const isNew = initialLoadDoneRef.current && !knownIdsRef.current.has(msg.id);
          return (
            <MessageBubble
              key={msg.tempId ?? msg.id}
              content={msg.content}
              createdAt={msg.createdAt}
              isMine={msg.senderId === currentUserId}
              read={msg.read}
              status={msg.status}
              isNew={isNew}
              onRetry={msg.tempId ? () => retryMessage(msg.tempId!) : undefined}
            />
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Typing indicator */}
      {typingUsers.length > 0 && (
        <div className="px-5 py-1.5 text-[11px] text-slate-300 italic font-light shrink-0 animate-fade-in">
          {contactName ?? "Someone"} is typing\u2026
        </div>
      )}

      {/* Input bar */}
      <div className="border-t border-warm-200/20 p-3.5 flex gap-2.5 shrink-0 bg-white">
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
          className="flex-1 px-4 py-2.5 rounded-xl bg-warm-50/60 border border-warm-200/40 text-[13px] text-slate-800 placeholder:text-slate-300 outline-none transition-all duration-500 focus:border-gold-400/50 focus:ring-2 focus:ring-gold-400/10"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim()}
          className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-500 cursor-pointer"
        >
          <FiSend className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
