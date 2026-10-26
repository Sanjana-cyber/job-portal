const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const {
  applyToJob,
  getJobApplications,
  getMyApplications,
  updateApplicationStatus,
  directApply,
  upload,
} = require("../controllers/applicationController");

// ─── Public: Seeker direct-apply with resume upload (no auth) ──────────────
router.post("/:jobId/direct-apply", upload.single("resume"), directApply);

// ─── Protected routes ──────────────────────────────────────────────────────
router.use(protect);

// Candidate routes
router.post("/:jobId/apply", authorize("jobseeker", "admin"), applyToJob);
router.get("/me", authorize("jobseeker", "admin"), getMyApplications);

// Recruiter routes
router.get("/job/:jobId", authorize("recruiter", "admin"), getJobApplications);
router.put("/:id/status", authorize("recruiter", "admin"), updateApplicationStatus);

module.exports = router;

