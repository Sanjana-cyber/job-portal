const mongoose = require("mongoose");

/**
 * Question Sub-document Schema
 */
const questionSchema = new mongoose.Schema({
  questionId: {
    type: String,
    default: () => new mongoose.Types.ObjectId().toString(),
  },
  questionIndex: {
    type: Number,
    required: true,
  },
  question: {
    type: String,
    required: [true, "Question text is required"],
    trim: true,
  },
  category: {
    type: String,
    enum: ["technical", "project-based", "behavioral"],
    required: [true, "Question category is required"],
  },
  skillTarget: {
    type: String,
    default: "",
    trim: true,
  },
  timeLimitSeconds: {
    type: Number,
    default: 120, // 2 minutes default
    min: 30,
    max: 600,
  },
  expectedPoints: [
    {
      type: String,
      trim: true,
    },
  ],
  answerText: {
    type: String,
    default: "",
  },
  audioUrl: {
    type: String,
    default: "",
  },
  audioTranscription: {
    type: String,
    default: "",
  },
  isAnswered: {
    type: Boolean,
    default: false,
  },
  answeredAt: {
    type: Date,
    default: null,
  },
  responseDurationSeconds: {
    type: Number,
    default: 0,
  },
  score: {
    type: Number,
    min: 0,
    max: 100,
    default: null,
  },
  feedback: {
    type: String,
    default: "",
  },
});

/**
 * Integrity Event Sub-document Schema
 * Logs suspicious activities such as tab switches and fullscreen exits
 */
const integrityEventSchema = new mongoose.Schema({
  eventType: {
    type: String,
    enum: [
      "tab_switch",
      "fullscreen_exit",
      "window_blur",
      "suspicious_activity",
      "other",
    ],
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  details: {
    type: String,
    default: "",
    trim: true,
  },
  questionIndex: {
    type: Number,
    default: null,
  },
});

/**
 * Interview Assessment Sub-document Schema
 */
const assessmentSchema = new mongoose.Schema({
  overallScore: {
    type: Number,
    min: 0,
    max: 100,
    default: null,
  },
  technicalScore: {
    type: Number,
    min: 0,
    max: 100,
    default: null,
  },
  communicationScore: {
    type: Number,
    min: 0,
    max: 100,
    default: null,
  },
  problemSolvingScore: {
    type: Number,
    min: 0,
    max: 100,
    default: null,
  },
  recommendation: {
    type: String,
    enum: ["strong_hire", "hire", "consider", "reject", "pending"],
    default: "pending",
  },
  summary: {
    type: String,
    default: "",
    trim: true,
  },
  strengths: [
    {
      type: String,
      trim: true,
    },
  ],
  areasForImprovement: [
    {
      type: String,
      trim: true,
    },
  ],
  evaluatedAt: {
    type: Date,
    default: null,
  },
  evaluationStatus: {
    type: String,
    enum: ["pending", "processing", "completed", "failed"],
    default: "pending",
  },
});

/**
 * Main Interview Schema
 */
const interviewSchema = new mongoose.Schema(
  {
    application: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Application",
      required: true,
      index: true,
    },
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
      index: true,
    },
    candidate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    candidateName: {
      type: String,
      required: true,
      trim: true,
    },
    candidateEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    recruiter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    invitationTokenHash: {
      type: String,
      required: true,
      index: true,
    },
    zoomLink: {
      type: String,
      default: "",
      trim: true,
    },
    interviewTiming: {
      type: String,
      default: "",
      trim: true,
    },
    status: {
      type: String,
      enum: ["not_started", "in_progress", "completed", "expired", "abandoned"],
      default: "not_started",
      index: true,
    },
    currentQuestionIndex: {
      type: Number,
      default: 0,
    },
    questions: [questionSchema],
    progress: {
      totalQuestions: { type: Number, default: 0 },
      answeredQuestions: { type: Number, default: 0 },
      percentComplete: { type: Number, default: 0 },
    },
    integrityEvents: [integrityEventSchema],
    integritySummary: {
      warningCount: { type: Number, default: 0 },
      tabSwitchCount: { type: Number, default: 0 },
      fullscreenExitCount: { type: Number, default: 0 },
      hasWarnings: { type: Boolean, default: false },
    },
    assessment: {
      type: assessmentSchema,
      default: () => ({}),
    },
    startedAt: {
      type: Date,
      default: null,
    },
    submittedAt: {
      type: Date,
      default: null,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Pre-save hook: automatically recalculate progress
 */
interviewSchema.pre("save", function () {
  if (this.questions && Array.isArray(this.questions)) {
    const total = this.questions.length;
    const answered = this.questions.filter((q) => q.isAnswered).length;
    this.progress = {
      totalQuestions: total,
      answeredQuestions: answered,
      percentComplete: total > 0 ? Math.round((answered / total) * 100) : 0,
    };
  }
});

module.exports = mongoose.model("Interview", interviewSchema);
