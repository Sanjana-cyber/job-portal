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
      default: 1,
      min: [1, "Headcount must be at least 1"],
      required: [
        function () {
          return this.status !== "Draft";
        },
        "Headcount is required",
      ],
    },
    jobType: {
      type: String,
      default: "Remote",
      trim: true,
      required: [
        function () {
          return this.status !== "Draft";
        },
        "Job type is required",
      ],
    },
    acceptableLocations: {
      type: [String],
      default: ["Remote"],
      required: [
        function () {
          return this.status !== "Draft";
        },
        "At least one acceptable location is required",
      ],
      validate: {
        validator: function (val) {
          if (this.status === "Draft") return true;
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
      default: "Mid Level",
      trim: true,
      required: [
        function () {
          return this.status !== "Draft";
        },
        "Level is required",
      ],
    },
    techStack: {
      type: [String],
      default: [],
      required: [
        function () {
          return this.status !== "Draft";
        },
        "Tech stack is required",
      ],
      validate: {
        validator: function (val) {
          if (this.status === "Draft") return true;
          return Array.isArray(val) && val.length > 0;
        },
        message: "Tech stack must contain at least one item",
      },
    },
    requiredSkills: {
      type: [String],
      default: [],
      required: [
        function () {
          return this.status !== "Draft";
        },
        "Required skills are required",
      ],
      validate: {
        validator: function (val) {
          if (this.status === "Draft") return true;
          return Array.isArray(val) && val.length > 0;
        },
        message: "Required skills must contain at least one skill",
      },
    },
    yearsOfExperience: {
      type: Number,
      default: 0,
      min: [0, "Years of experience cannot be negative"],
      required: [
        function () {
          return this.status !== "Draft";
        },
        "Years of experience is required",
      ],
    },

    // ── Additional Job Information ─────────────────────────────────────
    description: {
      type: String,
      default: "",
      trim: true,
      required: [
        function () {
          return this.status !== "Draft";
        },
        "Job description is required",
      ],
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
      default: "Full-time",
      trim: true,
      required: [
        function () {
          return this.status !== "Draft";
        },
        "Employment type is required",
      ],
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
jobSchema.pre("validate", async function (next) {
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
  if (typeof next === "function") {
    next();
  }
});

module.exports = mongoose.model("Job", jobSchema);
