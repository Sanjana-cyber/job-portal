const mongoose = require("mongoose");

/**
 * Job.js
 * Mongoose model for recruiter-posted job listings.
 * Used as the internal source for deterministic job-match scoring
 * and AI-driven recommendation explanations.
 */
const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Job title is required"],
      trim: true,
    },
    company: {
      type: String,
      required: [true, "Company name is required"],
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    requiredSkills: [{ type: String, trim: true }],
    preferredSkills: [{ type: String, trim: true }],
    location: {
      type: String,
      default: "",
      trim: true,
    },
    experienceRequired: {
      type: String,
      default: "",
      trim: true,
    },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Job", jobSchema);
