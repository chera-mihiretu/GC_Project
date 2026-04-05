"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signUp } from "@/lib/auth-client";
import { getDashboardPath } from "@/services/auth.service";
import { FiHeart } from "react-icons/fi";
import { PiStorefrontDuotone } from "react-icons/pi";

type RoleOption = "couple" | "vendor";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<RoleOption>("couple");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { data, error: authError } = await signUp.email({
      name,
      email,
      password,
    });

    setLoading(false);

    if (authError) {
      setError(authError.message || "Registration failed. Please try again.");
      return;
    }

    if (data?.user) {
      router.push(getDashboardPath(role));
    }
  }

  return (
    <>
      <h1 className="font-display text-[28px] font-bold text-slate-900 mb-1.5 tracking-tight">
        Begin your journey
      </h1>
      <p className="text-[15px] text-slate-500 mb-8 leading-relaxed">
        Create your account and start planning the wedding of your dreams
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Role selector */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
            I am a...
          </label>
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={() => setRole("couple")}
              className={`flex-1 flex flex-col items-center gap-1.5 py-4 px-3 border-2 rounded-2xl transition-all cursor-pointer ${
                role === "couple"
                  ? "border-rose-500 bg-rose-50 ring-[3px] ring-rose-100"
                  : "border-slate-200 bg-white hover:border-rose-300 hover:bg-rose-25"
              }`}
            >
              <FiHeart className={`w-7 h-7 ${role === "couple" ? "text-rose-500" : "text-slate-400"}`} />
              <span className="text-sm font-semibold text-slate-800">Couple</span>
              <span className="text-[11px] text-slate-400 text-center leading-tight">
                Planning our wedding
              </span>
            </button>
            <button
              type="button"
              onClick={() => setRole("vendor")}
              className={`flex-1 flex flex-col items-center gap-1.5 py-4 px-3 border-2 rounded-2xl transition-all cursor-pointer ${
                role === "vendor"
                  ? "border-rose-500 bg-rose-50 ring-[3px] ring-rose-100"
                  : "border-slate-200 bg-white hover:border-rose-300 hover:bg-rose-25"
              }`}
            >
              <PiStorefrontDuotone className={`w-7 h-7 ${role === "vendor" ? "text-rose-500" : "text-slate-400"}`} />
              <span className="text-sm font-semibold text-slate-800">Vendor</span>
              <span className="text-[11px] text-slate-400 text-center leading-tight">
                Offering services
              </span>
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="name" className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
            Full name
          </label>
          <input
            id="name"
            type="text"
            required
            placeholder="Your full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 border-[1.5px] border-slate-200 rounded-[10px] text-[15px] text-slate-800 bg-slate-50 outline-none transition-all placeholder:text-slate-400 focus:border-rose-400 focus:ring-[3px] focus:ring-rose-100 focus:bg-white"
          />
        </div>

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
          <label htmlFor="password" className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
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
            className="w-full px-4 py-3 border-[1.5px] border-slate-200 rounded-[10px] text-[15px] text-slate-800 bg-slate-50 outline-none transition-all placeholder:text-slate-400 focus:border-rose-400 focus:ring-[3px] focus:ring-rose-100 focus:bg-white"
          />
          <span className="text-xs text-slate-400 mt-0.5">At least 8 characters</span>
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
          {loading ? "Creating your account..." : "Create account"}
        </button>
      </form>

      <p className="text-center text-sm text-slate-500 mt-7">
        Already have an account?{" "}
        <a href="/login" className="text-rose-600 font-semibold hover:text-rose-700 transition-colors">
          Sign in
        </a>
      </p>
    </>
  );
}
