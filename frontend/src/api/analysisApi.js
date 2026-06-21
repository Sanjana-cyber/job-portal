/**
 * analysisApi.js
 * Frontend API methods for the Resume Intelligence module:
 *  - parseResume       — Gemini extracts structured JSON from PDF/DOCX
 *  - matchATS          — DETERMINISTIC backend ATS score (no Gemini)
 *  - getAiIntelligence — Gemini explains fixed score + recommends jobs (NEW)
 *  - getAiFeedback     — Legacy qualitative feedback (preserved)
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
// Deterministic backend scoring — same inputs always produce same score
// body: { jobDescription: string }
// returns: { matchScore, matchedKeywords, missingKeywords, status }
export const matchATS = (resumeId, jobDescription) =>
  api.post(`/resume-intelligence/${resumeId}/ats-match`, { jobDescription });

// POST /api/resume-intelligence/:id/ai-intelligence  (NEW)
// Gemini explains the fixed ATS score and recommends jobs
// body: { jobDescription, atsScore, matchedSkills, missingSkills,
//         matchedRequirements?, missingRequirements?,
//         internalJobsList?, jobMatchScores? }
// returns: { atsFeedback, recommendedJobs }
export const getAiIntelligence = (resumeId, payload) =>
  api.post(`/resume-intelligence/${resumeId}/ai-intelligence`, payload);

// POST /api/resume-intelligence/:id/ai-feedback  (LEGACY)
// body: { jobDescription, atsScore, matchedSkills, missingKeywords }
export const getAiFeedback = (resumeId, payload) =>
  api.post(`/resume-intelligence/${resumeId}/ai-feedback`, payload);
