import axios from "axios";
import tokenService from "./tokenService";

/**
 * Central API Client
 * ─────────────────────────────────────────────────────────────────────────────
 * Production Security Architecture:
 *   • withCredentials: true — automatically sends the HttpOnly cookie when supported
 *   • Bearer Token Injection — request interceptor pulls token from tokenService
 *     and injects into the Authorization header (essential for cross-origin/localhost reliability)
 *   • 10 s timeout — prevents the UI from hanging on a dead backend
 *   • 401 interceptor — clears tokenService and signals session expiration
 *   • 429 interceptor — surfaces rate-limiting
 */

const getApiBaseUrl = () => {
  const envUrl =
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    "http://localhost:5000/api";
  const trimmed = envUrl.trim().replace(/\/+$/, "");
  return trimmed.endsWith("/api") ? trimmed : `${trimmed}/api`;
};

export const API_BASE_URL = getApiBaseUrl();

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 10_000,
  headers: {
    "Content-Type": "application/json",
  },
});

// ─── Request Interceptor ─────────────────────────────────────────────────────
// Attach Bearer token from tokenService on every outgoing request
api.interceptors.request.use((config) => {
  const token = tokenService.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
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

    // 401 → session expired or invalid → clear token and dispatch auth:expired
    if (status === 401) {
      tokenService.clearToken();
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
  if (res.data?.token) {
    tokenService.setToken(res.data.token);
  }
  return res.data; // { success, message, user }
};

/**
 * Login an existing user.
 * Sets the token via tokenService and receives HttpOnly cookie.
 *
 * @param {{ email, password }} params
 */
export const loginUser = async ({ email, password }) => {
  const res = await api.post("/auth/login", {
    email: sanitizeEmail(email),
    password,
  });
  if (res.data?.token) {
    tokenService.setToken(res.data.token);
  }
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
  if (res.data?.token) {
    tokenService.setToken(res.data.token);
  }
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
  if (res.data?.token) {
    tokenService.setToken(res.data.token);
  }
  return res.data; // { success, message, user }
};

/**
 * Fetch the currently authenticated user's profile.
 * Relies on Bearer token or HttpOnly cookie being present — will 401 if not logged in.
 */
export const getMe = async () => {
  const res = await api.get("/auth/me");
  return res.data; // { success, user }
};

/**
 * Log the user out.
 * Clears tokenService and notifies backend to clear HttpOnly cookie.
 */
export const logoutUser = async () => {
  tokenService.clearToken();
  const res = await api.post("/auth/logout");
  return res.data; // { success, message }
};

// ─── Applications API ─────────────────────────────────────────────────────────

export const getJobApplications = async (jobId) => {
  const res = await api.get(`/applications/job/${jobId}`);
  return res.data; // { success, count, data }
};

export const updateApplicationStatus = async (applicationId, status) => {
  const res = await api.put(`/applications/${applicationId}/status`, { status });
  return res.data; // { success, message, data }
};

export const retryApplicationAts = async (applicationId) => {
  const res = await api.post(`/applications/${applicationId}/retry-ats`);
  return res.data; // { success, message, data }
};

// ─── Notifications API ────────────────────────────────────────────────────────

export const getNotifications = async () => {
  const res = await api.get("/notifications");
  return res.data; // { success, count, unreadCount, data }
};

export const markNotificationRead = async (notificationId) => {
  const res = await api.put(`/notifications/${notificationId}/read`);
  return res.data; // { success, data }
};

export const markAllNotificationsRead = async () => {
  const res = await api.put("/notifications/read-all");
  return res.data; // { success, message }
};

