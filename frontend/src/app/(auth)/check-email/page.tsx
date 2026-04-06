"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { FiMail, FiCheckCircle } from "react-icons/fi";
import { AiOutlineLoading3Quarters } from "react-icons/ai";

function CheckEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const [resendStatus, setResendStatus] = useState<
    "idle" | "sending" | "sent" | "error"
  >("idle");

  async function handleResend() {
    if (!email || resendStatus === "sending") return;
    setResendStatus("sending");

    try {
      await authClient.sendVerificationEmail({
        email,
        callbackURL: "/verify-email",
      });
      setResendStatus("sent");
    } catch {
      setResendStatus("error");
    }
  }

  return (
    <div className="text-center py-5">
      <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6">
        <FiMail className="w-8 h-8 text-rose-500" />
      </div>

      <h1 className="font-display text-[28px] font-bold text-slate-900 mb-2.5 tracking-tight">
        Check your inbox
      </h1>

      <p className="text-[15px] text-slate-500 mb-2 leading-relaxed">
        We&apos;ve sent a verification email to
      </p>
      {email && (
        <p className="text-[15px] font-semibold text-slate-800 mb-6">
          {email}
        </p>
      )}
      <p className="text-[15px] text-slate-500 mb-8 leading-relaxed">
        Click the link in the email to verify your account. You won&apos;t be
        able to sign in until your email is verified.
      </p>

      {resendStatus === "sent" ? (
        <div className="flex items-center justify-center gap-2 text-emerald-600 mb-6">
          <FiCheckCircle className="w-4 h-4" />
          <span className="text-sm font-medium">
            Verification email resent!
          </span>
        </div>
      ) : resendStatus === "error" ? (
        <p className="text-[13px] text-rose-600 bg-rose-50 border border-rose-200 rounded-md px-3.5 py-2.5 mb-6">
          Failed to resend. Please try again.
        </p>
      ) : null}

      <button
        onClick={handleResend}
        disabled={resendStatus === "sending" || resendStatus === "sent"}
        className="w-full py-3.5 bg-gradient-to-r from-rose-500 to-rose-600 text-white rounded-[10px] text-[15px] font-semibold tracking-wide shadow-[0_2px_8px_rgba(244,63,94,0.25)] transition-all hover:from-rose-600 hover:to-rose-700 hover:shadow-[0_4px_16px_rgba(244,63,94,0.35)] hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
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

      <p className="text-center text-sm text-slate-500 mt-7">
        Already verified?{" "}
        <a
          href="/login"
          className="text-rose-600 font-semibold hover:text-rose-700 transition-colors"
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
        <div className="text-center py-5">
          <AiOutlineLoading3Quarters className="w-12 h-12 text-rose-500 animate-spin mx-auto mb-6" />
          <p className="text-[15px] text-slate-500">Loading...</p>
        </div>
      }
    >
      <CheckEmailContent />
    </Suspense>
  );
}
