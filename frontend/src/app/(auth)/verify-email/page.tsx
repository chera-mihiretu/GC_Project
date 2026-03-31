"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );

  useEffect(() => {
    if (!token) {
      setStatus("error");
      return;
    }

    fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/auth/verify-email`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      },
    )
      .then((res) => {
        setStatus(res.ok ? "success" : "error");
      })
      .catch(() => setStatus("error"));
  }, [token]);

  return (
    <div style={{ textAlign: "center" }}>
      {status === "loading" && (
        <>
          <h1 style={{ fontSize: 24, marginBottom: 8 }}>Verifying email...</h1>
          <p style={{ color: "#666" }}>Please wait while we verify your email address.</p>
        </>
      )}
      {status === "success" && (
        <>
          <h1 style={{ fontSize: 24, marginBottom: 8 }}>Email verified</h1>
          <p style={{ color: "#666", marginBottom: 20 }}>
            Your email has been verified successfully.
          </p>
          <a
            href="/login"
            style={{
              display: "inline-block",
              padding: "10px 24px",
              background: "#111",
              color: "#fff",
              borderRadius: 8,
              textDecoration: "none",
              fontSize: 14,
            }}
          >
            Go to login
          </a>
        </>
      )}
      {status === "error" && (
        <>
          <h1 style={{ fontSize: 24, marginBottom: 8 }}>Verification failed</h1>
          <p style={{ color: "#666", marginBottom: 20 }}>
            The verification link is invalid or has expired.
          </p>
          <a
            href="/register"
            style={{
              display: "inline-block",
              padding: "10px 24px",
              background: "#111",
              color: "#fff",
              borderRadius: 8,
              textDecoration: "none",
              fontSize: 14,
            }}
          >
            Register again
          </a>
        </>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div style={{ textAlign: "center" }}>
          <h1 style={{ fontSize: 24, marginBottom: 8 }}>Verifying email...</h1>
          <p style={{ color: "#666" }}>Please wait.</p>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
