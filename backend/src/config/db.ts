import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import dotenv from "dotenv";

dotenv.config();

neonConfig.webSocketConstructor = ws;

const connectionString =
  process.env.DATABASE_URL || "postgres://localhost:5432/twedar";

export const pool = new Pool({ connectionString });

const connectDB = async (): Promise<void> => {
  const result = await pool.query("SELECT 1");
  if (!result) throw new Error("Database connection check failed");
};

export default connectDB;
