import { createServer } from "http";
import app from "./app.js";
import connectDB from "./config/db.js";
import { createSocketServer } from "./features/realtime/infrastructure/socket-server.js";
import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.PORT || 5000;

const httpServer = createServer(app);
createSocketServer(httpServer);

connectDB()
  .then(() => {
    console.log("Connected to PostgreSQL");
    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err: unknown) => {
    console.error("PostgreSQL connection error:", err);
    process.exit(1);
  });
