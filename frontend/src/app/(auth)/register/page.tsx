"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signUp } from "@/lib/auth-client";
import { getDashboardPath } from "@/services/auth.service";

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
      setError(authError.message || "Registration failed");
      return;
    }

    if (data?.user) {
      router.push(getDashboardPath(role));
    }
  }

  return (
    <>
      <h1 style={{ textAlign: "center", marginBottom: 8, fontSize: 24 }}>
        Create your account
      </h1>
      <p
        style={{
          textAlign: "center",
          marginBottom: 24,
          color: "#666",
          fontSize: 14,
        }}
      >
        Start planning your perfect wedding
      </p>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", marginBottom: 8, fontSize: 14 }}>
            I am a...
          </label>
          <div style={{ display: "flex", gap: 10 }}>
            {(["couple", "vendor"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                style={{
                  flex: 1,
                  padding: "10px 0",
                  border: role === r ? "2px solid #111" : "1px solid #ddd",
                  borderRadius: 8,
                  background: role === r ? "#f9f9f9" : "#fff",
                  fontSize: 14,
                  cursor: "pointer",
                  fontWeight: role === r ? 600 : 400,
                  textTransform: "capitalize",
                }}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label
            htmlFor="name"
            style={{ display: "block", marginBottom: 4, fontSize: 14 }}
          >
            Full name
          </label>
          <input
            id="name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
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
            minLength={8}
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
          <span style={{ fontSize: 12, color: "#999" }}>
            Min 8 characters
          </span>
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
          {loading ? "Creating account..." : "Create account"}
        </button>
      </form>

      <p
        style={{
          textAlign: "center",
          marginTop: 20,
          fontSize: 13,
          color: "#666",
        }}
      >
        Already have an account?{" "}
        <a href="/login" style={{ color: "#111", fontWeight: 500 }}>
          Sign in
        </a>
      </p>
    </>
  );
}
