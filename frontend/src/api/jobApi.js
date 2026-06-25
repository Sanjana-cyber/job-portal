import api from "./authApi";

export const createJob = (jobData) => api.post("/jobs", jobData);
export const getJobs = (search = "") => api.get(`/jobs?search=${search}`);
export const getMyJobs = () => api.get("/jobs/recruiter/me");
export const getJobById = (id) => api.get(`/jobs/${id}`);
export const updateJob = (id, jobData) => api.put(`/jobs/${id}`, jobData);
export const deleteJob = (id) => api.delete(`/jobs/${id}`);
