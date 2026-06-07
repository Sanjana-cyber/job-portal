const mongoose = require("mongoose");

// ─── Sub-document Schemas ──────────────────────────────────────────────────

const educationSchema = new mongoose.Schema({
  degree:         { type: String, required: [true, "Degree is required"] },
  college:        { type: String, required: [true, "College is required"] },
  specialization: { type: String, default: "" },
  startYear:      { type: Number, required: [true, "Start year is required"] },
  endYear:        { type: Number, required: [true, "End year is required"] },
  cgpa:           { type: String, default: "" },
});

const experienceSchema = new mongoose.Schema({
  company:          { type: String, default: "" },
  role:             { type: String, default: "" },
  startDate:        { type: Date },
  endDate:          { type: Date },
  isCurrent:        { type: Boolean, default: false },
  responsibilities: { type: String, default: "" },
});

const projectSchema = new mongoose.Schema({
  name:        { type: String, default: "" },
  description: { type: String, default: "" },
  techStack:   [{ type: String }],
  githubLink:  { type: String, default: "" },
  liveLink:    { type: String, default: "" },
});

const certificationSchema = new mongoose.Schema({
  name:          { type: String, default: "" },
  issuer:        { type: String, default: "" },
  issueDate:     { type: Date },
  credentialUrl: { type: String, default: "" },
});

// ─── Main Profile Schema ───────────────────────────────────────────────────

const candidateProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    // Personal Info
    phone:     { type: String, default: "" },
    location:  { type: String, default: "" },
    linkedin:  { type: String, default: "" },
    github:    { type: String, default: "" },
    portfolio: { type: String, default: "" },

    // Professional
    headline: { type: String, default: "" },
    about:    { type: String, default: "" },

    // Profile Photo — stored as Cloudinary URL + public_id for deletion
    photo: {
      url:      { type: String, default: "" },
      publicId: { type: String, default: "" },
    },

    // Skills
    technicalSkills: [{ type: String }],
    tools:           [{ type: String }],
    softSkills:      [{ type: String }],

    // Repeatable Sections
    education:      [educationSchema],
    experience:     [experienceSchema],
    projects:       [projectSchema],
    certifications: [certificationSchema],

    // Resume — stored as Cloudinary raw resource
    resume: {
      url:          { type: String, default: "" },
      publicId:     { type: String, default: "" },
      originalName: { type: String, default: "" },
      uploadedAt:   { type: Date },
    },

    // Computed — calculated on every save via pre-save hook
    completionScore: { type: Number, default: 0, min: 0, max: 100 },
  },
  { timestamps: true }
);

// ─── Pre-save: Calculate Completion Score ─────────────────────────────────
/**
 * Scoring breakdown (total 100):
 *   Personal Info (phone + location)  → 20
 *   Professional (headline + about)   → 15
 *   Skills (≥1 technical skill)       → 15
 *   Education (≥1 entry)              → 15
 *   Experience (≥1 entry)             → 10
 *   Projects (≥1 entry)               → 10
 *   Certifications (≥1 entry)         →  5
 *   Resume uploaded                   → 10
 */
candidateProfileSchema.pre("save", function () {
  let score = 0;
  if (this.phone && this.location)                      score += 20;
  if (this.headline && this.about)                      score += 15;
  if (this.technicalSkills && this.technicalSkills.length > 0) score += 15;
  if (this.education && this.education.length > 0)      score += 15;
  if (this.experience && this.experience.length > 0)    score += 10;
  if (this.projects && this.projects.length > 0)        score += 10;
  if (this.certifications && this.certifications.length > 0) score += 5;
  if (this.resume && this.resume.url)                   score += 10;
  this.completionScore = score;
});

module.exports = mongoose.model("CandidateProfile", candidateProfileSchema);
