"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { resetPassword } from "@/services/auth.service";
import { FiArrowLeft, FiCheckCircle, FiLock } from "react-icons/fi";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Invalid or missing reset token. Please request a new password reset link.");
    }
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    if (!token) {
      setError("Invalid reset token");
      return;
    }

    setLoading(true);

    try {
      const { error: resetError } = await resetPassword(token, password);
      setLoading(false);

      if (resetError) {
        setError(resetError.message || "Failed to reset password");
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
          <FiCheckCircle className="w-6 h-6 text-emerald-600" />
        </div>
        <h1 className="font-display text-[28px] font-bold text-slate-900 mb-2 tracking-tight text-center">
          Password reset successful
        </h1>
        <p className="text-[15px] text-slate-500 mb-8 leading-relaxed text-center">
          Your password has been successfully reset. You can now sign in with your new password.
        </p>

        <button
          onClick={() => router.push("/login")}
          className="flex items-center justify-center gap-2 w-full py-3.5 bg-gradient-to-r from-rose-500 to-rose-600 text-white rounded-[10px] text-[15px] font-semibold tracking-wide shadow-[0_2px_8px_rgba(244,63,94,0.25)] transition-all hover:from-rose-600 hover:to-rose-700"
        >
          Continue to sign in
        </button>
      </>
    );
  }

  if (!token) {
    return (
      <>
        <div className="w-14 h-14 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <FiLock className="w-6 h-6 text-rose-600" />
        </div>
        <h1 className="font-display text-[28px] font-bold text-slate-900 mb-2 tracking-tight text-center">
          Invalid reset link
        </h1>
        <p className="text-[15px] text-slate-500 mb-8 leading-relaxed text-center">
          This password reset link is invalid or has expired. Please request a new one.
        </p>

        <Link
          href="/forget-password"
          className="flex items-center justify-center gap-2 w-full py-3.5 bg-gradient-to-r from-rose-500 to-rose-600 text-white rounded-[10px] text-[15px] font-semibold tracking-wide shadow-[0_2px_8px_rgba(244,63,94,0.25)] transition-all hover:from-rose-600 hover:to-rose-700"
        >
          Request new reset link
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
        Set new password
      </h1>
      <p className="text-[15px] text-slate-500 mb-8 leading-relaxed">
        Your new password must be at least 8 characters long.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="password"
            className="text-xs font-semibold text-slate-700 uppercase tracking-wide"
          >
            New password
          </label>
          <input
            id="password"
            type="password"
            required
            placeholder="Enter new password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 border-[1.5px] border-slate-200 rounded-[10px] text-[15px] text-slate-800 bg-slate-50 outline-none transition-all placeholder:text-slate-400 focus:border-rose-400 focus:ring-[3px] focus:ring-rose-100 focus:bg-white"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="confirmPassword"
            className="text-xs font-semibold text-slate-700 uppercase tracking-wide"
          >
            Confirm password
          </label>
          <input
            id="confirmPassword"
            type="password"
            required
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
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
          {loading ? "Resetting..." : "Reset password"}
        </button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-10">
          <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
