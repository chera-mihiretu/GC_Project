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
        <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <FiMail className="w-5 h-5 text-emerald-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800 mb-1 text-center">
          Check your email
        </h1>
        <p className="text-slate-500 mb-6 text-center">
          We sent a password reset link to{" "}
          <span className="font-medium text-slate-700">{email}</span>
        </p>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-5 text-sm text-amber-700">
          Didn&apos;t receive the email? Check spam or{" "}
          <button
            onClick={() => setSuccess(false)}
            className="font-semibold text-amber-800 hover:underline"
          >
            try again
          </button>
        </div>

        <Link
          href="/login"
          className="flex items-center justify-center w-full py-2.5 bg-rose-500 text-white rounded-lg text-sm font-semibold transition-all hover:bg-rose-600"
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
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors mb-6"
      >
        <FiArrowLeft className="w-4 h-4" />
        Back to sign in
      </Link>

      <h1 className="text-2xl font-bold text-slate-800 mb-1">
        Forgot password?
      </h1>
      <p className="text-slate-500 mb-6">
        No worries, we&apos;ll send you reset instructions.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-sm font-medium text-slate-700">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-800 bg-white outline-none transition-all placeholder:text-slate-400 focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
          />
        </div>

        {error && (
          <p className="text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 mt-1 bg-rose-500 text-white rounded-lg text-sm font-semibold transition-all hover:bg-rose-600 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? "Sending..." : "Send reset link"}
        </button>
      </form>
    </>
  );
}
