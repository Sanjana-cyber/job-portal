const mongoose = require("mongoose");
const Job = require("../models/Job");

/**
 * Helper to validate MongoDB ObjectId
 */
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

/**
 * @desc    Create a new job posting
 * @route   POST /api/jobs
 * @access  Private (Recruiter only)
 */
const createJob = async (req, res) => {
  try {
    const jobData = { ...req.body };

    // Debug: log incoming body to trace 500 errors
    console.log("[createJob] Incoming body keys:", Object.keys(jobData));
    console.log("[createJob] recruiter user id:", req.user?._id);

    // Assign authenticated recruiter ID from verified JWT session
    jobData.recruiter = req.user._id;

    // Clean up numeric and date fields to avoid Mongoose cast issues
    if (jobData.salaryMin === null || jobData.salaryMin === "") delete jobData.salaryMin;
    if (jobData.salaryMax === null || jobData.salaryMax === "") delete jobData.salaryMax;
    if (jobData.applicationDeadline === null || jobData.applicationDeadline === "") delete jobData.applicationDeadline;
    if (jobData.yearsOfExperience === "" || jobData.yearsOfExperience === null) {
      jobData.yearsOfExperience = 0;
    }
    if (jobData.headcount === "" || jobData.headcount === null || isNaN(Number(jobData.headcount))) {
      jobData.headcount = 1;
    }

    const job = new Job(jobData);
    await job.save();

    return res.status(201).json({
      success: true,
      message: "Job created successfully",
      job,
    });
  } catch (error) {
    console.error("[createJob] Error name:", error.name);
    console.error("[createJob] Error message:", error.message);
    console.error("[createJob] Stack:", error.stack);
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message).join(", ");
      return res.status(400).json({
        success: false,
        message: messages,
      });
    }
    return res.status(500).json({
      success: false,
      message: "Failed to create job",
      detail: error.message,   // Always show in dev for debugging
    });
  }
};

/**
 * @desc    Get all jobs (Recruiter sees their own jobs; Jobseeker/Guest sees all published jobs)
 * @route   GET /api/jobs
 * @access  Public / Private
 */
const getAllJobs = async (req, res) => {
  try {
    let query = {};
    if (req.user && req.user.role === "recruiter") {
      // Recruiter sees all jobs they posted (including drafts and closed)
      query = { recruiter: req.user._id };
    } else {
      // Job seekers and visitors see published/open jobs (exclude unpublished drafts)
      query = { status: { $ne: "Draft" } };
    }

    const jobs = await Job.find(query)
      .populate("recruiter", "name email companyName")
      .sort({ createdAt: -1 });

    let jobsWithCounts = jobs;
    try {
      const Application = require("../models/Application");
      const counts = await Application.aggregate([
        { $group: { _id: "$job", count: { $sum: 1 } } },
      ]);
      const countMap = {};
      counts.forEach((c) => {
        if (c._id) countMap[c._id.toString()] = c.count;
      });
      jobsWithCounts = jobs.map((j) => {
        const jobObj = j.toObject();
        jobObj.applicationCount = countMap[j._id.toString()] || 0;
        return jobObj;
      });
    } catch (countErr) {
      console.warn("Could not aggregate application counts:", countErr.message);
    }

    return res.status(200).json({
      success: true,
      count: jobsWithCounts.length,
      jobs: jobsWithCounts,
    });
  } catch (error) {
    console.error("[getAllJobs] Error:", error.name, error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch jobs",
      detail: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * @desc    Get a single job by ID
 * @route   GET /api/jobs/:id
 * @access  Public / Private
 */
const getJobById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid job ID format",
      });
    }

    let query = { _id: id };
    if (req.user && req.user.role === "recruiter") {
      query.recruiter = req.user._id;
    } else {
      query.status = { $ne: "Draft" };
    }

    const job = await Job.findOne(query).populate("recruiter", "name email companyName");

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found or you are not authorized to view it",
      });
    }

    return res.status(200).json({
      success: true,
      job,
    });
  } catch (error) {
    console.error("[getJobById] Error:", error.name, error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch job",
      detail: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * @desc    Update a job by ID (authenticated recruiter only)
 * @route   PUT /api/jobs/:id
 * @access  Private (Recruiter only)
 */
const updateJob = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid job ID format",
      });
    }

    const updateData = { ...req.body };

    // Prevent client from modifying protected fields
    delete updateData._id;
    delete updateData.recruiter;
    delete updateData.createdAt;
    delete updateData.updatedAt;

    if (updateData.salaryMin === null || updateData.salaryMin === "") delete updateData.salaryMin;
    if (updateData.salaryMax === null || updateData.salaryMax === "") delete updateData.salaryMax;
    if (updateData.applicationDeadline === null || updateData.applicationDeadline === "") delete updateData.applicationDeadline;

    const updatedJob = await Job.findOneAndUpdate(
      { _id: id, recruiter: req.user._id },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedJob) {
      return res.status(404).json({
        success: false,
        message: "Job not found or you are not authorized to update it",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Job updated successfully",
      job: updatedJob,
    });
  } catch (error) {
    console.error("[updateJob] Error:", error.name, error.message);
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
    return res.status(500).json({
      success: false,
      message: "Failed to update job",
      detail: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * @desc    Delete a job by ID (authenticated recruiter only)
 * @route   DELETE /api/jobs/:id
 * @access  Private (Recruiter only)
 */
const deleteJob = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid job ID format",
      });
    }

    const job = await Job.findOneAndDelete({
      _id: id,
      recruiter: req.user._id,
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found or you are not authorized to delete it",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Job deleted successfully",
    });
  } catch (error) {
    console.error("[deleteJob] Error:", error.name, error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to delete job",
      detail: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

module.exports = {
  createJob,
  getAllJobs,
  getJobById,
  updateJob,
  deleteJob,
};
