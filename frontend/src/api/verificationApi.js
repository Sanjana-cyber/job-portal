import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

/** Recruiter: submit company details for verification */
export const submitVerification = (data) => api.post("/verification/submit", data);

/** Recruiter: get own verification status + global setting */
export const getVerificationStatus = () => api.get("/verification/status");

/** Admin: list all recruiters with their verification info */
export const getVerificationQueue = () => api.get("/verification/queue");

/** Admin: approve a recruiter */
export const approveRecruiter = (id) => api.put(`/verification/approve/${id}`);

/** Admin: reject a recruiter with optional note */
export const rejectRecruiter = (id, data) => api.put(`/verification/reject/${id}`, data);

/** Admin/Public: get global verification toggle */
export const getVerificationSettings = () => api.get("/verification/settings");

/** Admin: update the global toggle */
export const updateVerificationSettings = (data) => api.put("/verification/settings", data);

/** Admin: get recruiter counts by status */
export const getAdminStats = () => api.get("/verification/stats");

/** Seeker: get jobs posted in last 48h (for notification bell) */
export const getRecentJobs = () => api.get("/jobs/recent");

export default api;
