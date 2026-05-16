"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { FiAlertTriangle } from "react-icons/fi";

export default function DeleteAccountSection() {
  const router = useRouter();
  const [step, setStep] = useState<"idle" | "confirm" | "password">("idle");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    setError("");
    setLoading(true);

    try {
      await authClient.deleteUser({
        password: password || undefined,
        callbackURL: "/",
      });
      router.replace("/");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete account";
      setError(msg);
      setLoading(false);
    }
  }

  if (step === "idle") {
    return (
      <div className="rounded-2xl border border-red-200/40 bg-white p-8 sm:p-10">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center shrink-0">
            <FiAlertTriangle className="w-4.5 h-4.5 text-red-400" />
          </div>
          <div>
            <h3 className="text-[15px] font-semibold text-slate-900 mb-1">Delete Account</h3>
            <p className="text-[13px] text-slate-400 font-light leading-relaxed mb-6">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
            <button
              onClick={() => setStep("confirm")}
              className="cursor-pointer px-5 py-2.5 text-[13px] font-semibold text-red-600 border border-red-200/60 rounded-xl hover:bg-red-50 hover:border-red-200 transition-all duration-500"
            >
              Delete my account
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === "confirm") {
    return (
      <div className="rounded-2xl border border-red-200/50 bg-white p-8 sm:p-10">
        <div className="flex items-start gap-4 mb-8">
          <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center shrink-0">
            <FiAlertTriangle className="w-4.5 h-4.5 text-red-500" />
          </div>
          <div>
            <h3 className="text-[15px] font-semibold text-slate-900 mb-1">Are you sure?</h3>
            <p className="text-[13px] text-slate-400 font-light leading-relaxed">
              This will permanently delete your account. All your data, bookings, and conversations will be lost.
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setStep("idle")}
            className="cursor-pointer px-5 py-2.5 text-[13px] font-semibold text-slate-600 border border-warm-200/60 rounded-xl hover:bg-warm-50 hover:border-warm-200 transition-all duration-500"
          >
            Cancel
          </button>
          <button
            onClick={() => setStep("password")}
            className="cursor-pointer px-5 py-2.5 text-[13px] font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 shadow-[0_2px_12px_rgba(220,38,38,0.15)] hover:shadow-[0_4px_20px_rgba(220,38,38,0.25)] transition-all duration-500"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-red-200/50 bg-white p-8 sm:p-10">
      <div className="flex items-start gap-4 mb-8">
        <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center shrink-0">
          <FiAlertTriangle className="w-4.5 h-4.5 text-red-500" />
        </div>
        <div>
          <h3 className="text-[15px] font-semibold text-slate-900 mb-1">Confirm deletion</h3>
          <p className="text-[13px] text-slate-400 font-light leading-relaxed">
            Enter your password to permanently delete your account.
          </p>
        </div>
      </div>

      <div className="mb-6">
        <label htmlFor="delete-password" className="text-[13px] font-medium text-slate-600 block mb-2">
          Password
        </label>
        <input
          id="delete-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          className="w-full px-4 py-3.5 border border-warm-200/60 rounded-2xl text-[14px] text-slate-800 bg-white outline-none transition-all duration-500 placeholder:text-slate-300 focus:border-red-300 focus:shadow-[0_0_0_3px_rgba(254,242,242,1),0_0_0_5px_rgba(220,38,38,0.1)]"
          disabled={loading}
        />
      </div>

      {error && (
        <div className="rounded-2xl border border-red-100 bg-red-50/50 px-4 py-3.5 text-[13px] text-red-600 leading-relaxed mb-6">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={() => { setStep("idle"); setPassword(""); setError(""); }}
          disabled={loading}
          className="cursor-pointer px-5 py-2.5 text-[13px] font-semibold text-slate-600 border border-warm-200/60 rounded-xl hover:bg-warm-50 hover:border-warm-200 transition-all duration-500 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={handleDelete}
          disabled={loading || !password}
          className="cursor-pointer px-5 py-2.5 text-[13px] font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 shadow-[0_2px_12px_rgba(220,38,38,0.15)] hover:shadow-[0_4px_20px_rgba(220,38,38,0.25)] transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Deleting...
            </span>
          ) : (
            "Delete my account forever"
          )}
        </button>
      </div>
    </div>
  );
}
