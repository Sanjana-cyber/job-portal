const CandidateProfile = require("../models/CandidateProfile");
const { ErrorResponse } = require("../middleware/errorHandler");
const { uploadToCloudinary, deleteFromCloudinary } = require("../utils/cloudinaryHelper");

// ─── Helper: get or create profile ────────────────────────────────────────
const getOrCreate = async (userId) => {
  let profile = await CandidateProfile.findOne({ user: userId });
  if (!profile) profile = new CandidateProfile({ user: userId });
  return profile;
};

// ─── GET /api/profile/me ──────────────────────────────────────────────────
exports.getMyProfile = async (req, res, next) => {
  try {
    const profile = await getOrCreate(req.user._id);
    if (profile.isNew) await profile.save();
    res.status(200).json({ success: true, data: { profile, completionScore: profile.completionScore } });
  } catch (err) { next(err); }
};

// ─── PUT /api/profile/personal ────────────────────────────────────────────
exports.updatePersonalInfo = async (req, res, next) => {
  try {
    const { phone, location, linkedin, github, portfolio } = req.body;
    const profile = await getOrCreate(req.user._id);
    if (phone !== undefined)     profile.phone     = phone.trim();
    if (location !== undefined)  profile.location  = location.trim();
    if (linkedin !== undefined)  profile.linkedin  = linkedin.trim();
    if (github !== undefined)    profile.github    = github.trim();
    if (portfolio !== undefined) profile.portfolio = portfolio.trim();
    await profile.save();
    res.status(200).json({ success: true, message: "Personal info updated", data: { profile, completionScore: profile.completionScore } });
  } catch (err) { next(err); }
};

// ─── PUT /api/profile/professional ───────────────────────────────────────
exports.updateProfessional = async (req, res, next) => {
  try {
    const { headline, about } = req.body;
    const profile = await getOrCreate(req.user._id);
    if (headline !== undefined) profile.headline = headline.trim();
    if (about !== undefined)    profile.about    = about.trim();
    await profile.save();
    res.status(200).json({ success: true, message: "Professional info updated", data: { profile, completionScore: profile.completionScore } });
  } catch (err) { next(err); }
};

// ─── PUT /api/profile/skills ──────────────────────────────────────────────
exports.updateSkills = async (req, res, next) => {
  try {
    const { technicalSkills, tools, softSkills } = req.body;
    const profile = await getOrCreate(req.user._id);
    profile.technicalSkills = Array.isArray(technicalSkills) ? technicalSkills : [];
    profile.tools           = Array.isArray(tools) ? tools : [];
    profile.softSkills      = Array.isArray(softSkills) ? softSkills : [];
    await profile.save();
    res.status(200).json({ success: true, message: "Skills updated", data: { profile, completionScore: profile.completionScore } });
  } catch (err) { next(err); }
};

// ─── EDUCATION ────────────────────────────────────────────────────────────
exports.addEducation = async (req, res, next) => {
  try {
    const profile = await getOrCreate(req.user._id);
    profile.education.push(req.body);
    await profile.save();
    res.status(201).json({ success: true, message: "Education added", data: { profile, completionScore: profile.completionScore } });
  } catch (err) { next(err); }
};

exports.updateEducation = async (req, res, next) => {
  try {
    const profile = await CandidateProfile.findOne({ user: req.user._id });
    if (!profile) return next(new ErrorResponse("Profile not found", 404));
    const entry = profile.education.id(req.params.id);
    if (!entry) return next(new ErrorResponse("Education entry not found", 404));
    Object.assign(entry, req.body);
    await profile.save();
    res.status(200).json({ success: true, message: "Education updated", data: { profile, completionScore: profile.completionScore } });
  } catch (err) { next(err); }
};

exports.deleteEducation = async (req, res, next) => {
  try {
    const profile = await CandidateProfile.findOne({ user: req.user._id });
    if (!profile) return next(new ErrorResponse("Profile not found", 404));
    profile.education.pull({ _id: req.params.id });
    await profile.save();
    res.status(200).json({ success: true, message: "Education removed", data: { profile, completionScore: profile.completionScore } });
  } catch (err) { next(err); }
};

// ─── EXPERIENCE ───────────────────────────────────────────────────────────
exports.addExperience = async (req, res, next) => {
  try {
    const profile = await getOrCreate(req.user._id);
    profile.experience.push(req.body);
    await profile.save();
    res.status(201).json({ success: true, message: "Experience added", data: { profile, completionScore: profile.completionScore } });
  } catch (err) { next(err); }
};

exports.updateExperience = async (req, res, next) => {
  try {
    const profile = await CandidateProfile.findOne({ user: req.user._id });
    if (!profile) return next(new ErrorResponse("Profile not found", 404));
    const entry = profile.experience.id(req.params.id);
    if (!entry) return next(new ErrorResponse("Experience not found", 404));
    Object.assign(entry, req.body);
    await profile.save();
    res.status(200).json({ success: true, message: "Experience updated", data: { profile, completionScore: profile.completionScore } });
  } catch (err) { next(err); }
};

exports.deleteExperience = async (req, res, next) => {
  try {
    const profile = await CandidateProfile.findOne({ user: req.user._id });
    if (!profile) return next(new ErrorResponse("Profile not found", 404));
    profile.experience.pull({ _id: req.params.id });
    await profile.save();
    res.status(200).json({ success: true, message: "Experience removed", data: { profile, completionScore: profile.completionScore } });
  } catch (err) { next(err); }
};

// ─── PROJECTS ─────────────────────────────────────────────────────────────
exports.addProject = async (req, res, next) => {
  try {
    const profile = await getOrCreate(req.user._id);
    profile.projects.push(req.body);
    await profile.save();
    res.status(201).json({ success: true, message: "Project added", data: { profile, completionScore: profile.completionScore } });
  } catch (err) { next(err); }
};

exports.updateProject = async (req, res, next) => {
  try {
    const profile = await CandidateProfile.findOne({ user: req.user._id });
    if (!profile) return next(new ErrorResponse("Profile not found", 404));
    const entry = profile.projects.id(req.params.id);
    if (!entry) return next(new ErrorResponse("Project not found", 404));
    Object.assign(entry, req.body);
    await profile.save();
    res.status(200).json({ success: true, message: "Project updated", data: { profile, completionScore: profile.completionScore } });
  } catch (err) { next(err); }
};

exports.deleteProject = async (req, res, next) => {
  try {
    const profile = await CandidateProfile.findOne({ user: req.user._id });
    if (!profile) return next(new ErrorResponse("Profile not found", 404));
    profile.projects.pull({ _id: req.params.id });
    await profile.save();
    res.status(200).json({ success: true, message: "Project removed", data: { profile, completionScore: profile.completionScore } });
  } catch (err) { next(err); }
};

// ─── CERTIFICATIONS ───────────────────────────────────────────────────────
exports.addCertification = async (req, res, next) => {
  try {
    const profile = await getOrCreate(req.user._id);
    profile.certifications.push(req.body);
    await profile.save();
    res.status(201).json({ success: true, message: "Certification added", data: { profile, completionScore: profile.completionScore } });
  } catch (err) { next(err); }
};

exports.updateCertification = async (req, res, next) => {
  try {
    const profile = await CandidateProfile.findOne({ user: req.user._id });
    if (!profile) return next(new ErrorResponse("Profile not found", 404));
    const entry = profile.certifications.id(req.params.id);
    if (!entry) return next(new ErrorResponse("Certification not found", 404));
    Object.assign(entry, req.body);
    await profile.save();
    res.status(200).json({ success: true, message: "Certification updated", data: { profile, completionScore: profile.completionScore } });
  } catch (err) { next(err); }
};

exports.deleteCertification = async (req, res, next) => {
  try {
    const profile = await CandidateProfile.findOne({ user: req.user._id });
    if (!profile) return next(new ErrorResponse("Profile not found", 404));
    profile.certifications.pull({ _id: req.params.id });
    await profile.save();
    res.status(200).json({ success: true, message: "Certification removed", data: { profile, completionScore: profile.completionScore } });
  } catch (err) { next(err); }
};

// ─── PHOTO UPLOAD ─────────────────────────────────────────────────────────
exports.uploadPhoto = async (req, res, next) => {
  try {
    if (!req.file) return next(new ErrorResponse("No photo file provided", 400));
    const profile = await getOrCreate(req.user._id);
    // Delete old photo from Cloudinary before uploading new one
    if (profile.photo && profile.photo.publicId) {
      await deleteFromCloudinary(profile.photo.publicId, "image");
    }
    const { url, publicId } = await uploadToCloudinary(
      req.file.buffer,
      "job-portal/profiles/photos",
      "image"
    );
    profile.photo = { url, publicId };
    await profile.save();
    res.status(200).json({ success: true, message: "Photo uploaded", data: { photoUrl: url, completionScore: profile.completionScore } });
  } catch (err) { next(err); }
};

exports.deletePhoto = async (req, res, next) => {
  try {
    const profile = await CandidateProfile.findOne({ user: req.user._id });
    if (!profile) return next(new ErrorResponse("Profile not found", 404));
    await deleteFromCloudinary(profile.photo.publicId, "image");
    profile.photo = { url: "", publicId: "" };
    await profile.save();
    res.status(200).json({ success: true, message: "Photo removed" });
  } catch (err) { next(err); }
};

// ─── RESUME UPLOAD ────────────────────────────────────────────────────────
exports.uploadResume = async (req, res, next) => {
  try {
    if (!req.file) return next(new ErrorResponse("No resume file provided", 400));
    const profile = await getOrCreate(req.user._id);
    // Delete old resume from Cloudinary before uploading new one
    if (profile.resume && profile.resume.publicId) {
      await deleteFromCloudinary(profile.resume.publicId, "raw");
    }
    const { url, publicId } = await uploadToCloudinary(
      req.file.buffer,
      "job-portal/profiles/resumes",
      "raw"
    );
    profile.resume = {
      url,
      publicId,
      originalName: req.file.originalname,
      uploadedAt: new Date(),
    };
    await profile.save();
    res.status(200).json({ success: true, message: "Resume uploaded", data: { resumeUrl: url, originalName: req.file.originalname, completionScore: profile.completionScore } });
  } catch (err) { next(err); }
};

exports.deleteResume = async (req, res, next) => {
  try {
    const profile = await CandidateProfile.findOne({ user: req.user._id });
    if (!profile) return next(new ErrorResponse("Profile not found", 404));
    await deleteFromCloudinary(profile.resume.publicId, "raw");
    profile.resume = { url: "", publicId: "", originalName: "", uploadedAt: null };
    await profile.save();
    res.status(200).json({ success: true, message: "Resume removed", data: { completionScore: profile.completionScore } });
  } catch (err) { next(err); }
};
