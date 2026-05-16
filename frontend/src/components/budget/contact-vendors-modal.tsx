"use client";

import { useState, useEffect } from "react";
import {
  draftVendorMessage,
  contactCategoryVendors,
  type DraftMessageResponse,
} from "@/services/budget.service";
import {
  FiX,
  FiSend,
  FiEdit3,
  FiCheck,
  FiAlertCircle,
} from "react-icons/fi";

interface ContactVendorsModalProps {
  categoryId: string;
  categoryName: string;
  onClose: () => void;
  onSent: () => void;
}

export default function ContactVendorsModal({
  categoryId,
  categoryName,
  onClose,
  onSent,
}: ContactVendorsModalProps) {
  const [step, setStep] = useState<"loading" | "review" | "sending" | "done" | "error">("loading");
  const [draft, setDraft] = useState<DraftMessageResponse | null>(null);
  const [message, setMessage] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sendResult, setSendResult] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await draftVendorMessage(categoryId);
        if (cancelled) return;
        setDraft(result);
        setMessage(result.draft);
        setStep("review");
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to draft message");
        setStep("error");
      }
    })();
    return () => { cancelled = true; };
  }, [categoryId]);

  async function handleSend() {
    setStep("sending");
    try {
      const result = await contactCategoryVendors(categoryId, message);
      setSendResult(result.summary);
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send messages");
      setStep("error");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Contact Vendors</h2>
            <p className="text-xs text-gray-500">{categoryName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* Loading */}
          {step === "loading" && (
            <div className="flex flex-col items-center justify-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-pink-500 mb-3" />
              <p className="text-sm text-gray-500">AI is drafting your message...</p>
            </div>
          )}

          {/* Review draft */}
          {step === "review" && draft && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Sending to:</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {draft.vendors.map((v) => (
                    <span
                      key={v.id}
                      className="px-2.5 py-1 bg-pink-50 text-pink-700 text-xs font-medium rounded-full"
                    >
                      {v.businessName}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Message:</span>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="inline-flex items-center gap-1 text-xs text-pink-600 hover:text-pink-700 cursor-pointer"
                  >
                    <FiEdit3 className="w-3 h-3" />
                    {isEditing ? "Done editing" : "Edit message"}
                  </button>
                </div>
                {isEditing ? (
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={6}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none resize-none"
                    autoFocus
                  />
                ) : (
                  <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {message}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Sending */}
          {step === "sending" && (
            <div className="flex flex-col items-center justify-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-pink-500 mb-3" />
              <p className="text-sm text-gray-500">Sending messages to vendors...</p>
            </div>
          )}

          {/* Done */}
          {step === "done" && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-3">
                <FiCheck className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-base font-semibold text-gray-800 mb-1">Messages Sent</h3>
              <p className="text-sm text-gray-500">{sendResult}</p>
              <p className="text-xs text-gray-400 mt-2">
                Check your Messages page to see vendor replies.
              </p>
            </div>
          )}

          {/* Error */}
          {step === "error" && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-3">
                <FiAlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-base font-semibold text-gray-800 mb-1">Something went wrong</h3>
              <p className="text-sm text-red-500">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
          {step === "review" && (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                disabled={!message.trim()}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-sm bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors font-medium disabled:opacity-50 cursor-pointer"
              >
                <FiSend className="w-4 h-4" />
                Send to All
              </button>
            </>
          )}
          {(step === "done" || step === "error") && (
            <button
              onClick={() => { if (step === "done") onSent(); onClose(); }}
              className="px-5 py-2 text-sm bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors font-medium cursor-pointer"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
