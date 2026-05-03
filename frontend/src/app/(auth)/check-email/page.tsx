"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { FiMail, FiCheckCircle } from "react-icons/fi";
import { AiOutlineLoading3Quarters } from "react-icons/ai";

function CheckEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const redirect = searchParams.get("redirect") || "";
  const [resendStatus, setResendStatus] = useState<
    "idle" | "sending" | "sent" | "error"
  >("idle");

  const verifyCallbackURL = redirect
    ? `/verify-email?email=${encodeURIComponent(email)}&redirect=${encodeURIComponent(redirect)}`
    : `/verify-email?email=${encodeURIComponent(email)}`;

  async function handleResend() {
    if (!email || resendStatus === "sending") return;
    setResendStatus("sending");

    try {
      await authClient.sendVerificationEmail({
        email,
        callbackURL: verifyCallbackURL,
      });
      setResendStatus("sent");
    } catch {
      setResendStatus("error");
    }
  }

  return (
    <div className="text-center">
      <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-5">
        <FiMail className="w-5 h-5 text-rose-500" />
      </div>

      <h1 className="text-2xl font-bold text-slate-800 mb-2">
        Check your inbox
      </h1>

      <p className="text-slate-500 mb-1">
        We sent a verification email to
      </p>
      {email && (
        <p className="font-semibold text-slate-700 mb-4">
          {email}
        </p>
      )}
      <p className="text-sm text-slate-500 mb-6">
        Click the link in the email to verify your account.
      </p>

      {resendStatus === "sent" ? (
        <div className="flex items-center justify-center gap-2 text-emerald-600 mb-5">
          <FiCheckCircle className="w-4 h-4" />
          <span className="text-sm font-medium">Email resent!</span>
        </div>
      ) : resendStatus === "error" ? (
        <p className="text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2 mb-5">
          Failed to resend. Please try again.
        </p>
      ) : null}

      <button
        onClick={handleResend}
        disabled={resendStatus === "sending" || resendStatus === "sent"}
        className="w-full py-2.5 bg-rose-500 text-white rounded-lg text-sm font-semibold transition-all hover:bg-rose-600 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {resendStatus === "sending" ? (
          <span className="flex items-center justify-center gap-2">
            <AiOutlineLoading3Quarters className="w-4 h-4 animate-spin" />
            Sending...
          </span>
        ) : resendStatus === "sent" ? (
          "Email sent"
        ) : (
          "Resend verification email"
        )}
      </button>

      <p className="text-center text-sm text-slate-500 mt-6">
        Already verified?{" "}
        <a
          href={email ? `/login?email=${encodeURIComponent(email)}` : "/login"}
          className="text-rose-500 font-semibold hover:text-rose-600 transition-colors"
        >
          Sign in
        </a>
      </p>
    </div>
  );
}

export default function CheckEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="text-center py-4">
          <AiOutlineLoading3Quarters className="w-8 h-8 text-rose-500 animate-spin mx-auto mb-4" />
          <p className="text-sm text-slate-500">Loading...</p>
        </div>
      }
    >
      <CheckEmailContent />
    </Suspense>
  );
}
