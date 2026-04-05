"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import styles from "../form.module.css";

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
      .then((res) => setStatus(res.ok ? "success" : "error"))
      .catch(() => setStatus("error"));
  }, [token]);

  if (status === "loading") {
    return (
      <div className={styles.statusPage}>
        <div className={styles.spinner} />
        <h1 className={styles.statusTitle}>Verifying your email...</h1>
        <p className={styles.statusText}>
          Just a moment while we confirm your address.
        </p>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className={styles.statusPage}>
        <div className={styles.statusIcon}>✨</div>
        <h1 className={styles.statusTitle}>Email verified!</h1>
        <p className={styles.statusText}>
          Your email has been confirmed. You&apos;re all set to start planning
          your perfect day.
        </p>
        <a href="/login" className={styles.statusBtn}>
          Continue to sign in
        </a>
      </div>
    );
  }

  return (
    <div className={styles.statusPage}>
      <div className={styles.statusIcon}>💌</div>
      <h1 className={styles.statusTitle}>Verification failed</h1>
      <p className={styles.statusText}>
        This link may have expired or is invalid. Please try registering again
        to receive a new verification email.
      </p>
      <a href="/register" className={styles.statusBtn}>
        Back to registration
      </a>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className={styles.statusPage}>
          <div className={styles.spinner} />
          <h1 className={styles.statusTitle}>Verifying your email...</h1>
          <p className={styles.statusText}>Please wait.</p>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
