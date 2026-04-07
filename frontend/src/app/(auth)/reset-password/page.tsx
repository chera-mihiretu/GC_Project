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
      setError("Invalid or missing reset token.");
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
      setError("Password must be at least 8 characters");
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
      setError("An unexpected error occurred.");
    }
  }

  if (success) {
    return (
      <>
        <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <FiCheckCircle className="w-5 h-5 text-emerald-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800 mb-1 text-center">
          Password reset!
        </h1>
        <p className="text-slate-500 mb-6 text-center">
          Your password has been successfully reset.
        </p>

        <button
          onClick={() => router.push("/login")}
          className="w-full py-2.5 bg-rose-500 text-white rounded-lg text-sm font-semibold transition-all hover:bg-rose-600"
        >
          Continue to sign in
        </button>
      </>
    );
  }

  if (!token) {
    return (
      <>
        <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <FiLock className="w-5 h-5 text-rose-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800 mb-1 text-center">
          Invalid link
        </h1>
        <p className="text-slate-500 mb-6 text-center">
          This reset link is invalid or expired.
        </p>

        <Link
          href="/forget-password"
          className="flex items-center justify-center w-full py-2.5 bg-rose-500 text-white rounded-lg text-sm font-semibold transition-all hover:bg-rose-600"
        >
          Request new link
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
        Set new password
      </h1>
      <p className="text-slate-500 mb-6">
        Must be at least 8 characters.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-sm font-medium text-slate-700">
            New password
          </label>
          <input
            id="password"
            type="password"
            required
            placeholder="Enter new password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-800 bg-white outline-none transition-all placeholder:text-slate-400 focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700">
            Confirm password
          </label>
          <input
            id="confirmPassword"
            type="password"
            required
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
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
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
