const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const {
  applyToJob,
  getJobApplications,
  getMyApplications,
  updateApplicationStatus,
  directApply,
  retryAtsScoring,
  getApplicationResume,
  upload,
} = require("../controllers/applicationController");

// ─── Public: Direct application with resume file upload (no auth required) ─
router.post("/:jobId/direct-apply", upload.single("resume"), directApply);

// ─── Protected routes ──────────────────────────────────────────────────────
router.use(protect);

// View / download resume for an application (candidate, job's recruiter, or admin)
router.get("/:id/resume", getApplicationResume);

// Candidate routes
router.post("/:jobId", authorize("jobseeker", "admin"), applyToJob);
router.post("/:jobId/apply", authorize("jobseeker", "admin"), applyToJob);
router.get("/me", authorize("jobseeker", "admin"), getMyApplications);

// Recruiter routes
router.get("/job/:jobId", authorize("recruiter", "admin"), getJobApplications);
router.put("/:id/status", authorize("recruiter", "admin"), updateApplicationStatus);
router.post("/:id/retry-ats", authorize("recruiter", "admin"), retryAtsScoring);

module.exports = router;
