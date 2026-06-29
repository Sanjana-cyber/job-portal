const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const {
  submitVerificationRequest,
  getVerificationStatus,
  getVerificationQueue,
  approveRecruiter,
  rejectRecruiter,
  runWebCheckForRecruiter,
  getVerificationSettings,
  updateVerificationSettings,
  getAdminStats,
} = require("../controllers/verificationController");

const { analyzeCompanyDetails } = require("../utils/companyAnalyzer");

// ── Recruiter routes ────────────────────────────────────────────────────────
router.post("/submit",  protect, authorize("recruiter"), submitVerificationRequest);
router.get("/status",   protect, authorize("recruiter"), getVerificationStatus);

// ── Admin routes ────────────────────────────────────────────────────────────
router.get("/queue",           protect, authorize("admin"), getVerificationQueue);
router.get("/stats",           protect, authorize("admin"), getAdminStats);
router.get("/settings",        protect, authorize("admin"), getVerificationSettings);
router.put("/settings",        protect, authorize("admin"), updateVerificationSettings);
router.put("/approve/:id",     protect, authorize("admin"), approveRecruiter);
router.put("/reject/:id",      protect, authorize("admin"), rejectRecruiter);
router.post("/webcheck/:id",   protect, authorize("admin"), runWebCheckForRecruiter);

// ── DEBUG: Test company analyzer (open, no auth — remove in production) ──────
// Usage: GET /api/verification/debug-analyze?company=TCS&email=hr@tcs.com&website=https://www.tcs.com
router.get("/debug-analyze", async (req, res) => {
  const { company, email, website } = req.query;
  if (!company || !email) {
    return res.status(400).json({ error: "Provide ?company=NAME&email=EMAIL&website=URL" });
  }
  try {
    const result = await analyzeCompanyDetails(company, email, website || "");
    res.json({ input: { company, email, website }, result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
