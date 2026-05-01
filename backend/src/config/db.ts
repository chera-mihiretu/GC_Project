import pg from "pg";
import { env } from "./env.js";

const isSupabase = env.DATABASE_URL.includes("supabase");

export const pool = new pg.Pool({
  connectionString: env.DATABASE_URL,
  ssl: isSupabase ? { rejectUnauthorized: false } : undefined,
});

const connectDB = async (): Promise<void> => {
  const result = await pool.query("SELECT 1");
  if (!result) throw new Error("Database connection check failed");
};

export default connectDB;
