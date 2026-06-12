const mongoose = require("mongoose");

const resumeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: [true, "Resume title is required"],
      trim: true,
    },
    versionNumber: {
      type: Number,
      required: true,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    cloudinaryPublicId: {
      type: String,
      required: true,
    },
    originalFileName: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    parsingStatus: {
      type: String,
      enum: ["idle", "parsing", "done", "failed"],
      default: "idle",
    },
    parsedData: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Resume", resumeSchema);
