/**
 * Generate JWT token and set it as an HTTP-only cookie
 * HTTP-only cookies prevent XSS attacks from accessing the token
 *
 * @param {Object} user - The user document from MongoDB
 * @param {number} statusCode - HTTP status code for the response
 * @param {Object} res - Express response object
 * @param {string} [message] - Optional success message
 */
const sendTokenResponse = (user, statusCode, res, message = "Success") => {
  // Generate JWT token using the User model method
  const token = user.getSignedJwtToken();

  // Cookie options for security
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true, // Prevents JavaScript access (XSS protection)
    sameSite: "lax", // CSRF protection
    secure: process.env.NODE_ENV === "production", // HTTPS only in production
    path: "/",
  };

  // Remove password from output
  const userResponse = {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    provider: user.provider,
    isVerified: user.isVerified,
    createdAt: user.createdAt,
  };

  res
    .status(statusCode)
    .cookie("token", token, cookieOptions)
    .json({
      success: true,
      message,
      token, // Also send in body for clients that can't use cookies
      user: userResponse,
    });
};

module.exports = sendTokenResponse;
