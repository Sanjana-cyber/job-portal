const express = require("express");
const router = express.Router();
const { protect, authorize, optionalProtect } = require("../middleware/auth");
const {
  createJob,
  getAllJobs,
  getJobById,
  updateJob,
  deleteJob,
} = require("../controllers/jobController");

// Public & Job Seeker + Recruiter read access
router.get("/", optionalProtect, getAllJobs);
router.get("/:id", optionalProtect, getJobById);

// Recruiter write access
router.post("/", protect, authorize("recruiter", "admin"), createJob);
router.put("/:id", protect, authorize("recruiter", "admin"), updateJob);
router.delete("/:id", protect, authorize("recruiter", "admin"), deleteJob);

module.exports = router;
