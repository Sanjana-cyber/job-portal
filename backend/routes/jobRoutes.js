const express = require("express");
const router = express.Router();
const { protect, authorize, requireVerified } = require("../middleware/auth");
const {
  createJob,
  getJobs,
  getMyJobs,
  getJobById,
  updateJob,
  deleteJob,
  getRecentJobs,
} = require("../controllers/jobController");

// Public / authenticated
router.get("/recent", getRecentJobs);
router.get("/", getJobs);
router.get("/:id", getJobById);

// Recruiter / admin only
router.use(protect);
router.use(authorize("recruiter", "admin"));

router.get("/recruiter/me", getMyJobs);
router.post("/",    requireVerified, createJob);
router.put("/:id",  requireVerified, updateJob);
router.delete("/:id", deleteJob);

module.exports = router;

