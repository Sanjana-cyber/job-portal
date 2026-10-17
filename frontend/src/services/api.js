import axios from "axios";

/**
 * Central API Client
 * - withCredentials sends the HttpOnly JWT cookie automatically
 * - 10s timeout prevents UI hanging on dead backend
 * - 401 interceptor auto-redirects when session expires
 */
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,        // sends HttpOnly cookie on every request
  timeout: 10000,               // 10 second timeout
  headers: {
    "Content-Type": "application/json",
  },
});

// ─── Response Interceptor ────────────────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status  = error.response?.status;
    const message = error.response?.data?.message || error.message || "Something went wrong";

    // 401 → session expired / cookie gone → soft redirect to home
    if (status === 401) {
      // Only redirect if not already on a public page
      if (!window.location.pathname.startsWith("/login")) {
        window.dispatchEvent(new CustomEvent("auth:expired"));
      }
    }

    // 429 → rate-limited by backend
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

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Trim and lowercase an email before sending */
const sanitizeEmail = (email) => (email || "").trim().toLowerCase();

/** Trim a plain string */
const sanitizeStr = (str) => (str || "").trim();

// ============================================
// Auth API Endpoints
// ============================================

/** Register a user — token stored as HttpOnly cookie by backend */
export const registerUser = async ({ name, email, password, role, companyName, companyWebsite }) => {
  const payload = {
    name: sanitizeStr(name),
    email: sanitizeEmail(email),
    password,
    role,
  };
  if (role === "recruiter") {
    payload.companyName    = sanitizeStr(companyName);
    payload.companyWebsite = sanitizeStr(companyWebsite);
  }
  const res = await api.post("/auth/register", payload);
  return res.data;
};

/** Login user — token stored as HttpOnly cookie by backend */
export const loginUser = async ({ email, password }) => {
  const res = await api.post("/auth/login", {
    email: sanitizeEmail(email),
    password,
  });
  return res.data;
};

/** Forgot password — sends reset email */
export const forgotPassword = async (email) => {
  const res = await api.post("/auth/forgot-password", { email: sanitizeEmail(email) });
  return res.data;
};

/** Reset password using token */
export const resetPassword = async ({ token, password }) => {
  const res = await api.post("/auth/reset-password", { token, password });
  return res.data;
};

/** Google OAuth — role passed so backend assigns correct user type */
export const googleAuth = async ({ credential, role = "jobseeker" }) => {
  const res = await api.post("/auth/google", { credential, role });
  return res.data;
};

/** Get authenticated user profile (requires valid cookie) */
export const getMe = async () => {
  const res = await api.get("/auth/me");
  return res.data;
};

/** Logout — backend clears the HttpOnly cookie */
export const logoutUser = async () => {
  const res = await api.post("/auth/logout");
  return res.data;
};
