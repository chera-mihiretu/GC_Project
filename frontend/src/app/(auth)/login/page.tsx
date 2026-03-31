"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "@/lib/auth-client";
import { getDashboardPath, loginWithGoogle, loginWithApple } from "@/services/auth.service";
import { FcGoogle } from "react-icons/fc";
import { FaApple } from "react-icons/fa";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { data, error: authError } = await signIn.email({ email, password });
    setLoading(false);

    if (authError) {
      if (authError.status === 403) {
        router.push(`/check-email?email=${encodeURIComponent(email)}`);
        return;
      }
      setError(authError.message || "Invalid email or password");
      return;
    }

    if (data?.user) {
      const role = (data.user as Record<string, unknown>).role as string;
      router.push(getDashboardPath(role));
    }
  }

  return (
    <>
      <h1 className="font-display text-[28px] font-bold text-slate-900 mb-1.5 tracking-tight">
        Welcome back
      </h1>
      <p className="text-[15px] text-slate-500 mb-8 leading-relaxed">
        Sign in to continue planning your special day
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
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

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
              Password
            </label>
            <a
              href="/forget-password"
              className="text-xs font-medium text-rose-600 hover:text-rose-700 transition-colors"
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
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-4 my-6">
        <div className="flex-1 h-px bg-slate-200" />
        <span className="text-xs text-slate-400 font-medium uppercase tracking-widest">or</span>
        <div className="flex-1 h-px bg-slate-200" />
      </div>

      {/* Social buttons */}
      <div className="flex flex-col gap-2.5">
        <button
          onClick={() => loginWithGoogle()}
          className="flex items-center justify-center gap-2.5 w-full py-3 bg-white border-[1.5px] border-slate-200 rounded-[10px] text-sm font-medium text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50 hover:shadow-sm cursor-pointer"
        >
          <FcGoogle className="w-[18px] h-[18px]" />
          Continue with Google
        </button>
        <button
          onClick={() => loginWithApple()}
          className="flex items-center justify-center gap-2.5 w-full py-3 bg-white border-[1.5px] border-slate-200 rounded-[10px] text-sm font-medium text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50 hover:shadow-sm cursor-pointer"
        >
          <FaApple className="w-[18px] h-[18px]" />
          Continue with Apple
        </button>
      </div>

      <p className="text-center text-sm text-slate-500 mt-7">
        Don&apos;t have an account?{" "}
        <a href="/register" className="text-rose-600 font-semibold hover:text-rose-700 transition-colors">
          Create one
        </a>
      </p>
    </>
  );
}
