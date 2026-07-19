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
  getResumes, uploadResumeVersion, setActiveResume, deleteResumeVersion,
  downloadResume
} = require("../controllers/profileController");

// All profile routes require authentication
router.use(protect);

// ─── Core Profile ──────────────────────────────────────────────────────────
router.get("/me", getMyProfile);

// ─── Profile Sections ──────────────────────────────────────────────────────
router.put("/personal",      updatePersonalInfo);
router.put("/professional",  updateProfessional);
router.put("/skills",        updateSkills);
router.put("/autofill",      require("../controllers/profileController").autofillProfile);

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

// ─── Resume Versions ───────────────────────────────────────────────────────
router.get("/resumes", getResumes);
router.post("/resumes", uploadResume.single("resume"), uploadResumeVersion);
router.put("/resumes/:id/active", setActiveResume);
router.get("/resumes/:id/download", downloadResume);
router.delete("/resumes/:id", deleteResumeVersion);

module.exports = router;
