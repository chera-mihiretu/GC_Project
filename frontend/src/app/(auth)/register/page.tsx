"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signUp } from "@/lib/auth-client";
import { getDashboardPath } from "@/services/auth.service";
import styles from "../form.module.css";

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
      <h1 className={styles.heading}>Begin your journey</h1>
      <p className={styles.subtitle}>
        Create your account and start planning the wedding of your dreams
      </p>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label className={styles.label}>I am a...</label>
          <div className={styles.roleSelector}>
            <button
              type="button"
              onClick={() => setRole("couple")}
              className={`${styles.roleBtn} ${role === "couple" ? styles.roleBtnActive : ""}`}
            >
              <span className={styles.roleIcon}>💍</span>
              <span className={styles.roleName}>Couple</span>
              <span className={styles.roleDesc}>Planning our wedding</span>
            </button>
            <button
              type="button"
              onClick={() => setRole("vendor")}
              className={`${styles.roleBtn} ${role === "vendor" ? styles.roleBtnActive : ""}`}
            >
              <span className={styles.roleIcon}>🏪</span>
              <span className={styles.roleName}>Vendor</span>
              <span className={styles.roleDesc}>Offering services</span>
            </button>
          </div>
        </div>

        <div className={styles.field}>
          <label htmlFor="name" className={styles.label}>
            Full name
          </label>
          <input
            id="name"
            type="text"
            required
            placeholder="Your full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={styles.input}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="email" className={styles.label}>
            Email address
          </label>
          <input
            id="email"
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={styles.input}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="password" className={styles.label}>
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
            className={styles.input}
          />
          <span className={styles.hint}>At least 8 characters</span>
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <button type="submit" disabled={loading} className={styles.submitBtn}>
          {loading ? "Creating your account..." : "Create account"}
        </button>
      </form>

      <p className={styles.footer}>
        Already have an account?{" "}
        <a href="/login" className={styles.footerLink}>
          Sign in
        </a>
      </p>
    </>
  );
}
