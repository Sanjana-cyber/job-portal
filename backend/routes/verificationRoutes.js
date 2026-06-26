const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const {
  submitVerificationRequest,
  getVerificationStatus,
  getVerificationQueue,
  approveRecruiter,
  rejectRecruiter,
  getVerificationSettings,
  updateVerificationSettings,
  getAdminStats,
} = require("../controllers/verificationController");

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

module.exports = router;
