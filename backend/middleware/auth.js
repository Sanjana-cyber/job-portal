const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { ErrorResponse } = require("./errorHandler");

/**
 * Protect Middleware
 * Verifies JWT token from cookies or Authorization header
 * Attaches the authenticated user to req.user
 */
const protect = async (req, res, next) => {
  let token;

  // Check for token in HTTP-only cookie first (preferred method)
  if (req.cookies && req.cookies.token && req.cookies.token !== "none" && req.cookies.token !== "null") {
    token = req.cookies.token;
  }
  // Fallback: check Authorization header (Bearer token)
  else if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    const bearer = req.headers.authorization.split(" ")[1];
    if (bearer && bearer !== "null" && bearer !== "undefined" && bearer !== "none") {
      token = bearer;
    }
  }
  // Fallback: check query parameter (for direct file downloads/views in new browser tabs)
  else if (req.query && req.query.token && req.query.token !== "null" && req.query.token !== "undefined") {
    token = req.query.token;
  }

  // No token found — user is not authenticated
  if (!token) {
    return next(
      new ErrorResponse("Not authorized to access this route", 401)
    );
  }

  try {
    // Verify the token using our secret
    const secret = process.env.JWT_SECRET || "your_super_secret_jwt_key_change_this_in_production_2024";
    const decoded = jwt.verify(token, secret);

    // Find user by decoded ID and attach to request
    const user = await User.findById(decoded.id);

    if (!user) {
      return next(
        new ErrorResponse("User no longer exists", 401)
      );
    }

    req.user = user;
    next();
  } catch (error) {
    return next(
      new ErrorResponse("Not authorized to access this route", 401)
    );
  }
};

/**
 * Authorize Middleware
 * Restricts access to specific user roles
 * Must be used AFTER the protect middleware
 *
 * Usage: authorize("admin"), authorize("recruiter", "admin")
 *
 * @param  {...string} roles - Allowed roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(
        new ErrorResponse("Not authorized to access this route", 401)
      );
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorResponse(
          `Role '${req.user.role}' is not authorized to access this route`,
          403
        )
      );
    }

    next();
  };
};

/**
 * RequireVerified Middleware
 * Blocks job creation/update if the admin has enabled verification enforcement
 * AND the recruiter is not yet approved.
 *
 * Logic:
 *   verificationRequired = false → always pass through
 *   verificationRequired = true  → recruiter must have companyVerificationStatus === "approved"
 *
 * Must be used AFTER protect + authorize("recruiter") middleware.
 */
const requireVerified = async (req, res, next) => {
  try {
    // Only applies to recruiter role
    if (!req.user || req.user.role !== "recruiter") return next();

    const SiteSettings = require("../models/SiteSettings");
    const settings = await SiteSettings.getSettings();

    // If admin hasn't enabled enforcement, skip check
    if (!settings.verificationRequired) return next();

    // Fetch fresh user data (in case status changed since JWT was issued)
    const User = require("../models/User");
    const freshUser = await User.findById(req.user._id).select("companyVerificationStatus companyName");

    if (!freshUser || freshUser.companyVerificationStatus !== "approved") {
      return next(
        new ErrorResponse(
          "Your company verification is required before posting jobs. Please submit your company details from the dashboard.",
          403
        )
      );
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Optional Protect Middleware
 * If token is present, sets req.user. If not, passes through without 401 error.
 */
const optionalProtect = async (req, res, next) => {
  let token;
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  } else if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next();
  }

  try {
    const secret = process.env.JWT_SECRET || "your_super_secret_jwt_key_change_this_in_production_2024";
    const decoded = jwt.verify(token, secret);
    const user = await User.findById(decoded.id);
    if (user) req.user = user;
  } catch {
    // Ignore invalid or expired token for optional protect
  }
  next();
};

module.exports = { protect, authorize, requireVerified, optionalProtect };


