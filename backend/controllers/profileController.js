const CandidateProfile = require("../models/CandidateProfile");
const Resume = require("../models/Resume");
const { ErrorResponse } = require("../middleware/errorHandler");
const { uploadToCloudinary, deleteFromCloudinary } = require("../utils/cloudinaryHelper");
const https = require("https");

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

// ─── PUT /api/profile/autofill ────────────────────────────────────────────
exports.autofillProfile = async (req, res, next) => {
  try {
    const data = req.body;
    const profile = await getOrCreate(req.user._id);

    // Personal & Professional
    if (data.phone) profile.phone = data.phone;
    if (data.location) profile.location = data.location;
    if (data.linkedin) profile.linkedin = data.linkedin;
    if (data.github) profile.github = data.github;
    if (data.portfolio) profile.portfolio = data.portfolio;
    if (data.headline) profile.headline = data.headline;
    if (data.about) profile.about = data.about;

    // Skills (merge unique)
    if (Array.isArray(data.technicalSkills)) {
      profile.technicalSkills = [...new Set([...profile.technicalSkills, ...data.technicalSkills])];
    }
    if (Array.isArray(data.tools)) {
      profile.tools = [...new Set([...profile.tools, ...data.tools])];
    }
    if (Array.isArray(data.softSkills)) {
      profile.softSkills = [...new Set([...profile.softSkills, ...data.softSkills])];
    }

    // Education (append new)
    if (Array.isArray(data.education)) {
      data.education.forEach(edu => {
        if (edu.institution || edu.college) {
          profile.education.push({
            college: edu.institution || edu.college,
            degree: edu.degree || "Degree",
            specialization: edu.field || edu.specialization || "",
            startYear: parseInt(edu.startYear) || new Date().getFullYear() - 4,
            endYear: parseInt(edu.endYear) || new Date().getFullYear(),
            cgpa: edu.grade || edu.cgpa || ""
          });
        }
      });
    }

    // Experience (append new)
    if (Array.isArray(data.experience)) {
      data.experience.forEach(exp => {
        if (exp.company || exp.role) {
          profile.experience.push({
            company: exp.company || "Company",
            role: exp.role || "Role",
            startDate: exp.startDate ? new Date(exp.startDate) : null,
            endDate: exp.endDate ? new Date(exp.endDate) : null,
            isCurrent: !exp.endDate || String(exp.endDate).toLowerCase() === "present",
            responsibilities: exp.description || ""
          });
        }
      });
    }

    // Projects (append new)
    if (Array.isArray(data.projects)) {
      data.projects.forEach(proj => {
        if (proj.name) {
          profile.projects.push({
            name: proj.name,
            description: proj.description || "",
            techStack: Array.isArray(proj.techStack) ? proj.techStack : [],
            liveLink: proj.link || proj.liveLink || ""
          });
        }
      });
    }

    // Certifications (append new)
    if (Array.isArray(data.certifications)) {
      data.certifications.forEach(cert => {
        if (cert.name) {
          profile.certifications.push({
            name: cert.name,
            issuer: cert.issuer || "",
            issueDate: cert.year ? new Date(cert.year, 0, 1) : null
          });
        }
      });
    }

    await profile.save();
    res.status(200).json({ success: true, message: "Profile autofilled successfully", data: { profile, completionScore: profile.completionScore } });
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

// ─── RESUME VERSION HISTORY ────────────────────────────────────────────────
exports.getResumes = async (req, res, next) => {
  try {
    const resumes = await Resume.find({ user: req.user._id }).sort({ versionNumber: -1 });
    res.status(200).json({ success: true, data: resumes });
  } catch (err) { next(err); }
};

exports.uploadResumeVersion = async (req, res, next) => {
  try {
    if (!req.file) return next(new ErrorResponse("No resume file provided", 400));
    const title = req.body.title || "Untitled Resume";
    
    // Find highest version number
    const existingResumes = await Resume.find({ user: req.user._id });
    const versionNumber = existingResumes.length > 0 ? Math.max(...existingResumes.map(r => r.versionNumber)) + 1 : 1;
    
    const { url, publicId } = await uploadToCloudinary(
      req.file.buffer,
      "job-portal/profiles/resumes",
      "raw"
    );
    
    const isFirst = existingResumes.length === 0;
    
    const newResume = new Resume({
      user: req.user._id,
      title,
      versionNumber,
      fileUrl: url,
      cloudinaryPublicId: publicId,
      originalFileName: req.file.originalname,
      isActive: isFirst,
    });
    
    await newResume.save();
    
    let completionScore = 0;
    if (isFirst) {
      const profile = await getOrCreate(req.user._id);
      profile.resume = {
        url,
        publicId,
        originalName: req.file.originalname,
        uploadedAt: newResume.createdAt,
      };
      await profile.save();
      completionScore = profile.completionScore;
    } else {
      const profile = await CandidateProfile.findOne({ user: req.user._id });
      completionScore = profile ? profile.completionScore : 0;
    }
    
    res.status(201).json({ success: true, message: "Resume version uploaded", data: { resume: newResume, completionScore } });
  } catch (err) { next(err); }
};

exports.setActiveResume = async (req, res, next) => {
  try {
    const resumeId = req.params.id;
    const targetResume = await Resume.findOne({ _id: resumeId, user: req.user._id });
    if (!targetResume) return next(new ErrorResponse("Resume not found", 404));
    
    await Resume.updateMany({ user: req.user._id }, { isActive: false });
    targetResume.isActive = true;
    await targetResume.save();
    
    const profile = await getOrCreate(req.user._id);
    profile.resume = {
      url: targetResume.fileUrl,
      publicId: targetResume.cloudinaryPublicId,
      originalName: targetResume.originalFileName,
      uploadedAt: targetResume.createdAt,
    };
    await profile.save();
    
    res.status(200).json({ success: true, message: "Active resume updated", data: { resume: targetResume, completionScore: profile.completionScore } });
  } catch (err) { next(err); }
};

exports.deleteResumeVersion = async (req, res, next) => {
  try {
    const resumeId = req.params.id;
    const targetResume = await Resume.findOne({ _id: resumeId, user: req.user._id });
    if (!targetResume) return next(new ErrorResponse("Resume not found", 404));
    
    await deleteFromCloudinary(targetResume.cloudinaryPublicId, "raw");
    await Resume.findByIdAndDelete(resumeId);
    
    let completionScore = 0;
    
    if (targetResume.isActive) {
      // Clear active resume in candidate profile as per user request (manual active button)
      const profile = await CandidateProfile.findOne({ user: req.user._id });
      if (profile) {
        profile.resume = { url: "", publicId: "", originalName: "", uploadedAt: null };
        await profile.save();
        completionScore = profile.completionScore;
      }
    } else {
      const profile = await CandidateProfile.findOne({ user: req.user._id });
      completionScore = profile ? profile.completionScore : 0;
    }
    
    res.status(200).json({ success: true, message: "Resume version deleted", data: { completionScore } });
  } catch (err) { next(err); }
};

exports.downloadResume = async (req, res, next) => {
  try {
    const resumeId = req.params.id;
    const targetResume = await Resume.findOne({ _id: resumeId, user: req.user._id });
    if (!targetResume) return next(new ErrorResponse("Resume not found", 404));

    const originalName = targetResume.originalFileName || "resume.pdf";
    const ext = originalName.split('.').pop().toLowerCase();
    
    let contentType = "application/octet-stream";
    if (ext === "pdf") contentType = "application/pdf";
    else if (ext === "doc") contentType = "application/msword";
    else if (ext === "docx") contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

    res.setHeader("Content-Disposition", `attachment; filename="${originalName}"`);
    res.setHeader("Content-Type", contentType);

    // Ensure we are using https if the URL starts with https
    const protocol = targetResume.fileUrl.startsWith("https") ? https : require("http");
    
    protocol.get(targetResume.fileUrl, (stream) => {
      stream.pipe(res);
    }).on("error", (err) => {
      console.error("Error downloading file from Cloudinary:", err);
      next(new ErrorResponse("Failed to download file from storage", 500));
    });
  } catch (err) {
    next(err);
  }
};
