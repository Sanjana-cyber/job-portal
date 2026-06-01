const express = require("express");
const router = express.Router();
const {
  register,
  login,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
  googleAuth,
  verifyEmail,
} = require("../controllers/authController");
const { protect } = require("../middleware/auth");
const { authLimiter } = require("../middleware/rateLimiter");

/**
 * Auth Routes
 * All routes are prefixed with /api/auth
 *
 * Rate limiting is applied to public auth endpoints
 * to prevent brute force attacks
 */

// Public routes (rate-limited)
router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);
router.post("/forgot-password", authLimiter, forgotPassword);
router.post("/reset-password", authLimiter, resetPassword);
router.post("/google", authLimiter, googleAuth);
router.get("/verify-email/:token", verifyEmail);

// Protected routes (require authentication)
router.post("/logout", protect, logout);
router.get("/me", protect, getMe);

module.exports = router;
