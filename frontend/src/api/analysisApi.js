/**
 * analysisApi.js
 * Frontend API methods for the Resume Intelligence module:
 *  - Parse a resume (text extraction + Gemini JSON)
 *  - Get ATS match score (Gemini + Affinda)
 *  - Get AI qualitative feedback (Gemini)
 */
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  withCredentials: true,
});

// POST /api/resume-intelligence/:id/parse
export const parseResume = (resumeId) =>
  api.post(`/resume-intelligence/${resumeId}/parse`);

// POST /api/resume-intelligence/:id/ats-match
// body: { jobDescription: string }
export const matchATS = (resumeId, jobDescription) =>
  api.post(`/resume-intelligence/${resumeId}/ats-match`, { jobDescription });

// POST /api/resume-intelligence/:id/ai-feedback
// body: { jobDescription, atsScore, matchedSkills, missingKeywords }
export const getAiFeedback = (resumeId, payload) =>
  api.post(`/resume-intelligence/${resumeId}/ai-feedback`, payload);
