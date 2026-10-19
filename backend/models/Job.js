const mongoose = require("mongoose");

/**
 * Job Schema
 * ──────────
 * Stores recruiter job postings for Talent Bridge.
 * Each job is linked to the authenticated recruiter via the `recruiter` field.
 */
const jobSchema = new mongoose.Schema(
  {
    // ── Basic Job Information ──────────────────────────────────────────
    jobTitle: {
      type: String,
      required: [true, "Job title is required"],
      trim: true,
    },
    headcount: {
      type: Number,
      required: [true, "Headcount is required"],
      min: [1, "Headcount must be at least 1"],
    },
    jobType: {
      type: String,
      required: [true, "Job type is required"],
      trim: true,
    },
    acceptableLocations: {
      type: [String],
      required: [true, "At least one acceptable location is required"],
      validate: {
        validator: function (val) {
          return Array.isArray(val) && val.length > 0;
        },
        message: "At least one acceptable location is required",
      },
    },

    // ── Salary Information ─────────────────────────────────────────────
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
    useRecommendedSalary: {
      type: Boolean,
      default: false,
    },
    offeringBonus: {
      type: Boolean,
      default: false,
    },
    offeringEquity: {
      type: Boolean,
      default: false,
    },

    // ── Skills and Experience ──────────────────────────────────────────
    level: {
      type: String,
      required: [true, "Level is required"],
      trim: true,
    },
    techStack: {
      type: [String],
      required: [true, "Tech stack is required"],
      validate: {
        validator: function (val) {
          return Array.isArray(val) && val.length > 0;
        },
        message: "Tech stack must contain at least one item",
      },
    },
    requiredSkills: {
      type: [String],
      required: [true, "Required skills are required"],
      validate: {
        validator: function (val) {
          return Array.isArray(val) && val.length > 0;
        },
        message: "Required skills must contain at least one skill",
      },
    },
    yearsOfExperience: {
      type: Number,
      required: [true, "Years of experience is required"],
      min: [0, "Years of experience cannot be negative"],
    },

    // ── Additional Job Information ─────────────────────────────────────
    description: {
      type: String,
      required: [true, "Job description is required"],
      trim: true,
    },
    responsibilities: {
      type: [String],
      default: [],
    },
    requirements: {
      type: [String],
      default: [],
    },
    employmentType: {
      type: String,
      required: [true, "Employment type is required"],
      trim: true,
    },
    applicationDeadline: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      default: "Open",
      enum: {
        values: ["Open", "Closed", "Draft"],
        message: "Status must be Open, Closed, or Draft",
      },
    },

    // ── Recruiter Relationship ─────────────────────────────────────────
    recruiter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Recruiter reference is required"],
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Validate salaryMin does not exceed salaryMax when both are provided
 */
jobSchema.pre("validate", function (next) {
  if (
    this.salaryMin !== null &&
    this.salaryMin !== undefined &&
    this.salaryMax !== null &&
    this.salaryMax !== undefined &&
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
