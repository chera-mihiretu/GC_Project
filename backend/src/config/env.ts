import dotenv from "dotenv";

dotenv.config();

function required(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

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

  get isProduction() {
    return this.NODE_ENV === "production";
  },
} as const;
