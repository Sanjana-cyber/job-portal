const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

/**
 * User Schema for the Job Portal
 * Supports local and Google OAuth authentication
 * Roles: jobseeker, recruiter, admin
 */
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide a name"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [50, "Name cannot exceed 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Please provide an email"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        "Please provide a valid email address",
      ],
    },
    password: {
      type: String,
      minlength: [6, "Password must be at least 6 characters"],
      select: false, // Don't return password in queries by default
    },
    role: {
      type: String,
      enum: {
        values: ["jobseeker", "recruiter", "admin"],
        message: "Role must be jobseeker, recruiter, or admin",
      },
      default: "jobseeker",
    },
    provider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: String,
    verificationTokenExpire: Date,
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
  }
);

/**
 * Pre-save middleware: Hash password before saving
 * Only runs when password is modified (not on every save)
 */
userSchema.pre("save", async function () {
  // Skip hashing if password hasn't been modified
  if (!this.isModified("password")) {
    return;
  }

  // Hash password with 12 salt rounds for strong security
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

/**
 * Compare entered password with hashed password in database
 * @param {string} enteredPassword - Plain text password to verify
 * @returns {boolean} True if passwords match
 */
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

/**
 * Generate a signed JWT token for authentication
 * @returns {string} Signed JWT token
 */
userSchema.methods.getSignedJwtToken = function () {
  return jwt.sign({ id: this._id, role: this.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

/**
 * Generate and hash a password reset token
 * Token expires in 10 minutes for security
 * @returns {string} Unhashed reset token (sent to user via email)
 */
userSchema.methods.getResetPasswordToken = function () {
  // Generate random token
  const resetToken = crypto.randomBytes(32).toString("hex");

  // Hash token and store in database (never store raw tokens)
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // Set expiry to 10 minutes
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

/**
 * Generate and hash an email verification token
 * Token expires in 24 hours
 * @returns {string} Unhashed verification token (sent to user via email)
 */
userSchema.methods.getVerificationToken = function () {
  const verificationToken = crypto.randomBytes(32).toString("hex");

  this.verificationToken = crypto
    .createHash("sha256")
    .update(verificationToken)
    .digest("hex");

  // Set expiry to 24 hours
  this.verificationTokenExpire = Date.now() + 24 * 60 * 60 * 1000;

  return verificationToken;
};

module.exports = mongoose.model("User", userSchema);
