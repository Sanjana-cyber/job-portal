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

    // Assign authenticated recruiter ID from verified JWT session
    jobData.recruiter = req.user._id;

    const job = new Job(jobData);
    await job.save();

    return res.status(201).json({
      success: true,
      message: "Job created successfully",
      job,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
    return res.status(500).json({
      success: false,
      message: "Failed to create job",
    });
  }
};

/**
 * @desc    Get all jobs for the authenticated recruiter
 * @route   GET /api/jobs
 * @access  Private (Recruiter only)
 */
const getAllJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ recruiter: req.user._id }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      count: jobs.length,
      jobs,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch jobs",
    });
  }
};

/**
 * @desc    Get a single job by ID (authenticated recruiter only)
 * @route   GET /api/jobs/:id
 * @access  Private (Recruiter only)
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

    const job = await Job.findOne({
      _id: id,
      recruiter: req.user._id,
    });

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
    return res.status(500).json({
      success: false,
      message: "Failed to fetch job",
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
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
    return res.status(500).json({
      success: false,
      message: "Failed to update job",
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
    return res.status(500).json({
      success: false,
      message: "Failed to delete job",
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
