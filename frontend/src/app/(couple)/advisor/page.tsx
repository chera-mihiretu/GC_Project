"use client";

import { useState, useRef, useCallback, useEffect, memo } from "react";
import { FiSend, FiCpu, FiCheck, FiX, FiPlus, FiTrash2, FiMessageSquare, FiMenu } from "react-icons/fi";
import ReactMarkdown from "react-markdown";
import VendorCard from "@/components/ai/vendor-card";
import BookingCard from "@/components/ai/booking-card";
import VendorDetailPanel from "@/components/ai/vendor-detail-panel";
import BookingDetailPanel from "@/components/ai/booking-detail-panel";
import {
  streamAIMessage,
  confirmAction,
  listAISessions,
  loadSessionMessages,
  deleteAISession,
  type ChatMessage,
  type VendorCard as VendorCardType,
  type BookingCardData,
  type PendingAction,
  type AISession,
} from "@/services/ai.service";

interface DisplayMessage {
  id: string;
  role: "user" | "model";
  content: string;
  vendorCards?: VendorCardType[];
  bookingCards?: BookingCardData[];
  pendingAction?: PendingAction;
  actionStatus?: "pending" | "confirmed" | "cancelled" | "executing";
  isStreaming?: boolean;
  toolStatus?: string;
}

const MarkdownContent = memo(function MarkdownContent({ content }: { content: string }) {
  return (
    <div className="prose prose-sm prose-gray max-w-none break-words [&>p]:my-1 [&>ul]:my-1 [&>ol]:my-1 [&>h1]:text-base [&>h1]:font-bold [&>h1]:my-2 [&>h2]:text-sm [&>h2]:font-bold [&>h2]:my-1.5 [&>h3]:text-sm [&>h3]:font-semibold [&>h3]:my-1 [&_li]:my-0.5 [&_strong]:font-semibold [&_a]:text-rose-600 [&_a]:underline [&>hr]:my-2 [&>blockquote]:border-l-rose-300 [&>blockquote]:text-gray-600">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
});

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export default function AIAdvisorPage() {
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [panelVendorId, setPanelVendorId] = useState<string | null>(null);
  const [panelBookingId, setPanelBookingId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<AISession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sessionsLoaded, setSessionsLoaded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Load sessions on mount
  useEffect(() => {
    listAISessions().then(({ sessions: s }) => {
      setSessions(s);
      setSessionsLoaded(true);
      if (s.length > 0) {
        loadSession(s[0].id);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadSession = useCallback(async (sessionId: string) => {
    setActiveSessionId(sessionId);
    setSidebarOpen(false);
    const msgs = await loadSessionMessages(sessionId);
    const displayMsgs: DisplayMessage[] = msgs.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      vendorCards: m.vendorCards || undefined,
      pendingAction: m.pendingAction || undefined,
      actionStatus: m.pendingAction ? "confirmed" as const : undefined,
    }));
    setMessages(displayMsgs);
  }, []);

  const handleNewChat = useCallback(() => {
    setActiveSessionId(null);
    setMessages([]);
    setSidebarOpen(false);
    inputRef.current?.focus();
  }, []);

  const handleDeleteSession = useCallback(async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteAISession(sessionId);
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    if (activeSessionId === sessionId) {
      setActiveSessionId(null);
      setMessages([]);
    }
  }, [activeSessionId]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMsg: DisplayMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    if (inputRef.current) inputRef.current.style.height = "auto";
    setIsLoading(true);

    const history: ChatMessage[] = [
      ...messages.map((m) => ({ role: m.role, content: m.content })),
      { role: "user" as const, content: text },
    ];

    const aiMsgId = crypto.randomUUID();
    const aiMsg: DisplayMessage = {
      id: aiMsgId,
      role: "model",
      content: "",
      isStreaming: true,
    };
    setMessages((prev) => [...prev, aiMsg]);

    try {
      await streamAIMessage(
        history,
        {
          onToken: (token) => {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === aiMsgId ? { ...m, content: m.content + token } : m
              )
            );
          },
          onToolStart: (tool) => {
            const toolLabels: Record<string, string> = {
              searchVendors: "Searching vendors...",
              getVendorDetail: "Getting vendor details...",
              checkAvailability: "Checking availability...",
              sendMessageToVendors: "Sending messages...",
              readMessages: "Reading messages...",
              readAllConversations: "Checking inbox...",
              createBooking: "Creating booking...",
              listMyBookings: "Checking your bookings...",
              getBookingDetail: "Looking up booking details...",
            };
            setMessages((prev) =>
              prev.map((m) =>
                m.id === aiMsgId ? { ...m, toolStatus: toolLabels[tool] || `Running ${tool}...` } : m
              )
            );
          },
          onToolEnd: () => {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === aiMsgId ? { ...m, toolStatus: undefined } : m
              )
            );
          },
          onVendorCards: (cards) => {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === aiMsgId ? { ...m, vendorCards: cards } : m
              )
            );
          },
          onBookingCards: (cards) => {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === aiMsgId ? { ...m, bookingCards: cards } : m
              )
            );
          },
          onAction: (action) => {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === aiMsgId ? { ...m, pendingAction: action, actionStatus: "pending" as const } : m
              )
            );
          },
          onSession: (sessionId) => {
            setActiveSessionId(sessionId);
            // Add to sessions list if new
            setSessions((prev) => {
              if (prev.find((s) => s.id === sessionId)) return prev;
              const newSession: AISession = {
                id: sessionId,
                userId: "",
                title: text.slice(0, 50),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };
              return [newSession, ...prev];
            });
          },
          onDone: (sessionId) => {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === aiMsgId ? { ...m, isStreaming: false, toolStatus: undefined } : m
              )
            );
            setIsLoading(false);
            inputRef.current?.focus();
            if (sessionId) {
              setActiveSessionId(sessionId);
              // Update session in list
              setSessions((prev) =>
                prev.map((s) =>
                  s.id === sessionId ? { ...s, updatedAt: new Date().toISOString() } : s
                )
              );
            }
          },
          onError: (error) => {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === aiMsgId
                  ? { ...m, content: m.content || error || "Sorry, something went wrong.", isStreaming: false, toolStatus: undefined }
                  : m
              )
            );
            setIsLoading(false);
            inputRef.current?.focus();
          },
        },
        activeSessionId || undefined,
      );
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === aiMsgId
            ? { ...m, content: "Sorry, I encountered an error. Please try again.", isStreaming: false }
            : m
        )
      );
      setIsLoading(false);
      inputRef.current?.focus();
    }
  }, [input, isLoading, messages, activeSessionId]);

  const handleConfirmAction = useCallback(async (msgId: string, action: PendingAction) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, actionStatus: "executing" as const } : m))
    );

    try {
      const result = await confirmAction(action);

      setMessages((prev) =>
        prev.map((m) => (m.id === msgId
          ? { ...m, actionStatus: result.success ? "confirmed" as const : "cancelled" as const }
          : m
        ))
      );

      const successHints: Record<string, string> = {
        book_vendor: "You can track this under your **Bookings**.",
        send_message: "You can check your **Messages** page for replies.",
        cancel_booking: "The booking has been removed from your active bookings.",
        reschedule_booking: "You can find the new booking in your **Bookings** list.",
      };
      const successHint = successHints[action.type] || "";
      const resultMsg: DisplayMessage = {
        id: crypto.randomUUID(),
        role: "model",
        content: result.success
          ? `✓ ${result.summary} ${successHint}`
          : `⚠ ${result.summary}`,
      };
      setMessages((prev) => [...prev, resultMsg]);
    } catch {
      setMessages((prev) =>
        prev.map((m) => (m.id === msgId ? { ...m, actionStatus: "pending" as const } : m))
      );
      const errorMsg: DisplayMessage = {
        id: crypto.randomUUID(),
        role: "model",
        content: "Sorry, there was an error executing the action. You can try again.",
      };
      setMessages((prev) => [...prev, errorMsg]);
    }
  }, []);

  const handleCancelAction = useCallback((msgId: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, actionStatus: "cancelled" as const } : m))
    );

    const cancelMsg: DisplayMessage = {
      id: crypto.randomUUID(),
      role: "model",
      content: "Action cancelled. Let me know if you'd like to do something else.",
    };
    setMessages((prev) => [...prev, cancelMsg]);
  }, []);

  const handleCancelBookingFromPanel = useCallback(async (bookingId: string, vendorName: string) => {
    setPanelBookingId(null);
    const action: PendingAction = {
      type: "cancel_booking",
      description: `Cancel booking with ${vendorName}`,
      params: { bookingId },
    };
    const msgId = crypto.randomUUID();
    const actionMsg: DisplayMessage = {
      id: msgId,
      role: "model",
      content: `Would you like to cancel your booking with **${vendorName}**?`,
      pendingAction: action,
      actionStatus: "pending",
    };
    setMessages((prev) => [...prev, actionMsg]);
  }, []);

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-0">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 fixed lg:relative z-30 lg:z-0 inset-y-0 left-0 w-72 lg:w-64 bg-white border-r border-gray-200 flex flex-col transition-transform duration-200 lg:rounded-l-xl lg:border lg:border-gray-200/80`}
      >
        <div className="p-3 border-b border-gray-100">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg bg-rose-500 text-white text-sm font-medium hover:bg-rose-600 transition-colors"
          >
            <FiPlus className="w-4 h-4" />
            New Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {!sessionsLoaded && (
            <div className="p-4 text-center text-xs text-gray-400">Loading...</div>
          )}
          {sessionsLoaded && sessions.length === 0 && (
            <div className="p-4 text-center text-xs text-gray-400">No conversations yet</div>
          )}
          {sessions.map((session) => (
            <div
              key={session.id}
              role="button"
              tabIndex={0}
              onClick={() => loadSession(session.id)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") loadSession(session.id); }}
              className={`w-full flex items-start gap-2 px-3 py-2.5 rounded-lg text-left text-sm transition-colors group cursor-pointer ${
                activeSessionId === session.id
                  ? "bg-rose-50 text-rose-700"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <FiMessageSquare className="w-4 h-4 mt-0.5 shrink-0 opacity-60" />
              <div className="flex-1 min-w-0">
                <p className="truncate font-medium text-xs">
                  {session.title || "Untitled"}
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  {formatRelativeTime(session.updatedAt)}
                </p>
              </div>
              <button
                onClick={(e) => handleDeleteSession(session.id, e)}
                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-50 hover:text-red-500 transition-all"
              >
                <FiTrash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Sidebar backdrop (mobile) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center gap-3 mb-4 px-1">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50"
          >
            <FiMenu className="w-4 h-4" />
          </button>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center">
            <FiCpu className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 font-display">
              Twedar AI Agent
            </h1>
            <p className="text-sm text-gray-500">
              I find vendors, message them, book them, and coordinate everything for you
            </p>
          </div>
        </div>

        <div className="flex-1 flex flex-col bg-white rounded-xl border border-gray-200/80 overflow-hidden">
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <div className="w-16 h-16 rounded-2xl bg-rose-50 flex items-center justify-center mb-4">
                  <FiCpu className="w-8 h-8 text-rose-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Your Wedding Planning Agent
                </h3>
                <p className="text-sm text-gray-500 max-w-md mb-6">
                  Tell me what you need and I&apos;ll handle it — finding vendors, messaging them,
                  checking availability, and booking. Just say the word.
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {[
                    "Find me a venue and message the top 3",
                    "Check if any photographer is free on my wedding date",
                    "Book the best caterer for 200 guests under 50,000 ETB",
                    "Do I have any new replies from vendors?",
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => {
                        setInput(suggestion);
                        inputRef.current?.focus();
                      }}
                      className="px-3 py-2 text-xs rounded-full border border-gray-200 text-gray-600 hover:border-rose-300 hover:text-rose-600 hover:bg-rose-50 transition-all"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <div key={msg.id}>
                {msg.toolStatus && (
                  <div className="flex justify-start mb-2">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-full">
                      <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs text-blue-600 font-medium">{msg.toolStatus}</span>
                    </div>
                  </div>
                )}
                {(msg.content || !msg.toolStatus) && (
                <div
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm ${
                      msg.role === "user"
                        ? "bg-rose-500 text-white rounded-br-md"
                        : "bg-gray-100 text-gray-800 rounded-bl-md"
                    }`}
                  >
                    {msg.role === "user" ? (
                      <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                    ) : (
                      <>
                        {msg.isStreaming ? (
                          <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                        ) : (
                          <MarkdownContent content={msg.content} />
                        )}
                        {msg.isStreaming && !msg.toolStatus && (
                          <span className="inline-block w-1.5 h-4 bg-gray-400 animate-pulse ml-0.5 align-text-bottom" />
                        )}
                      </>
                    )}
                  </div>
                </div>
                )}
                {msg.vendorCards && msg.vendorCards.length > 0 && (
                  <div className="mt-2 ml-0 grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-[80%]">
                    {msg.vendorCards.map((vendor) => (
                      <VendorCard key={vendor.id} vendor={vendor} onClick={setPanelVendorId} />
                    ))}
                  </div>
                )}
                {msg.bookingCards && msg.bookingCards.length > 0 && (
                  <div className="mt-2 ml-0 grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-[80%]">
                    {msg.bookingCards.map((booking) => (
                      <BookingCard key={booking.bookingId} booking={booking} onClick={setPanelBookingId} />
                    ))}
                  </div>
                )}
                {msg.pendingAction && msg.actionStatus === "pending" && (
                  <div className="mt-3 ml-0 max-w-[80%]">
                    <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                      <div className="flex-1 text-sm text-amber-800">
                        <span className="font-medium">Action required:</span>{" "}
                        {msg.pendingAction.description}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleConfirmAction(msg.id, msg.pendingAction!)}
                          className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
                            msg.pendingAction.type === "cancel_booking"
                              ? "bg-red-500 hover:bg-red-600"
                              : "bg-green-500 hover:bg-green-600"
                          }`}
                        >
                          <FiCheck className="w-4 h-4" />
                          {msg.pendingAction.type === "cancel_booking" ? "Cancel Booking" : "Confirm"}
                        </button>
                        <button
                          onClick={() => handleCancelAction(msg.id)}
                          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                        >
                          <FiX className="w-4 h-4" />
                          {msg.pendingAction.type === "cancel_booking" ? "Keep Booking" : "Cancel"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                {msg.pendingAction && msg.actionStatus === "executing" && (
                  <div className="mt-3 ml-0 max-w-[80%]">
                    <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                      <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm text-blue-700">Executing action...</span>
                    </div>
                  </div>
                )}
                {msg.pendingAction && msg.actionStatus === "confirmed" && (
                  <div className="mt-3 ml-0 max-w-[80%]">
                    <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl">
                      <FiCheck className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-green-700 font-medium">Action completed</span>
                    </div>
                  </div>
                )}
                {msg.pendingAction && msg.actionStatus === "cancelled" && (
                  <div className="mt-3 ml-0 max-w-[80%]">
                    <div className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-xl">
                      <FiX className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-500">Action cancelled</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="border-t border-gray-100 p-3">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 150)}px`;
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Tell me what to do — find, message, book, check replies..."
                className="flex-1 px-4 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-300 transition-all resize-none overflow-hidden min-h-[42px] max-h-[150px]"
                rows={1}
                disabled={isLoading}
              />
              <button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="w-10 h-10 rounded-full bg-rose-500 text-white flex items-center justify-center hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shrink-0"
              >
                <FiSend className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <VendorDetailPanel
        vendorId={panelVendorId}
        onClose={() => setPanelVendorId(null)}
      />

      <BookingDetailPanel
        bookingId={panelBookingId}
        onClose={() => setPanelBookingId(null)}
        onCancelBooking={handleCancelBookingFromPanel}
        onViewVendor={(vendorProfileId) => {
          setPanelBookingId(null);
          setPanelVendorId(vendorProfileId);
        }}
      />
    </div>
  );
}
