import axios from "axios";

/**
 * Reuse the same axios instance configured in authApi.js
 * All requests include credentials (cookies) automatically
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

// ─── Profile ──────────────────────────────────────────────────────────────
export const getMyProfile        = ()     => api.get("/profile/me");

// ─── Sections ─────────────────────────────────────────────────────────────
export const updatePersonalInfo  = (data) => api.put("/profile/personal", data);
export const updateProfessional  = (data) => api.put("/profile/professional", data);
export const updateSkills        = (data) => api.put("/profile/skills", data);

// ─── Education ────────────────────────────────────────────────────────────
export const addEducation        = (data) => api.post("/profile/education", data);
export const updateEducation     = (id, data) => api.put(`/profile/education/${id}`, data);
export const deleteEducation     = (id)   => api.delete(`/profile/education/${id}`);

// ─── Experience ───────────────────────────────────────────────────────────
export const addExperience       = (data) => api.post("/profile/experience", data);
export const updateExperience    = (id, data) => api.put(`/profile/experience/${id}`, data);
export const deleteExperience    = (id)   => api.delete(`/profile/experience/${id}`);

// ─── Projects ─────────────────────────────────────────────────────────────
export const addProject          = (data) => api.post("/profile/projects", data);
export const updateProject       = (id, data) => api.put(`/profile/projects/${id}`, data);
export const deleteProject       = (id)   => api.delete(`/profile/projects/${id}`);

// ─── Certifications ───────────────────────────────────────────────────────
export const addCertification    = (data) => api.post("/profile/certifications", data);
export const updateCertification = (id, data) => api.put(`/profile/certifications/${id}`, data);
export const deleteCertification = (id)   => api.delete(`/profile/certifications/${id}`);

// ─── File Uploads (multipart/form-data) ───────────────────────────────────
// NOTE: Do NOT set Content-Type manually for FormData.
// Axios auto-detects FormData and sets 'multipart/form-data; boundary=...' correctly.
// Manually forcing the header strips the boundary → multer can't parse → 500 error.
export const uploadPhoto  = (formData) => api.post("/profile/photo",  formData);
export const deletePhoto  = ()         => api.delete("/profile/photo");
export const uploadResume = (formData) => api.post("/profile/resume", formData);
export const deleteResume = ()         => api.delete("/profile/resume");
