import axios from "axios";

/**
 * Axios instance configured for the Job Portal API
 * - Base URL points to the backend server
 * - withCredentials ensures cookies are sent with every request
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Register a new user
 * @param {Object} data - { name, email, password, role }
 */
export const registerUser = (data) => api.post("/auth/register", data);

/**
 * Login user
 * @param {Object} data - { email, password }
 */
export const loginUser = (data) => api.post("/auth/login", data);

/**
 * Logout current user (clears cookie)
 */
export const logoutUser = () => api.post("/auth/logout");

/**
 * Get current authenticated user
 */
export const getMe = () => api.get("/auth/me");

/**
 * Send forgot password email
 * @param {Object} data - { email }
 */
export const forgotPassword = (data) => api.post("/auth/forgot-password", data);

/**
 * Reset password with token
 * @param {Object} data - { token, password }
 */
export const resetPassword = (data) => api.post("/auth/reset-password", data);

/**
 * Google OAuth authentication
 * @param {Object} data - { credential, role }
 */
export const googleAuth = (data) => api.post("/auth/google", data);

export default api;
