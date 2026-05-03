"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { FiAlertTriangle } from "react-icons/fi";

export default function DeleteAccountSection() {
  const router = useRouter();
  const [step, setStep] = useState<"idle" | "confirm" | "password">("idle");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    setError("");
    setLoading(true);

    try {
      await authClient.deleteUser({
        password: password || undefined,
        callbackURL: "/",
      });
      router.replace("/");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete account";
      setError(msg);
      setLoading(false);
    }
  }

  if (step === "idle") {
    return (
      <div className="bg-white rounded-xl border border-red-200/60 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Delete Account</h3>
        <p className="text-sm text-gray-500 mb-4">
          Permanently delete your account and all associated data. This action cannot be undone.
        </p>
        <button
          onClick={() => setStep("confirm")}
          className="cursor-pointer px-4 py-2 text-sm font-medium text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
        >
          Delete my account
        </button>
      </div>
    );
  }

  if (step === "confirm") {
    return (
      <div className="bg-white rounded-xl border border-red-200 p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
            <FiAlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Are you sure?</h3>
            <p className="text-sm text-gray-500 mt-1">
              This will permanently delete your account. All your data, bookings, and conversations will be lost.
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setStep("idle")}
            className="cursor-pointer px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => setStep("password")}
            className="cursor-pointer px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-red-200 p-6">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
          <FiAlertTriangle className="w-5 h-5 text-red-500" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Confirm deletion</h3>
          <p className="text-sm text-gray-500 mt-1">
            Enter your password to permanently delete your account.
          </p>
        </div>
      </div>

      <div className="mb-4">
        <label htmlFor="delete-password" className="text-sm font-medium text-gray-700 block mb-1.5">
          Password
        </label>
        <input
          id="delete-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-800 bg-white outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
          disabled={loading}
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <button
          onClick={() => { setStep("idle"); setPassword(""); setError(""); }}
          disabled={loading}
          className="cursor-pointer px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={handleDelete}
          disabled={loading || !password}
          className="cursor-pointer px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Deleting..." : "Delete my account forever"}
        </button>
      </div>
    </div>
  );
}
