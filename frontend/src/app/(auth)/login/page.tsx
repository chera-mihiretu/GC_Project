"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, useSession } from "@/lib/auth-client";
import { getDashboardPath, loginWithGoogle, loginWithApple } from "@/services/auth.service";
import { FcGoogle } from "react-icons/fc";
import { FaApple } from "react-icons/fa";
import { FiArrowRight } from "react-icons/fi";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div className="h-8 w-48 bg-warm-100 rounded-lg animate-pulse" />
          <div className="h-4 w-64 bg-warm-100 rounded animate-pulse" />
          <div className="space-y-4 mt-8">
            <div className="h-12 bg-warm-100 rounded-xl animate-pulse" />
            <div className="h-12 bg-warm-100 rounded-xl animate-pulse" />
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, isPending } = useSession();
  const prefillEmail = searchParams.get("email") || "";
  const [email, setEmail] = useState(prefillEmail);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isPending && session?.user) {
      const role = (session.user as Record<string, unknown>).role as string;
      router.replace(getDashboardPath(role));
    }
  }, [session, isPending, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { data, error: authError } = await signIn.email({ email, password });
    setLoading(false);

    if (authError) {
      const msg = (authError.message ?? "").toLowerCase();
      const isBanned = msg.includes("banned") || msg.includes("suspended");

      if (isBanned) {
        setError(authError.message || "Your account has been suspended. Please contact support.");
        return;
      }

      if (authError.status === 403) {
        router.push(`/check-email?email=${encodeURIComponent(email)}`);
        return;
      }
      setError(authError.message || "Invalid email or password");
      return;
    }

    if (data?.user) {
      const redirect = searchParams.get("redirect");
      if (redirect) {
        router.push(redirect);
      } else {
        const role = (data.user as Record<string, unknown>).role as string;
        router.push(getDashboardPath(role));
      }
    }
  }

  return (
    <div className="animate-reveal-up">
      {/* Header */}
      <div className="mb-10">
        <h1 className="font-display text-3xl font-bold text-slate-900 tracking-headline mb-2">
          Welcome back
        </h1>
        <p className="text-[15px] text-slate-400 font-light">
          Sign in to continue planning your special day
        </p>
      </div>

      {/* No-account warning */}
      {searchParams.get("error") === "no_account" && (
        <div className="mb-8 rounded-2xl border border-gold-200/60 bg-gold-50/50 px-5 py-4 text-sm text-slate-600">
          No account found with this email.{" "}
          <a href="/register" className="font-semibold text-slate-900 hover:text-gold-600 transition-colors duration-300 underline underline-offset-2">
            Create an account
          </a>{" "}
          first, then sign in.
        </div>
      )}

      {/* Social login */}
      <div className="flex flex-col gap-3 mb-8">
        <button
          onClick={() => loginWithGoogle()}
          className="cursor-pointer group flex items-center justify-center gap-3 w-full py-3.5 bg-white border border-warm-200/60 rounded-2xl text-[14px] font-medium text-slate-700 transition-all duration-500 hover:border-warm-200 hover:shadow-[0_4px_20px_rgba(15,23,42,0.04)]"
        >
          <FcGoogle className="w-5 h-5" />
          Continue with Google
        </button>
        <button
          onClick={() => loginWithApple()}
          className="cursor-pointer group flex items-center justify-center gap-3 w-full py-3.5 bg-slate-900 rounded-2xl text-[14px] font-medium text-white transition-all duration-500 hover:bg-slate-800 hover:shadow-[0_4px_20px_rgba(15,23,42,0.15)]"
        >
          <FaApple className="w-5 h-5" />
          Continue with Apple
        </button>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-4 mb-8">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-warm-200 to-transparent" />
        <span className="text-[11px] uppercase tracking-editorial text-slate-300 font-medium">
          or
        </span>
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-warm-200 to-transparent" />
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
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
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3.5 border border-warm-200/60 rounded-2xl text-[14px] text-slate-800 bg-white outline-none transition-all duration-500 placeholder:text-slate-300 focus:border-slate-300 focus:shadow-[0_0_0_3px_rgba(250,248,245,1),0_0_0_5px_rgba(201,168,76,0.15)]"
          />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-[13px] font-medium text-slate-600">
              Password
            </label>
            <a
              href="/forget-password"
              className="text-[12px] font-medium text-slate-400 hover:text-slate-900 transition-colors duration-300"
            >
              Forgot password?
            </a>
          </div>
          <input
            id="password"
            type="password"
            required
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3.5 border border-warm-200/60 rounded-2xl text-[14px] text-slate-800 bg-white outline-none transition-all duration-500 placeholder:text-slate-300 focus:border-slate-300 focus:shadow-[0_0_0_3px_rgba(250,248,245,1),0_0_0_5px_rgba(201,168,76,0.15)]"
          />
        </div>

        {error && (
          <div className="rounded-2xl border border-rose-100 bg-rose-50/50 px-4 py-3.5 text-[13px] text-rose-600 leading-relaxed">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="cursor-pointer group w-full flex items-center justify-center gap-2 py-3.5 mt-1 bg-slate-900 text-white rounded-2xl text-[14px] font-semibold transition-all duration-500 hover:bg-slate-800 hover:shadow-[0_4px_20px_rgba(15,23,42,0.15)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Signing in...
            </span>
          ) : (
            <>
              Sign in
              <FiArrowRight className="w-4 h-4 transition-transform duration-500 group-hover:translate-x-0.5" aria-hidden />
            </>
          )}
        </button>
      </form>

      {/* Footer link */}
      <p className="text-center text-[14px] text-slate-400 mt-10 font-light">
        Don&apos;t have an account?{" "}
        <a
          href="/register"
          className="font-semibold text-slate-900 hover:text-gold-600 transition-colors duration-300"
        >
          Create one
        </a>
      </p>
    </div>
  );
}
