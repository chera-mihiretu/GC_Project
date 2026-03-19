import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

export const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL || "postgres://localhost:5432/twedar",
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
