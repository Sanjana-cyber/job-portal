const Application = require("../models/Application");
const Job = require("../models/Job");
const Resume = require("../models/Resume");
const { ErrorResponse } = require("../middleware/errorHandler");

// ─── POST /api/applications/:jobId ─────────────────────────────────────────
// Candidate applies to a job
exports.applyToJob = async (req, res, next) => {
  try {
    const jobId = req.params.jobId;
    const { coverLetter } = req.body;

    const job = await Job.findById(jobId);
    if (!job) {
      return next(new ErrorResponse("Job not found", 404));
    }

    if (!job.isActive) {
      return next(new ErrorResponse("This job is no longer active", 400));
    }

    // Check if candidate already applied
    const existingApp = await Application.findOne({ job: jobId, applicant: req.user._id });
    if (existingApp) {
      return next(new ErrorResponse("You have already applied to this job", 400));
    }

    // Get candidate's active resume
    const activeResume = await Resume.findOne({ user: req.user._id, isActive: true });
    if (!activeResume) {
      return next(new ErrorResponse("You must have an active resume to apply", 400));
    }

    const application = await Application.create({
      job: jobId,
      applicant: req.user._id,
      resume: activeResume._id,
      coverLetter: coverLetter || "",
    });

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

    // Ensure user is the recruiter who posted the job
    if (job.postedBy.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return next(new ErrorResponse("Not authorized to view these applications", 401));
    }

    const applications = await Application.find({ job: req.params.jobId })
      .populate("applicant", "name email")
      .populate("resume", "fileUrl originalFileName parsedData atsScore") // get resume details
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
// Candidate views all their applications
exports.getMyApplications = async (req, res, next) => {
  try {
    const applications = await Application.find({ applicant: req.user._id })
      .populate("job", "title company location isActive")
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
// Recruiter updates application status
exports.updateApplicationStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    
    if (!["pending", "reviewed", "shortlisted", "rejected", "hired"].includes(status)) {
      return next(new ErrorResponse("Invalid status value", 400));
    }

    const application = await Application.findById(req.params.id).populate("job");

    if (!application) {
      return next(new ErrorResponse("Application not found", 404));
    }

    // Ensure user is the recruiter who posted the job
    if (application.job.postedBy.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return next(new ErrorResponse("Not authorized to update this application", 401));
    }

    application.status = status;
    await application.save();

    res.status(200).json({
      success: true,
      message: "Application status updated",
      data: application,
    });
  } catch (err) {
    next(err);
  }
};
