"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { FiX, FiSend, FiHelpCircle, FiTrash2 } from "react-icons/fi";
import ReactMarkdown from "react-markdown";
import { streamGuideMessage, type GuideMessage } from "@/services/guide.service";

interface DisplayMessage {
  role: "user" | "model";
  content: string;
  streaming?: boolean;
}

const SUGGESTIONS = [
  "How do I book a vendor?",
  "How does the budget work?",
  "How do I set my availability?",
  "What can the AI Agent do?",
];

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-4 py-3">
      <div className="flex items-center gap-[3px]">
        <span className="w-[6px] h-[6px] rounded-full bg-slate-400 animate-[guideTyping_1.4s_ease-in-out_infinite]" />
        <span className="w-[6px] h-[6px] rounded-full bg-slate-300 animate-[guideTyping_1.4s_ease-in-out_0.2s_infinite]" />
        <span className="w-[6px] h-[6px] rounded-full bg-slate-200 animate-[guideTyping_1.4s_ease-in-out_0.4s_infinite]" />
      </div>
      <span className="text-[11px] text-slate-400 font-light ml-1.5">Thinking...</span>
    </div>
  );
}

export default function GuideBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [showPulse, setShowPulse] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    });
  }, []);

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  useEffect(scrollToBottom, [messages, scrollToBottom]);

  function handleOpen() {
    setOpen(true);
    setShowPulse(false);
    if (messages.length === 0) {
      setMessages([
        {
          role: "model",
          content:
            "Hi there! I'm the Twedar Guide. I can help you learn how to use any feature on the platform. What would you like to know?",
        },
      ]);
    }
  }

  async function sendMessage(text: string) {
    if (!text.trim() || streaming) return;

    const userMsg: DisplayMessage = { role: "user", content: text.trim() };
    const assistantMsg: DisplayMessage = { role: "model", content: "", streaming: true };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInput("");
    setStreaming(true);

    const history: GuideMessage[] = [
      ...messages.filter((m) => !m.streaming).map((m) => ({ role: m.role, content: m.content })),
      { role: "user" as const, content: text.trim() },
    ];

    try {
      await streamGuideMessage(history, {
        onToken: (token) => {
          setMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last.role === "model" && last.streaming) {
              updated[updated.length - 1] = { ...last, content: last.content + token };
            }
            return updated;
          });
          scrollToBottom();
        },
        onDone: () => {
          setMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last.role === "model" && last.streaming) {
              updated[updated.length - 1] = { ...last, streaming: false };
            }
            return updated;
          });
          setStreaming(false);
        },
        onError: () => {
          setMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last.role === "model" && last.streaming) {
              updated[updated.length - 1] = {
                ...last,
                content: "Sorry, I had trouble responding. Please try again.",
                streaming: false,
              };
            }
            return updated;
          });
          setStreaming(false);
        },
      });
    } catch {
      setMessages((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last.role === "model" && last.streaming) {
          updated[updated.length - 1] = {
            ...last,
            content: "Sorry, something went wrong. Please try again.",
            streaming: false,
          };
        }
        return updated;
      });
      setStreaming(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  const showSuggestions = messages.length <= 1 && !streaming;

  return (
    <>
      {/* Keyframes injected once */}
      <style jsx global>{`
        @keyframes guideTyping {
          0%, 60%, 100% { opacity: 0.3; transform: scale(0.8); }
          30% { opacity: 1; transform: scale(1.1); }
        }
        @keyframes guidePanelIn {
          from { opacity: 0; transform: translateY(16px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes guideMessageIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes guideCursor {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes guideFabPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(201, 168, 76, 0.5); }
          50% { box-shadow: 0 0 0 10px rgba(201, 168, 76, 0); }
        }
      `}</style>

      {/* Floating trigger button */}
      {!open && (
        <button
          onClick={handleOpen}
          className="cursor-pointer fixed bottom-6 right-6 z-50 w-14 h-14 rounded-2xl bg-slate-900 text-white shadow-[0_8px_30px_rgba(15,23,42,0.25)] hover:bg-slate-800 hover:shadow-[0_12px_40px_rgba(15,23,42,0.35)] transition-all duration-500 flex items-center justify-center group"
        >
          <FiHelpCircle className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" />
          {showPulse && (
            <span
              className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-gold-400 border-2 border-white"
              style={{ animation: "guideFabPulse 2s ease-in-out infinite" }}
            />
          )}
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div
          className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] h-[560px] max-h-[calc(100vh-4rem)] rounded-2xl bg-white border border-warm-200/50 shadow-[0_20px_60px_rgba(15,23,42,0.15)] flex flex-col overflow-hidden"
          style={{ animation: "guidePanelIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-warm-200/30 bg-gradient-to-r from-slate-900 to-slate-800 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center relative">
                <FiHelpCircle className="w-4 h-4 text-white/90" />
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-900" />
              </div>
              <div>
                <h3 className="text-[13px] font-semibold text-white">Platform Guide</h3>
                <p className="text-[10px] text-white/50 font-light">
                  {streaming ? "Typing..." : "Ask me how to use Twedar"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  setMessages([
                    {
                      role: "model",
                      content:
                        "Chat cleared! How can I help you?",
                    },
                  ]);
                }}
                disabled={streaming || messages.length <= 1}
                className="cursor-pointer w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors text-white/40 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed"
                title="Clear chat"
              >
                <FiTrash2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setOpen(false)}
                className="cursor-pointer w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors text-white/40 hover:text-white"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {messages.map((msg, i) => {
              const isWaiting = msg.role === "model" && msg.streaming && !msg.content;
              const isTyping = msg.role === "model" && msg.streaming && msg.content.length > 0;

              return (
                <div
                  key={i}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  style={{ animation: "guideMessageIn 0.3s ease-out forwards" }}
                >
                  {isWaiting ? (
                    <div className="bg-warm-50 border border-warm-200/30 rounded-2xl rounded-bl-md">
                      <TypingIndicator />
                    </div>
                  ) : (
                    <div
                      className={`max-w-[85%] px-4 py-2.5 text-[13px] leading-relaxed ${
                        msg.role === "user"
                          ? "bg-slate-900 text-white rounded-2xl rounded-br-md"
                          : "bg-warm-50 border border-warm-200/30 text-slate-700 rounded-2xl rounded-bl-md"
                      }`}
                    >
                      {msg.role === "model" ? (
                        <div className="guide-prose prose prose-sm max-w-none prose-headings:text-[13px] prose-headings:font-semibold prose-headings:text-slate-800 prose-headings:mb-1 prose-headings:mt-2 prose-p:text-[13px] prose-p:leading-relaxed prose-p:text-slate-600 prose-p:my-1 prose-li:text-[13px] prose-li:text-slate-600 prose-li:my-0 prose-strong:text-slate-800 prose-code:text-[12px] prose-code:bg-warm-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-ol:my-1 prose-ul:my-1">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                          {isTyping && (
                            <span
                              className="inline-block w-[2px] h-[14px] bg-slate-500 rounded-full ml-0.5 align-text-bottom"
                              style={{ animation: "guideCursor 0.8s step-end infinite" }}
                            />
                          )}
                        </div>
                      ) : (
                        msg.content
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Suggestions */}
          {showSuggestions && (
            <div className="px-4 pb-2 flex flex-wrap gap-1.5 shrink-0">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="cursor-pointer px-3 py-1.5 text-[11px] font-medium text-slate-500 bg-warm-50 border border-warm-200/40 rounded-full hover:border-warm-200 hover:text-slate-700 transition-all duration-300"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="px-4 pb-4 pt-2 border-t border-warm-200/20 shrink-0">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything about the platform..."
                disabled={streaming}
                rows={1}
                className="flex-1 resize-none px-4 py-2.5 border border-warm-200/40 rounded-xl bg-warm-50/30 text-[13px] text-slate-800 placeholder:text-slate-300 outline-none transition-all duration-300 focus:border-slate-300 focus:ring-2 focus:ring-slate-200/30 disabled:opacity-50 max-h-24"
                style={{ minHeight: "40px" }}
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || streaming}
                className="cursor-pointer w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-300 shrink-0"
              >
                {streaming ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <FiSend className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
