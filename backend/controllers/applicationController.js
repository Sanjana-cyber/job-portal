const path = require("path");
const fs = require("fs");
const multer = require("multer");
const Application = require("../models/Application");
const Job = require("../models/Job");
const Resume = require("../models/Resume");
const User = require("../models/User");
const { ErrorResponse } = require("../middleware/errorHandler");
const crypto = require("crypto");
const { computeAtsScore } = require("../utils/atsScoringService");
const { processApplicationAts } = require("../services/geminiAtsService");
const { createNotification } = require("../services/notificationService");
const { sendEmail, getInterviewInvitationEmailTemplate } = require("../utils/sendEmail");

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
    if (status === "rejected") {
      if (application.resumePath && fs.existsSync(application.resumePath)) {
        try {
          fs.unlinkSync(application.resumePath);
        } catch (e) {
          console.warn("[updateApplicationStatus] Could not delete resume file:", e.message);
        }
      }
      await Application.findByIdAndDelete(req.params.id);
      return res.status(200).json({
        success: true,
        deleted: true,
        message: "Candidate application has been rejected and permanently deleted.",
        data: { _id: req.params.id, status: "rejected" },
      });
    }

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

// ─── DELETE /api/applications/:id ──────────────────────────────────────────
// Recruiter or Admin permanently deletes an application
exports.deleteApplication = async (req, res, next) => {
  try {
    const application = await Application.findById(req.params.id).populate("job");
    if (!application) {
      return next(new ErrorResponse("Application not found", 404));
    }

    // Ensure user is the recruiter who owns the job, or an admin
    if (
      application.job &&
      application.job.recruiter &&
      application.job.recruiter.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return next(new ErrorResponse("Not authorized to delete this application", 403));
    }

    if (application.resumePath && fs.existsSync(application.resumePath)) {
      try {
        fs.unlinkSync(application.resumePath);
      } catch (fileErr) {
        console.warn("[deleteApplication] Resume deletion error:", fileErr.message);
      }
    }

    await Application.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      deleted: true,
      message: "Candidate application deleted successfully",
      data: { _id: req.params.id },
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

// ─── POST /api/applications/:id/select ────────────────────────────────────
// Recruiter selects a candidate and dispatches a secure interview invitation
exports.selectCandidateForInterview = async (req, res, next) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate({
        path: "job",
        populate: { path: "recruiter", select: "name companyName email" },
      })
      .populate("applicant", "name email");

    if (!application) {
      return next(new ErrorResponse("Application not found", 404));
    }

    if (!application.job) {
      return next(new ErrorResponse("Job associated with this application was not found", 404));
    }

    // Verify recruiter owns the job (or is admin)
    const recruiterId = application.job.recruiter?._id || application.job.recruiter;
    if (
      (!recruiterId || recruiterId.toString() !== req.user._id.toString()) &&
      req.user.role !== "admin"
    ) {
      return next(new ErrorResponse("Not authorized to select candidates for this job", 403));
    }

    // Prevent duplicate emails when the same candidate is selected repeatedly
    const isAlreadySelected = application.status === "selected";
    const hasActiveToken =
      application.interviewInvitation?.tokenHash &&
      application.interviewInvitation?.expiresAt &&
      new Date(application.interviewInvitation.expiresAt) > new Date();

    const isResend = req.query.resend === "true" || req.body.resend === true;

    if (isAlreadySelected && hasActiveToken && !isResend) {
      const rawToken = crypto.randomBytes(32).toString("hex");
      const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
      application.interviewInvitation.tokenHash = tokenHash;
      await application.save();
      const frontendUrl = (process.env.FRONTEND_URL || "http://localhost:5173").trim().replace(/\/+$/, "");
      const invitationUrl = `${frontendUrl}/interview-invitation?token=${rawToken}`;
      return res.status(200).json({
        success: true,
        alreadySelected: true,
        emailSent: false,
        message: "Candidate has already been selected. Opening interview schedule page.",
        data: application,
        invitationUrl,
        invitationToken: rawToken,
      });
    }

    // Candidate contact details
    const candidateName =
      application.applicantName || application.applicant?.name || "Candidate";
    const candidateEmail =
      application.applicantEmail || application.applicant?.email;

    if (!candidateEmail) {
      return next(
        new ErrorResponse("Cannot select candidate: no email address is on file for this application", 400)
      );
    }

    // Generate secure unpredictable raw token
    const rawToken = crypto.randomBytes(32).toString("hex");

    // Store secure SHA-256 hash in database
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

    // 7 days expiration
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Save selection status and invitation token
    application.status = "selected";
    application.interviewInvitation = {
      tokenHash,
      expiresAt,
      sentAt: new Date(),
      status: "sent",
    };
    await application.save();

    // Construct secure invitation URL
    const frontendUrl = (process.env.FRONTEND_URL || "http://localhost:5173").trim().replace(/\/+$/, "");
    const invitationUrl = `${frontendUrl}/interview-invitation?token=${rawToken}`;

    const jobTitle = application.job.jobTitle || "Job Position";
    const companyName =
      application.job.recruiter?.companyName || "Talent Bridge Partner";

    // Attempt email dispatch
    let emailResult = null;
    try {
      emailResult = await sendEmail({
        to: candidateEmail,
        subject: "Congratulations! You Have Been Selected for the Next Stage",
        html: getInterviewInvitationEmailTemplate({
          candidateName,
          jobTitle,
          companyName,
          invitationUrl,
        }),
      });
    } catch (emailErr) {
      console.error("[applicationController] Email sending error:", emailErr.message);
      // Mark as failed in invitation metadata to allow clean retry
      application.interviewInvitation.status = "failed";
      await application.save();

      return res.status(200).json({
        success: true,
        emailSent: false,
        warning: `Candidate was marked as selected, but email delivery failed (${emailErr.message}). You can safely retry.`,
        data: application,
        invitationUrl,
        invitationToken: rawToken,
      });
    }

    // Notify candidate in-app if registered
    if (application.applicant?._id) {
      createNotification({
        recipient: application.applicant._id,
        type: "application_status",
        title: "Selected for Interview",
        message: `Congratulations! You have been selected for the next stage for ${jobTitle} at ${companyName}.`,
        job: application.job._id,
        application: application._id,
      }).catch((err) => {
        console.error("[applicationController] Notification dispatch error:", err.message);
      });
    }

    res.status(200).json({
      success: true,
      emailSent: emailResult?.skipped ? false : true,
      emailSkipped: !!emailResult?.skipped,
      message: emailResult?.skipped
        ? `Candidate marked as selected. (Email dispatch skipped: ${emailResult.reason})`
        : `Candidate successfully selected and invitation email sent to ${candidateEmail}.`,
      data: application,
      invitationUrl,
      invitationToken: rawToken,
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/applications/interview-invitation/:token ─────────────────────
// Public endpoint: Validate interview invitation token and return sanitized info
exports.verifyInterviewInvitation = async (req, res, next) => {
  try {
    const { token } = req.params;
    if (!token || typeof token !== "string" || token.length < 16) {
      return res.status(400).json({
        valid: false,
        reason: "invalid",
        message: "A valid invitation token is required.",
      });
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const application = await Application.findOne({
      "interviewInvitation.tokenHash": tokenHash,
    })
      .populate({
        path: "job",
        populate: { path: "recruiter", select: "name companyName" },
      })
      .populate("applicant", "name email");

    if (!application) {
      return res.status(404).json({
        valid: false,
        reason: "invalid",
        message: "This interview invitation is invalid or does not exist.",
      });
    }

    // Check expiration
    if (
      application.interviewInvitation?.expiresAt &&
      new Date(application.interviewInvitation.expiresAt) < new Date()
    ) {
      return res.status(410).json({
        valid: false,
        reason: "expired",
        message: "This interview invitation has expired. Please contact the recruiter for an updated invitation.",
        data: {
          jobTitle: application.job?.jobTitle,
          companyName: application.job?.recruiter?.companyName || "Talent Bridge Partner",
        },
      });
    }

    // Check if already completed
    if (application.interviewInvitation?.status === "completed") {
      return res.status(200).json({
        valid: false,
        reason: "completed",
        message: "This interview invitation has already been completed.",
      });
    }

    const candidateName =
      application.applicantName || application.applicant?.name || "Candidate";
    const jobTitle = application.job?.jobTitle || "Job Position";
    const companyName =
      application.job?.recruiter?.companyName || "Talent Bridge Partner";
    const jobType = application.job?.jobType || "Full-time";
    const location =
      application.job?.acceptableLocations?.[0] || "Remote";

    res.status(200).json({
      valid: true,
      data: {
        candidateName,
        jobTitle,
        companyName,
        jobType,
        location,
        expiresAt: application.interviewInvitation.expiresAt,
      },
    });
  } catch (err) {
    next(err);
  }
};

