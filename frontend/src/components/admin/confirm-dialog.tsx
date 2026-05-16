"use client";

import { useState } from "react";

interface Props {
  title: string;
  description: string;
  confirmLabel: string;
  confirmColor?: string;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

export default function ConfirmDialog({
  title,
  description,
  confirmLabel,
  confirmColor = "bg-slate-900 hover:bg-slate-800",
  onConfirm,
  onCancel,
}: Props) {
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-[0_20px_60px_rgba(15,23,42,0.15)] max-w-sm w-full mx-4 p-8 sm:p-10 animate-scale-reveal">
        <h3 className="font-display text-lg font-semibold text-slate-900 mb-2">{title}</h3>
        <p className="text-[13px] text-slate-400 font-light leading-relaxed mb-8">{description}</p>
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
