import React from "react";
import TalentBridgeLogo from "../../components/TalentBridgeLogo/TalentBridgeLogo";
import {
  ArrowLeft,
  MapPin,
  Pencil,
  CheckCircle2,
  XCircle,
  Briefcase,
  Calendar,
  Building,
  Users,
  DollarSign
} from "lucide-react";
import "./recruiter.css";

/**
 * Format date into "DD Mon YY, hh:mm A IST"
 */
function formatTimelineDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;

  const day = String(d.getDate()).padStart(2, "0");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const mon = months[d.getMonth()];
  const yy = String(d.getFullYear()).slice(-2);

  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;

  return `${day} ${mon} ${yy}, ${hours}:${minutes} ${ampm} IST`;
}

/**
 * Extract { month, day } for the calendar date pill icon
 */
function getCalendarBadgeParts(dateStr) {
  const d = dateStr ? new Date(dateStr) : new Date();
  const valid = !isNaN(d.getTime());
  const actualDate = valid ? d : new Date();
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return {
    month: months[actualDate.getMonth()],
    day: actualDate.getDate(),
  };
}

/**
 * Format salary display
 */
function formatSalary(job) {
  const min = job.salaryMin;
  const max = job.salaryMax;
  const curr = job.currency || "INR";
  if (min !== undefined && min !== null && max !== undefined && max !== null) {
    return `${curr} ${Number(min).toLocaleString()} - ${Number(max).toLocaleString()}`;
  }
  if (min !== undefined && min !== null) {
    return `${curr} ${Number(min).toLocaleString()}+`;
  }
  if (max !== undefined && max !== null) {
    return `Up to ${curr} ${Number(max).toLocaleString()}`;
  }
  return null;
}

/**
 * ViewJobPage
 * A full-fledged page displaying complete job vacancy details.
 * Contains the paperplane TalentBridge logo, a clean hero area,
 * divider line, and sections with a vertical blue accent bar (|).
 * Zero AI-coated elements, strictly minimalist, and NO Quick Apply button.
 */
export default function ViewJobPage({
  job,
  companyName,
  onBack,
  onEdit,
  onToggleStatus,
  onApply,
}) {
  if (!job) {
    return (
      <div className="view-job-page">
        <div className="view-job-page__not-found">
          <h2>Job Not Found</h2>
          <p>The requested job posting could not be found or has been removed.</p>
          <button className="view-job-page__back-btn" onClick={onBack}>
            <ArrowLeft size={16} /> Back to All Jobs
          </button>
        </div>
      </div>
    );
  }

  const location = Array.isArray(job.acceptableLocations)
    ? job.acceptableLocations.join(", ")
    : job.acceptableLocations || "";

  const postedFormatted = formatTimelineDate(job.createdAt) || "Recently Posted";
  const deadlineFormatted = job.applicationDeadline
    ? formatTimelineDate(job.applicationDeadline)
    : "Open until filled";

  const { month: dateMonth, day: dateDay } = getCalendarBadgeParts(job.createdAt);
  const salary = formatSalary(job);
  const isClosed = job.status === "Closed";
  const isDraft = job.status === "Draft";

  return (
    <div className="view-job-page">
      {/* ── Top Navigation Bar ── */}
      <header className="view-job-page__navbar">
        <div className="view-job-page__navbar-inner">
          <div className="view-job-page__navbar-left">
            <button
              className="view-job-page__back-btn"
              onClick={onBack}
              id="view-job-back-btn"
            >
              <ArrowLeft size={18} />
              <span>Back to Jobs</span>
            </button>
            <span className="view-job-page__breadcrumb-sep">/</span>
            <span className="view-job-page__breadcrumb-current">Job Details</span>
          </div>

          <div className="view-job-page__navbar-actions">
            {/* Toggle Status: Close / Reopen Registration */}
            {onToggleStatus && (
              <button
                className={`view-job-action-btn ${
                  isClosed
                    ? "view-job-action-btn--reopen"
                    : "view-job-action-btn--close"
                }`}
                onClick={() => onToggleStatus(job)}
                id="view-job-toggle-status-btn"
              >
                {isClosed ? (
                  <>
                    <CheckCircle2 size={16} /> Reopen Registration
                  </>
                ) : (
                  <>
                    <XCircle size={16} /> Close Registration
                  </>
                )}
              </button>
            )}

            {/* Edit Job Button */}
            {onEdit && (
              <button
                className="view-job-action-btn view-job-action-btn--edit"
                onClick={() => onEdit(job)}
                id="view-job-edit-btn"
              >
                <Pencil size={16} />
                <span>Edit Role</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ── Main Full Page Canvas ── */}
      <main className="view-job-page__container">
        <div className="view-job-page__layout">
          {/* Left: main detail card */}
          <div className="view-job-page__main">
          <div className="view-job-page__card" id="view-job-main-card">
          {/* ── Hero Area: Title, Company, Location + Right Big TalentBridge Logo Card ── */}
          <div className="view-job-hero">
            <div className="view-job-hero__main">
              <h1 className="view-job-hero__title">
                {job.jobTitle || "Job Vacancy"}
              </h1>
              <p className="view-job-hero__company">
                {companyName || job.companyName || "Talent Bridge Verified Employer"}
              </p>

              {/* Location Box (Pill Matching Reference Picture) */}
              <div className="view-job-location-box">
                <div className="view-job-location-box__icon">
                  <MapPin size={18} />
                </div>
                <div className="view-job-location-box__info">
                  <span className="view-job-location-box__label">Location</span>
                  <span className="view-job-location-box__val">
                    {location || "Pan India / Remote"}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Big TalentBridge Logo Card (Paperplane logo variant used throughout the project) */}
            <div className="view-job-logo-card">
              <TalentBridgeLogo variant="paperplane" size={54} />
              <span className="view-job-logo-card__brand">TALENT BRIDGE</span>
            </div>
          </div>

          {/* ── Full Width Divider Line ── */}
          <hr className="view-job-divider" />

          {/* ── All Job Information Sections (Minimalist, No AI Coating) ── */}
          <div className="view-job-body">
            {/* 1. Eligibility */}
            <section className="view-job-section" id="section-eligibility">
              <h2 className="view-job-section__heading">
                <span className="view-job-section__bar" />
                Eligibility
              </h2>
              <div className="view-job-section__content">
                <p className="view-job-eligibility-summary">
                  {job.level ? `${job.level}` : "Open to All Experience Levels"}
                  {job.yearsOfExperience !== undefined && job.yearsOfExperience !== null
                    ? ` • ${job.yearsOfExperience === 0 ? "Freshers / Entry Level (0 years exp)" : `${job.yearsOfExperience}+ years of experience`}`
                    : ""}
                  {job.employmentType ? ` • ${job.employmentType}` : ""}
                  {job.jobType ? ` (${job.jobType})` : ""}
                </p>
                {job.requirements?.length > 0 && (
                  <ul className="view-job-bullet-list">
                    {job.requirements.map((req, i) => (
                      <li key={i}>{req}</li>
                    ))}
                  </ul>
                )}
              </div>
            </section>

            {/* 2. Recruitment Process / Timeline (Matching Reference Picture) */}
            <section className="view-job-section" id="section-recruitment-process">
              <h2 className="view-job-section__heading">
                <span className="view-job-section__bar" />
                Recruitment Process
              </h2>
              <div className="view-job-timeline-card">
                <div className="view-job-date-badge">
                  <div className="view-job-date-badge__month">{dateMonth}</div>
                  <div className="view-job-date-badge__day">{dateDay}</div>
                </div>

                <div className="view-job-timeline-card__main">
                  <div className="view-job-timeline-meta">
                    <span className="view-job-timeline-range">
                      {postedFormatted} → {deadlineFormatted}
                    </span>
                    <span
                      className={`view-job-status-tag view-job-status-tag--${job.status?.toLowerCase() || "open"}`}
                    >
                      {isClosed
                        ? "Registration Closed"
                        : isDraft
                        ? "Draft Mode"
                        : "Registration Open"}
                    </span>
                  </div>

                  <div className="view-job-timeline-inner-box">
                    <h4 className="view-job-timeline-inner-title">Registration</h4>
                    <p className="view-job-timeline-inner-sub">
                      {isClosed
                        ? "Candidate registration for this selection process is currently closed."
                        : "Register for the candidate evaluation and selection process."}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* 3. About the Job */}
            {job.description && (
              <section className="view-job-section" id="section-about-job">
                <h2 className="view-job-section__heading">
                  <span className="view-job-section__bar" />
                  About the Job
                </h2>
                <div className="view-job-prose">
                  <p>{job.description}</p>
                </div>
              </section>
            )}

            {/* 4. Key Responsibilities */}
            {job.responsibilities?.length > 0 && (
              <section className="view-job-section" id="section-responsibilities">
                <h2 className="view-job-section__heading">
                  <span className="view-job-section__bar" />
                  Key Responsibilities
                </h2>
                <ul className="view-job-bullet-list">
                  {job.responsibilities.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </section>
            )}

            {/* 5. Required Skills & Tech Stack (Zero AI Coating, Clean minimalist tags) */}
            {((job.requiredSkills && job.requiredSkills.length > 0) ||
              (job.techStack && job.techStack.length > 0)) && (
              <section className="view-job-section" id="section-skills">
                <h2 className="view-job-section__heading">
                  <span className="view-job-section__bar" />
                  Skills & Competencies
                </h2>
                <div className="view-job-tags-row">
                  {job.requiredSkills?.map((skill, i) => (
                    <span key={`sk-${i}`} className="view-job-chip view-job-chip--skill">
                      {skill}
                    </span>
                  ))}
                  {job.techStack?.map((tech, i) => (
                    <span key={`ts-${i}`} className="view-job-chip view-job-chip--tech">
                      {tech}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* 6. Overview & Compensation */}
            <section className="view-job-section" id="section-compensation">
              <h2 className="view-job-section__heading">
                <span className="view-job-section__bar" />
                Job Overview & Compensation
              </h2>
              <div className="view-job-overview-grid">
                <div className="view-job-overview-item">
                  <span className="view-job-overview-label">Total Openings</span>
                  <span className="view-job-overview-val">
                    {job.headcount || 1} vacancy / vacancies
                  </span>
                </div>
                <div className="view-job-overview-item">
                  <span className="view-job-overview-label">Salary Package</span>
                  <span className="view-job-overview-val">
                    {salary || "Competitive / Undisclosed"}
                  </span>
                </div>
                <div className="view-job-overview-item">
                  <span className="view-job-overview-label">Employment Type</span>
                  <span className="view-job-overview-val">
                    {job.employmentType || "Full-time"}
                  </span>
                </div>
                <div className="view-job-overview-item">
                  <span className="view-job-overview-label">Work Arrangement</span>
                  <span className="view-job-overview-val">
                    {job.jobType || "Remote"}
                  </span>
                </div>
              </div>
            </section>
          </div>
          </div>{/* end view-job-page__card */}
          </div>{/* end view-job-page__main */}

          {/* Right: sticky Apply Now card */}
          {onApply && (
            <aside className="view-job-apply-sidebar">
              <div className="view-job-apply-card">
                <div className="view-job-apply-card__logo">
                  <TalentBridgeLogo variant="paperplane" size={36} />
                </div>
                <h3 className="view-job-apply-card__title">{job.jobTitle}</h3>
                <p className="view-job-apply-card__company">
                  {companyName || job.companyName || "Talent Bridge"}
                </p>

                <div className="view-job-apply-card__meta">
                  {salary && (
                    <div className="view-job-apply-card__meta-row">
                      <DollarSign size={14} />
                      <span>{salary}</span>
                    </div>
                  )}
                  {job.employmentType && (
                    <div className="view-job-apply-card__meta-row">
                      <Briefcase size={14} />
                      <span>{job.employmentType}{job.jobType ? ` · ${job.jobType}` : ""}</span>
                    </div>
                  )}
                  {location && (
                    <div className="view-job-apply-card__meta-row">
                      <MapPin size={14} />
                      <span>{location}</span>
                    </div>
                  )}
                  {job.applicationDeadline && (
                    <div className="view-job-apply-card__meta-row">
                      <Calendar size={14} />
                      <span>Deadline: {deadlineFormatted}</span>
                    </div>
                  )}
                </div>

                {isClosed ? (
                  <button className="view-job-apply-card__btn view-job-apply-card__btn--closed" disabled>
                    Registration Closed
                  </button>
                ) : (
                  <button
                    className="view-job-apply-card__btn"
                    onClick={() => onApply(job)}
                    id="view-job-apply-now-btn"
                  >
                    Apply Now
                  </button>
                )}

                <p className="view-job-apply-card__note">
                  Your application goes directly to the hiring team.
                </p>
              </div>
            </aside>
          )}
        </div>{/* end view-job-page__layout */}
      </main>
    </div>
  );
}
