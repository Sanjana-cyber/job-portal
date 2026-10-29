import React, { useState, useRef, useEffect } from "react";
import { ArrowLeft, Upload, CheckCircle2, X, MapPin, Sparkles } from "lucide-react";
import { useAuthModal } from "../context/AuthModalContext";
import "./ApplyForm.css";

const getApiBase = () => {
  const envUrl =
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    "http://localhost:5000/api";
  const trimmed = envUrl.trim().replace(/\/+$/, "");
  return trimmed.endsWith("/api") ? trimmed : `${trimmed}/api`;
};

const API_BASE = getApiBase();

const GENDER_OPTIONS = [
  { label: "Female" },
  { label: "Male" },
  { label: "Transgender" },
  { label: "Intersex" },
  { label: "Non-binary" },
  { label: "Prefer not to say" },
  { label: "Others" }
];

/* ── Helper: Convert Base64 dataURL to a File object ─────────────────────── */
function dataURLtoFile(dataurl, filename) {
  try {
    const arr = dataurl.split(",");
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  } catch {
    return new File(["Dashboard Resume Document"], filename, {
      type: "application/pdf",
    });
  }
}

/* ── Helper: Check if Candidate Dashboard is filled ─────────────────────── */
function getDashboardProfile() {
  try {
    const saved = localStorage.getItem("tb_seeker_dashboard_profile");
    if (!saved) return null;
    const p = JSON.parse(saved);
    // Verified filled if isFilled flag is true or essential candidate details are present
    const isFilled = Boolean(
      p.isFilled ||
      (p.firstName && p.email && (p.phone || p.location || (p.skills && p.skills.length > 0) || p.headline || p.resumeFileName))
    );
    return isFilled ? p : null;
  } catch {
    return null;
  }
}

export default function ApplyForm({ job, onBack }) {
  const { user } = useAuthModal();
  const dashboard = getDashboardProfile();

  // If dashboard is filled: automatic pre-fill with all candidate information
  // If dashboard is NOT filled: leave fields blank for manual entry
  const [form, setForm] = useState(() => {
    if (dashboard) {
      return {
        applicantName: dashboard.firstName || (user?.name ? user.name.split(" ")[0] : ""),
        applicantLastName: dashboard.lastName || (user?.name ? user.name.split(" ").slice(1).join(" ") : ""),
        applicantEmail: dashboard.email || user?.email || "",
        applicantPhone: dashboard.phone || "",
        gender: dashboard.gender || "",
        location: dashboard.location || "",
        coverLetter:
          dashboard.about ||
          (dashboard.headline
            ? `Passionate ${dashboard.headline} applying for ${job?.jobTitle || "this position"}.`
            : ""),
      };
    }

    // Default: unfilled manually
    return {
      applicantName: "",
      applicantLastName: "",
      applicantEmail: user?.email || "",
      applicantPhone: "",
      gender: "",
      location: "",
      coverLetter: "",
    };
  });

  const [resumeFile, setResumeFile] = useState(() => {
    if (dashboard?.resumeFileName) {
      if (dashboard.resumeBase64) {
        return dataURLtoFile(dashboard.resumeBase64, dashboard.resumeFileName);
      }
      return new File(["Dashboard Resume Document"], dashboard.resumeFileName, {
        type: dashboard.resumeType || "application/pdf",
      });
    }
    return null;
  });

  const [autofilledFromDashboard, setAutofilledFromDashboard] = useState(Boolean(dashboard));
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const fileInputRef = useRef(null);

  const company =
    job?.companyName ||
    job?.recruiter?.companyName ||
    "the company";

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    if (error) setError("");
  };

  const handleClearToManual = () => {
    setForm({
      applicantName: "",
      applicantLastName: "",
      applicantEmail: "",
      applicantPhone: "",
      gender: "",
      location: "",
      coverLetter: "",
    });
    setResumeFile(null);
    setAutofilledFromDashboard(false);
  };

  const handleFile = (file) => {
    if (!file) return;
    const ext = file.name.split(".").pop().toLowerCase();
    if (!["pdf", "doc", "docx"].includes(ext)) {
      setError("Only PDF, DOC, or DOCX files are accepted.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("File size must be under 5 MB.");
      return;
    }
    setResumeFile(file);
    setError("");
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const fullApplicantName = [form.applicantName, form.applicantLastName]
      .filter(Boolean)
      .join(" ")
      .trim();

    if (!fullApplicantName) return setError("First name is required.");
    if (!form.applicantEmail.trim()) return setError("Email is required.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.applicantEmail))
      return setError("Enter a valid email address.");
    if (!form.applicantPhone.trim())
      return setError("Mobile number is required.");
    if (!resumeFile) return setError("Please attach your resume.");

    setLoading(true);
    setError("");

    try {
      const fd = new FormData();
      fd.append("applicantName", fullApplicantName);
      fd.append("applicantEmail", form.applicantEmail.trim());
      fd.append("applicantPhone", form.applicantPhone.trim());
      if (form.gender) fd.append("gender", form.gender);
      if (form.location) fd.append("location", form.location);
      fd.append("coverLetter", form.coverLetter.trim());
      fd.append("resume", resumeFile);

      const res = await fetch(`${API_BASE}/applications/${job._id}/direct-apply`, {
        method: "POST",
        credentials: "include",
        body: fd,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Submission failed.");

      setSubmitted(true);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /* ── Success screen ─────────────────────────────────────────────────────── */
  if (submitted) {
    return (
      <div className="af-page">
        <div className="af-header">
          <button className="af-back" onClick={onBack} aria-label="Back">
            <ArrowLeft size={16} /> Back to Listings
          </button>
        </div>
        <div className="af-success">
          <div className="af-success__icon">
            <CheckCircle2 size={40} />
          </div>
          <h2 className="af-success__title">Application Submitted!</h2>
          <p className="af-success__text">
            Your application for <strong>{job.jobTitle}</strong> at{" "}
            <strong>{company}</strong> has been received. The hiring team will
            reach out to you directly.
          </p>
          <button className="af-btn af-btn--primary" onClick={onBack}>
            Back to Jobs
          </button>
        </div>
      </div>
    );
  }

  /* ── Form screen ────────────────────────────────────────────────────────── */
  return (
    <div className="af-page">

      {/* ── Top Header Bar (breadcrumb-style) ─────────────────────────────── */}
      <div className="af-header">
        <button className="af-back" onClick={onBack} aria-label="Back">
          <ArrowLeft size={16} />
        </button>
        <div className="af-header__logo">🏢</div>
        <div className="af-header__job">
          <p className="af-header__title">{job.jobTitle}</p>
          <p className="af-header__company">{company}</p>
        </div>
      </div>

      {/* ── Scrollable Body ─────────────────────────────────────────────────── */}
      <div className="af-body">
        <div className="af-card">

          <h2 className="af-card__heading">Application Form</h2>

          {autofilledFromDashboard && (
            <div className="af-autofill-banner" role="status">
              <div className="af-autofill-banner__left">
                <Sparkles size={16} className="af-autofill-banner__icon" />
                <span>
                  <strong>Auto-filled from Dashboard:</strong> Your candidate profile information was automatically loaded.
                </span>
              </div>
              <button
                type="button"
                className="af-autofill-banner__clear"
                onClick={handleClearToManual}
                title="Clear all fields to fill manually"
              >
                Clear to Fill Manually
              </button>
            </div>
          )}

          {error && (
            <div className="af-error">
              <X size={14} /> {error}
            </div>
          )}

          <form className="af-form" onSubmit={handleSubmit} noValidate>

            {/* ── Basic Details ─────────────────────────────────────────────── */}
            <p className="af-section-title">Basic Details</p>

            {/* First Name + Last Name */}
            <div className="af-row">
              <div className="af-field">
                <label className="af-label" htmlFor="af-fname">
                  First Name<sup>*</sup>
                </label>
                <input
                  id="af-fname"
                  className="af-input"
                  type="text"
                  name="applicantName"
                  value={form.applicantName}
                  onChange={handleChange}
                  autoComplete="given-name"
                />
              </div>
              <div className="af-field">
                <label className="af-label" htmlFor="af-lname">
                  Last Name <span className="af-optional">(if applicable)</span>
                </label>
                <input
                  id="af-lname"
                  className="af-input"
                  type="text"
                  name="applicantLastName"
                  value={form.applicantLastName || ""}
                  onChange={handleChange}
                  autoComplete="family-name"
                />
              </div>
            </div>

            {/* Email + Mobile */}
            <div className="af-row">
              <div className="af-field">
                <label className="af-label" htmlFor="af-email">
                  Email<sup>*</sup>
                </label>
                <input
                  id="af-email"
                  className="af-input"
                  type="email"
                  name="applicantEmail"
                  value={form.applicantEmail}
                  onChange={handleChange}
                  autoComplete="email"
                />
              </div>
              <div className="af-field">
                <label className="af-label" htmlFor="af-phone">
                  Mobile<sup>*</sup>
                </label>
                <div className="af-phone-row">
                  <span className="af-phone-prefix">
                    <span className="af-phone-prefix__flag">🇮🇳</span>
                    +91 ▾
                  </span>
                  <input
                    id="af-phone"
                    className="af-phone-input"
                    type="tel"
                    name="applicantPhone"
                    value={form.applicantPhone}
                    onChange={handleChange}
                    autoComplete="tel"
                  />
                </div>
              </div>
            </div>

            {/* Gender */}
            <div className="af-field">
              <label className="af-label">Gender<sup>*</sup></label>
              <div className="af-gender-pills">
                {GENDER_OPTIONS.map((g) => (
                  <button
                    key={g.label}
                    type="button"
                    className={`af-gender-pill${form.gender === g.label ? " af-gender-pill--active" : ""}`}
                    onClick={() => setForm((p) => ({ ...p, gender: p.gender === g.label ? "" : g.label }))}
                  >
                    <span className="af-gender-pill__icon">{g.icon}</span>
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Location */}
            <div className="af-field">
              <label className="af-label" htmlFor="af-location">
                Location<sup>*</sup>
              </label>
              <div className="af-location-wrap">
                <input
                  id="af-location"
                  className="af-input"
                  type="text"
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  autoComplete="address-level2"
                />
                <span className="af-location-icon">
                  <MapPin size={16} />
                </span>
              </div>
            </div>

            {/* Resume */}
            <div className="af-field">
              <label className="af-label">Resume *</label>
              <div
                className={`af-dropzone ${dragOver ? "af-dropzone--over" : ""} ${resumeFile ? "af-dropzone--filled" : ""}`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
                aria-label="Upload resume"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  style={{ display: "none" }}
                  onChange={(e) => handleFile(e.target.files[0])}
                />
                {resumeFile ? (
                  <div className="af-dropzone__file">
                    <CheckCircle2 size={18} className="af-dropzone__ok" />
                    <span>{resumeFile.name}</span>
                    <button
                      type="button"
                      className="af-dropzone__remove"
                      onClick={(e) => { e.stopPropagation(); setResumeFile(null); }}
                      aria-label="Remove file"
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
                    <p className="af-dropzone__hint">PDF, DOC, DOCX · Max 5 MB</p>
                  </>
                )}
              </div>
            </div>

            {/* Cover Letter */}
            <div className="af-field">
              <label className="af-label" htmlFor="af-cover">
                Cover Letter <span className="af-optional">(optional)</span>
              </label>
              <textarea
                id="af-cover"
                className="af-textarea"
                name="coverLetter"
                value={form.coverLetter}
                onChange={handleChange}
                placeholder="Tell the hiring team why you're a great fit…"
                rows={4}
              />
            </div>

          </form>
        </div>
      </div>

      {/* ── Sticky Footer ──────────────────────────────────────────────────── */}
      <div className="af-footer">
        <button className="af-footer__close" type="button" onClick={onBack}>
          Close
        </button>
        <button
          className="af-btn af-btn--primary"
          type="submit"
          disabled={loading}
          onClick={handleSubmit}
        >
          {loading ? "Submitting…" : "Next"}
        </button>
      </div>

    </div>
  );
}
