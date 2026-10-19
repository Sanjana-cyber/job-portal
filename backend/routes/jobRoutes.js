const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const {
  createJob,
  getAllJobs,
  getJobById,
  updateJob,
  deleteJob,
} = require("../controllers/jobController");

// Protect all routes: Require valid JWT token and recruiter role
router.use(protect);
router.use(authorize("recruiter", "admin"));

// Route definitions
router.post("/", createJob);
router.get("/", getAllJobs);
router.get("/:id", getJobById);
router.put("/:id", updateJob);
router.delete("/:id", deleteJob);

module.exports = router;
