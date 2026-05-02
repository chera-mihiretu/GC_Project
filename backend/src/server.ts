import { createServer } from "http";
import app from "./app.js";
import connectDB from "./config/db.js";
import { createSocketServer } from "./features/realtime/infrastructure/socket-server.js";
import { env } from "./config/env.js";

const httpServer = createServer(app);
createSocketServer(httpServer);

connectDB()
  .then(() => {
    console.log("Connected to PostgreSQL");
    httpServer.listen(env.PORT, () => {
      console.log(`Server running on port ${env.PORT}`);
    });
  })
  .catch((err: unknown) => {
    console.error("PostgreSQL connection error:", err);
    process.exit(1);
  });
