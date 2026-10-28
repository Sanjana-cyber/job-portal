const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["application_received", "ats_completed", "ats_failed"],
      default: "application_received",
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      default: null,
    },
    application: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Application",
      default: null,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

// Prevent accidental duplicate notifications for the same application and event type
notificationSchema.index(
  { recipient: 1, application: 1, type: 1 },
  { unique: true, sparse: true }
);

module.exports = mongoose.model("Notification", notificationSchema);
