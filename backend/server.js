const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const mongoSanitize = require("express-mongo-sanitize");
const connectDB = require("./config/db");
const { errorHandler } = require("./middleware/errorHandler");
const authRoutes = require("./routes/authRoutes");
const profileRoutes = require("./routes/profileRoutes");

// Load environment variables strictly from the backend/.env file
const path = require("path");
dotenv.config({ path: path.join(__dirname, ".env") });

// Create Express application
const app = express();

// ============================================
// Middleware Stack
// ============================================

// CORS — Allow frontend to communicate with backend
app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL || "http://localhost:5173",
      "http://localhost:5174"
    ],
    credentials: true, // Allow cookies to be sent cross-origin
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Parse JSON request bodies (limit to 10kb to prevent large payload attacks)
app.use(express.json({ limit: "10kb" }));

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

// Parse cookies from requests
app.use(cookieParser());

// Sanitize data — Prevent NoSQL injection attacks by removing keys starting with $ or containing .
const sanitizeObject = (obj) => {
  if (obj && typeof obj === "object") {
    for (const key in obj) {
      if (key.startsWith("$") || key.includes(".")) {
        delete obj[key];
      } else if (typeof obj[key] === "object") {
        sanitizeObject(obj[key]);
      }
    }
  }
};

app.use((req, res, next) => {
  if (req.body) sanitizeObject(req.body);
  if (req.params) sanitizeObject(req.params);
  if (req.query) sanitizeObject(req.query);
  next();
});

// ============================================
// API Routes
// ============================================

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Job Portal API is running",
    timestamp: new Date().toISOString(),
  });
});

// Authentication routes
app.use("/api/auth", authRoutes);

// Candidate profile routes
app.use("/api/profile", profileRoutes);

// 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// ============================================
// Global Error Handler (must be last middleware)
// ============================================
app.use(errorHandler);

// ============================================
// Start Server
// ============================================
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Start listening for requests
    const server = app.listen(PORT, () => {
      console.log(`\n🚀 Server running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`);
      console.log(`📡 API: http://localhost:${PORT}/api`);
      console.log(`❤️  Health: http://localhost:${PORT}/api/health\n`);
    });

    // Graceful shutdown handling
    process.on("unhandledRejection", (err) => {
      console.error(`❌ Unhandled Rejection: ${err.message}`);
      server.close(() => process.exit(1));
    });

    process.on("SIGTERM", () => {
      console.log("👋 SIGTERM received. Shutting down gracefully...");
      server.close(() => process.exit(0));
    });
  } catch (error) {
    console.error(`❌ Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

startServer();
