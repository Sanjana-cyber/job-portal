import axios from "axios";

/**
 * Central API Client
 * ─────────────────────────────────────────────────────────────────────────────
 * Security features baked in:
 *   • withCredentials — sends the HttpOnly JWT cookie on every request (no
 *     localStorage, no XSS-accessible token)
 *   • 10 s timeout — prevents the UI from hanging on a dead backend
 *   • 401 interceptor — fires a custom DOM event so AuthModalContext can clear
 *     the user state and show the login modal automatically
 *   • 429 interceptor — surfaces the backend rate-limit message clearly
 *   • Input sanitisation helpers — trim/lowercase before every request so the
 *     server never receives accidental leading/trailing whitespace
 */

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,   // HttpOnly cookie — JWT never touches localStorage
  timeout: 10_000,         // 10-second timeout; shows error instead of spinning
  headers: {
    "Content-Type": "application/json",
  },
});

// ─── Response Interceptor ────────────────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message =
      error.response?.data?.message ||
      error.message ||
      "Something went wrong";

    // 401 → cookie expired or invalid → signal the app to auto-logout
    if (status === 401) {
      // Dispatch a custom event; AuthModalContext listens and clears user state
      window.dispatchEvent(new CustomEvent("auth:expired"));
    }

    // 429 → rate-limited by backend (brute-force protection)
    if (status === 429) {
      return Promise.reject({
        status: 429,
        message: "Too many attempts. Please wait 15 minutes and try again.",
        data: error.response?.data,
      });
    }

    return Promise.reject({
      status: status || 500,
      message,
      data: error.response?.data,
    });
  }
);

// ─── Sanitisation Helpers ─────────────────────────────────────────────────────

/** Trim whitespace and lowercase — safe for email fields */
const sanitizeEmail = (email) => (email || "").trim().toLowerCase();

/** Trim whitespace from plain strings */
const sanitizeStr = (str) => (str || "").trim();

// ─── Auth API ─────────────────────────────────────────────────────────────────

/**
 * Register a new user.
 * JWT is stored in an HttpOnly cookie by the backend — never exposed to JS.
 *
 * @param {{ name, email, password, role, companyName?, companyWebsite? }} params
 */
export const registerUser = async ({
  name,
  email,
  password,
  role,
  companyName,
  companyWebsite,
}) => {
  const payload = {
    name: sanitizeStr(name),
    email: sanitizeEmail(email),
    password, // never trimmed — user may intentionally include spaces
    role,
  };
  // Only include recruiter fields when registering as a recruiter
  if (role === "recruiter") {
    payload.companyName = sanitizeStr(companyName);
    payload.companyWebsite = sanitizeStr(companyWebsite);
  }
  const res = await api.post("/auth/register", payload);
  return res.data; // { success, message, user }
};

/**
 * Login an existing user.
 * Backend sets the HttpOnly JWT cookie on success.
 *
 * @param {{ email, password }} params
 */
export const loginUser = async ({ email, password }) => {
  const res = await api.post("/auth/login", {
    email: sanitizeEmail(email),
    password,
  });
  return res.data; // { success, message, user }
};

/**
 * Send a forgot-password reset link to the provided email.
 * Backend always returns success to prevent email enumeration.
 *
 * @param {string} email
 */
export const forgotPassword = async (email) => {
  const res = await api.post("/auth/forgot-password", {
    email: sanitizeEmail(email),
  });
  return res.data; // { success, message }
};

/**
 * Reset the user's password using the token from the reset email.
 *
 * @param {{ token, password }} params
 */
export const resetPassword = async ({ token, password }) => {
  const res = await api.post("/auth/reset-password", {
    token: sanitizeStr(token),
    password,
  });
  return res.data; // { success, message, user }
};

/**
 * Authenticate via Google OAuth (ID token from GSI library).
 * Role is passed so the backend can assign the correct user type for new users.
 *
 * @param {{ credential, role }} params
 */
export const googleAuth = async ({ credential, role = "jobseeker" }) => {
  const res = await api.post("/auth/google", { credential, role });
  return res.data; // { success, message, user }
};

/**
 * Fetch the currently authenticated user's profile.
 * Relies on the HttpOnly cookie being present — will 401 if not logged in.
 */
export const getMe = async () => {
  const res = await api.get("/auth/me");
  return res.data; // { success, user }
};

/**
 * Log the user out.
 * Backend clears the HttpOnly cookie; frontend clears its local state.
 */
export const logoutUser = async () => {
  const res = await api.post("/auth/logout");
  return res.data; // { success, message }
};
