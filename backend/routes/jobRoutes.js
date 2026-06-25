const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const {
  createJob,
  getJobs,
  getMyJobs,
  getJobById,
  updateJob,
  deleteJob
} = require("../controllers/jobController");

// Public/Authenticated
router.get("/", getJobs);
router.get("/:id", getJobById);

// Recruiter only
router.use(protect);
router.use(authorize("recruiter", "admin"));

router.get("/recruiter/me", getMyJobs);
router.post("/", createJob);
router.put("/:id", updateJob);
router.delete("/:id", deleteJob);

module.exports = router;
