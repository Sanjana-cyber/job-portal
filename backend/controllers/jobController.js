const Job = require("../models/Job");
const Application = require("../models/Application");
const User = require("../models/User");
const { ErrorResponse } = require("../middleware/errorHandler");
const { sendEmail } = require("../utils/sendEmail");

// ─── POST /api/jobs ────────────────────────────────────────────────────────
exports.createJob = async (req, res, next) => {
  try {
    const { title, company, description, requiredSkills, preferredSkills, location, experienceRequired } = req.body;

    const job = await Job.create({
      title,
      company,
      description,
      requiredSkills: Array.isArray(requiredSkills) ? requiredSkills : [],
      preferredSkills: Array.isArray(preferredSkills) ? preferredSkills : [],
      location,
      experienceRequired,
      postedBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: "Job created successfully",
      data: job,
    });

    // ── Background: notify all job seekers ──────────────────────────────
    // Runs after response is sent so it never delays the recruiter
    setImmediate(async () => {
      try {
        const seekers = await User.find({ role: "jobseeker", isVerified: true })
          .select("name email")
          .lean();

        if (!seekers.length) return;

        const emailPromises = seekers.map((seeker) =>
          sendEmail({
            to: seeker.email,
            subject: `🆕 New Job: ${title} at ${company} — Job Portal`,
            html: getNewJobEmailTemplate(seeker.name, { title, company, location, experienceRequired, description }),
          }).catch((e) => console.error(`Notification email failed for ${seeker.email}:`, e.message))
        );

        await Promise.allSettled(emailPromises);
      } catch (e) {
        console.error("Job notification dispatch error:", e.message);
      }
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/jobs/recent — recent jobs for seeker notification bell ───────
exports.getRecentJobs = async (req, res, next) => {
  try {
    // Jobs posted in the last 48 hours
    const since = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const jobs = await Job.find({ isActive: true, createdAt: { $gte: since } })
      .select("title company location createdAt")
      .sort({ createdAt: -1 })
      .limit(20);

    res.status(200).json({ success: true, count: jobs.length, data: jobs });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/jobs ─────────────────────────────────────────────────────────
exports.getJobs = async (req, res, next) => {
  try {
    const query = { isActive: true };

    if (req.query.search) {
      query.$or = [
        { title: { $regex: req.query.search, $options: "i" } },
        { company: { $regex: req.query.search, $options: "i" } },
        { requiredSkills: { $regex: req.query.search, $options: "i" } },
      ];
    }

    const jobs = await Job.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: jobs.length,
      data: jobs,
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/jobs/me ──────────────────────────────────────────────────────
exports.getMyJobs = async (req, res, next) => {
  try {
    const jobs = await Job.find({ postedBy: req.user._id }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: jobs.length,
      data: jobs,
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/jobs/:id ─────────────────────────────────────────────────────
exports.getJobById = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id).populate("postedBy", "name email");

    if (!job) {
      return next(new ErrorResponse(`Job not found with id of ${req.params.id}`, 404));
    }

    res.status(200).json({
      success: true,
      data: job,
    });
  } catch (err) {
    next(err);
  }
};

// ─── PUT /api/jobs/:id ─────────────────────────────────────────────────────
exports.updateJob = async (req, res, next) => {
  try {
    let job = await Job.findById(req.params.id);

    if (!job) {
      return next(new ErrorResponse(`Job not found with id of ${req.params.id}`, 404));
    }

    if (job.postedBy.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return next(new ErrorResponse(`User not authorized to update this job`, 401));
    }

    job = await Job.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: "Job updated successfully",
      data: job,
    });
  } catch (err) {
    next(err);
  }
};

// ─── DELETE /api/jobs/:id ──────────────────────────────────────────────────
exports.deleteJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return next(new ErrorResponse(`Job not found with id of ${req.params.id}`, 404));
    }

    if (job.postedBy.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return next(new ErrorResponse(`User not authorized to delete this job`, 401));
    }

    await Application.deleteMany({ job: req.params.id });
    await job.deleteOne();

    res.status(200).json({
      success: true,
      message: "Job deleted successfully",
      data: {},
    });
  } catch (err) {
    next(err);
  }
};

// ─── Email template: new job notification ──────────────────────────────────
const getNewJobEmailTemplate = (seekerName, job) => {
  const { title, company, location, experienceRequired, description } = job;
  const jobsUrl = `${process.env.FRONTEND_URL}/jobs`;
  return `
    <div style="max-width:600px;margin:0 auto;padding:20px;font-family:'Segoe UI',Arial,sans-serif;">
      <div style="background:linear-gradient(135deg,#1c1614 0%,#382c29 100%);padding:28px;border-radius:12px 12px 0 0;text-align:center;">
        <h1 style="color:#feece3;margin:0;font-size:26px;">💼 Job Portal</h1>
        <p style="color:rgba(254,236,227,0.7);margin:6px 0 0;font-size:14px;">New opportunity just posted</p>
      </div>
      <div style="background:#ffffff;padding:30px;border:1px solid #e0e0e0;border-radius:0 0 12px 12px;">
        <h2 style="color:#1c1614;margin-top:0;">${title}</h2>
        <p style="color:#574641;font-size:15px;margin:0 0 16px;">
          <strong>${company}</strong>${location ? ` &bull; ${location}` : ""}${experienceRequired ? ` &bull; ${experienceRequired}` : ""}
        </p>
        ${description ? `<p style="color:#555;font-size:14px;line-height:1.6;border-left:3px solid #91766e;padding-left:12px;">${description.slice(0, 200)}${description.length > 200 ? "..." : ""}</p>` : ""}
        <div style="text-align:center;margin:28px 0;">
          <a href="${jobsUrl}" style="background:linear-gradient(135deg,#382c29,#574641);color:#feece3;padding:14px 36px;border-radius:8px;text-decoration:none;font-size:15px;font-weight:600;">
            View All Jobs
          </a>
        </div>
        <p style="color:#aaa;font-size:12px;">Hello ${seekerName}, this is an automatic notification.</p>
        <hr style="border:none;border-top:1px solid #eee;margin:20px 0;" />
        <p style="color:#ccc;font-size:11px;text-align:center;">© ${new Date().getFullYear()} Job Portal. All rights reserved.</p>
      </div>
    </div>`;
};
