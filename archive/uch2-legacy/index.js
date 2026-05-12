// ===============================
// U_C_H Enterprise Backend
// Institutional-Grade API Server
// ===============================

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const morgan = require("morgan");
const mongoose = require("mongoose");
const winston = require("winston");

const app = express();

// ===============================
// Environment Validation
// ===============================

const PORT = process.env.PORT || 5000;
const DATABASE_URL = process.env.DATABASE_URL || "mongodb://localhost:27017/uch";
const CORS_ORIGIN = process.env.CORS_ORIGIN || "*";

if (!process.env.JWT_SECRET) {
  console.warn("⚠ WARNING: JWT_SECRET is not set");
}

// ===============================
// Logger Setup (Enterprise)
// ===============================

const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console()
  ],
});

// ===============================
// Security Middleware
// ===============================

app.use(helmet());

app.use(cors({
  origin: CORS_ORIGIN,
  credentials: true,
}));

app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("combined"));

// ===============================
// Health Endpoint (Required)
// ===============================

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "U_C_H Enterprise API",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

// ===============================
// Base Route
// ===============================

app.get("/", (req, res) => {
  res.json({
    message: "U_C_H Enterprise API is running",
  });
});

// ===============================
// Database Connection
// ===============================

mongoose.connect(DATABASE_URL)
  .then(() => {
    logger.info("MongoDB connected");
  })
  .catch((err) => {
    logger.error("MongoDB connection error", err);
    process.exit(1);
  });

// ===============================
// Global Error Handler
// ===============================

app.use((err, req, res, next) => {
  logger.error(err);

  res.status(err.status || 500).json({
    error: "Internal Server Error",
  });
});

// ===============================
// Start Server
// ===============================

app.listen(PORT, () => {
  logger.info(`U_C_H Enterprise API running on port ${PORT}`);
});
