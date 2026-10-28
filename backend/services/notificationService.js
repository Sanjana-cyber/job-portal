const Notification = require("../models/Notification");

/**
 * Creates a notification for a user (e.g. recruiter)
 * Safely deduplicates notifications using the unique compound index.
 *
 * @param {Object} params
 * @param {string|ObjectId} params.recipient - User ID of the recipient
 * @param {string} [params.type] - "application_received" | "ats_completed" | "ats_failed"
 * @param {string} params.title - Short title
 * @param {string} params.message - Descriptive message (no sensitive PII or full resume)
 * @param {string|ObjectId} [params.job] - Associated Job ID
 * @param {string|ObjectId} [params.application] - Associated Application ID
 */
async function createNotification({ recipient, type = "application_received", title, message, job, application }) {
  if (!recipient || !title || !message) {
    return null;
  }

  try {
    const doc = await Notification.create({
      recipient,
      type,
      title,
      message,
      job: job || null,
      application: application || null,
    });
    return doc;
  } catch (err) {
    // Duplicate notification prevented by unique index (code 11000)
    if (err.code === 11000) {
      return null;
    }
    console.error("[notificationService] Failed to create notification:", err.message);
    return null;
  }
}

module.exports = {
  createNotification,
};
