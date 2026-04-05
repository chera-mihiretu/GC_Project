import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

const connectionString =
  process.env.DATABASE_URL || "postgres://localhost:5432/twedar";

export const pool = new Pool({
  connectionString,
  ssl: connectionString.includes("neon.tech")
    ? { rejectUnauthorized: false }
    : undefined,
});

const connectDB = async (): Promise<void> => {
  const client = await pool.connect();
  try {
    await client.query("SELECT 1");
  } finally {
    client.release();
  }
};

export default connectDB;
