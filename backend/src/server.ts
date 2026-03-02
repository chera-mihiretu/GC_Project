/**
 * @fileoverview Main HTTP server entry point for the Twedar backend.
 * 
 * This module is responsible for:
 * - Creating the HTTP server instance
 * - Initializing the database connection
 * - Setting up Socket.IO for real-time communication
 * - Starting the server on the configured port
 * 
 * @module server
 */
import { createServer } from "http";
import app from "./app.js";
import connectDB from "./config/db.js";
import { createSocketServer } from "./features/realtime/infrastructure/socket-server.js";
import { env } from "./config/env.js";

/**
 * HTTP server instance wrapping the Express application.
 * Used as the foundation for both REST API and WebSocket connections.
 */
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