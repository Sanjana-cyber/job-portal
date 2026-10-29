import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Upload,
  Camera,
  CheckCircle2,
  X,
  MapPin,
  Briefcase,
  User,
  Plus,
  FileText,
  Sparkles,
  Search,
  Eye,
  ShieldCheck
} from "lucide-react";
import TalentBridgeLogo from "../components/TalentBridgeLogo/TalentBridgeLogo";
import SeekerNavbar from "./SeekerNavbar";
import "./ApplyForm.css";
import "./CreateDashboardForm.css";

const GENDER_OPTIONS = [
  { label: "Female" },
  { label: "Male" },
  { label: "Transgender" },
  { label: "Intersex" },
  { label: "Non-binary" },
  { label: "Prefer not to say" },
  { label: "Others" }
];

export default function CreateDashboardForm({ onBack, user }) {
  const navigate = useNavigate();

  // Load initial form from localStorage draft or logged-in user
  const [form, setForm] = useState(() => {
    try {
      const saved = localStorage.getItem("tb_seeker_dashboard_profile");
      if (saved) return JSON.parse(saved);
    } catch {
      // storage unavailable
    }
    return {
      firstName: user?.name ? user.name.split(" ")[0] : "",
      lastName: user?.name ? user.name.split(" ").slice(1).join(" ") : "",
      email: user?.email || "",
      phone: "",
      gender: "",
      location: "",
      headline: "",
      experienceYears: "",
      about: "",
      skills: [],
      profileImage: null,
      resumeFileName: null,
      resumeBase64: null,
      isFilled: false,
    };
  });

  const [imagePreview, setImagePreview] = useState(form.profileImage || null);
  const [resumeFile, setResumeFile] = useState(null);
  const [skillInput, setSkillInput] = useState("");
  const [dragOverImage, setDragOverImage] = useState(false);
  const [dragOverResume, setDragOverResume] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const imageInputRef = useRef(null);
  const resumeInputRef = useRef(null);

  // Sync user info if user logs in
  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        firstName: prev.firstName || (user.name ? user.name.split(" ")[0] : ""),
        lastName: prev.lastName || (user.name ? user.name.split(" ").slice(1).join(" ") : ""),
        email: prev.email || user.email || "",
      }));
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    if (error) setError("");
  };

  /* ── Image Upload Handling ─────────────────────────────────────────────── */
  const handleImageFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file (JPEG, PNG, WEBP).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be under 5 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result);
      setForm((p) => ({ ...p, profileImage: reader.result }));
    };
    reader.readAsDataURL(file);
    setError("");
  };

  const handleImageDrop = (e) => {
    e.preventDefault();
    setDragOverImage(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveImage = (e) => {
    e.stopPropagation();
    setImagePreview(null);
    setForm((p) => ({ ...p, profileImage: null }));
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  /* ── Resume File Handling ──────────────────────────────────────────────── */
  const handleResumeFile = (file) => {
    if (!file) return;
    const ext = file.name.split(".").pop().toLowerCase();
    if (!["pdf", "doc", "docx"].includes(ext)) {
      setError("Only PDF, DOC, or DOCX resume files are accepted.");
      return;
    }
    if (file.size > 6 * 1024 * 1024) {
      setError("Resume file must be under 6 MB.");
      return;
    }
    setResumeFile(file);
    setForm((p) => ({
      ...p,
      resumeFileName: file.name,
      resumeType: file.type || "application/pdf",
    }));
    setError("");

    // Read as Base64 to store in dashboard profile for auto-filling apply forms
    const reader = new FileReader();
    reader.onload = () => {
      setForm((p) => ({
        ...p,
        resumeBase64: reader.result,
        resumeFileName: file.name,
        resumeType: file.type || "application/pdf",
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleResumeDrop = (e) => {
    e.preventDefault();
    setDragOverResume(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleResumeFile(e.dataTransfer.files[0]);
    }
  };

  /* ── Skill Tags Handling ───────────────────────────────────────────────── */
  const handleAddSkill = (e) => {
    if (e) e.preventDefault();
    const trimmed = skillInput.trim();
    if (trimmed && !form.skills.includes(trimmed)) {
      setForm((p) => ({ ...p, skills: [...p.skills, trimmed] }));
    }
    setSkillInput("");
  };

  const handleRemoveSkill = (skillToRemove) => {
    setForm((p) => ({
      ...p,
      skills: p.skills.filter((s) => s !== skillToRemove),
    }));
  };

  /* ── Submit Handler ────────────────────────────────────────────────────── */
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.firstName.trim()) return setError("First name is required.");
    if (!form.email.trim()) return setError("Email address is required.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      return setError("Enter a valid email address.");

    setLoading(true);
    setError("");

    setTimeout(() => {
      try {
        const payload = {
          ...form,
          isFilled: true,
          updatedAt: new Date().toISOString(),
        };
        localStorage.setItem("tb_seeker_dashboard_profile", JSON.stringify(payload));
      } catch {
        // Storage limit or private browsing
      }
      setLoading(false);
      setSubmitted(true);
    }, 600);
  };

  /* ── Success Screen (Matching ApplyForm Success Screen) ─────────────────── */
  if (submitted) {
    const fullName = `${form.firstName} ${form.lastName}`.trim();
    return (
      <div className="af-page">
        {/* ── Top Navbar (identical to Jobs page) ── */}
        <SeekerNavbar
          activeTab="dashboard"
          onTabChange={(tab) => {
            if (tab === "jobs") {
              if (onBack) onBack();
              else navigate("/seeker/jobs");
            } else if (tab === "resume") {
              navigate("/seeker/resume-builder");
            } else if (tab === "dashboard") {
              setSubmitted(false);
            }
          }}
        />

        <div className="af-success cd-success">
          <div className="af-success__icon cd-success__icon">
            <CheckCircle2 size={44} />
          </div>

          <h2 className="af-success__title">Dashboard Created Successfully!</h2>
          <p className="af-success__text">
            Your candidate profile and job dashboard are now live. Recruiters will be able
            to discover your credentials and invite you for relevant roles.
          </p>

          {/* Profile Overview Card */}
          <div className="cd-profile-summary-card">
            <div className="cd-summary-avatar-wrap">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt={fullName}
                  className="cd-summary-avatar-img"
                />
              ) : (
                <div className="cd-summary-avatar-initials">
                  {form.firstName ? form.firstName[0].toUpperCase() : "U"}
                </div>
              )}
            </div>

            <div className="cd-summary-meta">
              <h3 className="cd-summary-name">{fullName || "Job Seeker"}</h3>
              <p className="cd-summary-headline">{form.headline || "Job Candidate"}</p>
              <div className="cd-summary-row">
                {form.location && (
                  <span className="cd-summary-pill">
                    <MapPin size={12} /> {form.location}
                  </span>
                )}
                <span className="cd-summary-pill cd-summary-pill--active">
                  <ShieldCheck size={12} /> Public Active Profile
                </span>
              </div>
            </div>
          </div>

          {form.skills?.length > 0 && (
            <div className="cd-summary-skills">
              <span className="cd-summary-skills-title">Matched Skills:</span>
              <div className="cd-skills-list">
                {form.skills.map((s) => (
                  <span key={s} className="cd-skill-tag cd-skill-tag--verified">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="cd-success-actions">
            <button className="af-btn af-btn--primary" onClick={onBack}>
              <Search size={16} /> Browse Matching Jobs
            </button>
            <button
              className="cd-btn-secondary"
              onClick={() => {
                setSubmitted(false);
              }}
            >
              <Eye size={16} /> Edit Dashboard Details
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Create Dashboard Form Screen ───────────────────────────────────────── */
  return (
    <div className="af-page">
      {/* ── Top Navbar (identical to Jobs page) ─────── */}
      <SeekerNavbar
        activeTab="dashboard"
        onTabChange={(tab) => {
          if (tab === "jobs") {
            if (onBack) onBack();
            else navigate("/seeker/jobs");
          } else if (tab === "resume") {
            navigate("/seeker/resume-builder");
          }
        }}
      />

      {/* ── Scrollable Body with Card ───────────────────────────────────────── */}
      <div className="af-body">
        <div className="af-card cd-card">
          <div className="cd-header-flex">
            <div>
              {onBack && (
                <button
                  type="button"
                  className="cd-back-to-jobs-btn"
                  onClick={onBack}
                  title="Return to job listings"
                >
                  <ArrowLeft size={14} /> Back to Job Listings
                </button>
              )}
              <h2 className="af-card__heading">Candidate Dashboard Form</h2>
              <p className="cd-card-sub">
                Complete your profile and dashboard so companies can contact and hire you directly.
              </p>
            </div>
            
          </div>

          {error && (
            <div className="af-error">
              <X size={14} /> {error}
            </div>
          )}

          <form className="af-form" onSubmit={handleSubmit} noValidate>
            {/* ── 1. PROFILE PHOTO / IMAGE UPLOAD (REQUESTED FEATURE) ──────── */}
            <p className="af-section-title">Profile Photo / Avatar Image</p>

            <div className="cd-image-upload-section">
              <div
                className={`cd-image-dropzone ${dragOverImage ? "cd-image-dropzone--over" : ""} ${imagePreview ? "cd-image-dropzone--has-img" : ""}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverImage(true);
                }}
                onDragLeave={() => setDragOverImage(false)}
                onDrop={handleImageDrop}
                onClick={() => imageInputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && imageInputRef.current?.click()}
                aria-label="Upload profile photo"
                id="cd-image-dropzone"
              >
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  style={{ display: "none" }}
                  onChange={(e) => handleImageFile(e.target.files[0])}
                  id="cd-image-input"
                />

                {imagePreview ? (
                  <div className="cd-image-preview-box">
                    <img
                      src={imagePreview}
                      alt="Uploaded candidate avatar"
                      className="cd-image-preview-thumb"
                    />
                    <div className="cd-image-preview-info">
                      <div className="cd-image-preview-meta">
                        <CheckCircle2 size={16} className="text-emerald" />
                        <strong>Profile Photo Uploaded</strong>
                      </div>
                      <p className="cd-image-hint">
                        Click anywhere to change, or remove to revert to default avatar.
                      </p>
                    </div>
                    <button
                      type="button"
                      className="cd-image-remove-btn"
                      onClick={handleRemoveImage}
                      title="Remove image"
                      aria-label="Remove photo"
                    >
                      <X size={15} />
                    </button>
                  </div>
                ) : (
                  <div className="cd-image-placeholder">
                    <div className="cd-image-icon-ring">
                      <Camera size={26} className="cd-image-icon" />
                    </div>
                    <div className="cd-image-prompt">
                      <p className="cd-image-title">
                        <span>Click to upload image</span> or drag and drop photo
                      </p>
                      <p className="cd-image-subtext">PNG, JPG or WEBP &bull; Max 5 MB</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ── 2. BASIC DETAILS ────────────────────────────────────────── */}
            <p className="af-section-title">Personal &amp; Contact Details</p>

            {/* First Name + Last Name */}
            <div className="af-row">
              <div className="af-field">
                <label className="af-label" htmlFor="cd-fname">
                  First Name<sup>*</sup>
                </label>
                <input
                  id="cd-fname"
                  className="af-input"
                  type="text"
                  name="firstName"
                  value={form.firstName}
                  onChange={handleChange}
                  placeholder="e.g. Aarav"
                  autoComplete="given-name"
                  required
                />
              </div>

              <div className="af-field">
                <label className="af-label" htmlFor="cd-lname">
                  Last Name
                </label>
                <input
                  id="cd-lname"
                  className="af-input"
                  type="text"
                  name="lastName"
                  value={form.lastName}
                  onChange={handleChange}
                  placeholder="e.g. Sharma"
                  autoComplete="family-name"
                />
              </div>
            </div>

            {/* Email + Mobile */}
            <div className="af-row">
              <div className="af-field">
                <label className="af-label" htmlFor="cd-email">
                  Email Address<sup>*</sup>
                </label>
                <input
                  id="cd-email"
                  className="af-input"
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="name@example.com"
                  autoComplete="email"
                  required
                />
              </div>

              <div className="af-field">
                <label className="af-label" htmlFor="cd-phone">
                  Mobile Number
                </label>
                <div className="af-phone-row">
                  <span className="af-phone-prefix">
                    <span className="af-phone-prefix__flag">🇮🇳</span>
                    +91 ▾
                  </span>
                  <input
                    id="cd-phone"
                    className="af-phone-input"
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="98765 43210"
                    autoComplete="tel"
                  />
                </div>
              </div>
            </div>

            {/* Gender Selection */}
            <div className="af-field">
              <label className="af-label">Gender</label>
              <div className="af-gender-pills">
                {GENDER_OPTIONS.map((g) => (
                  <button
                    key={g.label}
                    type="button"
                    className={`af-gender-pill${form.gender === g.label ? " af-gender-pill--active" : ""}`}
                    onClick={() =>
                      setForm((p) => ({
                        ...p,
                        gender: p.gender === g.label ? "" : g.label,
                      }))
                    }
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Location */}
            <div className="af-field">
              <label className="af-label" htmlFor="cd-location">
                Current Location / City
              </label>
              <div className="af-location-wrap">
                <input
                  id="cd-location"
                  className="af-input"
                  type="text"
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  placeholder="e.g. Bangalore, India"
                  autoComplete="address-level2"
                />
                <span className="af-location-icon">
                  <MapPin size={16} />
                </span>
              </div>
            </div>

            {/* ── 3. PROFESSIONAL PROFILE & HEADLINE ─────────────────────── */}
            <p className="af-section-title">Professional Role &amp; Experience</p>

            <div className="af-row">
              <div className="af-field">
                <label className="af-label" htmlFor="cd-headline">
                  Professional Headline / Target Role
                </label>
                <input
                  id="cd-headline"
                  className="af-input"
                  type="text"
                  name="headline"
                  value={form.headline}
                  onChange={handleChange}
                  placeholder="e.g. Senior Full Stack Engineer"
                />
              </div>

              <div className="af-field">
                <label className="af-label" htmlFor="cd-exp">
                  Total Experience (Years)
                </label>
                <input
                  id="cd-exp"
                  className="af-input"
                  type="number"
                  min="0"
                  max="50"
                  name="experienceYears"
                  value={form.experienceYears}
                  onChange={handleChange}
                  placeholder="e.g. 3"
                />
              </div>
            </div>

            {/* Skills Tags */}
            <div className="af-field">
              <label className="af-label">Core Skills</label>
              <div className="cd-skills-input-row">
                <input
                  type="text"
                  className="af-input"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddSkill();
                    }
                  }}
                  placeholder="Add a skill (e.g. Python, Docker, Figma) and press Enter"
                />
                <button
                  type="button"
                  className="cd-btn-add-skill"
                  onClick={handleAddSkill}
                  disabled={!skillInput.trim()}
                >
                  <Plus size={15} /> Add
                </button>
              </div>

              {form.skills?.length > 0 && (
                <div className="cd-skills-list cd-skills-list--edit">
                  {form.skills.map((s) => (
                    <span key={s} className="cd-skill-pill">
                      <span>{s}</span>
                      <button
                        type="button"
                        className="cd-skill-del"
                        onClick={() => handleRemoveSkill(s)}
                        title={`Remove ${s}`}
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* ── 4. RESUME UPLOAD ────────────────────────────────────────── */}
            <div className="af-field">
              <label className="af-label">Resume / CV (Optional)</label>
              <div
                className={`af-dropzone ${dragOverResume ? "af-dropzone--over" : ""} ${resumeFile || form.resumeFileName ? "af-dropzone--filled" : ""}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverResume(true);
                }}
                onDragLeave={() => setDragOverResume(false)}
                onDrop={handleResumeDrop}
                onClick={() => resumeInputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && resumeInputRef.current?.click()}
                aria-label="Upload resume"
              >
                <input
                  ref={resumeInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  style={{ display: "none" }}
                  onChange={(e) => handleResumeFile(e.target.files[0])}
                />
                {resumeFile || form.resumeFileName ? (
                  <div className="af-dropzone__file">
                    <CheckCircle2 size={18} className="af-dropzone__ok" />
                    <span>{resumeFile ? resumeFile.name : form.resumeFileName}</span>
                    <button
                      type="button"
                      className="af-dropzone__remove"
                      onClick={(e) => {
                        e.stopPropagation();
                        setResumeFile(null);
                        setForm((p) => ({ ...p, resumeFileName: null }));
                      }}
                      aria-label="Remove resume"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload size={22} className="af-dropzone__icon" />
                    <p className="af-dropzone__text">
                      Drag &amp; drop your resume, or <span>click to browse</span>
                    </p>
                    <p className="af-dropzone__hint">PDF, DOC, DOCX &bull; Max 6 MB</p>
                  </>
                )}
              </div>
            </div>

            {/* ── 5. PROFESSIONAL BIO ─────────────────────────────────────── */}
            <div className="af-field">
              <label className="af-label" htmlFor="cd-about">
                Professional Bio / Summary
              </label>
              <textarea
                id="cd-about"
                className="af-textarea"
                name="about"
                value={form.about}
                onChange={handleChange}
                placeholder="Briefly describe your career background, key achievements, and target roles…"
                rows={4}
              />
            </div>
          </form>
        </div>
      </div>

      {/* ── Sticky Footer (Matching ApplyForm footer) ───────────────────────── */}
      <div className="af-footer">
        <button className="af-footer__close" type="button" onClick={onBack}>
          Close
        </button>
        <button
          className="af-btn af-btn--primary cd-submit-btn"
          type="button"
          disabled={loading}
          onClick={handleSubmit}
          id="cd-save-dashboard-btn"
        >
          {loading ? "Saving Dashboard…" : "Save & Create Dashboard"}
        </button>
      </div>
    </div>
  );
}
