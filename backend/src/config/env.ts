/**
 * @fileoverview Environment configuration module for the Twedar backend.
 * 
 * This module centralizes all environment variable access and provides:
 * - Type-safe environment variable retrieval
 * - Required vs optional variable distinction
 * - Sensible defaults for development
 * - Runtime validation of critical configuration
 * 
 * @module config/env
 */
import dotenv from "dotenv";

dotenv.config();

/**
 * Retrieves a required environment variable.
 * Throws an error if the variable is not set, ensuring
 * the application fails fast during startup rather than
 * encountering runtime issues later.
 * 
 * @param key - The environment variable name
 * @returns The environment variable value
 * @throws Error if the variable is not set
 */
function required(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

/**
 * Retrieves an optional environment variable with a fallback.
 * Used for configuration that has sensible defaults for
 * local development but may be overridden in production.
 * 
 * @param key - The environment variable name
 * @param fallback - Default value if not set
 * @returns The environment variable value or fallback
 */
function optional(key: string, fallback: string): string {
  return process.env[key] || fallback;
}

export const env = {
  PORT: optional("PORT", "5000"),
  NODE_ENV: optional("NODE_ENV", "development"),

  DATABASE_URL: optional("DATABASE_URL", "postgres://localhost:5432/twedar"),

  BETTER_AUTH_URL: optional("BETTER_AUTH_URL", "http://localhost:5000"),
  BETTER_AUTH_SECRET: required("BETTER_AUTH_SECRET"),

  FRONTEND_URL: optional("FRONTEND_URL", "http://localhost:3000"),

  GOOGLE_CLIENT_ID: optional("GOOGLE_CLIENT_ID", ""),
  GOOGLE_CLIENT_SECRET: optional("GOOGLE_CLIENT_SECRET", ""),

  APPLE_CLIENT_ID: optional("APPLE_CLIENT_ID", ""),
  APPLE_CLIENT_SECRET: optional("APPLE_CLIENT_SECRET", ""),

  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: process.env.SMTP_PORT,
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
  SMTP_FROM: process.env.SMTP_FROM,

  SUPABASE_URL: required("SUPABASE_URL"),
  SUPABASE_ANON_KEY: required("SUPABASE_ANON_KEY"),

  CHAPA_SECRET_KEY: required("CHAPA_SECRET_KEY"),
  CHAPA_WEBHOOK_SECRET: required("CHAPA_WEBHOOK_SECRET"),

  get isProduction() {
    return this.NODE_ENV === "production";
  },
} as const;