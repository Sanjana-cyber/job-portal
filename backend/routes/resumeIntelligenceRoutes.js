const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const {
  parseResume,
  matchATS,
  getAiFeedback,
} = require("../controllers/resumeIntelligenceController");

// All routes require authentication
router.use(protect);

// ─── Parse a specific resume version ───────────────────────────────────────
// POST /api/resume-intelligence/:id/parse
router.post("/:id/parse", parseResume);

// ─── ATS match score ────────────────────────────────────────────────────────
// POST /api/resume-intelligence/:id/ats-match
// Body: { jobDescription: "..." }
router.post("/:id/ats-match", matchATS);

// ─── AI Feedback ────────────────────────────────────────────────────────────
// POST /api/resume-intelligence/:id/ai-feedback
// Body: { jobDescription: "...", atsScore: 82, matchedSkills: [...], missingKeywords: [...] }
router.post("/:id/ai-feedback", getAiFeedback);

module.exports = router;
