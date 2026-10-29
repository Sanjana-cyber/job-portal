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
  selectCandidateForInterview,
  verifyInterviewInvitation,
  deleteApplication,
  upload,
} = require("../controllers/applicationController");

// ─── Public routes (no auth required) ──────────────────────────────────────
router.post("/:jobId/direct-apply", upload.single("resume"), directApply);
router.get("/interview-invitation/:token", verifyInterviewInvitation);

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
router.delete("/:id", authorize("recruiter", "admin"), deleteApplication);
router.post("/:id/retry-ats", authorize("recruiter", "admin"), retryAtsScoring);
router.post("/:id/select", authorize("recruiter", "admin"), selectCandidateForInterview);

module.exports = router;
