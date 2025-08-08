import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "@repo/database/src/env";
import { createLogger } from "@repo/shared";

const app = express();
const PORT = env.SERVER_PORT || 9000;

const logger = createLogger("express entry");

// Middleware

app.use(helmet());
app.use(cors());
app.use(morgan("combined"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`, {
    Environment: ` ${env.NODE_ENV || "Development"}`,
  });
});
