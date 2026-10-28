import React, { useState, useMemo } from "react";
import { useAuthModal } from "../../context/AuthModalContext";
import { api } from "../../services/api";
import TalentBridgeLogo from "../../components/TalentBridgeLogo/TalentBridgeLogo";
import {
  ArrowLeft,
  Briefcase,
  DollarSign,
  Layers,
  FileText,
  Plus,
  Trash2,
  X,
  CheckCircle2,
  Circle,
  AlertCircle,
  Building2,
  ShieldCheck,
  Check,
  Globe,
} from "lucide-react";
import "./createJob.css";
import NotificationBell from "../../components/NotificationBell/NotificationBell";

/* ─── Static Preset Options ────────────────────────────────────────────────── */
const EMPLOYMENT_TYPES = [
  "Full-time",
  "Part-time",
  "Contract",
  "Internship",
  "Freelance",
];

const WORK_ARRANGEMENTS = ["Remote", "On-site", "Hybrid", "Flexible"];

const EXPERIENCE_LEVELS = [
  "Entry Level",
  "Mid Level",
  "Senior",
  "Lead",
  "Director",
  "Executive",
];

const QUICK_LOCATIONS = [
  "Remote",
  "San Francisco, CA",
  "New York, NY",
  "London, UK",
  "Bengaluru, India",
];

const POPULAR_SKILLS = [
  "React",
  "Node.js",
  "TypeScript",
  "Python",
  "SQL",
  "System Design",
  "REST APIs",
];

const POPULAR_TECH = [
  "JavaScript",
  "Express",
  "MongoDB",
  "PostgreSQL",
  "AWS",
  "Docker",
  "Git",
];

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  CreateJob Component                                                        */
/* ═══════════════════════════════════════════════════════════════════════════ */
export default function CreateJob({ onBack, onJobCreated, initialData = null }) {
  const { user, logout } = useAuthModal();

  // ── Form State ──────────────────────────────────────────────────────────
  const [formData, setFormData] = useState({
    jobTitle: initialData?.jobTitle || "",
    employmentType: initialData?.employmentType || "Full-time",
    jobType: initialData?.jobType || "Remote",
    acceptableLocations: Array.isArray(initialData?.acceptableLocations)
      ? initialData.acceptableLocations
      : initialData?.acceptableLocations
      ? [initialData.acceptableLocations]
      : ["Remote"],
    headcount: initialData?.headcount || 1,
    salaryMin: initialData?.salaryMin ?? "",
    salaryMax: initialData?.salaryMax ?? "",
    offeringBonus: initialData?.offeringBonus || false,
    offeringEquity: initialData?.offeringEquity || false,
    useRecommendedSalary: initialData?.useRecommendedSalary || false,
    level: initialData?.level || "Mid Level",
    yearsOfExperience: initialData?.yearsOfExperience ?? 2,
    requiredSkills: Array.isArray(initialData?.requiredSkills)
      ? initialData.requiredSkills
      : [],
    techStack: Array.isArray(initialData?.techStack)
      ? initialData.techStack
      : [],
    description: initialData?.description || "",
    responsibilities: Array.isArray(initialData?.responsibilities)
      ? initialData.responsibilities
      : [],
    requirements: Array.isArray(initialData?.requirements)
      ? initialData.requirements
      : [],
    applicationDeadline: initialData?.applicationDeadline
      ? new Date(initialData.applicationDeadline).toISOString().split("T")[0]
      : "",
    status: initialData?.status || "Open",
  });

  // ── Local Input States for Tag Builders ───────────────────────────────────
  const [locationInput, setLocationInput] = useState("");
  const [skillInput, setSkillInput] = useState("");
  const [techInput, setTechInput] = useState("");
  const [responsibilityInput, setResponsibilityInput] = useState("");
  const [requirementInput, setRequirementInput] = useState("");

  // ── Validation & Submission States ───────────────────────────────────────
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Field Change Handlers ────────────────────────────────────────────────
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    if (apiError) setApiError(null);
  };

  // ── Tag Addition & Removal Helpers ────────────────────────────────────────
  const addTag = (field, value, clearFn) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    if (!formData[field].includes(trimmed)) {
      setFormData((prev) => ({
        ...prev,
        [field]: [...prev[field], trimmed],
      }));
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    }
    clearFn("");
  };

  const removeTag = (field, indexToRemove) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, idx) => idx !== indexToRemove),
    }));
  };

  // ── Dynamic Item List Helpers (Responsibilities & Requirements) ────────────
  const addListItem = (field, value, clearFn) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    setFormData((prev) => ({
      ...prev,
      [field]: [...prev[field], trimmed],
    }));
    clearFn("");
  };

  const removeListItem = (field, indexToRemove) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, idx) => idx !== indexToRemove),
    }));
  };

  // ── Form Validation ───────────────────────────────────────────────────────
  const validate = (isDraft = false, data = formData, isClosed = false) => {
    const errs = {};

    // For draft or closing registration: only job title is required so it can be identified
    if (!data.jobTitle?.trim()) {
      errs.jobTitle = isDraft
        ? "Job title is required to save a draft"
        : isClosed
        ? "Job title is required to close registration"
        : "Job title is required";
    }

    // Salary validation (applies if values are entered)
    if (
      data.salaryMin !== "" &&
      data.salaryMax !== "" &&
      Number(data.salaryMin) > Number(data.salaryMax)
    ) {
      errs.salaryMin = "Minimum salary cannot exceed maximum salary";
    }

    // If saving as draft or closing registration, skip other strict mandatory checks
    if (isDraft || isClosed) {
      setErrors(errs);
      return { isValid: Object.keys(errs).length === 0, errors: errs };
    }

    // Mandatory fields for Publishing / Open jobs
    if (!data.employmentType?.trim()) {
      errs.employmentType = "Employment type is required";
    }
    if (!data.jobType?.trim()) {
      errs.jobType = "Work arrangement is required";
    }
    if (!data.acceptableLocations || data.acceptableLocations.length === 0) {
      errs.acceptableLocations = "At least one location is required";
    }
    if (!data.headcount || Number(data.headcount) < 1) {
      errs.headcount = "Openings must be at least 1";
    }
    if (!data.level?.trim()) {
      errs.level = "Experience level is required";
    }
    if (
      data.yearsOfExperience === "" ||
      Number(data.yearsOfExperience) < 0
    ) {
      errs.yearsOfExperience = "Years of experience must be 0 or greater";
    }
    if (!data.requiredSkills || data.requiredSkills.length === 0) {
      errs.requiredSkills = "Add at least one required skill";
    }
    if (!data.techStack || data.techStack.length === 0) {
      errs.techStack = "Add at least one tech stack tool";
    }
    if (!data.description?.trim()) {
      errs.description = "Job summary description is required";
    } else if (data.description.trim().length < 20) {
      errs.description = "Description should be at least 20 characters";
    }

    setErrors(errs);
    return { isValid: Object.keys(errs).length === 0, errors: errs };
  };

  // ── Form Submission ───────────────────────────────────────────────────────
  const handleSubmit = async (submitStatus = "Open") => {
    const isDraft = submitStatus === "Draft";
    const isClosed = submitStatus === "Closed";

    // Auto-commit any currently typed text in inputs into their arrays
    let currentSkills = [...formData.requiredSkills];
    if (skillInput.trim() && !currentSkills.includes(skillInput.trim())) {
      currentSkills.push(skillInput.trim());
      setSkillInput("");
    }

    let currentTech = [...formData.techStack];
    if (techInput.trim() && !currentTech.includes(techInput.trim())) {
      currentTech.push(techInput.trim());
      setTechInput("");
    }

    let currentLocations = [...formData.acceptableLocations];
    if (locationInput.trim() && !currentLocations.includes(locationInput.trim())) {
      currentLocations.push(locationInput.trim());
      setLocationInput("");
    }

    const currentData = {
      ...formData,
      status: submitStatus,
      requiredSkills: currentSkills,
      techStack: currentTech,
      acceptableLocations: currentLocations,
    };
    setFormData(currentData);

    const { isValid, errors: validationErrors } = validate(isDraft, currentData, isClosed);
    if (!isValid) {
      const errorList = Object.values(validationErrors);
      setApiError(
        isDraft
          ? "Please provide a Job Title to save this job as a draft."
          : isClosed
          ? "Please provide a Job Title to close registration."
          : `Please fill in all required fields before publishing: ${errorList.join(", ")}`
      );
      window.scrollTo({ top: 120, behavior: "smooth" });
      return;
    }

    setIsSubmitting(true);
    setApiError(null);

    const payload = {
      jobTitle: currentData.jobTitle.trim(),
      headcount: Number(currentData.headcount) || 1,
      jobType: currentData.jobType.trim() || "Remote",
      acceptableLocations:
        currentData.acceptableLocations.length > 0
          ? currentData.acceptableLocations
          : ["Remote"],
      employmentType: currentData.employmentType.trim() || "Full-time",
      level: currentData.level.trim() || "Mid Level",
      yearsOfExperience:
        currentData.yearsOfExperience !== ""
          ? Number(currentData.yearsOfExperience)
          : 0,
      salaryMin:
        currentData.salaryMin !== "" ? Number(currentData.salaryMin) : null,
      salaryMax:
        currentData.salaryMax !== "" ? Number(currentData.salaryMax) : null,
      offeringBonus: Boolean(currentData.offeringBonus),
      offeringEquity: Boolean(currentData.offeringEquity),
      useRecommendedSalary: Boolean(currentData.useRecommendedSalary),
      requiredSkills: currentData.requiredSkills,
      techStack: currentData.techStack,
      description:
        currentData.description.trim() ||
        (isDraft ? "Draft job posting" : ""),
      responsibilities: currentData.responsibilities,
      requirements: currentData.requirements,
      applicationDeadline: currentData.applicationDeadline || null,
      status: submitStatus,
    };

    try {
      let res;
      if (initialData?._id) {
        res = await api.put(`/jobs/${initialData._id}`, payload);
      } else {
        res = await api.post("/jobs", payload);
      }

      if (res.data?.success) {
        if (onJobCreated) {
          onJobCreated(res.data.job);
        } else if (onBack) {
          onBack();
        }
      }
    } catch (err) {
      const msg =
        err.data?.message ||
        err.data?.detail ||
        err.message ||
        "Failed to save job. Please verify all fields and try again.";
      setApiError(msg);
      window.scrollTo({ top: 120, behavior: "smooth" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Checklist Progress Calculation ────────────────────────────────────────
  const checklistItems = useMemo(
    () => [
      {
        id: "title",
        label: "Job title specified",
        done: Boolean(formData.jobTitle.trim()),
      },
      {
        id: "type",
        label: "Employment type & arrangement",
        done: Boolean(formData.employmentType && formData.jobType),
      },
      {
        id: "location",
        label: "At least 1 location specified",
        done: formData.acceptableLocations.length > 0,
      },
      {
        id: "exp",
        label: "Experience level & years set",
        done: Boolean(formData.level && formData.yearsOfExperience !== ""),
      },
      {
        id: "skills",
        label: "Core required skills added",
        done: formData.requiredSkills.length > 0,
      },
      {
        id: "tech",
        label: "Tech stack tools specified",
        done: formData.techStack.length > 0,
      },
      {
        id: "desc",
        label: "Role summary completed",
        done: formData.description.trim().length >= 20,
      },
    ],
    [formData]
  );

  const completedCount = checklistItems.filter((item) => item.done).length;
  const progressPercent = Math.round((completedCount / checklistItems.length) * 100);

  const initials = (user?.name || user?.companyName || "Recruiter")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="create-job-page">
      {/* ── Recruiter Top Navbar ───────────────────────────────────────────── */}
      <nav className="recruiter-navbar" id="create-job-navbar">


        <div className="recruiter-navbar__profile">
          <NotificationBell />
          <div
            className="recruiter-navbar__avatar"
            title={user?.name || "Recruiter"}
          >
            {initials}
          </div>
          <button
            className="recruiter-navbar__logout"
            onClick={logout}
            id="create-job-logout-btn"
          >
            Logout
          </button>
        </div>
      </nav>

      {/* ── Main Container ────────────────────────────────────────────────── */}
      <div className="create-job-container">
        {/* Navigation / Breadcrumb */}
        <div className="create-job-nav">
          <div className="create-job-breadcrumb">
            <button
              className="create-job-back-link"
              onClick={onBack}
              id="back-to-jobs-btn"
            >
              <ArrowLeft size={15} />
              Back to Jobs
            </button>
            <span className="create-job-breadcrumb__separator">/</span>
            <span className="create-job-breadcrumb__current">
              {initialData ? "Edit Job" : "Create New Job"}
            </span>
          </div>
        </div>

        {/* Page Title & Quick Actions Header */}
        <div className="create-job-header">
          <div className="create-job-header__text">
            <h1>{initialData ? "Edit Job Posting" : "Create a New Job"}</h1>
            <p>
              Fill in the parameters below to publish this vacancy across Talent
              Bridge and connect with qualified candidates.
            </p>
          </div>

          <div className="create-job-header__actions">
            <button
              type="button"
              className="create-job-btn create-job-btn--secondary"
              onClick={onBack}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="button"
              className="create-job-btn create-job-btn--close-reg"
              onClick={() => handleSubmit("Closed")}
              disabled={isSubmitting}
              id="close-registration-top-btn"
              title="Close candidate registration"
            >
              {formData.status === "Closed" ? "Registration Closed" : "Close Registration"}
            </button>
            <button
              type="button"
              className="create-job-btn create-job-btn--secondary"
              onClick={() => handleSubmit("Draft")}
              disabled={isSubmitting}
              id="save-draft-top-btn"
            >
              Save Draft
            </button>
            <button
              type="button"
              className="create-job-btn create-job-btn--primary"
              onClick={() => handleSubmit(formData.status === "Closed" ? "Closed" : "Open")}
              disabled={isSubmitting}
              id="publish-job-top-btn"
            >
              {isSubmitting ? (
                <>
                  <span className="create-job-spinner" />
                  Saving…
                </>
              ) : (
                <>
                  <Check size={16} />
                  {initialData ? "Save Changes" : "Publish Job"}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Server Error Banner */}
        {apiError && (
          <div className="create-job-error-banner" role="alert">
            <AlertCircle size={20} />
            <div>
              <strong>Action required:</strong> {apiError}
            </div>
          </div>
        )}

        {/* Layout Grid: Main Form (Wide) + Sidebar (Narrow Contextual) */}
        <div className="create-job-grid">
          {/* ══════════════ Left Form Column ══════════════ */}
          <div className="create-job-form-col">
            {/* ── Section 1: Job Details ── */}
            <section className="create-job-section" id="section-job-details">
              <div className="create-job-section__header">
                <div className="create-job-section__title-wrap">
                  <div className="create-job-section__icon">
                    <Briefcase size={18} />
                  </div>
                  <div>
                    <h2 className="create-job-section__title">Job Details</h2>
                    <p className="create-job-section__desc">
                      Role title, working arrangement, locations, and headcount.
                    </p>
                  </div>
                </div>
                <span className="create-job-section__badge create-job-section__badge--required">
                  Required
                </span>
              </div>

              {/* Job Title */}
              <div className="create-job-field">
                <label className="create-job-label" htmlFor="jobTitle">
                  <span>
                    Job Title
                    <span className="create-job-label__required">*</span>
                  </span>
                </label>
                <input
                  id="jobTitle"
                  type="text"
                  className={`create-job-input ${
                    errors.jobTitle ? "create-job-input--error" : ""
                  }`}
                  placeholder="e.g. Senior Full Stack Engineer"
                  value={formData.jobTitle}
                  onChange={(e) => handleInputChange("jobTitle", e.target.value)}
                  autoComplete="off"
                />
                {errors.jobTitle && (
                  <span className="create-job-field-error">
                    <AlertCircle size={13} /> {errors.jobTitle}
                  </span>
                )}
              </div>

              {/* Employment Type & Work Arrangement */}
              <div className="create-job-form-row">
                <div className="create-job-field">
                  <label className="create-job-label" htmlFor="employmentType">
                    <span>
                      Employment Type
                      <span className="create-job-label__required">*</span>
                    </span>
                  </label>
                  <select
                    id="employmentType"
                    className={`create-job-select ${
                      errors.employmentType ? "create-job-select--error" : ""
                    }`}
                    value={formData.employmentType}
                    onChange={(e) =>
                      handleInputChange("employmentType", e.target.value)
                    }
                  >
                    {EMPLOYMENT_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                  {errors.employmentType && (
                    <span className="create-job-field-error">
                      <AlertCircle size={13} /> {errors.employmentType}
                    </span>
                  )}
                </div>

                <div className="create-job-field">
                  <label className="create-job-label" htmlFor="jobType">
                    <span>
                      Work Arrangement
                      <span className="create-job-label__required">*</span>
                    </span>
                  </label>
                  <select
                    id="jobType"
                    className={`create-job-select ${
                      errors.jobType ? "create-job-select--error" : ""
                    }`}
                    value={formData.jobType}
                    onChange={(e) => handleInputChange("jobType", e.target.value)}
                  >
                    {WORK_ARRANGEMENTS.map((arr) => (
                      <option key={arr} value={arr}>
                        {arr}
                      </option>
                    ))}
                  </select>
                  {errors.jobType && (
                    <span className="create-job-field-error">
                      <AlertCircle size={13} /> {errors.jobType}
                    </span>
                  )}
                </div>
              </div>

              {/* Acceptable Locations */}
              <div className="create-job-field">
                <label className="create-job-label" htmlFor="locationInput">
                  <span>
                    Acceptable Locations
                    <span className="create-job-label__required">*</span>
                  </span>
                  <span className="create-job-label__hint">
                    Press Enter or click Add
                  </span>
                </label>

                <div className="create-job-tag-input-wrap">
                  <div className="create-job-tag-list">
                    {formData.acceptableLocations.map((loc, idx) => (
                      <span key={loc} className="create-job-tag">
                        <Globe size={12} />
                        {loc}
                        <button
                          type="button"
                          className="create-job-tag__remove"
                          onClick={() => removeTag("acceptableLocations", idx)}
                          aria-label={`Remove location ${loc}`}
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>

                  <div className="create-job-tag-input-row">
                    <input
                      id="locationInput"
                      type="text"
                      className="create-job-input"
                      placeholder="Add city, country or Remote (e.g. San Francisco, CA)"
                      value={locationInput}
                      onChange={(e) => setLocationInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addTag(
                            "acceptableLocations",
                            locationInput,
                            setLocationInput
                          );
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="create-job-tag-add-btn"
                      onClick={() =>
                        addTag(
                          "acceptableLocations",
                          locationInput,
                          setLocationInput
                        )
                      }
                    >
                      <Plus size={15} /> Add
                    </button>
                  </div>
                </div>

                {errors.acceptableLocations && (
                  <span className="create-job-field-error">
                    <AlertCircle size={13} /> {errors.acceptableLocations}
                  </span>
                )}

                {/* Quick Add Pills */}
                <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap", marginTop: "0.45rem" }}>
                  <span style={{ fontSize: "0.74rem", color: "#64748b", alignSelf: "center" }}>
                    Quick add:
                  </span>
                  {QUICK_LOCATIONS.map((loc) => (
                    <button
                      key={loc}
                      type="button"
                      style={{
                        fontSize: "0.72rem",
                        padding: "0.15rem 0.45rem",
                        borderRadius: "4px",
                        border: "1px dashed #cbd5e1",
                        background: "#f8fafc",
                        color: "#475569",
                        cursor: "pointer",
                      }}
                      onClick={() => addTag("acceptableLocations", loc, setLocationInput)}
                    >
                      +{loc}
                    </button>
                  ))}
                </div>
              </div>

              {/* Headcount Openings & Application Deadline */}
              <div className="create-job-form-row">
                <div className="create-job-field">
                  <label className="create-job-label" htmlFor="headcount">
                    <span>
                      Openings / Headcount
                      <span className="create-job-label__required">*</span>
                    </span>
                  </label>
                  <input
                    id="headcount"
                    type="number"
                    min="1"
                    className={`create-job-input ${
                      errors.headcount ? "create-job-input--error" : ""
                    }`}
                    value={formData.headcount}
                    onChange={(e) =>
                      handleInputChange("headcount", e.target.value)
                    }
                  />
                  {errors.headcount && (
                    <span className="create-job-field-error">
                      <AlertCircle size={13} /> {errors.headcount}
                    </span>
                  )}
                </div>

                <div className="create-job-field">
                  <label className="create-job-label" htmlFor="applicationDeadline">
                    <span>Application Deadline</span>
                    <span className="create-job-label__hint">Optional</span>
                  </label>
                  <input
                    id="applicationDeadline"
                    type="date"
                    className="create-job-input"
                    value={formData.applicationDeadline}
                    onChange={(e) =>
                      handleInputChange("applicationDeadline", e.target.value)
                    }
                  />
                </div>
              </div>

              {/* Registration Status Selector */}
              <div className="create-job-field" style={{ marginTop: "1rem" }}>
                <label className="create-job-label">
                  <span>
                    Job Registration Status
                    <span className="create-job-label__required">*</span>
                  </span>
                  <span className="create-job-label__hint">
                    Choose whether candidates can currently register & apply
                  </span>
                </label>
                <div className="create-job-status-picker">
                  <button
                    type="button"
                    className={`create-job-status-btn ${formData.status === "Open" ? "create-job-status-btn--active-open" : ""}`}
                    onClick={() => handleInputChange("status", "Open")}
                  >
                    <span className="create-job-status-indicator create-job-status-indicator--open" />
                    <div>
                      <strong>Open</strong>
                      <p>Accepting new applications</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    className={`create-job-status-btn ${formData.status === "Closed" ? "create-job-status-btn--active-closed" : ""}`}
                    onClick={() => handleInputChange("status", "Closed")}
                  >
                    <span className="create-job-status-indicator create-job-status-indicator--closed" />
                    <div>
                      <strong>Closed</strong>
                      <p>Close registration (no new applicants)</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    className={`create-job-status-btn ${formData.status === "Draft" ? "create-job-status-btn--active-draft" : ""}`}
                    onClick={() => handleInputChange("status", "Draft")}
                  >
                    <span className="create-job-status-indicator create-job-status-indicator--draft" />
                    <div>
                      <strong>Draft</strong>
                      <p>Saved as work-in-progress</p>
                    </div>
                  </button>
                </div>
              </div>
            </section>

            {/* ── Section 2: Compensation & Experience ── */}
            <section className="create-job-section" id="section-compensation">
              <div className="create-job-section__header">
                <div className="create-job-section__title-wrap">
                  <div className="create-job-section__icon">
                    <DollarSign size={18} />
                  </div>
                  <div>
                    <h2 className="create-job-section__title">
                      Compensation & Experience
                    </h2>
                    <p className="create-job-section__desc">
                      Set realistic salary parameters, seniority level, and required tenure.
                    </p>
                  </div>
                </div>
              </div>

              {/* Salary Range */}
              <div className="create-job-form-row">
                <div className="create-job-field">
                  <label className="create-job-label" htmlFor="salaryMin">
                    <span>Minimum Salary (Annual USD)</span>
                    <span className="create-job-label__hint">Optional</span>
                  </label>
                  <input
                    id="salaryMin"
                    type="number"
                    min="0"
                    step="1000"
                    placeholder="e.g. 90,000"
                    className={`create-job-input ${
                      errors.salaryMin ? "create-job-input--error" : ""
                    }`}
                    value={formData.salaryMin}
                    onChange={(e) =>
                      handleInputChange("salaryMin", e.target.value)
                    }
                  />
                  {errors.salaryMin && (
                    <span className="create-job-field-error">
                      <AlertCircle size={13} /> {errors.salaryMin}
                    </span>
                  )}
                </div>

                <div className="create-job-field">
                  <label className="create-job-label" htmlFor="salaryMax">
                    <span>Maximum Salary (Annual USD)</span>
                    <span className="create-job-label__hint">Optional</span>
                  </label>
                  <input
                    id="salaryMax"
                    type="number"
                    min="0"
                    step="1000"
                    placeholder="e.g. 130,000"
                    className="create-job-input"
                    value={formData.salaryMax}
                    onChange={(e) =>
                      handleInputChange("salaryMax", e.target.value)
                    }
                  />
                </div>
              </div>

              {/* Additional Incentives Checkboxes */}
              <div className="create-job-checkbox-group">
                <label className="create-job-checkbox-label">
                  <input
                    type="checkbox"
                    className="create-job-checkbox"
                    checked={formData.offeringBonus}
                    onChange={(e) =>
                      handleInputChange("offeringBonus", e.target.checked)
                    }
                  />
                  <span>Performance Bonus</span>
                </label>

                <label className="create-job-checkbox-label">
                  <input
                    type="checkbox"
                    className="create-job-checkbox"
                    checked={formData.offeringEquity}
                    onChange={(e) =>
                      handleInputChange("offeringEquity", e.target.checked)
                    }
                  />
                  <span>Equity / Stock Options</span>
                </label>

                <label className="create-job-checkbox-label">
                  <input
                    type="checkbox"
                    className="create-job-checkbox"
                    checked={formData.useRecommendedSalary}
                    onChange={(e) =>
                      handleInputChange(
                        "useRecommendedSalary",
                        e.target.checked
                      )
                    }
                  />
                  <span>Use Talent Bridge Market Recommendation</span>
                </label>
              </div>

              {/* Experience Level & Years of Experience */}
              <div className="create-job-form-row" style={{ marginTop: "1rem" }}>
                <div className="create-job-field">
                  <label className="create-job-label" htmlFor="level">
                    <span>
                      Seniority / Experience Level
                      <span className="create-job-label__required">*</span>
                    </span>
                  </label>
                  <select
                    id="level"
                    className={`create-job-select ${
                      errors.level ? "create-job-select--error" : ""
                    }`}
                    value={formData.level}
                    onChange={(e) => handleInputChange("level", e.target.value)}
                  >
                    {EXPERIENCE_LEVELS.map((lvl) => (
                      <option key={lvl} value={lvl}>
                        {lvl}
                      </option>
                    ))}
                  </select>
                  {errors.level && (
                    <span className="create-job-field-error">
                      <AlertCircle size={13} /> {errors.level}
                    </span>
                  )}
                </div>

                <div className="create-job-field">
                  <label className="create-job-label" htmlFor="yearsOfExperience">
                    <span>
                      Years of Experience
                      <span className="create-job-label__required">*</span>
                    </span>
                  </label>
                  <input
                    id="yearsOfExperience"
                    type="number"
                    min="0"
                    placeholder="e.g. 3"
                    className={`create-job-input ${
                      errors.yearsOfExperience
                        ? "create-job-input--error"
                        : ""
                    }`}
                    value={formData.yearsOfExperience}
                    onChange={(e) =>
                      handleInputChange("yearsOfExperience", e.target.value)
                    }
                  />
                  {errors.yearsOfExperience && (
                    <span className="create-job-field-error">
                      <AlertCircle size={13} /> {errors.yearsOfExperience}
                    </span>
                  )}
                </div>
              </div>
            </section>

            {/* ── Section 3: Skills & Tech Stack ── */}
            <section className="create-job-section" id="section-skills">
              <div className="create-job-section__header">
                <div className="create-job-section__title-wrap">
                  <div className="create-job-section__icon">
                    <Layers size={18} />
                  </div>
                  <div>
                    <h2 className="create-job-section__title">
                      Skills & Tech Stack
                    </h2>
                    <p className="create-job-section__desc">
                      Competencies tested during resume screening and candidate evaluation.
                    </p>
                  </div>
                </div>
                <span className="create-job-section__badge create-job-section__badge--required">
                  Required
                </span>
              </div>

              {/* Required Skills */}
              <div className="create-job-field">
                <label className="create-job-label" htmlFor="skillInput">
                  <span>
                    Required Skills
                    <span className="create-job-label__required">*</span>
                  </span>
                  <span className="create-job-label__hint">
                    Press Enter or comma to add
                  </span>
                </label>

                <div className="create-job-tag-input-wrap">
                  <div className="create-job-tag-list">
                    {formData.requiredSkills.map((sk, idx) => (
                      <span key={sk} className="create-job-tag">
                        {sk}
                        <button
                          type="button"
                          className="create-job-tag__remove"
                          onClick={() => removeTag("requiredSkills", idx)}
                          aria-label={`Remove skill ${sk}`}
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>

                  <div className="create-job-tag-input-row">
                    <input
                      id="skillInput"
                      type="text"
                      className="create-job-input"
                      placeholder="e.g. React, System Design, REST APIs"
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === ",") {
                          e.preventDefault();
                          addTag("requiredSkills", skillInput, setSkillInput);
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="create-job-tag-add-btn"
                      onClick={() =>
                        addTag("requiredSkills", skillInput, setSkillInput)
                      }
                    >
                      <Plus size={15} /> Add Skill
                    </button>
                  </div>
                </div>

                {errors.requiredSkills && (
                  <span className="create-job-field-error">
                    <AlertCircle size={13} /> {errors.requiredSkills}
                  </span>
                )}

                {/* Popular Skill Suggestions */}
                <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap", marginTop: "0.45rem" }}>
                  <span style={{ fontSize: "0.74rem", color: "#64748b", alignSelf: "center" }}>
                    Suggestions:
                  </span>
                  {POPULAR_SKILLS.map((sk) => (
                    <button
                      key={sk}
                      type="button"
                      style={{
                        fontSize: "0.72rem",
                        padding: "0.15rem 0.45rem",
                        borderRadius: "4px",
                        border: "1px dashed #cbd5e1",
                        background: "#f8fafc",
                        color: "#475569",
                        cursor: "pointer",
                      }}
                      onClick={() => addTag("requiredSkills", sk, setSkillInput)}
                    >
                      +{sk}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tech Stack */}
              <div className="create-job-field" style={{ marginTop: "1.25rem" }}>
                <label className="create-job-label" htmlFor="techInput">
                  <span>
                    Technology Stack & Tools
                    <span className="create-job-label__required">*</span>
                  </span>
                  <span className="create-job-label__hint">
                    Press Enter or comma to add
                  </span>
                </label>

                <div className="create-job-tag-input-wrap">
                  <div className="create-job-tag-list">
                    {formData.techStack.map((tech, idx) => (
                      <span key={tech} className="create-job-tag">
                        {tech}
                        <button
                          type="button"
                          className="create-job-tag__remove"
                          onClick={() => removeTag("techStack", idx)}
                          aria-label={`Remove technology ${tech}`}
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>

                  <div className="create-job-tag-input-row">
                    <input
                      id="techInput"
                      type="text"
                      className="create-job-input"
                      placeholder="e.g. JavaScript, Docker, PostgreSQL"
                      value={techInput}
                      onChange={(e) => setTechInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === ",") {
                          e.preventDefault();
                          addTag("techStack", techInput, setTechInput);
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="create-job-tag-add-btn"
                      onClick={() =>
                        addTag("techStack", techInput, setTechInput)
                      }
                    >
                      <Plus size={15} /> Add Tool
                    </button>
                  </div>
                </div>

                {errors.techStack && (
                  <span className="create-job-field-error">
                    <AlertCircle size={13} /> {errors.techStack}
                  </span>
                )}

                {/* Popular Tech Suggestions */}
                <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap", marginTop: "0.45rem" }}>
                  <span style={{ fontSize: "0.74rem", color: "#64748b", alignSelf: "center" }}>
                    Suggestions:
                  </span>
                  {POPULAR_TECH.map((t) => (
                    <button
                      key={t}
                      type="button"
                      style={{
                        fontSize: "0.72rem",
                        padding: "0.15rem 0.45rem",
                        borderRadius: "4px",
                        border: "1px dashed #cbd5e1",
                        background: "#f8fafc",
                        color: "#475569",
                        cursor: "pointer",
                      }}
                      onClick={() => addTag("techStack", t, setTechInput)}
                    >
                      +{t}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* ── Section 4: Job Description ── */}
            <section className="create-job-section" id="section-description">
              <div className="create-job-section__header">
                <div className="create-job-section__title-wrap">
                  <div className="create-job-section__icon">
                    <FileText size={18} />
                  </div>
                  <div>
                    <h2 className="create-job-section__title">
                      Job Description
                    </h2>
                    <p className="create-job-section__desc">
                      Summary overview, key day-to-day responsibilities, and specific qualifications.
                    </p>
                  </div>
                </div>
                <span className="create-job-section__badge create-job-section__badge--required">
                  Required
                </span>
              </div>

              {/* Role Summary / Description */}
              <div className="create-job-field">
                <label className="create-job-label" htmlFor="description">
                  <span>
                    Role Summary & Overview
                    <span className="create-job-label__required">*</span>
                  </span>
                  <span className="create-job-label__hint">
                    {formData.description.length} chars
                  </span>
                </label>
                <textarea
                  id="description"
                  className={`create-job-textarea ${
                    errors.description ? "create-job-textarea--error" : ""
                  }`}
                  placeholder="Provide an overview of the company, mission, role purpose, and what makes this position impactful..."
                  rows={5}
                  value={formData.description}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                />
                {errors.description && (
                  <span className="create-job-field-error">
                    <AlertCircle size={13} /> {errors.description}
                  </span>
                )}
              </div>

              {/* Key Responsibilities Builder */}
              <div className="create-job-field" style={{ marginTop: "1rem" }}>
                <label className="create-job-label" htmlFor="responsibilityInput">
                  <span>Key Responsibilities</span>
                  <span className="create-job-label__hint">
                    {formData.responsibilities.length} added
                  </span>
                </label>

                <div className="create-job-items-builder">
                  {formData.responsibilities.length > 0 && (
                    <div className="create-job-items-list">
                      {formData.responsibilities.map((resp, idx) => (
                        <div key={idx} className="create-job-item-row">
                          <span className="create-job-item-bullet" />
                          <span className="create-job-item-text">{resp}</span>
                          <button
                            type="button"
                            className="create-job-item-delete"
                            onClick={() =>
                              removeListItem("responsibilities", idx)
                            }
                            aria-label="Remove item"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="create-job-item-input-row">
                    <input
                      id="responsibilityInput"
                      type="text"
                      className="create-job-input"
                      placeholder="e.g. Architect scalable microservices in Node.js and AWS"
                      value={responsibilityInput}
                      onChange={(e) =>
                        setResponsibilityInput(e.target.value)
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addListItem(
                            "responsibilities",
                            responsibilityInput,
                            setResponsibilityInput
                          );
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="create-job-tag-add-btn"
                      onClick={() =>
                        addListItem(
                          "responsibilities",
                          responsibilityInput,
                          setResponsibilityInput
                        )
                      }
                    >
                      <Plus size={15} /> Add
                    </button>
                  </div>
                </div>
              </div>

              {/* Requirements & Qualifications Builder */}
              <div className="create-job-field" style={{ marginTop: "1.25rem" }}>
                <label className="create-job-label" htmlFor="requirementInput">
                  <span>Role Requirements & Qualifications</span>
                  <span className="create-job-label__hint">
                    {formData.requirements.length} added
                  </span>
                </label>

                <div className="create-job-items-builder">
                  {formData.requirements.length > 0 && (
                    <div className="create-job-items-list">
                      {formData.requirements.map((req, idx) => (
                        <div key={idx} className="create-job-item-row">
                          <span className="create-job-item-bullet" />
                          <span className="create-job-item-text">{req}</span>
                          <button
                            type="button"
                            className="create-job-item-delete"
                            onClick={() =>
                              removeListItem("requirements", idx)
                            }
                            aria-label="Remove item"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="create-job-item-input-row">
                    <input
                      id="requirementInput"
                      type="text"
                      className="create-job-input"
                      placeholder="e.g. BS in Computer Science or equivalent practical experience"
                      value={requirementInput}
                      onChange={(e) => setRequirementInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addListItem(
                            "requirements",
                            requirementInput,
                            setRequirementInput
                          );
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="create-job-tag-add-btn"
                      onClick={() =>
                        addListItem(
                          "requirements",
                          requirementInput,
                          setRequirementInput
                        )
                      }
                    >
                      <Plus size={15} /> Add
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* ── Footer Actions ── */}
            {apiError && (
              <div className="create-job-error-banner" role="alert" style={{ marginBottom: "1rem" }}>
                <AlertCircle size={18} />
                <div>
                  <strong>Attention Needed</strong>
                  <p>{apiError}</p>
                </div>
              </div>
            )}

            <div className="create-job-footer">
              <button
                type="button"
                className="create-job-btn create-job-btn--secondary"
                onClick={onBack}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="create-job-btn create-job-btn--close-reg"
                onClick={() => handleSubmit("Closed")}
                disabled={isSubmitting}
                id="close-registration-bottom-btn"
                title="Close registration to prevent new applicants"
              >
                {formData.status === "Closed" ? "Registration Closed" : "Close Registration"}
              </button>
              <button
                type="button"
                className="create-job-btn create-job-btn--secondary"
                onClick={() => handleSubmit("Draft")}
                disabled={isSubmitting}
                id="save-draft-btn"
              >
                {isSubmitting ? (
                  <>
                    <span className="create-job-spinner" />
                    Saving…
                  </>
                ) : (
                  "Save as Draft"
                )}
              </button>
              <button
                type="button"
                className="create-job-btn create-job-btn--primary"
                onClick={() => handleSubmit(formData.status === "Closed" ? "Closed" : "Open")}
                disabled={isSubmitting}
                id="publish-job-bottom-btn"
              >
                {isSubmitting ? (
                  <>
                    <span className="create-job-spinner" />
                    Publishing…
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    {initialData ? "Save Changes" : "Publish Job"}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* ══════════════ Right Sidebar (Contextual) ══════════════ */}
          <aside className="create-job-sidebar">
            {/* Checklist Card */}
            <div className="create-job-sidebar-card">
              <div className="create-job-sidebar-card__header">
                <h3 className="create-job-sidebar-card__title">
                  Publishing Checklist
                </h3>
                <span
                  style={{
                    fontSize: "0.74rem",
                    fontWeight: 700,
                    color: completedCount === checklistItems.length ? "#059669" : "#64748b",
                  }}
                >
                  {completedCount}/{checklistItems.length}
                </span>
              </div>

              <div className="create-job-checklist">
                {checklistItems.map((item) => (
                  <div
                    key={item.id}
                    className={`create-job-checklist__item ${
                      item.done ? "create-job-checklist__item--complete" : ""
                    }`}
                  >
                    <span
                      className={`create-job-checklist__icon ${
                        item.done
                          ? "create-job-checklist__icon--done"
                          : "create-job-checklist__icon--pending"
                      }`}
                    >
                      {item.done ? (
                        <CheckCircle2 size={16} />
                      ) : (
                        <Circle size={16} />
                      )}
                    </span>
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>

              <div className="create-job-checklist__progress-wrap">
                <div className="create-job-checklist__progress-bar">
                  <div
                    className="create-job-checklist__progress-fill"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <div className="create-job-checklist__progress-text">
                  <span>Completion</span>
                  <span>{progressPercent}%</span>
                </div>
              </div>
            </div>

            {/* Visibility & Posting Information */}
            <div className="create-job-sidebar-card">
              <div className="create-job-sidebar-card__header">
                <h3 className="create-job-sidebar-card__title">
                  Job Visibility
                </h3>
              </div>

              <div className="create-job-visibility-info">
                <div className="create-job-visibility-row">
                  <span className="create-job-visibility-label">Posting as</span>
                  <span className="create-job-visibility-value">
                    <Building2 size={14} color="#2563eb" />
                    {user?.companyName || user?.name || "Verified Recruiter"}
                  </span>
                </div>

                <div className="create-job-visibility-row">
                  <span className="create-job-visibility-label">Visibility Status</span>
                  <div>
                    <span className="create-job-visibility-status-pill">
                      <ShieldCheck size={12} />
                      {formData.status === "Draft" ? "Draft Mode" : "Public & Live"}
                    </span>
                  </div>
                </div>

                <div className="create-job-visibility-row">
                  <span className="create-job-visibility-label">Application Pipeline</span>
                  <span style={{ fontSize: "0.82rem", color: "#475569" }}>
                    Candidate resumes will be routed through Talent Bridge screening.
                  </span>
                </div>

                <div className="create-job-visibility-tip">
                  <ShieldCheck size={16} />
                  <div>
                    <strong>Quality hiring tip:</strong> Including competitive compensation and 3–5 specific responsibilities increases qualified applicant conversion by up to 35%.
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
