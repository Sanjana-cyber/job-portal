const mongoose = require("mongoose");
const Job = require("../models/Job");
const { ErrorResponse } = require("../middleware/errorHandler");

/**
 * jobController.js
 * ────────────────
 * Contains all business logic for the Recruiter Job Management API.
 *
 * Security measures applied in this file:
 *
 *   1. ObjectId validation   — req.params.id is checked before any DB query.
 *                              Invalid IDs return 400, not 500 CastErrors.
 *
 *   2. Ownership check       — For GET/:id, PUT, DELETE: we compare
 *                              job.recruiterId with req.user._id.
 *                              Returns 403 if another recruiter tries to access.
 *
 *   3. Input validation      — All incoming fields are validated manually
 *                              before touching the database.
 *
 *   4. Field whitelist       — createJob and updateJob only read the specific
 *                              fields they allow. Raw req.body is NEVER passed
 *                              to Mongoose directly — this prevents NoSQL injection
 *                              and protects fields like recruiterId, createdAt.
 *
 *   5. recruiterId from JWT  — On creation, recruiterId is always set from
 *                              req.user._id (the verified JWT identity).
 *                              The client cannot supply or override this.
 */

// ─── Helper: validate a MongoDB ObjectId ─────────────────────────────────────
/**
 * Returns true if the given string is a valid 24-character hex MongoDB ObjectId.
 * We check this BEFORE calling findById() so an invalid ID returns 400 (bad input)
 * rather than a confusing Mongoose CastError.
 */
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// ─── Helper: validate job input fields ───────────────────────────────────────
/**
 * Validates the fields allowed when creating or updating a job.
 *
 * @param {object} fields  - The plain object of fields to validate
 * @param {boolean} isCreate - true when creating (required fields enforced)
 * @returns {string|null}  - Error message string if invalid, null if OK
 */
const validateJobFields = (fields, isCreate = false) => {
  const {
    title,
    company,
    location,
    employmentType,
    description,
    responsibilities,
    skills,
    experience,
    education,
    salaryMin,
    salaryMax,
    openings,
    applicationDeadline,
    status,
  } = fields;

  const ALLOWED_EMPLOYMENT_TYPES = [
    "full-time",
    "part-time",
    "internship",
    "contract",
  ];
  const ALLOWED_STATUSES = ["active", "closed", "draft"];

  // ── Required field checks (only enforced on create) ──────────────────────
  if (isCreate) {
    if (!title || typeof title !== "string" || title.trim() === "") {
      return "Title is required and must be a non-empty string";
    }
    if (!company || typeof company !== "string" || company.trim() === "") {
      return "Company is required and must be a non-empty string";
    }
    if (!location || typeof location !== "string" || location.trim() === "") {
      return "Location is required and must be a non-empty string";
    }
    if (!employmentType) {
      return "Employment type is required";
    }
    if (!description || typeof description !== "string" || description.trim() === "") {
      return "Description is required and must be a non-empty string";
    }
    if (!skills || !Array.isArray(skills) || skills.length === 0) {
      return "Skills must be a non-empty array";
    }
    if (!experience || typeof experience !== "string" || experience.trim() === "") {
      return "Experience is required and must be a non-empty string";
    }
    if (openings === undefined || openings === null) {
      return "Number of openings is required";
    }
  }

  // ── Type checks for fields that ARE provided (applies to both create & update) ─
  if (title !== undefined) {
    if (typeof title !== "string" || title.trim() === "") {
      return "Title must be a non-empty string";
    }
    if (title.length > 150) {
      return "Title cannot exceed 150 characters";
    }
  }

  if (company !== undefined) {
    if (typeof company !== "string" || company.trim() === "") {
      return "Company must be a non-empty string";
    }
    if (company.length > 100) {
      return "Company name cannot exceed 100 characters";
    }
  }

  if (location !== undefined) {
    if (typeof location !== "string" || location.trim() === "") {
      return "Location must be a non-empty string";
    }
  }

  if (employmentType !== undefined) {
    if (!ALLOWED_EMPLOYMENT_TYPES.includes(employmentType)) {
      return `Employment type must be one of: ${ALLOWED_EMPLOYMENT_TYPES.join(", ")}`;
    }
  }

  if (description !== undefined) {
    if (typeof description !== "string" || description.trim() === "") {
      return "Description must be a non-empty string";
    }
  }

  if (responsibilities !== undefined && typeof responsibilities !== "string") {
    return "Responsibilities must be a string";
  }

  if (skills !== undefined) {
    if (!Array.isArray(skills) || skills.length === 0) {
      return "Skills must be a non-empty array";
    }
    // Every element in the array must be a non-empty string
    const allStrings = skills.every(
      (s) => typeof s === "string" && s.trim() !== ""
    );
    if (!allStrings) {
      return "Each skill must be a non-empty string";
    }
  }

  if (experience !== undefined) {
    if (typeof experience !== "string" || experience.trim() === "") {
      return "Experience must be a non-empty string";
    }
  }

  if (education !== undefined && typeof education !== "string") {
    return "Education must be a string";
  }

  if (salaryMin !== undefined && salaryMin !== null) {
    const min = Number(salaryMin);
    if (isNaN(min) || min < 0) {
      return "Salary minimum must be a non-negative number";
    }
  }

  if (salaryMax !== undefined && salaryMax !== null) {
    const max = Number(salaryMax);
    if (isNaN(max) || max < 0) {
      return "Salary maximum must be a non-negative number";
    }
  }

  // Cross-field check: salaryMin must not exceed salaryMax
  if (
    salaryMin !== undefined &&
    salaryMin !== null &&
    salaryMax !== undefined &&
    salaryMax !== null
  ) {
    if (Number(salaryMin) > Number(salaryMax)) {
      return "Minimum salary cannot be greater than maximum salary";
    }
  }

  if (openings !== undefined) {
    const op = Number(openings);
    if (!Number.isInteger(op) || op < 1) {
      return "Openings must be a positive whole number";
    }
  }

  if (applicationDeadline !== undefined && applicationDeadline !== null) {
    const d = new Date(applicationDeadline);
    if (isNaN(d.getTime())) {
      return "Application deadline must be a valid date";
    }
  }

  if (status !== undefined) {
    if (!ALLOWED_STATUSES.includes(status)) {
      return `Status must be one of: ${ALLOWED_STATUSES.join(", ")}`;
    }
  }

  // All checks passed
  return null;
};

// ─── POST /api/jobs ───────────────────────────────────────────────────────────
/**
 * createJob
 * ─────────
 * Creates a new job posting for the authenticated recruiter.
 *
 * Security:
 *   - recruiterId is taken from req.user._id (JWT identity) — client cannot supply it.
 *   - Only whitelisted fields are read from req.body.
 *   - All fields are validated before the DB insert.
 */
exports.createJob = async (req, res, next) => {
  try {
    // Step 1: Extract only the fields we allow from the request body.
    // Anything else in req.body (like recruiterId, createdAt) is simply ignored.
    const {
      title,
      company,
      location,
      employmentType,
      description,
      responsibilities,
      skills,
      experience,
      education,
      salaryMin,
      salaryMax,
      openings,
      applicationDeadline,
      status,
    } = req.body;

    // Step 2: Validate all provided fields
    const validationError = validateJobFields(
      {
        title,
        company,
        location,
        employmentType,
        description,
        responsibilities,
        skills,
        experience,
        education,
        salaryMin,
        salaryMax,
        openings,
        applicationDeadline,
        status,
      },
      true // isCreate = true → enforce required fields
    );

    if (validationError) {
      return next(new ErrorResponse(validationError, 400));
    }

    // Step 3: Build the job object.
    // recruiterId is ALWAYS set from req.user._id — the client cannot influence this.
    const job = await Job.create({
      title: title.trim(),
      company: company.trim(),
      location: location.trim(),
      employmentType,
      description: description.trim(),
      responsibilities: responsibilities ? responsibilities.trim() : "",
      skills: skills.map((s) => s.trim()),
      experience: experience.trim(),
      education: education ? education.trim() : "",
      salaryMin: salaryMin !== undefined && salaryMin !== null ? Number(salaryMin) : null,
      salaryMax: salaryMax !== undefined && salaryMax !== null ? Number(salaryMax) : null,
      openings: Number(openings),
      applicationDeadline: applicationDeadline || null,
      status: status || "active",
      recruiterId: req.user._id, // ← Always from JWT, never from client
    });

    return res.status(201).json({
      success: true,
      message: "Job created successfully",
      data: job,
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/jobs ────────────────────────────────────────────────────────────
/**
 * getJobs
 * ───────
 * Returns all jobs posted by the currently authenticated recruiter.
 *
 * Security:
 *   - The recruiterId filter is always req.user._id from the JWT.
 *   - The client cannot pass a different recruiterId to see another recruiter's jobs.
 *   - The optional "status" query param is validated against allowed values only.
 */
exports.getJobs = async (req, res, next) => {
  try {
    // Always filter by the logged-in recruiter's ID
    const filter = { recruiterId: req.user._id };

    // Optional status filter — only accept known values, ignore anything else
    const ALLOWED_STATUSES = ["active", "closed", "draft"];
    if (req.query.status && ALLOWED_STATUSES.includes(req.query.status)) {
      filter.status = req.query.status;
    }

    const jobs = await Job.find(filter).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: jobs.length,
      data: jobs,
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/jobs/:id ────────────────────────────────────────────────────────
/**
 * getJobById
 * ──────────
 * Returns a single job by its MongoDB ID.
 *
 * Security:
 *   - ObjectId is validated before the query (returns 400 for bad IDs).
 *   - Ownership check: if the job belongs to another recruiter, return 403.
 */
exports.getJobById = async (req, res, next) => {
  try {
    // Step 1: Validate the ID format before querying MongoDB
    if (!isValidObjectId(req.params.id)) {
      return next(new ErrorResponse("Invalid job ID format", 400));
    }

    // Step 2: Find the job
    const job = await Job.findById(req.params.id);

    if (!job) {
      return next(new ErrorResponse("Job not found", 404));
    }

    // Step 3: Ownership check
    // Only the recruiter who created this job can view it via this endpoint.
    // Admin can always view.
    if (
      job.recruiterId.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return next(
        new ErrorResponse("You are not authorized to view this job", 403)
      );
    }

    return res.status(200).json({
      success: true,
      data: job,
    });
  } catch (err) {
    next(err);
  }
};

// ─── PUT /api/jobs/:id ────────────────────────────────────────────────────────
/**
 * updateJob
 * ─────────
 * Updates an existing job. Follows a strict 8-step security process:
 *
 *   1. Authenticate recruiter        (done by protect middleware before this runs)
 *   2. Validate the job ID format    (isValidObjectId check)
 *   3. Find the job                  (Job.findById)
 *   4. Check ownership               (job.recruiterId === req.user._id)
 *   5. Validate incoming fields      (validateJobFields)
 *   6. Build a whitelisted update    (only allowed fields — no recruiterId, createdAt)
 *   7. Never allow recruiterId change (recruiterId is excluded from the update object)
 *   8. Save to database              (Job.findByIdAndUpdate with runValidators)
 */
exports.updateJob = async (req, res, next) => {
  try {
    // Step 2: Validate ID format
    if (!isValidObjectId(req.params.id)) {
      return next(new ErrorResponse("Invalid job ID format", 400));
    }

    // Step 3: Find the job
    const job = await Job.findById(req.params.id);

    if (!job) {
      return next(new ErrorResponse("Job not found", 404));
    }

    // Step 4: Ownership check
    if (
      job.recruiterId.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return next(
        new ErrorResponse("You are not authorized to modify this job", 403)
      );
    }

    // Step 5 & 6: Extract ONLY the fields we allow to be updated.
    // Any field NOT listed here (recruiterId, createdAt, etc.) is automatically ignored,
    // even if the client sends it in the request body.
    const {
      title,
      company,
      location,
      employmentType,
      description,
      responsibilities,
      skills,
      experience,
      education,
      salaryMin,
      salaryMax,
      openings,
      applicationDeadline,
      status,
    } = req.body;

    // Validate only the fields that were actually provided
    const validationError = validateJobFields(
      {
        title,
        company,
        location,
        employmentType,
        description,
        responsibilities,
        skills,
        experience,
        education,
        salaryMin,
        salaryMax,
        openings,
        applicationDeadline,
        status,
      },
      false // isCreate = false → don't enforce required fields on partial updates
    );

    if (validationError) {
      return next(new ErrorResponse(validationError, 400));
    }

    // Step 6: Build the update object — only include fields that were sent
    const updateData = {};

    if (title !== undefined)              updateData.title = title.trim();
    if (company !== undefined)            updateData.company = company.trim();
    if (location !== undefined)           updateData.location = location.trim();
    if (employmentType !== undefined)     updateData.employmentType = employmentType;
    if (description !== undefined)        updateData.description = description.trim();
    if (responsibilities !== undefined)   updateData.responsibilities = responsibilities.trim();
    if (skills !== undefined)             updateData.skills = skills.map((s) => s.trim());
    if (experience !== undefined)         updateData.experience = experience.trim();
    if (education !== undefined)          updateData.education = education.trim();
    if (openings !== undefined)           updateData.openings = Number(openings);
    if (status !== undefined)             updateData.status = status;

    // Salary fields — handle explicit null (to clear them) and numeric values
    if (salaryMin !== undefined)          updateData.salaryMin = salaryMin !== null ? Number(salaryMin) : null;
    if (salaryMax !== undefined)          updateData.salaryMax = salaryMax !== null ? Number(salaryMax) : null;
    if (applicationDeadline !== undefined) updateData.applicationDeadline = applicationDeadline || null;

    // Step 7: recruiterId is never in updateData — it cannot be changed. Ever.

    // Step 8: Update with runValidators so Mongoose schema rules still apply
    const updatedJob = await Job.findByIdAndUpdate(
      req.params.id,
      updateData, // ← only safe, whitelisted fields — never raw req.body
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      message: "Job updated successfully",
      data: updatedJob,
    });
  } catch (err) {
    next(err);
  }
};

// ─── DELETE /api/jobs/:id ─────────────────────────────────────────────────────
/**
 * deleteJob
 * ─────────
 * Deletes a job posting. Follows a 5-step security process:
 *
 *   1. Authenticate recruiter        (done by protect middleware before this runs)
 *   2. Validate the job ID format    (isValidObjectId check)
 *   3. Find the job                  (Job.findById)
 *   4. Check ownership               (job.recruiterId === req.user._id)
 *   5. Delete only if owner          (job.deleteOne())
 *
 * Note: We do NOT delete related applications here intentionally —
 * application cleanup can be handled separately when that module is built.
 */
exports.deleteJob = async (req, res, next) => {
  try {
    // Step 2: Validate ID format
    if (!isValidObjectId(req.params.id)) {
      return next(new ErrorResponse("Invalid job ID format", 400));
    }

    // Step 3: Find the job
    const job = await Job.findById(req.params.id);

    if (!job) {
      return next(new ErrorResponse("Job not found", 404));
    }

    // Step 4: Ownership check
    if (
      job.recruiterId.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return next(
        new ErrorResponse("You are not authorized to delete this job", 403)
      );
    }

    // Step 5: Delete the job
    await job.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Job deleted successfully",
      data: {},
    });
  } catch (err) {
    next(err);
  }
};
