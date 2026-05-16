"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { useSocketContext } from "@/components/realtime/socket-provider";
import ChatList from "@/components/realtime/chat-list";
import ChatWindow from "@/components/realtime/chat-window";
import type { Conversation } from "@/types/realtime";
import { FiMessageSquare, FiArrowLeft } from "react-icons/fi";

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
    <div className="h-[calc(100vh-8rem)]">
      {/* ── Header ── */}
      <div className="mb-4">
        <p className="text-[11px] font-semibold uppercase tracking-editorial text-slate-400 mb-1">
          Communication
        </p>
        <h1 className="font-display text-2xl font-bold text-slate-900 tracking-headline">
          Messages
        </h1>
      </div>

      <div className="rounded-2xl border border-warm-200/50 bg-white overflow-hidden flex h-[calc(100%-4.5rem)]">
        {/* Conversation list sidebar */}
        <div
          className={`w-full sm:w-[320px] sm:border-r border-warm-200/30 shrink-0 overflow-y-auto ${
            selectedConv ? "hidden sm:block" : "block"
          }`}
        >
          <div className="px-5 py-4 border-b border-warm-200/20">
            <h2 className="text-[13px] font-semibold text-slate-700">Conversations</h2>
          </div>
          <ChatList
            currentUserId={currentUserId}
            selectedId={selectedConv?.id ?? null}
            onSelect={handleSelect}
            onlineUsers={onlineUsers}
          />
        </div>

        {/* Chat window */}
        <div className={`flex-1 flex flex-col min-w-0 ${selectedConv ? "block" : "hidden sm:flex"}`}>
          {selectedConv ? (
            <>
              <div className="sm:hidden border-b border-warm-200/20 px-4 py-2.5">
                <button
                  onClick={() => setSelectedConv(null)}
                  className="flex items-center gap-1.5 text-[12px] text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  <FiArrowLeft className="w-3.5 h-3.5" /> Back
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
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="w-14 h-14 rounded-xl bg-warm-50 border border-warm-200/40 flex items-center justify-center mb-4">
                <FiMessageSquare className="w-6 h-6 text-slate-300" />
              </div>
              <h3 className="text-[14px] font-semibold text-slate-700 mb-1">
                Select a conversation
              </h3>
              <p className="text-[12px] text-slate-400 font-light max-w-xs">
                Pick a conversation from the list or start a new one by messaging a vendor.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
