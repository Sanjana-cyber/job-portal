const crypto = require("crypto");
const User = require("../models/User");
const sendTokenResponse = require("../utils/generateToken");
const {
  sendEmail,
  getVerificationEmailTemplate,
  getResetPasswordEmailTemplate,
} = require("../utils/sendEmail");
const {
  validateRegister,
  validateLogin,
  validateResetPassword,
  sanitize,
} = require("../utils/validators");
const { ErrorResponse } = require("../middleware/errorHandler");
const { OAuth2Client } = require("google-auth-library");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * @desc    Register a new user (jobseeker or recruiter only)
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    // Validate input
    const validation = validateRegister({ name, email, password, role });
    if (!validation.isValid) {
      return next(new ErrorResponse(validation.errors.join(", "), 400));
    }

    // Prevent admin registration through public endpoint
    if (role === "admin") {
      return next(
        new ErrorResponse("Admin registration is not allowed", 403)
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return next(
        new ErrorResponse("An account with this email already exists", 400)
      );
    }

    // Create user with sanitized inputs
    const user = await User.create({
      name: sanitize(name),
      email: email.toLowerCase().trim(),
      password,
      role: role || "jobseeker",
      provider: "local",
    });

    // Generate email verification token
    const verificationToken = user.getVerificationToken();
    await user.save({ validateBeforeSave: false });

    // Build verification URL
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;

    // Send verification email (non-blocking — don't fail registration if email fails)
    try {
      await sendEmail({
        to: user.email,
        subject: "Verify Your Email — Job Portal",
        html: getVerificationEmailTemplate(user.name, verificationUrl),
      });
    } catch (emailError) {
      console.error("Email sending failed:", emailError.message);
      // Continue with registration even if email fails
    }

    // Send token response with JWT cookie
    sendTokenResponse(user, 201, res, "Registration successful. Please verify your email.");
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate input
    const validation = validateLogin({ email, password });
    if (!validation.isValid) {
      return next(new ErrorResponse(validation.errors.join(", "), 400));
    }

    // Find user by email and include password field for comparison
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select(
      "+password"
    );

    if (!user) {
      return next(new ErrorResponse("Invalid email or password", 401));
    }

    // Check if user registered with Google (no password set)
    if (user.provider === "google" && !user.password) {
      return next(
        new ErrorResponse(
          "This account uses Google sign-in. Please use Google to log in.",
          400
        )
      );
    }

    // Verify password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return next(new ErrorResponse("Invalid email or password", 401));
    }

    // Send token response
    sendTokenResponse(user, 200, res, "Login successful");
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Logout user — clear cookie
 * @route   POST /api/auth/logout
 * @access  Private
 */
const logout = async (req, res, next) => {
  try {
    // Clear the JWT cookie
    res.cookie("token", "none", {
      expires: new Date(Date.now() + 5 * 1000), // Expires in 5 seconds
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });

    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current logged-in user
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res, next) => {
  try {
    // req.user is set by the protect middleware
    const user = await User.findById(req.user.id);

    if (!user) {
      return next(new ErrorResponse("User not found", 404));
    }

    res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        provider: user.provider,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
        // Recruiter verification
        companyName: user.companyName,
        workEmail: user.workEmail,
        companyWebsite: user.companyWebsite,
        companyVerificationStatus: user.companyVerificationStatus,
        companyVerificationNote: user.companyVerificationNote,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Forgot password — send reset email
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return next(new ErrorResponse("Please provide an email address", 400));
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      // Return success even if user doesn't exist (prevents email enumeration)
      return res.status(200).json({
        success: true,
        message: "If an account exists with this email, a reset link has been sent",
      });
    }

    // Check if user registered with Google
    if (user.provider === "google") {
      return next(
        new ErrorResponse(
          "This account uses Google sign-in. Password reset is not available.",
          400
        )
      );
    }

    // Generate reset token
    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    // Build reset URL
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    try {
      await sendEmail({
        to: user.email,
        subject: "Password Reset — Job Portal",
        html: getResetPasswordEmailTemplate(user.name, resetUrl),
      });

      res.status(200).json({
        success: true,
        message: "If an account exists with this email, a reset link has been sent",
      });
    } catch (emailError) {
      // Clear reset token if email fails
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });

      console.error("Email sending failed:", emailError.message);
      return next(
        new ErrorResponse("Email could not be sent. Please try again later.", 500)
      );
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reset password using token
 * @route   POST /api/auth/reset-password
 * @access  Public
 */
const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    // Validate input
    const validation = validateResetPassword({ token, password });
    if (!validation.isValid) {
      return next(new ErrorResponse(validation.errors.join(", "), 400));
    }

    // Hash the token from the URL to compare with stored hash
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    // Find user with valid (non-expired) reset token
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return next(
        new ErrorResponse("Invalid or expired reset token", 400)
      );
    }

    // Set new password (will be hashed by pre-save hook)
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    // Log user in with new password
    sendTokenResponse(user, 200, res, "Password reset successful");
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Google OAuth authentication
 * @route   POST /api/auth/google
 * @access  Public
 */
const googleAuth = async (req, res, next) => {
  try {
    const { credential, role } = req.body;

    if (!credential) {
      return next(new ErrorResponse("Google credential is required", 400));
    }

    // Securely verify the Google ID token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID, // Specify the CLIENT_ID of the app that accesses the backend
    });

    const payload = ticket.getPayload();
    const { email, name, email_verified } = payload;

    if (!email) {
      return next(new ErrorResponse("Unable to get email from Google", 400));
    }

    // Check if user exists
    let user = await User.findOne({ email: email.toLowerCase() });

    if (user) {
      // Existing user — log them in
      sendTokenResponse(user, 200, res, "Login successful");
    } else {
      // Prevent admin role via Google auth
      const userRole = role === "admin" ? "jobseeker" : role || "jobseeker";

      // Create new user with Google provider
      user = await User.create({
        name: name || email.split("@")[0],
        email: email.toLowerCase(),
        provider: "google",
        isVerified: email_verified || true, // Google emails are pre-verified
        role: userRole,
      });

      sendTokenResponse(user, 201, res, "Registration successful");
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Verify email address using token
 * @route   GET /api/auth/verify-email/:token
 * @access  Public
 */
const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.params;

    if (!token) {
      return next(new ErrorResponse("Verification token is required", 400));
    }

    // Hash the token to compare with stored hash
    const verificationToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    // Find user with valid (non-expired) verification token
    const user = await User.findOne({
      verificationToken,
      verificationTokenExpire: { $gt: Date.now() },
    });

    if (!user) {
      return next(
        new ErrorResponse("Invalid or expired verification token", 400)
      );
    }

    // Mark email as verified and clear token
    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpire = undefined;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: "Email verified successfully",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
  googleAuth,
  verifyEmail,
};
