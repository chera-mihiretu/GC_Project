/**
 * @fileoverview PostgreSQL database connection configuration.
 * 
 * This module sets up the database connection pool using node-postgres (pg).
 * It handles both local PostgreSQL and Supabase-hosted databases with
 * appropriate SSL configuration.
 * 
 * @module config/db
 */
import pg from "pg";
import { env } from "./env.js";

/**
 * Determines if the database is hosted on Supabase based on the connection URL.
 * Supabase connections require SSL with specific settings.
 */
const isSupabase = env.DATABASE_URL.includes("supabase");

/**
 * PostgreSQL connection pool instance.
 * 
 * The pool manages multiple database connections efficiently, reusing
 * connections across requests rather than opening a new connection
 * for each query. This significantly improves performance under load.
 * 
 * SSL is enabled for Supabase connections with relaxed certificate
 * validation to support their managed PostgreSQL service.
 */
export const pool = new pg.Pool({
  connectionString: env.DATABASE_URL,
  ssl: isSupabase ? { rejectUnauthorized: false } : undefined,
});

/**
 * Verifies the database connection is working.
 * 
 * This function is called during server startup to ensure the database
 * is reachable before accepting requests. Fails fast if connection
 * cannot be established.
 * 
 * @returns Promise that resolves when connection is verified
 * @throws Error if database connection check fails
 */
const connectDB = async (): Promise<void> => {
  const result = await pool.query("SELECT 1");
  if (!result) throw new Error("Database connection check failed");
};

export default connectDB;