const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const {
  applyToJob,
  getJobApplications,
  getMyApplications,
  updateApplicationStatus
} = require("../controllers/applicationController");

// All routes require authentication
router.use(protect);

// Candidate routes
router.post("/:jobId/apply", authorize("jobseeker", "admin"), applyToJob);
router.get("/me", authorize("jobseeker", "admin"), getMyApplications);

// Recruiter routes
router.get("/job/:jobId", authorize("recruiter", "admin"), getJobApplications);
router.put("/:id/status", authorize("recruiter", "admin"), updateApplicationStatus);

module.exports = router;
