import axios from 'axios';

/**
 * Central API Client Configuration
 * Base URL connects to backend Express server on port 5000
 * withCredentials: true ensures HTTP-only cookies (JWT) are sent with requests
 */
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach Bearer token from localStorage if present as fallback
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: extract error message cleanly
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message || error.message || 'Something went wrong';
    return Promise.reject({
      status: error.response?.status || 500,
      message,
      data: error.response?.data,
    });
  }
);

// ============================================
// Auth API Endpoints
// ============================================

/** Register a user (jobseeker or recruiter) */
export const registerUser = async ({ name, email, password, role, companyName, companyWebsite }) => {
  const payload = { name, email, password, role };
  if (role === 'recruiter') {
    payload.companyName = companyName;
    if (companyWebsite) payload.companyWebsite = companyWebsite;
  }
  const res = await api.post('/auth/register', payload);
  if (res.data?.token) {
    localStorage.setItem('token', res.data.token);
  }
  return res.data;
};

/** Login user */
export const loginUser = async ({ email, password }) => {
  const res = await api.post('/auth/login', { email, password });
  if (res.data?.token) {
    localStorage.setItem('token', res.data.token);
  }
  return res.data;
};

/** Forgot password (sends reset email) */
export const forgotPassword = async (email) => {
  const res = await api.post('/auth/forgot-password', { email });
  return res.data;
};

/** Reset password using token */
export const resetPassword = async ({ token, password }) => {
  const res = await api.post('/auth/reset-password', { token, password });
  if (res.data?.token) {
    localStorage.setItem('token', res.data.token);
  }
  return res.data;
};

/** Google OAuth login/register */
export const googleAuth = async ({ credential, role = 'jobseeker' }) => {
  const res = await api.post('/auth/google', { credential, role });
  if (res.data?.token) {
    localStorage.setItem('token', res.data.token);
  }
  return res.data;
};

/** Get authenticated user profile */
export const getMe = async () => {
  const res = await api.get('/auth/me');
  return res.data;
};

/** Logout user */
export const logoutUser = async () => {
  try {
    const res = await api.post('/auth/logout');
    return res.data;
  } finally {
    localStorage.removeItem('token');
  }
};
