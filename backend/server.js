const path = require("path");
const dotenv = require("dotenv");

// Load environment variables strictly from the backend/.env file BEFORE importing other local modules
dotenv.config({ path: path.join(__dirname, ".env") });

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const mongoSanitize = require("express-mongo-sanitize");
const connectDB = require("./config/db");
const { errorHandler } = require("./middleware/errorHandler");
const authRoutes = require("./routes/authRoutes");
const profileRoutes = require("./routes/profileRoutes");
const resumeIntelligenceRoutes = require("./routes/resumeIntelligenceRoutes");
const jobRoutes = require("./routes/jobRoutes");           // Recruiter job management (protected)
const applicationRoutes = require("./routes/applicationRoutes");
const verificationRoutes = require("./routes/verificationRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

// Create Express application
const app = express();

// ============================================
// Middleware Stack
// ============================================

// Allowed origins for CORS
const allowedOrigins = [
  "http://localhost:5173",
  "https://job-portal-h9m1-nine.vercel.app",
  "http://localhost:5174",
  "http://localhost:3000",
];

// If FRONTEND_URL is provided in environment variables, add it after trimming trailing slashes
if (process.env.FRONTEND_URL) {
  const envOrigin = process.env.FRONTEND_URL.trim().replace(/\/+$/, "");
  if (envOrigin && !allowedOrigins.includes(envOrigin)) {
    allowedOrigins.push(envOrigin);
  }
}

const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests (curl, Postman, server-to-server) without origin header
    if (!origin) return callback(null, true);

    const cleanOrigin = origin.trim().replace(/\/+$/, "");
    if (allowedOrigins.includes(cleanOrigin)) {
      return callback(null, true);
    }
    return callback(null, false);
  },
  credentials: true, // Allow cookies to be sent cross-origin
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
  optionsSuccessStatus: 200,
};

// CORS — Must be registered before any routes or terminating middleware
app.use(cors(corsOptions));

// Helmet — sets secure HTTP headers (XSS, clickjacking, sniffing protection)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "https://accounts.google.com", "https://apis.google.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: [
          "'self'",
          ...allowedOrigins,
          "http://localhost:5000",
          "https://accounts.google.com",
        ],
        frameSrc: ["https://accounts.google.com"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: process.env.NODE_ENV === "production" ? [] : null,
      },
    },
    crossOriginEmbedderPolicy: false, // needed for Google Sign-In iframe
    crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow cross-origin resources
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

// Serve uploaded files (resumes etc.)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));


// Authentication routes
app.use("/api/auth", authRoutes);

// Candidate profile routes
app.use("/api/profile", profileRoutes);

// Resume intelligence routes (parse, ATS, AI feedback)
app.use("/api/resume-intelligence", resumeIntelligenceRoutes);

// Recruiter Job Management routes (protected — recruiter/admin only)
// Handles: POST, GET, GET/:id, PUT/:id, DELETE/:id for a recruiter's own jobs
app.use("/api/jobs", jobRoutes);
app.use("/api/recruiter/jobs", jobRoutes);

// Application routes
app.use("/api/applications", applicationRoutes);

// Notification routes
app.use("/api/notifications", notificationRoutes);

// Recruiter verification routes
app.use("/api/verification", verificationRoutes);

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
