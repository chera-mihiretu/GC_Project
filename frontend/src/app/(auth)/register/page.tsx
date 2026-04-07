"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signUp } from "@/lib/auth-client";
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
      router.push(`/check-email?email=${encodeURIComponent(email)}`);
    }
  }

  return (
    <>
      <h1 className="text-2xl font-bold text-slate-800 mb-1">
        Begin your journey
      </h1>
      <p className="text-slate-500 mb-6">
        Create your account and start planning
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Role selector */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-slate-700">
            I am a...
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setRole("couple")}
              className={`flex-1 flex flex-col items-center gap-1 py-3 px-2 border rounded-xl transition-all cursor-pointer ${
                role === "couple"
                  ? "border-rose-400 bg-rose-50 ring-2 ring-rose-100"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <FiHeart className={`w-5 h-5 ${role === "couple" ? "text-rose-500" : "text-slate-400"}`} />
              <span className="text-sm font-medium text-slate-700">Couple</span>
              <span className="text-[10px] text-slate-400">Planning our wedding</span>
            </button>
            <button
              type="button"
              onClick={() => setRole("vendor")}
              className={`flex-1 flex flex-col items-center gap-1 py-3 px-2 border rounded-xl transition-all cursor-pointer ${
                role === "vendor"
                  ? "border-rose-400 bg-rose-50 ring-2 ring-rose-100"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <PiStorefrontDuotone className={`w-5 h-5 ${role === "vendor" ? "text-rose-500" : "text-slate-400"}`} />
              <span className="text-sm font-medium text-slate-700">Vendor</span>
              <span className="text-[10px] text-slate-400">Offering services</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="name" className="text-sm font-medium text-slate-700">
            Full name
          </label>
          <input
            id="name"
            type="text"
            required
            placeholder="Your full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-800 bg-white outline-none transition-all placeholder:text-slate-400 focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
          />
        </div>

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
          <label htmlFor="password" className="text-sm font-medium text-slate-700">
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
            className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-800 bg-white outline-none transition-all placeholder:text-slate-400 focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
          />
          <span className="text-xs text-slate-400">At least 8 characters</span>
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
          {loading ? "Creating account..." : "Create account"}
        </button>
      </form>

      <p className="text-center text-sm text-slate-500 mt-6">
        Already have an account?{" "}
        <a href="/login" className="text-rose-500 font-semibold hover:text-rose-600 transition-colors">
          Sign in
        </a>
      </p>
    </>
  );
}
