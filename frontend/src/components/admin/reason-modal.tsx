"use client";

import { useState } from "react";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
        <p className="text-sm text-gray-500 mb-4">{description}</p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-rose-300 outline-none resize-none"
          placeholder="Enter reason..."
        />
        {error && <p className="text-red-600 text-xs mt-1">{error}</p>}
        <div className="flex justify-end gap-3 mt-4">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className={`px-4 py-2 text-sm text-white rounded-lg ${confirmColor} disabled:opacity-50`}
          >
            {loading ? "Processing..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
