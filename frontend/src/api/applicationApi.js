import api from "./authApi";

// Candidate
export const applyToJob = (jobId, data) => api.post(`/applications/${jobId}/apply`, data);
export const getMyApplications = () => api.get("/applications/me");

// Recruiter
export const getJobApplications = (jobId) => api.get(`/applications/job/${jobId}`);
export const updateApplicationStatus = (appId, status) => api.put(`/applications/${appId}/status`, { status });
