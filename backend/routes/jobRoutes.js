const express = require("express");
const router = express.Router();

// Import our middleware
const { protect, authorize, requireVerified } = require("../middleware/auth");

// Import controller functions
const {
  createJob,
  getJobs,
  getJobById,
  updateJob,
  deleteJob,
} = require("../controllers/jobController");

/**
 * jobRoutes.js
 * ────────────
 * Defines the URL paths for the Recruiter Job Management API.
 *
 * All routes that modify data (POST, PUT, DELETE) and the
 * recruiter-scoped GET /api/jobs are protected by:
 *   1. protect      → verifies the JWT and sets req.user
 *   2. authorize    → ensures the user has the "recruiter" role
 *   3. requireVerified (on write routes) → ensures company is approved
 *
 * The ownership check (does this recruiter own this job?) is handled
 * inside each individual controller function, not here.
 *
 * Route summary:
 *
 *   POST   /api/jobs           → createJob   (recruiter only)
 *   GET    /api/jobs           → getJobs     (recruiter only — their own jobs)
 *   GET    /api/jobs/:id       → getJobById  (recruiter only — must own the job)
 *   PUT    /api/jobs/:id       → updateJob   (recruiter only — must own the job)
 *   DELETE /api/jobs/:id       → deleteJob   (recruiter only — must own the job)
 */

// ─── All routes below require a valid JWT + recruiter role ────────────────────
router.use(protect);
router.use(authorize("recruiter", "admin"));

// POST /api/jobs — create a new job listing
// requireVerified ensures the recruiter's company has been approved by admin
router.post("/", requireVerified, createJob);

// GET /api/jobs — list all jobs belonging to the logged-in recruiter
router.get("/", getJobs);

// GET /api/jobs/:id — get a single job (ownership verified in controller)
router.get("/:id", getJobById);

// PUT /api/jobs/:id — update a job (ownership + field whitelist enforced in controller)
router.put("/:id", requireVerified, updateJob);

// DELETE /api/jobs/:id — delete a job (ownership verified in controller)
router.delete("/:id", deleteJob);

module.exports = router;
