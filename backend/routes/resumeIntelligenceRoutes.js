const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const {
  parseResume,
  matchATS,
  getAiFeedback,
  getAiIntelligence,
} = require("../controllers/resumeIntelligenceController");

// All routes require authentication
router.use(protect);

// ─── Parse a specific resume version ───────────────────────────────────────
// POST /api/resume-intelligence/:id/parse
router.post("/:id/parse", parseResume);

// ─── Deterministic ATS match score (no Gemini) ─────────────────────────────
// POST /api/resume-intelligence/:id/ats-match
// Body: { jobDescription: "..." }
// Returns: { matchScore, matchedKeywords, missingKeywords, status }
router.post("/:id/ats-match", matchATS);

// ─── AI Intelligence (NEW) — Gemini explanation only ──────────────────────
// POST /api/resume-intelligence/:id/ai-intelligence
// Body: { jobDescription, atsScore, matchedSkills, missingSkills,
//         matchedRequirements?, missingRequirements?,
//         internalJobsList?, jobMatchScores? }
// Returns: { atsFeedback, recommendedJobs }
router.post("/:id/ai-intelligence", getAiIntelligence);

// ─── AI Feedback (LEGACY — preserved for backward compat) ──────────────────
// POST /api/resume-intelligence/:id/ai-feedback
router.post("/:id/ai-feedback", getAiFeedback);

module.exports = router;
