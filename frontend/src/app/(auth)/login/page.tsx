"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "@/lib/auth-client";
import { getDashboardPath, loginWithGoogle, loginWithApple } from "@/services/auth.service";
import { FcGoogle } from "react-icons/fc";
import { FaApple } from "react-icons/fa";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
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
      <h1 className="text-2xl font-bold text-slate-800 mb-1">
        Welcome back
      </h1>
      <p className="text-slate-500 mb-6">
        Sign in to continue planning your special day
      </p>

      {searchParams.get("error") === "no_account" && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          No account found with this email.{" "}
          <a href="/register" className="font-semibold text-rose-500 hover:text-rose-600 underline">
            Create an account
          </a>{" "}
          first, then sign in.
        </div>
      )}

      {/* Social buttons first for better UX */}
      <div className="flex flex-col gap-2.5 mb-6">
        <button
          onClick={() => loginWithGoogle()}
          className="flex items-center justify-center gap-2.5 w-full py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 transition-all hover:bg-slate-50 hover:border-slate-300 hover:shadow-sm cursor-pointer"
        >
          <FcGoogle className="w-5 h-5" />
          Continue with Google
        </button>
        <button
          onClick={() => loginWithApple()}
          className="flex items-center justify-center gap-2.5 w-full py-2.5 bg-slate-900 border border-slate-900 rounded-lg text-sm font-medium text-white transition-all hover:bg-slate-800 cursor-pointer"
        >
          <FaApple className="w-5 h-5" />
          Continue with Apple
        </button>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 h-px bg-slate-200" />
        <span className="text-xs text-slate-400 font-medium">or continue with email</span>
        <div className="flex-1 h-px bg-slate-200" />
      </div>

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

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-sm font-medium text-slate-700">
              Password
            </label>
            <a
              href="/forget-password"
              className="text-xs font-medium text-rose-500 hover:text-rose-600 transition-colors"
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
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <p className="text-center text-sm text-slate-500 mt-6">
        Don&apos;t have an account?{" "}
        <a href="/register" className="text-rose-500 font-semibold hover:text-rose-600 transition-colors">
          Create one
        </a>
      </p>
    </>
  );
}
