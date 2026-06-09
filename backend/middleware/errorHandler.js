/**
 * Custom Error Response class
 * Extends the native Error class with a status code
 */
class ErrorResponse extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

/**
 * Global Error Handling Middleware
 * Catches all errors and returns consistent JSON responses
 * Handles specific Mongoose error types gracefully
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error for development debugging
  if (process.env.NODE_ENV === "development") {
    // Don't log full stack traces for expected 401/404 errors
    if (err.statusCode === 401 || err.statusCode === 404) {
      console.error(`⚠️  [${err.statusCode}] ${err.message}`);
    } else {
      console.error("❌ Error:", err);
    }
  }

  // Mongoose bad ObjectId (CastError)
  if (err.name === "CastError") {
    const message = "Resource not found";
    error = new ErrorResponse(message, 404);
  }

  // Mongoose duplicate key error (code 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `An account with this ${field} already exists`;
    error = new ErrorResponse(message, 400);
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const message = Object.values(err.errors)
      .map((val) => val.message)
      .join(", ");
    error = new ErrorResponse(message, 400);
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    const message = "Invalid token. Please log in again";
    error = new ErrorResponse(message, 401);
  }

  if (err.name === "TokenExpiredError") {
    const message = "Token expired. Please log in again";
    error = new ErrorResponse(message, 401);
  }

  // Multer errors (file type / size violations)
  if (err.name === "MulterError") {
    let message = "File upload error";
    if (err.code === "LIMIT_FILE_SIZE")  message = "File too large. Check the size limit.";
    if (err.code === "LIMIT_FILE_COUNT") message = "Too many files.";
    if (err.code === "LIMIT_UNEXPECTED_FILE") message = `Unexpected field: ${err.field}`;
    error = new ErrorResponse(message, 400);
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || "Internal Server Error",
    // Only include stack trace in development
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

module.exports = { ErrorResponse, errorHandler };
