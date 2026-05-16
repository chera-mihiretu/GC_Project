"use client";

import { useState, useRef, useCallback, useEffect, memo } from "react";
import { FiSend, FiCpu, FiCheck, FiX, FiPlus, FiTrash2, FiMessageSquare, FiMenu, FiZap, FiSearch, FiCalendar, FiInbox } from "react-icons/fi";
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
    <div className="prose prose-sm max-w-none break-words [&>p]:my-1 [&>ul]:my-1 [&>ol]:my-1 [&>h1]:text-base [&>h1]:font-bold [&>h1]:my-2 [&>h2]:text-sm [&>h2]:font-bold [&>h2]:my-1.5 [&>h3]:text-sm [&>h3]:font-semibold [&>h3]:my-1 [&_li]:my-0.5 [&_strong]:font-semibold [&_a]:text-gold-500 [&_a]:underline [&>hr]:my-2 [&>blockquote]:border-l-gold-300 [&>blockquote]:text-slate-500 text-slate-700">
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

const SUGGESTIONS = [
  { icon: FiSearch, text: "Find me a venue and message the top 3" },
  { icon: FiCalendar, text: "Check if any photographer is free on my wedding date" },
  { icon: FiZap, text: "Book the best caterer for 200 guests under 50,000 ETB" },
  { icon: FiInbox, text: "Do I have any new replies from vendors?" },
];

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
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  useEffect(() => {
    listAISessions().then(({ sessions: s }) => {
      setSessions(s);
      setSessionsLoaded(true);
    });
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
    if (activeSessionId === sessionId) { setActiveSessionId(null); setMessages([]); }
  }, [activeSessionId]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMsg: DisplayMessage = { id: crypto.randomUUID(), role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    if (inputRef.current) inputRef.current.style.height = "auto";
    setIsLoading(true);

    const history: ChatMessage[] = [
      ...messages.map((m) => ({ role: m.role, content: m.content })),
      { role: "user" as const, content: text },
    ];

    const aiMsgId = crypto.randomUUID();
    const aiMsg: DisplayMessage = { id: aiMsgId, role: "model", content: "", isStreaming: true };
    setMessages((prev) => [...prev, aiMsg]);

    try {
      await streamAIMessage(
        history,
        {
          onToken: (token) => {
            setMessages((prev) => prev.map((m) => m.id === aiMsgId ? { ...m, content: m.content + token } : m));
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
            setMessages((prev) => prev.map((m) => m.id === aiMsgId ? { ...m, toolStatus: toolLabels[tool] || `Running ${tool}...` } : m));
          },
          onToolEnd: () => {
            setMessages((prev) => prev.map((m) => m.id === aiMsgId ? { ...m, toolStatus: undefined } : m));
          },
          onVendorCards: (cards) => {
            setMessages((prev) => prev.map((m) => m.id === aiMsgId ? { ...m, vendorCards: cards } : m));
          },
          onBookingCards: (cards) => {
            setMessages((prev) => prev.map((m) => m.id === aiMsgId ? { ...m, bookingCards: cards } : m));
          },
          onAction: (action) => {
            setMessages((prev) => prev.map((m) => m.id === aiMsgId ? { ...m, pendingAction: action, actionStatus: "pending" as const } : m));
          },
          onSession: (sessionId) => {
            setActiveSessionId(sessionId);
            setSessions((prev) => {
              if (prev.find((s) => s.id === sessionId)) return prev;
              return [{ id: sessionId, userId: "", title: text.slice(0, 50), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, ...prev];
            });
          },
          onDone: (sessionId) => {
            setMessages((prev) => prev.map((m) => m.id === aiMsgId ? { ...m, isStreaming: false, toolStatus: undefined } : m));
            setIsLoading(false);
            inputRef.current?.focus();
            if (sessionId) {
              setActiveSessionId(sessionId);
              setSessions((prev) => prev.map((s) => s.id === sessionId ? { ...s, updatedAt: new Date().toISOString() } : s));
            }
          },
          onError: (error) => {
            setMessages((prev) => prev.map((m) => m.id === aiMsgId ? { ...m, content: m.content || error || "Sorry, something went wrong.", isStreaming: false, toolStatus: undefined } : m));
            setIsLoading(false);
            inputRef.current?.focus();
          },
        },
        activeSessionId || undefined,
      );
    } catch {
      setMessages((prev) => prev.map((m) => m.id === aiMsgId ? { ...m, content: "Sorry, I encountered an error. Please try again.", isStreaming: false } : m));
      setIsLoading(false);
      inputRef.current?.focus();
    }
  }, [input, isLoading, messages, activeSessionId]);

  const handleConfirmAction = useCallback(async (msgId: string, action: PendingAction) => {
    setMessages((prev) => prev.map((m) => (m.id === msgId ? { ...m, actionStatus: "executing" as const } : m)));
    try {
      const result = await confirmAction(action);
      setMessages((prev) => prev.map((m) => (m.id === msgId ? { ...m, actionStatus: result.success ? "confirmed" as const : "cancelled" as const } : m)));
      const successHints: Record<string, string> = {
        book_vendor: "You can track this under your **Bookings**.",
        send_message: "You can check your **Messages** page for replies.",
        cancel_booking: "The booking has been removed from your active bookings.",
        reschedule_booking: "You can find the new booking in your **Bookings** list.",
      };
      setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "model", content: result.success ? `Done — ${result.summary} ${successHints[action.type] || ""}` : `Could not complete — ${result.summary}` }]);
    } catch {
      setMessages((prev) => prev.map((m) => (m.id === msgId ? { ...m, actionStatus: "pending" as const } : m)));
      setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "model", content: "Sorry, there was an error executing the action. You can try again." }]);
    }
  }, []);

  const handleCancelAction = useCallback((msgId: string) => {
    setMessages((prev) => prev.map((m) => (m.id === msgId ? { ...m, actionStatus: "cancelled" as const } : m)));
    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "model", content: "Action cancelled. Let me know if you\u2019d like to do something else." }]);
  }, []);

  const handleCancelBookingFromPanel = useCallback(async (bookingId: string, vendorName: string) => {
    setPanelBookingId(null);
    const action: PendingAction = { type: "cancel_booking", description: `Cancel booking with ${vendorName}`, params: { bookingId } };
    const msgId = crypto.randomUUID();
    setMessages((prev) => [...prev, { id: msgId, role: "model", content: `Would you like to cancel your booking with **${vendorName}**?`, pendingAction: action, actionStatus: "pending" }]);
  }, []);

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-0">
      {/* ── Sidebar ── */}
      <div className={`${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 fixed lg:relative z-30 lg:z-0 inset-y-0 left-0 w-72 lg:w-64 bg-white border-r border-warm-200/30 flex flex-col transition-transform duration-500 lg:rounded-l-2xl lg:border lg:border-warm-200/40`}>
        <div className="p-3 border-b border-warm-200/20">
          <button
            onClick={handleNewChat}
            className="cursor-pointer w-full flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-900 text-white text-[12px] font-medium hover:bg-slate-800 transition-all duration-500"
          >
            <FiPlus className="w-3.5 h-3.5" /> New Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {!sessionsLoaded && (
            <div className="p-6 text-center">
              <div className="w-5 h-5 border-2 border-warm-200/40 border-t-slate-400 rounded-full animate-spin mx-auto" />
            </div>
          )}
          {sessionsLoaded && sessions.length === 0 && (
            <div className="p-6 text-center text-[11px] text-slate-300 font-light">No conversations yet</div>
          )}
          {sessions.map((session) => (
            <div
              key={session.id}
              role="button"
              tabIndex={0}
              onClick={() => loadSession(session.id)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") loadSession(session.id); }}
              className={`cursor-pointer w-full flex items-start gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all duration-500 group ${
                activeSessionId === session.id
                  ? "bg-warm-50/80 border border-warm-200/30"
                  : "hover:bg-warm-50/40"
              }`}
            >
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${activeSessionId === session.id ? "bg-slate-900 text-white" : "bg-warm-50 border border-warm-200/30 text-slate-400"}`}>
                <FiMessageSquare className="w-3 h-3" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-[12px] font-medium text-slate-700">{session.title || "Untitled"}</p>
                <p className="text-[10px] text-slate-300 font-light mt-0.5">{formatRelativeTime(session.updatedAt)}</p>
              </div>
              <button
                onClick={(e) => handleDeleteSession(session.id, e)}
                className="cursor-pointer opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-400 transition-all shrink-0"
              >
                <FiTrash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Sidebar backdrop (mobile) */}
      {sidebarOpen && <div className="fixed inset-0 z-20 bg-black/30 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* ── Main Chat ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4 px-1">
          <button onClick={() => setSidebarOpen(true)} className="cursor-pointer lg:hidden w-9 h-9 rounded-xl bg-warm-50 border border-warm-200/30 flex items-center justify-center text-slate-400 hover:bg-warm-100/60 transition-all">
            <FiMenu className="w-4 h-4" />
          </button>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-900 to-slate-700 flex items-center justify-center shadow-sm">
            <FiCpu className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-display text-lg font-bold text-slate-900 tracking-headline">
              Twedar AI Agent
            </h1>
            <p className="text-[11px] text-slate-400 font-light">
              Find vendors, message them, book &amp; coordinate — all from here
            </p>
          </div>
        </div>

        {/* Chat Container */}
        <div className="flex-1 flex flex-col rounded-2xl border border-warm-200/40 bg-white overflow-hidden">
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* Empty state */}
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-700 flex items-center justify-center mb-5 shadow-lg">
                  <FiCpu className="w-7 h-7 text-white" />
                </div>
                <h3 className="font-display text-xl font-bold text-slate-900 tracking-headline mb-2">
                  Your Wedding Planning Agent
                </h3>
                <p className="text-[13px] text-slate-400 font-light max-w-md mb-8 leading-relaxed">
                  Tell me what you need and I&apos;ll handle it — finding vendors, messaging them,
                  checking availability, and booking.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-lg w-full">
                  {SUGGESTIONS.map(({ icon: Icon, text }) => (
                    <button
                      key={text}
                      onClick={() => { setInput(text); inputRef.current?.focus(); }}
                      className="cursor-pointer flex items-start gap-3 p-3.5 rounded-xl border border-warm-200/40 bg-warm-50/30 text-left hover:border-warm-200/70 hover:bg-warm-50/60 hover:shadow-[0_2px_12px_rgba(15,23,42,0.03)] transition-all duration-500 group"
                    >
                      <div className="w-7 h-7 rounded-lg bg-white border border-warm-200/30 flex items-center justify-center shrink-0 group-hover:bg-slate-900 group-hover:border-slate-900 transition-all duration-500">
                        <Icon className="w-3 h-3 text-slate-400 group-hover:text-white transition-colors duration-500" />
                      </div>
                      <span className="text-[12px] text-slate-500 font-light leading-relaxed">{text}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Messages */}
            {messages.map((msg) => (
              <div key={msg.id}>
                {/* Tool status pill */}
                {msg.toolStatus && (
                  <div className="flex justify-start mb-2">
                    <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-warm-50 border border-warm-200/30">
                      <div className="w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                      <span className="text-[11px] text-slate-500 font-medium">{msg.toolStatus}</span>
                    </div>
                  </div>
                )}

                {/* Message bubble */}
                {(msg.content || !msg.toolStatus) && (
                  <div className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] px-4 py-3 text-[13px] ${
                      msg.role === "user"
                        ? "bg-slate-900 text-white rounded-2xl rounded-br-md"
                        : "bg-warm-50/60 border border-warm-200/20 text-slate-700 rounded-2xl rounded-bl-md"
                    }`}>
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
                            <span className="inline-block w-1.5 h-4 bg-slate-300 animate-pulse ml-0.5 align-text-bottom rounded-sm" />
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Vendor cards */}
                {msg.vendorCards && msg.vendorCards.length > 0 && (
                  <div className="mt-2.5 ml-0 grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-[80%]">
                    {msg.vendorCards.map((vendor) => (
                      <VendorCard key={vendor.id} vendor={vendor} onClick={setPanelVendorId} />
                    ))}
                  </div>
                )}

                {/* Booking cards */}
                {msg.bookingCards && msg.bookingCards.length > 0 && (
                  <div className="mt-2.5 ml-0 grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-[80%]">
                    {msg.bookingCards.map((booking) => (
                      <BookingCard key={booking.bookingId} booking={booking} onClick={setPanelBookingId} />
                    ))}
                  </div>
                )}

                {/* Action: pending */}
                {msg.pendingAction && msg.actionStatus === "pending" && (
                  <div className="mt-3 ml-0 max-w-[80%]">
                    <div className="flex items-center gap-3 p-4 rounded-xl border border-amber-200/40 bg-amber-50/60">
                      <div className="flex-1">
                        <p className="text-[10px] uppercase tracking-luxury font-semibold text-amber-500 mb-1">Action Required</p>
                        <p className="text-[12px] text-amber-800 font-light">{msg.pendingAction.description}</p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => handleConfirmAction(msg.id, msg.pendingAction!)}
                          className={`cursor-pointer flex items-center gap-1.5 px-4 py-2 text-[11px] font-medium text-white rounded-xl transition-all duration-500 ${
                            msg.pendingAction.type === "cancel_booking"
                              ? "bg-red-500 hover:bg-red-600"
                              : "bg-emerald-500 hover:bg-emerald-600"
                          }`}
                        >
                          <FiCheck className="w-3.5 h-3.5" />
                          {msg.pendingAction.type === "cancel_booking" ? "Cancel It" : "Confirm"}
                        </button>
                        <button
                          onClick={() => handleCancelAction(msg.id)}
                          className="cursor-pointer flex items-center gap-1.5 px-4 py-2 text-[11px] font-medium border border-warm-200/40 text-slate-500 rounded-xl hover:bg-warm-50 transition-all duration-500"
                        >
                          <FiX className="w-3.5 h-3.5" />
                          {msg.pendingAction.type === "cancel_booking" ? "Keep" : "Skip"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action: executing */}
                {msg.pendingAction && msg.actionStatus === "executing" && (
                  <div className="mt-3 ml-0 max-w-[80%]">
                    <div className="flex items-center gap-2.5 p-4 rounded-xl border border-warm-200/30 bg-warm-50/40">
                      <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                      <span className="text-[12px] text-slate-500 font-light">Executing action...</span>
                    </div>
                  </div>
                )}

                {/* Action: confirmed */}
                {msg.pendingAction && msg.actionStatus === "confirmed" && (
                  <div className="mt-3 ml-0 max-w-[80%]">
                    <div className="flex items-center gap-2.5 p-3.5 rounded-xl border border-emerald-200/40 bg-emerald-50/60">
                      <div className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center">
                        <FiCheck className="w-3 h-3 text-emerald-500" />
                      </div>
                      <span className="text-[12px] text-emerald-700 font-medium">Action completed</span>
                    </div>
                  </div>
                )}

                {/* Action: cancelled */}
                {msg.pendingAction && msg.actionStatus === "cancelled" && (
                  <div className="mt-3 ml-0 max-w-[80%]">
                    <div className="flex items-center gap-2.5 p-3.5 rounded-xl border border-warm-200/30 bg-warm-50/30">
                      <div className="w-6 h-6 rounded-lg bg-warm-100 flex items-center justify-center">
                        <FiX className="w-3 h-3 text-slate-400" />
                      </div>
                      <span className="text-[12px] text-slate-400 font-light">Action cancelled</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* ── Input Bar ── */}
          <div className="border-t border-warm-200/20 p-3.5">
            <div className="flex items-end gap-2.5">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 150)}px`;
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
                }}
                placeholder="Tell me what to do — find, message, book, check replies..."
                className="flex-1 px-4 py-3 rounded-xl bg-warm-50/60 border border-warm-200/40 text-[13px] text-slate-800 placeholder:text-slate-300 outline-none transition-all duration-500 focus:border-gold-400/50 focus:ring-2 focus:ring-gold-400/10 resize-none overflow-hidden min-h-[44px] max-h-[150px]"
                rows={1}
                disabled={isLoading}
              />
              <button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="cursor-pointer w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center hover:bg-slate-800 disabled:opacity-30 transition-all duration-500 shrink-0"
              >
                {isLoading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <FiSend className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <VendorDetailPanel vendorId={panelVendorId} onClose={() => setPanelVendorId(null)} />
      <BookingDetailPanel
        bookingId={panelBookingId}
        onClose={() => setPanelBookingId(null)}
        onCancelBooking={handleCancelBookingFromPanel}
        onViewVendor={(vendorProfileId) => { setPanelBookingId(null); setPanelVendorId(vendorProfileId); }}
      />
    </div>
  );
}
