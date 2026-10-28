const Notification = require("../models/Notification");
const { ErrorResponse } = require("../middleware/errorHandler");

// ─── GET /api/notifications ──────────────────────────────────────────────────
// Get notifications for authenticated user (recruiter/jobseeker/admin)
exports.getNotifications = async (req, res, next) => {
  try {
    let filter = { recipient: req.user._id };

    // For recruiters and admins, ensure they see notifications for all jobs or all applicant events
    if (req.user.role === "recruiter" || req.user.role === "admin") {
      filter = {
        $or: [
          { recipient: req.user._id },
          { recipient: { $exists: true } },
        ],
      };
    }

    const notifications = await Notification.find(filter)
      .populate("job", "jobTitle")
      .populate("application", "applicantName applicantEmail status atsScore atsStatus")
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = await Notification.countDocuments({
      ...filter,
      isRead: false,
    });

    res.status(200).json({
      success: true,
      count: notifications.length,
      unreadCount,
      data: notifications,
    });
  } catch (err) {
    next(err);
  }
};

// ─── PUT /api/notifications/:id/read ─────────────────────────────────────────
// Mark a single notification as read
exports.markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return next(new ErrorResponse("Notification not found", 404));
    }

    notification.isRead = true;
    await notification.save();

    res.status(200).json({
      success: true,
      data: notification,
    });
  } catch (err) {
    next(err);
  }
};

// ─── PUT /api/notifications/read-all ─────────────────────────────────────────
// Mark all notifications as read for current user
exports.markAllAsRead = async (req, res, next) => {
  try {
    let filter = { recipient: req.user._id, isRead: false };
    if (req.user.role === "recruiter" || req.user.role === "admin") {
      filter = { isRead: false };
    }

    await Notification.updateMany(
      filter,
      { $set: { isRead: true } }
    );

    res.status(200).json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (err) {
    next(err);
  }
};
