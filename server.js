// server.js

const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const handleSocketConnection = require("./socketHandlers");

/**
 * Express app
 */
const app = express();

/**
 * Allowed frontend origins
 * Add local + production frontend URLs here
 */
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://gamefront-zeta.vercel.app",
];

/**
 * Express CORS middleware for normal HTTP routes
 */
app.use(
  cors({
    origin(origin, callback) {
      // Allow requests with no origin (like curl/postman/server-to-server)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

app.use(express.json());

/**
 * Basic health route
 */
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
  });
});

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

/**
 * Create HTTP server
 */
const httpServer = http.createServer(app);

/**
 * Socket.IO server with production-safe CORS
 */
const io = new Server(httpServer, {
  cors: {
    origin(origin, callback) {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`Socket.IO CORS blocked for origin: ${origin}`));
    },
    methods: ["GET", "POST"],
    credentials: true,
  },

  /**
   * Keep both transports enabled.
   * If websocket upgrade fails, polling can still work.
   */
  transports: ["websocket", "polling"],
});

/**
 * Register socket handlers
 */
handleSocketConnection(io);

/**
 * Use deployment port in production
 */
const PORT = process.env.PORT || 8000;

/**
 * Start server
 */
httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
