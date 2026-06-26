const User = require("../models/User");
const SiteSettings = require("../models/SiteSettings");
const { ErrorResponse } = require("../middleware/errorHandler");
const { sendEmail } = require("../utils/sendEmail");

/* ─── Recruiter: Submit / Re-submit Company Details ─────────────────────── */
/**
 * @desc  Recruiter submits company details for verification
 *        (also used for re-submission after rejection)
 * @route POST /api/verification/submit
 * @access Private — recruiter
 */
exports.submitVerificationRequest = async (req, res, next) => {
  try {
    const { companyName, workEmail, companyWebsite } = req.body;

    if (!companyName || !workEmail) {
      return next(new ErrorResponse("Company name and work email are required", 400));
    }

    const user = await User.findById(req.user._id);

    if (user.companyVerificationStatus === "approved") {
      return next(new ErrorResponse("Your company is already verified", 400));
    }
    if (user.companyVerificationStatus === "pending") {
      return next(new ErrorResponse("Your request is already under review. Please wait for admin response.", 400));
    }

    // none or rejected — allow submit / re-submit
    user.companyName = companyName.trim();
    user.workEmail = workEmail.toLowerCase().trim();
    user.companyWebsite = (companyWebsite || "").trim();
    user.companyVerificationStatus = "pending";
    user.companyVerificationNote = "";
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: "Verification request submitted. The admin will review your company details shortly.",
      data: {
        companyName: user.companyName,
        workEmail: user.workEmail,
        companyWebsite: user.companyWebsite,
        companyVerificationStatus: user.companyVerificationStatus,
      },
    });
  } catch (error) {
    next(error);
  }
};

/* ─── Recruiter: Get Own Verification Status ─────────────────────────────── */
/**
 * @desc  Get current recruiter's verification info + global setting
 * @route GET /api/verification/status
 * @access Private — recruiter
 */
exports.getVerificationStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const settings = await SiteSettings.getSettings();

    res.status(200).json({
      success: true,
      data: {
        companyName: user.companyName,
        workEmail: user.workEmail,
        companyWebsite: user.companyWebsite,
        companyVerificationStatus: user.companyVerificationStatus,
        companyVerificationNote: user.companyVerificationNote,
        verificationRequired: settings.verificationRequired,
      },
    });
  } catch (error) {
    next(error);
  }
};

/* ─── Admin: List All Recruiters ─────────────────────────────────────────── */
/**
 * @desc  Get all recruiter accounts with their verification details
 * @route GET /api/verification/queue
 * @access Private — admin
 */
exports.getVerificationQueue = async (req, res, next) => {
  try {
    const recruiters = await User.find({ role: "recruiter" })
      .select(
        "name email companyName workEmail companyWebsite companyVerificationStatus companyVerificationNote createdAt provider"
      )
      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      count: recruiters.length,
      data: recruiters,
    });
  } catch (error) {
    next(error);
  }
};

/* ─── Admin: Approve Recruiter ───────────────────────────────────────────── */
/**
 * @desc  Approve a recruiter's company verification
 * @route PUT /api/verification/approve/:id
 * @access Private — admin
 */
exports.approveRecruiter = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) return next(new ErrorResponse("Recruiter not found", 404));
    if (user.role !== "recruiter") return next(new ErrorResponse("User is not a recruiter", 400));

    user.companyVerificationStatus = "approved";
    user.companyVerificationNote = "";
    await user.save({ validateBeforeSave: false });

    // Send approval email (non-blocking)
    try {
      await sendEmail({
        to: user.email,
        subject: "🎉 Company Verification Approved — Job Portal",
        html: getVerificationResultEmailTemplate(user.name, "approved", ""),
      });
    } catch (e) {
      console.error("Approval email failed:", e.message);
    }

    res.status(200).json({
      success: true,
      message: `${user.name} has been approved.`,
      data: { companyVerificationStatus: "approved" },
    });
  } catch (error) {
    next(error);
  }
};

/* ─── Admin: Reject Recruiter ────────────────────────────────────────────── */
/**
 * @desc  Reject a recruiter's company verification with an optional note
 * @route PUT /api/verification/reject/:id
 * @access Private — admin
 */
exports.rejectRecruiter = async (req, res, next) => {
  try {
    const { note } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) return next(new ErrorResponse("Recruiter not found", 404));
    if (user.role !== "recruiter") return next(new ErrorResponse("User is not a recruiter", 400));

    user.companyVerificationStatus = "rejected";
    user.companyVerificationNote = (note || "Your verification request was not approved.").trim();
    await user.save({ validateBeforeSave: false });

    // Send rejection email (non-blocking)
    try {
      await sendEmail({
        to: user.email,
        subject: "Company Verification Update — Job Portal",
        html: getVerificationResultEmailTemplate(user.name, "rejected", user.companyVerificationNote),
      });
    } catch (e) {
      console.error("Rejection email failed:", e.message);
    }

    res.status(200).json({
      success: true,
      message: `${user.name} has been rejected.`,
      data: { companyVerificationStatus: "rejected" },
    });
  } catch (error) {
    next(error);
  }
};

/* ─── Admin: Get / Update Global Verification Toggle ─────────────────────── */
/**
 * @desc  Get current site-wide verification setting
 * @route GET /api/verification/settings
 * @access Private — admin
 */
exports.getVerificationSettings = async (req, res, next) => {
  try {
    const settings = await SiteSettings.getSettings();
    res.status(200).json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc  Update the verificationRequired toggle
 * @route PUT /api/verification/settings
 * @access Private — admin
 */
exports.updateVerificationSettings = async (req, res, next) => {
  try {
    const { verificationRequired } = req.body;

    if (typeof verificationRequired !== "boolean") {
      return next(new ErrorResponse("verificationRequired must be a boolean", 400));
    }

    const settings = await SiteSettings.getSettings();
    settings.verificationRequired = verificationRequired;
    await settings.save();

    res.status(200).json({
      success: true,
      message: `Verification enforcement ${verificationRequired ? "enabled" : "disabled"}.`,
      data: settings,
    });
  } catch (error) {
    next(error);
  }
};

/* ─── Admin: Stats Dashboard ─────────────────────────────────────────────── */
/**
 * @desc  Recruiter counts by verification status + current toggle
 * @route GET /api/verification/stats
 * @access Private — admin
 */
exports.getAdminStats = async (req, res, next) => {
  try {
    const [pending, approved, rejected, total] = await Promise.all([
      User.countDocuments({ role: "recruiter", companyVerificationStatus: "pending" }),
      User.countDocuments({ role: "recruiter", companyVerificationStatus: "approved" }),
      User.countDocuments({ role: "recruiter", companyVerificationStatus: "rejected" }),
      User.countDocuments({ role: "recruiter" }),
    ]);

    const settings = await SiteSettings.getSettings();

    res.status(200).json({
      success: true,
      data: { pending, approved, rejected, total, verificationRequired: settings.verificationRequired },
    });
  } catch (error) {
    next(error);
  }
};

/* ─── Email Template Helper ─────────────────────────────────────────────── */
const getVerificationResultEmailTemplate = (name, status, note) => {
  const isApproved = status === "approved";
  const accent = isApproved ? "#22c55e" : "#ef4444";
  const body = isApproved
    ? `<p style="color:#555;font-size:16px;">Congratulations! Your company has been <strong>verified</strong>. You can now post jobs on the Job Portal.</p>`
    : `<p style="color:#555;font-size:16px;">Your company verification request was <strong>not approved</strong>.</p>
       <div style="background:#fef2f2;border-left:4px solid #ef4444;padding:12px 16px;border-radius:6px;margin:16px 0;">
         <strong style="color:#991b1b;">Reason:</strong>
         <p style="color:#555;margin:4px 0 0;">${note}</p>
       </div>
       <p style="color:#555;font-size:15px;">You can log in and re-submit a new request with updated information.</p>`;

  return `
    <div style="max-width:600px;margin:0 auto;padding:20px;font-family:'Segoe UI',Arial,sans-serif;">
      <div style="background:${accent};padding:28px;border-radius:12px 12px 0 0;text-align:center;">
        <h1 style="color:white;margin:0;font-size:26px;">Job Portal</h1>
      </div>
      <div style="background:#fff;padding:30px;border:1px solid #e0e0e0;border-radius:0 0 12px 12px;">
        <h2 style="color:#333;margin-top:0;">Company Verification ${isApproved ? "Approved ✅" : "Update ❌"}</h2>
        <p style="color:#555;font-size:16px;">Hello <strong>${name}</strong>,</p>
        ${body}
        <hr style="border:none;border-top:1px solid #eee;margin:20px 0;" />
        <p style="color:#aaa;font-size:12px;text-align:center;">© ${new Date().getFullYear()} Job Portal. All rights reserved.</p>
      </div>
    </div>`;
};
