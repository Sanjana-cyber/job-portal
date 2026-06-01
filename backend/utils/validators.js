/**
 * Input Validation Utilities
 * Validates and sanitizes user inputs to prevent injection and ensure data quality
 */

/**
 * Sanitize a string input: trim whitespace and remove potential script tags
 * @param {string} str - Input string to sanitize
 * @returns {string} Sanitized string
 */
const sanitize = (str) => {
  if (typeof str !== "string") return "";
  return str
    .trim()
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
};

/**
 * Validate registration input data
 * @param {Object} data - Registration data
 * @param {string} data.name - User's name
 * @param {string} data.email - User's email
 * @param {string} data.password - User's password
 * @param {string} data.role - User's role
 * @returns {Object} { isValid: boolean, errors: string[] }
 */
const validateRegister = (data) => {
  const errors = [];

  // Validate name
  if (!data.name || data.name.trim().length === 0) {
    errors.push("Name is required");
  } else if (data.name.trim().length < 2) {
    errors.push("Name must be at least 2 characters");
  } else if (data.name.trim().length > 50) {
    errors.push("Name cannot exceed 50 characters");
  }

  // Validate email
  if (!data.email || data.email.trim().length === 0) {
    errors.push("Email is required");
  } else {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(data.email.trim())) {
      errors.push("Please provide a valid email address");
    }
  }

  // Validate password
  if (!data.password) {
    errors.push("Password is required");
  } else if (data.password.length < 6) {
    errors.push("Password must be at least 6 characters");
  } else if (data.password.length > 128) {
    errors.push("Password cannot exceed 128 characters");
  } else {
    // Check for password strength
    if (!/(?=.*[a-z])/.test(data.password)) {
      errors.push("Password must contain at least one lowercase letter");
    }
    if (!/(?=.*[A-Z])/.test(data.password)) {
      errors.push("Password must contain at least one uppercase letter");
    }
    if (!/(?=.*\d)/.test(data.password)) {
      errors.push("Password must contain at least one number");
    }
  }

  // Validate role
  const validRoles = ["jobseeker", "recruiter"];
  if (data.role && !validRoles.includes(data.role)) {
    errors.push("Invalid role. Must be jobseeker or recruiter");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validate login input data
 * @param {Object} data - Login data
 * @param {string} data.email - User's email
 * @param {string} data.password - User's password
 * @returns {Object} { isValid: boolean, errors: string[] }
 */
const validateLogin = (data) => {
  const errors = [];

  if (!data.email || data.email.trim().length === 0) {
    errors.push("Email is required");
  }

  if (!data.password) {
    errors.push("Password is required");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validate reset password input
 * @param {Object} data - Reset password data
 * @param {string} data.password - New password
 * @param {string} data.token - Reset token
 * @returns {Object} { isValid: boolean, errors: string[] }
 */
const validateResetPassword = (data) => {
  const errors = [];

  if (!data.token) {
    errors.push("Reset token is required");
  }

  if (!data.password) {
    errors.push("New password is required");
  } else if (data.password.length < 6) {
    errors.push("Password must be at least 6 characters");
  } else {
    if (!/(?=.*[a-z])/.test(data.password)) {
      errors.push("Password must contain at least one lowercase letter");
    }
    if (!/(?=.*[A-Z])/.test(data.password)) {
      errors.push("Password must contain at least one uppercase letter");
    }
    if (!/(?=.*\d)/.test(data.password)) {
      errors.push("Password must contain at least one number");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

module.exports = {
  sanitize,
  validateRegister,
  validateLogin,
  validateResetPassword,
};
