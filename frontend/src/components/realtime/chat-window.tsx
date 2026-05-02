"use client";

import { useEffect, useRef, useState, useCallback, memo } from "react";
import { useChat } from "@/hooks/use-chat";
import { FiSend } from "react-icons/fi";
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
}: {
  content: string;
  createdAt: string;
  isMine: boolean;
  read: boolean;
}) {
  return (
    <div className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[75%] px-3.5 py-2 rounded-2xl text-sm ${
          isMine
            ? "bg-rose-500 text-white rounded-br-md"
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
            <span
              className={`text-[10px] ${
                read ? "text-rose-200" : "text-rose-300/50"
              }`}
            >
              {read ? "✓✓" : "✓"}
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
    sendMessage,
    sendTyping,
    markRead,
  } = useChat(conversationId);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetchMessages();
    markRead();
  }, [fetchMessages, markRead]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
    sendMessage(input.trim());
    setInput("");
    sendTyping(false);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
  }, [input, sendMessage, sendTyping]);

  return (
    <div className="flex flex-col h-full">
      {/* Contact header */}
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

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-sm text-gray-400">
            No messages yet — start the conversation!
          </div>
        )}
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            content={msg.content}
            createdAt={msg.createdAt}
            isMine={msg.senderId === currentUserId}
            read={msg.read}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Typing indicator */}
      {typingUsers.length > 0 && (
        <div className="px-4 py-1.5 text-xs text-gray-400 italic shrink-0">
          {contactName ?? "Someone"} is typing…
        </div>
      )}

      {/* Input */}
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
          className="flex items-center justify-center w-10 h-10 rounded-full bg-rose-500 text-white hover:bg-rose-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <FiSend className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
