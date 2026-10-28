const path = require("path");
const fs = require("fs");
const multer = require("multer");
const Application = require("../models/Application");
const Job = require("../models/Job");
const Resume = require("../models/Resume");
const User = require("../models/User");
const { ErrorResponse } = require("../middleware/errorHandler");
const { computeAtsScore } = require("../utils/atsScoringService");
const { processApplicationAts } = require("../services/geminiAtsService");
const { createNotification } = require("../services/notificationService");

// ─── Multer setup for resume file uploads ──────────────────────────────────
const uploadDir = path.resolve(__dirname, "../uploads/resumes");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    // Sanitize original file name
    const cleanName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_");
    cb(null, `${unique}-${cleanName}`);
  },
});

const fileFilter = (_req, file, cb) => {
  const allowed = [".pdf", ".doc", ".docx"];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new ErrorResponse("Only PDF, DOC, and DOCX files are allowed", 400), false);
  }
};

exports.upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
});

// ─── POST /api/applications/:jobId/direct-apply ────────────────────────────
// Public applicant submits form with resume file upload (no auth required)
exports.directApply = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const { applicantName, applicantEmail, applicantPhone, coverLetter } = req.body;

    if (!applicantName || !applicantName.trim()) {
      return next(new ErrorResponse("Applicant name is required", 400));
    }
    if (!applicantEmail || !applicantEmail.trim()) {
      return next(new ErrorResponse("Applicant email is required", 400));
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(applicantEmail.trim())) {
      return next(new ErrorResponse("Please provide a valid email address", 400));
    }

    if (!req.file) {
      return next(new ErrorResponse("Resume file (.pdf, .doc, or .docx) is required", 400));
    }

    const job = await Job.findById(jobId);
    if (!job) {
      return next(new ErrorResponse("Job not found", 404));
    }

    // Check if job is accepting applications
    if (job.status !== "Open") {
      return next(new ErrorResponse("This job posting is closed and no longer accepting applications", 400));
    }

    // Check application deadline
    if (job.applicationDeadline && new Date(job.applicationDeadline) < new Date()) {
      return next(new ErrorResponse("The application deadline for this job has passed", 400));
    }

    const normalizedEmail = applicantEmail.trim().toLowerCase();

    // Prevent duplicate direct applications with the same email for this job
    const existing = await Application.findOne({
      job: jobId,
      applicantEmail: normalizedEmail,
    });
    if (existing) {
      return next(new ErrorResponse("You have already submitted an application for this job with this email address", 400));
    }

    const resumeFilePath = req.file ? req.file.path : "";

    const application = await Application.create({
      job: jobId,
      applicantName: applicantName.trim(),
      applicantEmail: normalizedEmail,
      applicantPhone: (applicantPhone || "").trim(),
      resumeFilePath,
      coverLetter: (coverLetter || "").trim(),
      status: "pending",
      atsStatus: "pending",
    });

    // 1. Send recruiter notification asynchronously
    let recruiterId = job.recruiter;
    if (!recruiterId) {
      const fallbackRecruiter = await User.findOne({ role: "recruiter" }).select("_id");
      recruiterId = fallbackRecruiter?._id;
    }
    if (recruiterId) {
      createNotification({
        recipient: recruiterId,
        type: "application_received",
        title: "New Application Received",
        message: `New application received from ${application.applicantName} for ${job.jobTitle}.`,
        job: job._id,
        application: application._id,
      }).catch((err) => {
        console.error("[applicationController] Recruiter notification error:", err.message);
      });
    }

    // 2. Trigger Gemini ATS screening in the background
    setImmediate(() => {
      processApplicationAts(application._id).catch((err) => {
        console.error("[applicationController] Background ATS screening error:", err.message);
      });
    });

    // 3. Return immediate success response without blocking on Gemini
    res.status(201).json({
      success: true,
      message: "Application submitted successfully",
      data: {
        id: application._id,
        job: application.job,
        status: application.status,
        atsStatus: application.atsStatus,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/applications/:jobId & /api/applications/:jobId/apply ────────
// Authenticated job seeker applies using their active saved resume
exports.applyToJob = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const { coverLetter } = req.body;

    const job = await Job.findById(jobId);
    if (!job) {
      return next(new ErrorResponse("Job not found", 404));
    }

    // Check if job is open
    if (job.status !== "Open") {
      return next(new ErrorResponse("This job posting is closed and no longer accepting applications", 400));
    }

    if (job.applicationDeadline && new Date(job.applicationDeadline) < new Date()) {
      return next(new ErrorResponse("The application deadline for this job has passed", 400));
    }

    // Check if candidate already applied
    const existingApp = await Application.findOne({
      job: jobId,
      applicant: req.user._id,
    });
    if (existingApp) {
      return next(new ErrorResponse("You have already applied to this job", 400));
    }

    // Get candidate's active saved resume
    const activeResume = await Resume.findOne({
      user: req.user._id,
      isActive: true,
    });
    if (!activeResume) {
      return next(new ErrorResponse("You must have an active resume uploaded to apply", 400));
    }

    // Baseline deterministic ATS computation if parsed data exists
    let initialAtsScore = null;
    let initialMatched = [];
    let initialMissing = [];

    if (activeResume.parsedData) {
      const jdText = job.description
        ? `${job.jobTitle} ${job.description} ${(job.requiredSkills || []).join(" ")}`
        : job.jobTitle;
      const atsResult = computeAtsScore(activeResume.parsedData, jdText);
      initialAtsScore = atsResult.atsScore;
      initialMatched = atsResult.matchedKeywords;
      initialMissing = atsResult.missingKeywords;
    }

    const application = await Application.create({
      job: jobId,
      applicant: req.user._id,
      applicantName: req.user.name || "Candidate",
      applicantEmail: req.user.email || "",
      applicantPhone: req.user.phone || "",
      resume: activeResume._id,
      coverLetter: (coverLetter || "").trim(),
      status: "pending",
      atsStatus: "pending",
      atsScore: initialAtsScore,
      matchedKeywords: initialMatched,
      missingKeywords: initialMissing,
    });

    // 1. Send recruiter notification asynchronously
    let recruiterId = job.recruiter;
    if (!recruiterId) {
      const fallbackRecruiter = await User.findOne({ role: "recruiter" }).select("_id");
      recruiterId = fallbackRecruiter?._id;
    }
    if (recruiterId) {
      createNotification({
        recipient: recruiterId,
        type: "application_received",
        title: "New Application Received",
        message: `New application received from ${req.user.name || "Candidate"} for ${job.jobTitle}.`,
        job: job._id,
        application: application._id,
      }).catch((err) => {
        console.error("[applicationController] Recruiter notification error:", err.message);
      });
    }

    // 2. Trigger Gemini ATS screening in background
    setImmediate(() => {
      processApplicationAts(application._id).catch((err) => {
        console.error("[applicationController] Background ATS screening error:", err.message);
      });
    });

    // 3. Return immediate success response without blocking on Gemini
    res.status(201).json({
      success: true,
      message: "Successfully applied to job",
      data: application,
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/applications/job/:jobId ──────────────────────────────────────
// Recruiter views all applications for their job
exports.getJobApplications = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.jobId);
    if (!job) {
      return next(new ErrorResponse("Job not found", 404));
    }

    // Verify user is the recruiter who owns the job, or an admin
    if (job.recruiter.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return next(new ErrorResponse("Not authorized to view applications for this job", 403));
    }

    const applications = await Application.find({ job: req.params.jobId })
      .populate("applicant", "name email phone")
      .populate("resume", "fileUrl originalFileName parsedData")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: applications.length,
      data: applications,
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/applications/me ──────────────────────────────────────────────
// Candidate views all their submitted applications
exports.getMyApplications = async (req, res, next) => {
  try {
    const applications = await Application.find({ applicant: req.user._id })
      .populate("job", "jobTitle level jobType acceptableLocations status createdAt")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: applications.length,
      data: applications,
    });
  } catch (err) {
    next(err);
  }
};

// ─── PUT /api/applications/:id/status ──────────────────────────────────────
// Recruiter updates application hiring status
exports.updateApplicationStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ["pending", "reviewed", "shortlisted", "rejected", "hired"];

    if (!allowedStatuses.includes(status)) {
      return next(new ErrorResponse(`Invalid status value. Allowed: ${allowedStatuses.join(", ")}`, 400));
    }

    const application = await Application.findById(req.params.id).populate("job");
    if (!application) {
      return next(new ErrorResponse("Application not found", 404));
    }

    // Ensure user is the recruiter who owns the job, or an admin
    if (
      application.job.recruiter.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return next(new ErrorResponse("Not authorized to update this application", 403));
    }

    // Update recruitment decision status (does not alter atsStatus)
    application.status = status;
    await application.save();

    res.status(200).json({
      success: true,
      message: "Application status updated successfully",
      data: application,
    });
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/applications/:id/retry-ats ──────────────────────────────────
// Recruiter or Admin restarts ATS screening for an application
exports.retryAtsScoring = async (req, res, next) => {
  try {
    const application = await Application.findById(req.params.id).populate("job");
    if (!application) {
      return next(new ErrorResponse("Application not found", 404));
    }

    if (
      application.job.recruiter.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return next(new ErrorResponse("Not authorized to trigger ATS scoring for this application", 403));
    }

    application.atsStatus = "pending";
    application.atsExplanation = "";
    await application.save();

    // Trigger screening in background
    setImmediate(() => {
      processApplicationAts(application._id).catch((err) => {
        console.error("[applicationController] Retry ATS background error:", err.message);
      });
    });

    res.status(200).json({
      success: true,
      message: "ATS screening restarted",
      data: application,
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/applications/:id/resume ──────────────────────────────────────
// Securely view or download the candidate resume file
exports.getApplicationResume = async (req, res, next) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate("job")
      .populate("resume");

    if (!application) {
      return next(new ErrorResponse("Application not found", 404));
    }

    // Authorization: recruiter of the job, applicant themselves, or admin
    const isOwnerRecruiter =
      application.job?.recruiter &&
      application.job.recruiter.toString() === req.user._id.toString();
    const isApplicant =
      application.applicant &&
      application.applicant.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isOwnerRecruiter && !isApplicant && !isAdmin) {
      return next(new ErrorResponse("Not authorized to access this resume", 403));
    }

    // If resume is from Cloudinary
    if (application.resume && application.resume.fileUrl) {
      return res.redirect(application.resume.fileUrl);
    }

    // If resume is a local uploaded file
    if (application.resumeFilePath) {
      const allowedDir = path.resolve(__dirname, "../uploads/resumes");
      const safePath = path.resolve(application.resumeFilePath);

      if (!safePath.startsWith(allowedDir) || !fs.existsSync(safePath)) {
        return next(new ErrorResponse("Resume file could not be located", 404));
      }

      const ext = path.extname(safePath).toLowerCase();
      let contentType = "application/octet-stream";
      if (ext === ".pdf") contentType = "application/pdf";
      else if (ext === ".docx") contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      else if (ext === ".doc") contentType = "application/msword";

      res.setHeader("Content-Type", contentType);
      res.setHeader("Content-Disposition", `inline; filename="${path.basename(safePath)}"`);
      return fs.createReadStream(safePath).pipe(res);
    }

    return next(new ErrorResponse("No resume file associated with this application", 404));
  } catch (err) {
    next(err);
  }
};
