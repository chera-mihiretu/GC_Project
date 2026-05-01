"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, Suspense, useCallback } from "react";
import { useSession, authClient } from "@/lib/auth-client";
import { getDashboardPath } from "@/services/auth.service";
import { FiCheckCircle, FiAlertCircle } from "react-icons/fi";
import { AiOutlineLoading3Quarters } from "react-icons/ai";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const { data: session, isPending } = useSession();
  const [verificationStatus, setVerificationStatus] = useState<
    "loading" | "success" | "error"
  >("loading");
  const [countdown, setCountdown] = useState(5);
  const status = session?.user
    ? "success"
    : token
      ? verificationStatus
      : "error";

  const redirectToDashboard = useCallback(() => {
    const role = (session?.user as Record<string, unknown> | undefined)
      ?.role as string | undefined;
    router.push(getDashboardPath(role));
  }, [session, router]);

  useEffect(() => {
    if (isPending) return;

    if (session?.user || !token) return;

    authClient
      .verifyEmail({ query: { token } })
      .then(() => setVerificationStatus("success"))
      .catch(() => setVerificationStatus("error"));
  }, [token, session, isPending]);

  useEffect(() => {
    if (status !== "success") return;

    if (countdown <= 0) {
      redirectToDashboard();
      return;
    }

    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [status, countdown, redirectToDashboard]);

  if (status === "loading") {
    return (
      <div className="text-center py-5">
        <AiOutlineLoading3Quarters className="w-12 h-12 text-rose-500 animate-spin mx-auto mb-6" />
        <h1 className="font-display text-2xl font-bold text-slate-900 mb-2.5">
          Verifying your email...
        </h1>
        <p className="text-[15px] text-slate-500 leading-relaxed">
          Just a moment while we confirm your address.
        </p>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="text-center py-5">
        <FiCheckCircle className="w-14 h-14 text-emerald-500 mx-auto mb-5" />
        <h1 className="font-display text-2xl font-bold text-slate-900 mb-2.5">
          Verification successful!
        </h1>
        <p className="text-[15px] text-slate-500 mb-7 leading-relaxed">
          Your email has been confirmed. You&apos;re all set to start planning
          your perfect day.
        </p>
        <p className="text-sm text-slate-400 mb-6">
          Redirecting to your dashboard in{" "}
          <span className="font-semibold text-slate-600">{countdown}</span>{" "}
          second{countdown !== 1 ? "s" : ""}...
        </p>
        <button
          onClick={redirectToDashboard}
          className="inline-block px-8 py-3 bg-linear-to-r from-rose-500 to-rose-600 text-white rounded-[10px] text-sm font-semibold shadow-[0_2px_8px_rgba(244,63,94,0.25)] transition-all hover:from-rose-600 hover:to-rose-700 hover:shadow-[0_4px_16px_rgba(244,63,94,0.35)] hover:-translate-y-0.5 cursor-pointer"
        >
          Go to dashboard now
        </button>
      </div>
    );
  }

  return (
    <div className="text-center py-5">
      <FiAlertCircle className="w-14 h-14 text-rose-400 mx-auto mb-5" />
      <h1 className="font-display text-2xl font-bold text-slate-900 mb-2.5">
        Verification failed
      </h1>
      <p className="text-[15px] text-slate-500 mb-7 leading-relaxed">
        This link may have expired or is invalid. Please try registering again
        to receive a new verification email.
      </p>
      <a
        href="/register"
        className="inline-block px-8 py-3 bg-linear-to-r from-rose-500 to-rose-600 text-white rounded-[10px] text-sm font-semibold shadow-[0_2px_8px_rgba(244,63,94,0.25)] transition-all hover:from-rose-600 hover:to-rose-700 hover:shadow-[0_4px_16px_rgba(244,63,94,0.35)] hover:-translate-y-0.5"
      >
        Back to registration
      </a>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="text-center py-5">
          <AiOutlineLoading3Quarters className="w-12 h-12 text-rose-500 animate-spin mx-auto mb-6" />
          <h1 className="font-display text-2xl font-bold text-slate-900 mb-2.5">
            Verifying your email...
          </h1>
          <p className="text-[15px] text-slate-500">Please wait.</p>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
