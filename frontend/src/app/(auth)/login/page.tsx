"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "@/lib/auth-client";
import { getDashboardPath } from "@/services/auth.service";
import { loginWithGoogle, loginWithApple } from "@/services/auth.service";

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

    const { data, error: authError } = await signIn.email({
      email,
      password,
    });

    setLoading(false);

    if (authError) {
      setError(authError.message || "Invalid credentials");
      return;
    }

    if (data?.user) {
      const role = (data.user as Record<string, unknown>).role as string;
      router.push(getDashboardPath(role));
    }
  }

  return (
    <>
      <h1 style={{ textAlign: "center", marginBottom: 8, fontSize: 24 }}>
        Welcome back
      </h1>
      <p
        style={{
          textAlign: "center",
          marginBottom: 24,
          color: "#666",
          fontSize: 14,
        }}
      >
        Sign in to your Twedarr account
      </p>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 16 }}>
          <label
            htmlFor="email"
            style={{ display: "block", marginBottom: 4, fontSize: 14 }}
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px",
              border: "1px solid #ddd",
              borderRadius: 8,
              fontSize: 14,
              boxSizing: "border-box",
            }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label
            htmlFor="password"
            style={{ display: "block", marginBottom: 4, fontSize: 14 }}
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px",
              border: "1px solid #ddd",
              borderRadius: 8,
              fontSize: 14,
              boxSizing: "border-box",
            }}
          />
        </div>

        {error && (
          <p style={{ color: "#dc2626", fontSize: 13, marginBottom: 12 }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "10px 0",
            background: "#111",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            fontSize: 14,
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          margin: "20px 0",
          gap: 12,
        }}
      >
        <hr style={{ flex: 1, border: "none", borderTop: "1px solid #eee" }} />
        <span style={{ color: "#999", fontSize: 12 }}>OR</span>
        <hr style={{ flex: 1, border: "none", borderTop: "1px solid #eee" }} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <button
          onClick={() => loginWithGoogle()}
          style={{
            width: "100%",
            padding: "10px 0",
            background: "#fff",
            border: "1px solid #ddd",
            borderRadius: 8,
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          Continue with Google
        </button>
        <button
          onClick={() => loginWithApple()}
          style={{
            width: "100%",
            padding: "10px 0",
            background: "#fff",
            border: "1px solid #ddd",
            borderRadius: 8,
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          Continue with Apple
        </button>
      </div>

      <p
        style={{
          textAlign: "center",
          marginTop: 20,
          fontSize: 13,
          color: "#666",
        }}
      >
        Don&apos;t have an account?{" "}
        <a href="/register" style={{ color: "#111", fontWeight: 500 }}>
          Sign up
        </a>
      </p>
    </>
  );
}
