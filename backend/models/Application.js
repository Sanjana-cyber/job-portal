const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema(
  {
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },
    applicant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    resume: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resume",
      default: null,
    },
    // Direct-apply fields (when seeker fills the form without a stored resume)
    applicantName: { type: String, default: "" },
    applicantEmail: { type: String, default: "" },
    applicantPhone: { type: String, default: "" },
    resumeFilePath: { type: String, default: "" }, // uploaded file path on server
    coverLetter: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["pending", "reviewed", "shortlisted", "rejected", "hired"],
      default: "pending",
    },
    atsScore: { type: Number, default: null },
    matchedKeywords: [{ type: String }],
    missingKeywords: [{ type: String }],
    atsStatus: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
    },
    atsExplanation: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Application", applicationSchema);

