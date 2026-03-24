"use client";

import { useState } from "react";
import Link from "next/link";
import { forgetPassword } from "@/services/auth.service";
import { FiArrowLeft, FiMail } from "react-icons/fi";

export default function ForgetPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { error: resetError } = await forgetPassword(email);
      setLoading(false);

      if (resetError) {
        setError(resetError.message || "Failed to send reset email");
        return;
      }

      setSuccess(true);
    } catch {
      setLoading(false);
      setError("An unexpected error occurred. Please try again.");
    }
  }

  if (success) {
    return (
      <>
        <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <FiMail className="w-6 h-6 text-emerald-600" />
        </div>
        <h1 className="font-display text-[28px] font-bold text-slate-900 mb-2 tracking-tight text-center">
          Check your email
        </h1>
        <p className="text-[15px] text-slate-500 mb-8 leading-relaxed text-center">
          We&apos;ve sent a password reset link to{" "}
          <span className="font-medium text-slate-700">{email}</span>
        </p>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-amber-800">
            Didn&apos;t receive the email? Check your spam folder or{" "}
            <button
              onClick={() => setSuccess(false)}
              className="font-semibold text-amber-900 hover:underline"
            >
              try again
            </button>
          </p>
        </div>

        <Link
          href="/login"
          className="flex items-center justify-center gap-2 w-full py-3.5 bg-gradient-to-r from-rose-500 to-rose-600 text-white rounded-[10px] text-[15px] font-semibold tracking-wide shadow-[0_2px_8px_rgba(244,63,94,0.25)] transition-all hover:from-rose-600 hover:to-rose-700"
        >
          Back to sign in
        </Link>
      </>
    );
  }

  return (
    <>
      <Link
        href="/login"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors mb-8"
      >
        <FiArrowLeft className="w-4 h-4" />
        Back to sign in
      </Link>

      <h1 className="font-display text-[28px] font-bold text-slate-900 mb-1.5 tracking-tight">
        Forgot password?
      </h1>
      <p className="text-[15px] text-slate-500 mb-8 leading-relaxed">
        No worries, we&apos;ll send you reset instructions.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="email"
            className="text-xs font-semibold text-slate-700 uppercase tracking-wide"
          >
            Email address
          </label>
          <input
            id="email"
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 border-[1.5px] border-slate-200 rounded-[10px] text-[15px] text-slate-800 bg-slate-50 outline-none transition-all placeholder:text-slate-400 focus:border-rose-400 focus:ring-[3px] focus:ring-rose-100 focus:bg-white"
          />
        </div>

        {error && (
          <p className="text-[13px] text-rose-600 bg-rose-50 border border-rose-200 rounded-md px-3.5 py-2.5">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 mt-1 bg-gradient-to-r from-rose-500 to-rose-600 text-white rounded-[10px] text-[15px] font-semibold tracking-wide shadow-[0_2px_8px_rgba(244,63,94,0.25)] transition-all hover:from-rose-600 hover:to-rose-700 hover:shadow-[0_4px_16px_rgba(244,63,94,0.35)] hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
        >
          {loading ? "Sending..." : "Send reset link"}
        </button>
      </form>
    </>
  );
}
