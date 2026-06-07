const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { uploadPhoto, uploadResume } = require("../middleware/upload");
const {
  getMyProfile,
  updatePersonalInfo,
  updateProfessional,
  updateSkills,
  addEducation, updateEducation, deleteEducation,
  addExperience, updateExperience, deleteExperience,
  addProject, updateProject, deleteProject,
  addCertification, updateCertification, deleteCertification,
  uploadPhoto: uploadPhotoCtrl, deletePhoto,
  uploadResume: uploadResumeCtrl, deleteResume,
} = require("../controllers/profileController");

// All profile routes require authentication
router.use(protect);

// ─── Core Profile ──────────────────────────────────────────────────────────
router.get("/me", getMyProfile);

// ─── Profile Sections ──────────────────────────────────────────────────────
router.put("/personal",      updatePersonalInfo);
router.put("/professional",  updateProfessional);
router.put("/skills",        updateSkills);

// ─── Education ─────────────────────────────────────────────────────────────
router.post("/education",         addEducation);
router.put("/education/:id",      updateEducation);
router.delete("/education/:id",   deleteEducation);

// ─── Experience ────────────────────────────────────────────────────────────
router.post("/experience",        addExperience);
router.put("/experience/:id",     updateExperience);
router.delete("/experience/:id",  deleteExperience);

// ─── Projects ──────────────────────────────────────────────────────────────
router.post("/projects",          addProject);
router.put("/projects/:id",       updateProject);
router.delete("/projects/:id",    deleteProject);

// ─── Certifications ────────────────────────────────────────────────────────
router.post("/certifications",        addCertification);
router.put("/certifications/:id",     updateCertification);
router.delete("/certifications/:id",  deleteCertification);

// ─── Photo ─────────────────────────────────────────────────────────────────
// uploadPhoto.single("photo") — multer processes "photo" field from multipart/form-data
router.post("/photo",   uploadPhoto.single("photo"),   uploadPhotoCtrl);
router.delete("/photo", deletePhoto);

// ─── Resume ────────────────────────────────────────────────────────────────
// uploadResume.single("resume") — multer processes "resume" field
router.post("/resume",   uploadResume.single("resume"), uploadResumeCtrl);
router.delete("/resume", deleteResume);

module.exports = router;
