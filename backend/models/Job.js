const mongoose = require("mongoose");

/**
 * Job.js
 * ──────
 * Mongoose schema for recruiter-posted job listings.
 *
 * Fields with `required: true` must be provided on creation.
 * Fields with `default` or no `required` are optional.
 *
 * recruiterId references the User document (a recruiter user).
 * Ownership checks in the controller compare job.recruiterId with req.user._id.
 */
const jobSchema = new mongoose.Schema(
  {
    // ── Core details ──────────────────────────────────────────────────────────
    title: {
      type: String,
      required: [true, "Job title is required"],
      trim: true,
      maxlength: [150, "Title cannot exceed 150 characters"],
    },

    company: {
      type: String,
      required: [true, "Company name is required"],
      trim: true,
      maxlength: [100, "Company name cannot exceed 100 characters"],
    },

    location: {
      type: String,
      required: [true, "Location is required"],
      trim: true,
      maxlength: [150, "Location cannot exceed 150 characters"],
    },

    // ── Employment details ────────────────────────────────────────────────────
    employmentType: {
      type: String,
      required: [true, "Employment type is required"],
      enum: {
        values: ["full-time", "part-time", "internship", "contract"],
        message:
          "Employment type must be one of: full-time, part-time, internship, contract",
      },
    },

    description: {
      type: String,
      required: [true, "Job description is required"],
      trim: true,
    },

    responsibilities: {
      type: String,
      trim: true,
      default: "",
    },

    // skills is a required array of strings
    skills: {
      type: [String],
      required: [true, "At least one skill is required"],
      validate: {
        validator: function (arr) {
          // Array must have at least one non-empty string
          return Array.isArray(arr) && arr.length > 0;
        },
        message: "Skills must be a non-empty array of strings",
      },
    },

    experience: {
      type: String,
      required: [true, "Experience requirement is required"],
      trim: true,
      maxlength: [100, "Experience field cannot exceed 100 characters"],
    },

    education: {
      type: String,
      trim: true,
      default: "",
    },

    // ── Compensation ──────────────────────────────────────────────────────────
    salaryMin: {
      type: Number,
      min: [0, "Minimum salary cannot be negative"],
      default: null,
    },

    salaryMax: {
      type: Number,
      min: [0, "Maximum salary cannot be negative"],
      default: null,
    },

    // ── Logistics ─────────────────────────────────────────────────────────────
    openings: {
      type: Number,
      required: [true, "Number of openings is required"],
      min: [1, "Openings must be at least 1"],
      validate: {
        validator: Number.isInteger,
        message: "Openings must be a whole number",
      },
    },

    applicationDeadline: {
      type: Date,
      default: null,
    },

    // ── Ownership ─────────────────────────────────────────────────────────────
    // Points to the User document of the recruiter who created this job.
    // Set exclusively by the backend from req.user._id — never trusted from the client.
    recruiterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Recruiter reference is required"],
    },

    // ── Status ────────────────────────────────────────────────────────────────
    status: {
      type: String,
      enum: {
        values: ["active", "closed", "draft"],
        message: "Status must be one of: active, closed, draft",
      },
      default: "active",
    },
  },
  {
    // Automatically adds createdAt and updatedAt timestamps
    timestamps: true,
  }
);

/**
 * Schema-level validation: salaryMin must not exceed salaryMax.
 * This runs only when both values are provided.
 */
jobSchema.pre("validate", function (next) {
  if (
    this.salaryMin !== null &&
    this.salaryMax !== null &&
    this.salaryMin > this.salaryMax
  ) {
    this.invalidate(
      "salaryMin",
      "Minimum salary cannot be greater than maximum salary"
    );
  }
  next();
});

module.exports = mongoose.model("Job", jobSchema);
