"use client";

import { useState } from "react";
import { FiX } from "react-icons/fi";

interface Props {
  title: string;
  description: string;
  confirmLabel: string;
  confirmColor?: string;
  minLength?: number;
  onConfirm: (reason: string) => Promise<void>;
  onCancel: () => void;
}

export default function ReasonModal({
  title,
  description,
  confirmLabel,
  confirmColor = "bg-red-600 hover:bg-red-700",
  minLength = 10,
  onConfirm,
  onCancel,
}: Props) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleConfirm() {
    if (reason.trim().length < minLength) {
      setError(`Reason must be at least ${minLength} characters`);
      return;
    }
    setError("");
    setLoading(true);
    try {
      await onConfirm(reason.trim());
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-[0_20px_60px_rgba(15,23,42,0.15)] max-w-md w-full mx-4 p-8 sm:p-10 animate-scale-reveal">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="font-display text-lg font-semibold text-slate-900">{title}</h3>
            <p className="text-[12px] text-slate-400 font-light mt-1">{description}</p>
          </div>
          <button
            onClick={onCancel}
            className="cursor-pointer w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-slate-500 hover:bg-warm-50 transition-all duration-500"
          >
            <FiX className="w-4.5 h-4.5" />
          </button>
        </div>

        <div className="mb-6">
          <label className="block text-[12px] font-medium text-slate-500 mb-2">
            Reason
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            className="w-full px-4 py-3.5 border border-warm-200/60 rounded-xl text-[14px] text-slate-800 bg-white outline-none transition-all duration-500 placeholder:text-slate-300 resize-none focus:border-slate-300 focus:shadow-[0_0_0_3px_rgba(250,248,245,1),0_0_0_5px_rgba(201,168,76,0.15)]"
            placeholder="Enter reason..."
          />
          {error && <p className="text-[12px] text-red-500 font-light mt-2">{error}</p>}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="cursor-pointer flex-1 py-3 text-[13px] font-semibold text-slate-600 border border-warm-200/60 rounded-xl hover:bg-warm-50 hover:border-warm-200 disabled:opacity-40 transition-all duration-500"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className={`cursor-pointer flex-1 py-3 text-[13px] font-semibold text-white rounded-xl shadow-[0_2px_12px_rgba(15,23,42,0.1)] disabled:opacity-40 transition-all duration-500 ${confirmColor}`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing...
              </span>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
