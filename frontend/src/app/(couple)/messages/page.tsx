"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { useSocketContext } from "@/components/realtime/socket-provider";
import ChatList from "@/components/realtime/chat-list";
import ChatWindow from "@/components/realtime/chat-window";
import type { Conversation } from "@/types/realtime";
import { FiMessageSquare, FiArrowLeft, FiSend } from "react-icons/fi";

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

export default function MessagesPage() {
  const searchParams = useSearchParams();
  const cidParam = searchParams.get("cid");
  const { data: session } = useSession();
  const { onlineUsers } = useSocketContext();

  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);

  const currentUserId = session?.user?.id ?? "";

  const handleSelect = useCallback((conv: Conversation) => {
    setSelectedConv(conv);
  }, []);

  useEffect(() => {
    if (cidParam && !selectedConv) {
      setSelectedConv({
        id: cidParam,
        participantOne: "",
        participantTwo: "",
        lastMessageAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      });
    }
  }, [cidParam, selectedConv]);

  const contact = useMemo(() => {
    if (!selectedConv || !currentUserId) return null;
    return getOtherParticipant(selectedConv, currentUserId);
  }, [selectedConv, currentUserId]);

  if (!currentUserId) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-warm-200/40 border-t-gold-400 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      {/* ── Header ── */}
      <div className="flex items-end justify-between gap-4 mb-5">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-editorial text-slate-400 mb-2">Communication</p>
          <h1 className="font-display text-3xl font-bold text-slate-900 tracking-headline">Messages</h1>
          <p className="text-[13px] text-slate-400 font-light mt-1.5">Chat with your wedding vendors</p>
        </div>
        <div className="flex items-center gap-1.5 pb-1">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] text-slate-400 font-light">{onlineUsers.size} online</span>
        </div>
      </div>

      {/* ── Chat Container ── */}
      <div className="rounded-2xl border border-warm-200/40 bg-white overflow-hidden flex flex-1 min-h-0 shadow-[0_4px_24px_rgba(15,23,42,0.03)]">
        {/* ── Conversation Sidebar ── */}
        <div className={`w-full sm:w-[320px] sm:border-r border-warm-200/20 shrink-0 flex flex-col overflow-hidden ${selectedConv ? "hidden sm:flex" : "flex"}`}>
          <div className="px-5 py-4 border-b border-warm-200/15 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-warm-50 border border-warm-200/30 flex items-center justify-center">
                <FiMessageSquare className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <h2 className="text-[13px] font-semibold text-slate-800">Conversations</h2>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            <ChatList
              currentUserId={currentUserId}
              selectedId={selectedConv?.id ?? null}
              onSelect={handleSelect}
              onlineUsers={onlineUsers}
            />
          </div>
        </div>

        {/* ── Chat Window ── */}
        <div className={`flex-1 flex flex-col min-w-0 ${selectedConv ? "flex" : "hidden sm:flex"}`}>
          {selectedConv ? (
            <>
              {/* Mobile back */}
              <div className="sm:hidden border-b border-warm-200/15 px-4 py-2.5">
                <button
                  onClick={() => setSelectedConv(null)}
                  className="cursor-pointer flex items-center gap-1.5 text-[12px] text-slate-400 hover:text-slate-600 transition-colors group"
                >
                  <FiArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform duration-500" /> Back to conversations
                </button>
              </div>
              <ChatWindow
                conversationId={selectedConv.id}
                currentUserId={currentUserId}
                contactName={contact?.name}
                contactImage={contact?.image}
                contactOnline={contact ? onlineUsers.has(contact.id) : false}
              />
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-10">
              <div className="relative mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-warm-50 to-warm-100/60 border border-warm-200/30 flex items-center justify-center">
                  <FiMessageSquare className="w-7 h-7 text-slate-300" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-slate-900 flex items-center justify-center shadow-sm">
                  <FiSend className="w-2.5 h-2.5 text-white" />
                </div>
              </div>
              <h3 className="font-display text-[16px] font-bold text-slate-800 tracking-headline mb-1.5">
                Select a conversation
              </h3>
              <p className="text-[12px] text-slate-400 font-light max-w-xs leading-relaxed">
                Pick a conversation from the list or start a new one by visiting a vendor&apos;s profile.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
