"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signUp, useSession } from "@/lib/auth-client";
import { getDashboardPath, loginWithGoogle, loginWithApple } from "@/services/auth.service";
import { FiHeart, FiArrowRight } from "react-icons/fi";
import { PiStorefrontDuotone } from "react-icons/pi";
import { FcGoogle } from "react-icons/fc";
import { FaApple } from "react-icons/fa";

type RoleOption = "couple" | "vendor";

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div className="h-8 w-52 bg-warm-100 rounded-lg animate-pulse" />
          <div className="h-4 w-64 bg-warm-100 rounded animate-pulse" />
          <div className="space-y-4 mt-8">
            <div className="h-14 bg-warm-100 rounded-2xl animate-pulse" />
            <div className="h-14 bg-warm-100 rounded-2xl animate-pulse" />
            <div className="h-14 bg-warm-100 rounded-2xl animate-pulse" />
          </div>
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, isPending } = useSession();
  const isInvitation = searchParams.get("invitation") === "1";
  const redirectPath = searchParams.get("redirect") || "";
  const inviteEmail = searchParams.get("email") || "";

  const [name, setName] = useState("");
  const [email, setEmail] = useState(inviteEmail);
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<RoleOption>(isInvitation ? "vendor" : "couple");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isPending && session?.user) {
      const userRole = (session.user as Record<string, unknown>).role as string;
      router.replace(getDashboardPath(userRole));
    }
  }, [session, isPending, router]);

  useEffect(() => {
    const r = searchParams.get("role");
    if (r === "vendor") setRole("vendor");
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const checkRes = await fetch("/api/v1/auth/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const checkData = await checkRes.json();
      if (!checkData.available) {
        setError("An account with this email already exists. Please sign in instead.");
        setLoading(false);
        return;
      }
    } catch {
      // If the check fails, proceed with signup and let Better Auth handle it
    }

    const { data, error: authError } = await signUp.email({
      name,
      email,
      password,
      accountType: role,
    } as Parameters<typeof signUp.email>[0]);

    setLoading(false);

    if (authError) {
      setError(authError.message || "Registration failed. Please try again.");
      return;
    }

    if (data?.user) {
      if (isInvitation && redirectPath) {
        const invIdMatch = redirectPath.match(/\/accept-invitation\/(.+)/);
        if (invIdMatch) {
          const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
          fetch(`${apiBase}/api/v1/auth/invitation/${invIdMatch[1]}/accepted`, {
            method: "POST",
            credentials: "include",
          }).catch(() => {});
        }
        try { localStorage.setItem("twedar_post_verify_redirect", redirectPath); } catch {}
        router.push(`/check-email?email=${encodeURIComponent(email)}&redirect=${encodeURIComponent(redirectPath)}`);
      } else {
        router.push(`/check-email?email=${encodeURIComponent(email)}`);
      }
    }
  }

  const inputClasses =
    "w-full px-4 py-3.5 border border-warm-200/60 rounded-2xl text-[14px] text-slate-800 bg-white outline-none transition-all duration-500 placeholder:text-slate-300 focus:border-slate-300 focus:shadow-[0_0_0_3px_rgba(250,248,245,1),0_0_0_5px_rgba(201,168,76,0.15)]";

  return (
    <div className="animate-reveal-up">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-slate-900 tracking-headline mb-2">
          {isInvitation ? "Join your team" : "Begin your journey"}
        </h1>
        <p className="text-[15px] text-slate-400 font-light">
          {isInvitation
            ? "Create your staff account to accept the invitation"
            : "Create your account and start planning your dream wedding"}
        </p>
      </div>

      {/* Invitation banner */}
      {isInvitation && (
        <div className="mb-8 rounded-2xl border border-slate-200/60 bg-champagne-50/50 px-5 py-4 text-[13px] text-slate-600 leading-relaxed">
          <PiStorefrontDuotone className="inline w-4 h-4 mr-1.5 -mt-0.5 text-gold-500" />
          You&apos;re being invited as <strong className="font-semibold text-slate-800">vendor staff</strong>. Your account will be set up accordingly.
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Role selector */}
        {!isInvitation && (
          <div className="flex flex-col gap-2.5">
            <label className="text-[13px] font-medium text-slate-600">
              I am a...
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setRole("couple")}
                className={`cursor-pointer flex-1 flex flex-col items-center gap-2 py-5 px-3 border rounded-2xl transition-all duration-500 ${
                  role === "couple"
                    ? "border-slate-900 bg-slate-900 shadow-[0_4px_20px_rgba(15,23,42,0.15)]"
                    : "border-warm-200/60 bg-white hover:border-warm-200"
                }`}
              >
                <FiHeart
                  className={`w-5 h-5 transition-colors duration-500 ${
                    role === "couple" ? "text-rose-300" : "text-slate-300"
                  }`}
                  strokeWidth={1.5}
                />
                <span
                  className={`text-[13px] font-semibold transition-colors duration-500 ${
                    role === "couple" ? "text-white" : "text-slate-700"
                  }`}
                >
                  Couple
                </span>
                <span
                  className={`text-[10px] transition-colors duration-500 ${
                    role === "couple" ? "text-white/50" : "text-slate-400"
                  }`}
                >
                  Planning our wedding
                </span>
              </button>
              <button
                type="button"
                onClick={() => setRole("vendor")}
                className={`cursor-pointer flex-1 flex flex-col items-center gap-2 py-5 px-3 border rounded-2xl transition-all duration-500 ${
                  role === "vendor"
                    ? "border-slate-900 bg-slate-900 shadow-[0_4px_20px_rgba(15,23,42,0.15)]"
                    : "border-warm-200/60 bg-white hover:border-warm-200"
                }`}
              >
                <PiStorefrontDuotone
                  className={`w-5 h-5 transition-colors duration-500 ${
                    role === "vendor" ? "text-gold-400" : "text-slate-300"
                  }`}
                />
                <span
                  className={`text-[13px] font-semibold transition-colors duration-500 ${
                    role === "vendor" ? "text-white" : "text-slate-700"
                  }`}
                >
                  Vendor
                </span>
                <span
                  className={`text-[10px] transition-colors duration-500 ${
                    role === "vendor" ? "text-white/50" : "text-slate-400"
                  }`}
                >
                  Offering services
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Social login */}
        {!isInvitation && (
          <>
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => loginWithGoogle(role)}
                className="cursor-pointer group flex items-center justify-center gap-3 w-full py-3.5 bg-white border border-warm-200/60 rounded-2xl text-[14px] font-medium text-slate-700 transition-all duration-500 hover:border-warm-200 hover:shadow-[0_4px_20px_rgba(15,23,42,0.04)]"
              >
                <FcGoogle className="w-5 h-5" />
                Continue with Google
              </button>
              <button
                type="button"
                onClick={() => loginWithApple(role)}
                className="cursor-pointer group flex items-center justify-center gap-3 w-full py-3.5 bg-slate-900 rounded-2xl text-[14px] font-medium text-white transition-all duration-500 hover:bg-slate-800 hover:shadow-[0_4px_20px_rgba(15,23,42,0.15)]"
              >
                <FaApple className="w-5 h-5" />
                Continue with Apple
              </button>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-warm-200 to-transparent" />
              <span className="text-[11px] uppercase tracking-editorial text-slate-300 font-medium">
                or
              </span>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-warm-200 to-transparent" />
            </div>
          </>
        )}

        {/* Full name */}
        <div className="flex flex-col gap-2">
          <label htmlFor="name" className="text-[13px] font-medium text-slate-600">
            Full name
          </label>
          <input
            id="name"
            type="text"
            required
            placeholder="Your full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClasses}
          />
        </div>

        {/* Email */}
        <div className="flex flex-col gap-2">
          <label htmlFor="email" className="text-[13px] font-medium text-slate-600">
            Email address
          </label>
          <input
            id="email"
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => { if (!isInvitation || !inviteEmail) setEmail(e.target.value); }}
            readOnly={isInvitation && !!inviteEmail}
            className={`${inputClasses} ${
              isInvitation && inviteEmail ? "!bg-warm-50 cursor-not-allowed opacity-70" : ""
            }`}
          />
          {isInvitation && inviteEmail && (
            <span className="text-[11px] text-slate-400 font-light">
              This email is linked to your invitation and cannot be changed.
            </span>
          )}
        </div>

        {/* Password */}
        <div className="flex flex-col gap-2">
          <label htmlFor="password" className="text-[13px] font-medium text-slate-600">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={8}
            placeholder="Create a strong password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClasses}
          />
          <span className="text-[11px] text-slate-300 font-light">
            At least 8 characters
          </span>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-2xl border border-rose-100 bg-rose-50/50 px-4 py-3.5 text-[13px] text-rose-600 leading-relaxed">
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="cursor-pointer group w-full flex items-center justify-center gap-2 py-3.5 mt-1 bg-slate-900 text-white rounded-2xl text-[14px] font-semibold transition-all duration-500 hover:bg-slate-800 hover:shadow-[0_4px_20px_rgba(15,23,42,0.15)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Creating account...
            </span>
          ) : (
            <>
              Create account
              <FiArrowRight className="w-4 h-4 transition-transform duration-500 group-hover:translate-x-0.5" aria-hidden />
            </>
          )}
        </button>
      </form>

      {/* Footer */}
      <p className="text-center text-[14px] text-slate-400 mt-10 font-light">
        Already have an account?{" "}
        <a
          href="/login"
          className="font-semibold text-slate-900 hover:text-gold-600 transition-colors duration-300"
        >
          Sign in
        </a>
      </p>
    </div>
  );
}
