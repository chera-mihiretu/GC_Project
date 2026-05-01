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
  const { socket } = useSocketContext();

  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  const currentUserId = session?.user?.id ?? "";

  useEffect(() => {
    if (!socket) return;

    function onPresence(data: { userId: string; online: boolean }) {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        if (data.online) next.add(data.userId);
        else next.delete(data.userId);
        return next;
      });
    }

    socket.on("presence:update", onPresence);
    return () => {
      socket.off("presence:update", onPresence);
    };
  }, [socket]);

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
      <div className="flex items-center justify-center h-full text-sm text-gray-400">
        Loading...
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto h-[calc(100vh-8rem)]">
      <h1 className="text-2xl font-bold text-gray-900 font-[family-name:var(--font-display)] mb-4">
        Messages
      </h1>

      <div className="bg-white rounded-xl border border-gray-200/80 overflow-hidden flex h-[calc(100%-3rem)]">
        {/* Conversation list */}
        <div
          className={`w-full sm:w-80 sm:border-r border-gray-200/80 flex-shrink-0 overflow-y-auto ${
            selectedConv ? "hidden sm:block" : "block"
          }`}
        >
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700">
              Conversations
            </h2>
          </div>
          <ChatList
            currentUserId={currentUserId}
            selectedId={selectedConv?.id ?? null}
            onSelect={handleSelect}
            onlineUsers={onlineUsers}
          />
        </div>

        {/* Chat window */}
        <div
          className={`flex-1 flex flex-col min-w-0 ${
            selectedConv ? "block" : "hidden sm:flex"
          }`}
        >
          {selectedConv ? (
            <>
              {/* Mobile back button */}
              <div className="sm:hidden border-b border-gray-100 px-3 py-2">
                <button
                  onClick={() => setSelectedConv(null)}
                  className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
                >
                  <FiArrowLeft className="w-4 h-4" /> Back
                </button>
              </div>
              <ChatWindow
                conversationId={selectedConv.id}
                currentUserId={currentUserId}
                contactName={contact?.name}
                contactImage={contact?.image}
                contactOnline={
                  contact ? onlineUsers.has(contact.id) : false
                }
              />
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                <FiMessageSquare className="w-6 h-6 text-gray-400" />
              </div>
              <h3 className="text-sm font-semibold text-gray-700 mb-1">
                Select a conversation
              </h3>
              <p className="text-xs text-gray-400 max-w-xs">
                Pick a conversation from the list or start a new one by messaging a vendor.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
