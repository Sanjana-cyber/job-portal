const Job = require("../models/Job");
const Application = require("../models/Application");
const { ErrorResponse } = require("../middleware/errorHandler");

// ─── POST /api/jobs ────────────────────────────────────────────────────────
exports.createJob = async (req, res, next) => {
  try {
    const { title, company, description, requiredSkills, preferredSkills, location, experienceRequired } = req.body;
    
    const job = await Job.create({
      title,
      company,
      description,
      requiredSkills: Array.isArray(requiredSkills) ? requiredSkills : [],
      preferredSkills: Array.isArray(preferredSkills) ? preferredSkills : [],
      location,
      experienceRequired,
      postedBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: "Job created successfully",
      data: job,
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/jobs ─────────────────────────────────────────────────────────
exports.getJobs = async (req, res, next) => {
  try {
    // Basic filtering: only active jobs by default
    const query = { isActive: true };
    
    // Add search by title/company/skills if provided in query string
    if (req.query.search) {
      query.$or = [
        { title: { $regex: req.query.search, $options: "i" } },
        { company: { $regex: req.query.search, $options: "i" } },
        { requiredSkills: { $regex: req.query.search, $options: "i" } }
      ];
    }

    const jobs = await Job.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: jobs.length,
      data: jobs,
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/jobs/me ──────────────────────────────────────────────────────
exports.getMyJobs = async (req, res, next) => {
  try {
    const jobs = await Job.find({ postedBy: req.user._id }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: jobs.length,
      data: jobs,
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/jobs/:id ─────────────────────────────────────────────────────
exports.getJobById = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id).populate("postedBy", "name email");
    
    if (!job) {
      return next(new ErrorResponse(`Job not found with id of ${req.params.id}`, 404));
    }

    res.status(200).json({
      success: true,
      data: job,
    });
  } catch (err) {
    next(err);
  }
};

// ─── PUT /api/jobs/:id ─────────────────────────────────────────────────────
exports.updateJob = async (req, res, next) => {
  try {
    let job = await Job.findById(req.params.id);

    if (!job) {
      return next(new ErrorResponse(`Job not found with id of ${req.params.id}`, 404));
    }

    // Ensure user is job owner
    if (job.postedBy.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return next(new ErrorResponse(`User not authorized to update this job`, 401));
    }

    job = await Job.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: "Job updated successfully",
      data: job,
    });
  } catch (err) {
    next(err);
  }
};

// ─── DELETE /api/jobs/:id ──────────────────────────────────────────────────
exports.deleteJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return next(new ErrorResponse(`Job not found with id of ${req.params.id}`, 404));
    }

    // Ensure user is job owner
    if (job.postedBy.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return next(new ErrorResponse(`User not authorized to delete this job`, 401));
    }

    // Deactivate instead of hard delete to preserve applications, or actually delete
    // We will hard delete here, and also clean up applications
    await Application.deleteMany({ job: req.params.id });
    await job.deleteOne();

    res.status(200).json({
      success: true,
      message: "Job deleted successfully",
      data: {},
    });
  } catch (err) {
    next(err);
  }
};
