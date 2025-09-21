const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { createLogger, format, transports } = require("winston");
const OpenAI = require("openai");
const { HfInference } = require("@huggingface/inference");
const multer = require("multer");
const ffmpeg = require("ffmpeg-static");
require("dotenv").config();

const nlpRoutes = require("./routes/nlp");
const { errorHandler } = require("./middleware/errorHandler");
const { connectRedis } = require("./config/redis");

// Initialize logger
const logger = createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.json()
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: "logs/nlp-service.log" })
  ]
});

// Initialize AI clients
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

const app = express();
const PORT = process.env.PORT || 3002;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 requests per windowMs
  message: "Too many requests from this IP, please try again later."
});
app.use("/api/", limiter);

// File upload middleware
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("audio/")) {
      cb(null, true);
    } else {
      cb(new Error("Only audio files are allowed!"), false);
    }
  }
});

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get("User-Agent"),
    timestamp: new Date().toISOString()
  });
  next();
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    service: "nlp-service",
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || "1.0.0",
    ai_services: {
      openai: process.env.OPENAI_API_KEY ? "configured" : "not configured",
      huggingface: process.env.HUGGINGFACE_API_KEY ? "configured" : "not configured"
    }
  });
});

// API routes
app.use("/api/nlp", nlpRoutes);

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: `Route ${req.originalUrl} not found`
  });
});

// Graceful shutdown
process.on("SIGTERM", () => {
  logger.info("SIGTERM received, shutting down gracefully");
  server.close(() => {
    logger.info("Process terminated");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  logger.info("SIGINT received, shutting down gracefully");
  server.close(() => {
    logger.info("Process terminated");
    process.exit(0);
  });
});

// Start server
const startServer = async () => {
  try {
    // Connect to Redis
    await connectRedis();
    logger.info("Redis connected successfully");

    const server = app.listen(PORT, () => {
      logger.info(`NLP service running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || "development"}`);
    });

  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

module.exports = { app, openai, hf, logger };
