import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  Users,
  Search,
  FileText,
  LayoutDashboard,
  Send,
  Building,
  MapPin,
  AlertCircle,
  LogIn,
  UserPlus,
  X,
  Briefcase,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import TalentBridgeLogo from "../TalentBridgeLogo/TalentBridgeLogo";
import heroImg from "./hero.png";
import SearchBar from "../../seeker/SearchBar";
import { useAuthModal } from "../../context/AuthModalContext";
import { api } from "../../services/api";
import "./HeroSection.css";
import "../../seeker/SeekerJobs.css";

/* ── Fallback Demo Published Jobs ────────────────────────────────────────── */
const FALLBACK_JOBS = [
  {
    _id: "hero-job-1",
    jobTitle: "Senior Full Stack Developer",
    companyName: "Nexus Cloud Systems",
    acceptableLocations: ["Bangalore", "Remote"],
    employmentType: "Full-time",
    jobType: "Remote",
    level: "Senior",
    yearsOfExperience: 3,
    salaryMin: 1200000,
    salaryMax: 2200000,
    currency: "INR",
    requiredSkills: ["React", "Node.js", "MongoDB", "TypeScript"],
    description: "Build robust cloud microservices and responsive user interfaces using modern web frameworks.",
    status: "Published",
  },
  {
    _id: "hero-job-2",
    jobTitle: "Frontend React Engineer",
    companyName: "Apex Digital Solutions",
    acceptableLocations: ["Hyderabad", "Remote"],
    employmentType: "Full-time",
    jobType: "Hybrid",
    level: "Mid-Level",
    yearsOfExperience: 2,
    salaryMin: 800000,
    salaryMax: 1500000,
    currency: "INR",
    requiredSkills: ["React", "JavaScript", "CSS3", "Redux"],
    description: "Design pixel-perfect interfaces and seamless web workflows for high-growth tech platforms.",
    status: "Published",
  },
  {
    _id: "hero-job-3",
    jobTitle: "Backend Node.js & API Developer",
    companyName: "DataPulse Analytics",
    acceptableLocations: ["Pune", "Remote"],
    employmentType: "Full-time",
    jobType: "Remote",
    level: "Mid-Level",
    yearsOfExperience: 2,
    salaryMin: 900000,
    salaryMax: 1600000,
    currency: "INR",
    requiredSkills: ["Node.js", "Express", "PostgreSQL", "REST APIs"],
    description: "Architect high-performance distributed backend services, authentication mechanisms, and databases.",
    status: "Published",
  },
  {
    _id: "hero-job-4",
    jobTitle: "Data Science & Machine Learning Specialist",
    companyName: "Cognitive AI Labs",
    acceptableLocations: ["Remote / Pan India"],
    employmentType: "Full-time",
    jobType: "Remote",
    level: "Senior",
    yearsOfExperience: 3,
    salaryMin: 1400000,
    salaryMax: 2600000,
    currency: "INR",
    requiredSkills: ["Python", "Machine Learning", "PyTorch", "NLP"],
    description: "Develop cutting-edge predictive models and machine learning pipelines for enterprise applications.",
    status: "Published",
  },
];

/* ── Precise Category Matchers for Category Chips (Identical to Seeker Jobs) ── */
const CATEGORY_MATCHERS = {
  "full stack developer": (title, text) =>
    /full[\s\-_]*stack/i.test(title) || /full[\s\-_]*stack/i.test(text) || /mern|mean/i.test(title),
  "backend developer": (title, text) =>
    !/full[\s\-_]*stack/i.test(title) && (/back[\s\-_]*end/i.test(title) || /back[\s\-_]*end/i.test(text)),
  "data science": (title, text) =>
    /data\s+scien|machine\s+learning|deep\s+learning|data\s+analyst|data\s+analytics|data\s+engineer/i.test(title) ||
    /data\s+scien|machine\s+learning/i.test(text),
  "content writing": (title, text) =>
    /content\s+writ|content\s+creator|copywrit|technical\s+writer/i.test(title) || /content\s+writ|copywrit/i.test(text),
  "digital marketing": (title, text) =>
    /digital\s+marketing|social\s+media\s+marketing|growth\s+marketing|seo\s+specialist/i.test(title) || /digital\s+marketing/i.test(text),
  "accounting": (title, text) =>
    /\b(accountant|accounting|accounts|finance\s+manager|auditor|taxation|bookkeeper|cpa)\b/i.test(title) ||
    /\b(accountant|accounting|accounts\s+payable|accounts\s+receivable|bookkeeping)\b/i.test(text),
  "hr": (title, text) =>
    /\b(hr|human\s+resources|recruiter|recruitment|talent\s+acquisition)\b/i.test(title),
  "sales": (title, text) =>
    /\b(sales|business\s+development|bde|bda|inside\s+sales|account\s+executive|telecaller)\b/i.test(title),
  "electronics": (title, text) =>
    /\b(electronic|electronics|embedded|vlsi|pcb|hardware\s+engineer|semiconductor)\b/i.test(title),
};

/* ── Helpers ───────────────────────────────────────────────────────────────── */
function formatLocation(loc) {
  if (!loc) return "Remote / Pan India";
  if (Array.isArray(loc)) {
    return loc.length > 0 ? loc.join(", ") : "Remote / Pan India";
  }
  return loc;
}

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
  return "Competitive";
}

function matchJobWithQuery(job, rawQuery) {
  if (!rawQuery || !rawQuery.trim()) return true;
  const q = rawQuery.trim().toLowerCase();
  const title = (job.jobTitle || "").toLowerCase();
  const company = (job.companyName || job.recruiter?.companyName || "").toLowerCase();
  const location = formatLocation(job.acceptableLocations).toLowerCase();
  const skills = Array.isArray(job.requiredSkills) ? job.requiredSkills.join(" ").toLowerCase() : "";
  const tech = Array.isArray(job.techStack) ? job.techStack.join(" ").toLowerCase() : "";
  const desc = (job.description || "").toLowerCase();
  const searchableText = `${title} ${company} ${location} ${skills} ${tech} ${desc}`;

  if (CATEGORY_MATCHERS[q]) {
    return CATEGORY_MATCHERS[q](title, searchableText);
  }

  const tokens = q.split(/[\s\-_]+/).filter((t) => t.length > 0);
  return tokens.every((tok) => searchableText.includes(tok));
}

function HeroSection() {
  const navigate = useNavigate();
  const { user, openModal } = useAuthModal();

  // Search state
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedArrangement, setSelectedArrangement] = useState("all");
  const [jobs, setJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [hasFetchedJobs, setHasFetchedJobs] = useState(false);

  // Dialog and Modal states
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [selectedJobForApply, setSelectedJobForApply] = useState(null);
  const [viewingJob, setViewingJob] = useState(null);

  const searchSectionRef = useRef(null);

  // Fetch jobs when search is toggled open
  const fetchPublishedJobs = useCallback(async () => {
    if (hasFetchedJobs) return;
    setLoadingJobs(true);
    try {
      const res = await api.get("/jobs");
      const list = res.data?.jobs || res.data || [];
      const published = Array.isArray(list)
        ? list.filter((j) => (j.status || "").toLowerCase() !== "draft")
        : [];
      setJobs(published.length > 0 ? published : FALLBACK_JOBS);
    } catch {
      setJobs(FALLBACK_JOBS);
    } finally {
      setLoadingJobs(false);
      setHasFetchedJobs(true);
    }
  }, [hasFetchedJobs]);

  const handleSearchClick = () => {
    setShowSearchBar((prev) => {
      const nextState = !prev;
      if (nextState) {
        fetchPublishedJobs();
        setTimeout(() => {
          searchSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
          const inputEl = document.getElementById("hero-seeker-search-input");
          inputEl?.focus();
        }, 120);
      }
      return nextState;
    });
  };

  const handleBuildResumeClick = () => {
    if (user && (user.role === "jobseeker" || user.role === "seeker")) {
      navigate("/seeker/jobs");
    } else {
      openModal("signup", "jobseeker");
    }
  };

  const handleDashboardClick = () => {
    if (user && user.role === "recruiter") {
      navigate("/recruiter");
    } else if (user && (user.role === "jobseeker" || user.role === "seeker")) {
      navigate("/seeker/jobs");
    } else {
      openModal("role");
    }
  };

  // Handle Apply button click
  const handleApplyClick = (job) => {
    if (!user) {
      setSelectedJobForApply(job);
      setShowLoginDialog(true);
    } else if (user.role === "recruiter") {
      alert("Recruiters cannot apply for jobs. Please log in as a job seeker.");
    } else {
      navigate("/seeker/jobs");
    }
  };

  // Filter jobs based on search query, category chips, and arrangement
  const filteredJobs = useMemo(() => {
    let source = jobs.length > 0 ? jobs : FALLBACK_JOBS;
    // Exclude drafts
    source = source.filter((j) => (j.status || "").toLowerCase() !== "draft");

    // Search query
    if (searchQuery.trim()) {
      source = source.filter((j) => matchJobWithQuery(j, searchQuery));
    }

    // Category filter
    if (selectedCategory) {
      source = source.filter((j) => matchJobWithQuery(j, selectedCategory));
    }

    // Work Mode / Job Type
    if (selectedArrangement !== "all") {
      source = source.filter(
        (j) => (j.jobType || "").toLowerCase() === selectedArrangement.toLowerCase()
      );
    }

    return source;
  }, [jobs, searchQuery, selectedCategory, selectedArrangement]);

  return (
    <section className="hero">
      <div className="hero__dots" aria-hidden="true" />

      <div className="hero__content">
        <div className="hero__brand">
          <TalentBridgeLogo variant="paperplane" className="hero__logo" />
          <h1 className="hero__title">TALENT BRIDGE</h1>
        </div>

        <p className="hero__subtitle">
          Find Jobs. Build Career. Shape Your Future.
        </p>

        {/* Quick Action Circular Buttons */}
        <div className="hero__circular-actions" role="group" aria-label="Hero Quick Actions">
          <div
            className="hero__circular-item"
            onClick={handleSearchClick}
          >
            <button
              type="button"
              className={`hero__circular-btn hero__circular-btn--search ${showSearchBar ? "hero__circular-btn--active" : ""}`}
              id="hero-circle-btn-search"
              onClick={(e) => {
                e.stopPropagation();
                handleSearchClick();
              }}
              aria-label="Search"
              title="Search"
            >
              <Search className="hero__circular-icon" size={22} strokeWidth={2.2} />
              <span className="sr-only">Search</span>
            </button>
            <span className="hero__circular-label">Search</span>
          </div>

          <div
            className="hero__circular-item"
            onClick={handleBuildResumeClick}
          >
            <button
              type="button"
              className="hero__circular-btn hero__circular-btn--resume"
              id="hero-circle-btn-resume"
              onClick={(e) => {
                e.stopPropagation();
                handleBuildResumeClick();
              }}
              aria-label="Build Resume"
              title="Build Resume"
            >
              <FileText className="hero__circular-icon" size={22} strokeWidth={2.2} />
              <span className="sr-only">Build Resume</span>
            </button>
            <span className="hero__circular-label">Build Resume</span>
          </div>

          <div
            className="hero__circular-item"
            onClick={handleDashboardClick}
          >
            <button
              type="button"
              className="hero__circular-btn hero__circular-btn--dashboard"
              id="hero-circle-btn-dashboard"
              onClick={(e) => {
                e.stopPropagation();
                handleDashboardClick();
              }}
              aria-label="Create Dashboard"
              title="Create Dashboard"
            >
              <LayoutDashboard className="hero__circular-icon" size={22} strokeWidth={2.2} />
              <span className="sr-only">Create Dashboard</span>
            </button>
            <span className="hero__circular-label">Create Dashboard</span>
          </div>
        </div>

        {/* ── Search Bar Section (Appears when Search button is clicked) ── */}
        {showSearchBar && (
          <div className="hero__search-section" ref={searchSectionRef}>
            {/* Top Prompt Banner: First login then search for job */}
            {!user && (
              <div className="hero__search-banner">
                <div className="hero__search-banner-info">
                  <LogIn size={20} className="hero__search-banner-icon" />
                  <div>
                    <strong className="hero__search-banner-title">
                      First login then search for job
                    </strong>
                    <p className="hero__search-banner-sub">
                      Sign in to apply directly to all openings, track your applications, and receive interview invitations.
                    </p>
                  </div>
                </div>
                <div className="hero__search-banner-actions">
                  <button
                    type="button"
                    className="hero__search-banner-btn hero__search-banner-btn--login"
                    id="hero-banner-login-btn"
                    onClick={() => {
                      setSelectedJobForApply(null);
                      setShowLoginDialog(true);
                    }}
                  >
                    <LogIn size={15} /> Log In
                  </button>
                  <button
                    type="button"
                    className="hero__search-banner-btn hero__search-banner-btn--register"
                    id="hero-banner-signup-btn"
                    onClick={() => openModal("signup", "jobseeker")}
                  >
                    <UserPlus size={15} /> Sign Up
                  </button>
                </div>
              </div>
            )}

            {/* Header: SearchBar + Close Button */}
            <div className="hero__search-bar-header">
              <div className="hero__search-bar-wrap">
                <SearchBar
                  value={searchQuery}
                  onChange={(val) => {
                    setSearchQuery(val);
                    if (selectedCategory && val !== selectedCategory) {
                      setSelectedCategory("");
                    }
                  }}
                  placeholder="Search jobs by title, skills, or location…"
                  id="hero-seeker-search-input"
                />
              </div>
              <button
                type="button"
                className="hero__search-close-btn"
                onClick={() => setShowSearchBar(false)}
                title="Close Search Bar"
              >
                <X size={16} />
                <span>Close</span>
              </button>
            </div>

            {/* Category Chips (Identical to Seeker Jobs) */}
            <div className="hero__search-categories">
              {["Content Writing", "Digital Marketing", "Data Science", "Accounting", "Backend Developer", "Full Stack Developer", "Electronics", "HR", "Sales"].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`seeker-category-chip${selectedCategory === cat ? " seeker-category-chip--active" : ""}`}
                  onClick={() => {
                    setSelectedCategory((prev) => (prev === cat ? "" : cat));
                    setSelectedArrangement("all");
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Filter Sub-bar: Modes & Count */}
            <div className="hero__search-subbar">
              <div className="hero__search-workmodes">
                {["all", "Remote", "Hybrid", "On-site"].map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    className={`seeker-filter-pill${selectedArrangement.toLowerCase() === mode.toLowerCase() ? " seeker-filter-chip--active" : ""}`}
                    onClick={() => setSelectedArrangement(mode)}
                  >
                    {mode === "all" ? "All Modes" : mode}
                  </button>
                ))}
              </div>

              <div className="hero__search-status" style={{ margin: 0 }}>
                <span className="hero__search-count">
                  {filteredJobs.length} {filteredJobs.length === 1 ? "opportunity" : "opportunities"} found
                </span>
                {(searchQuery || selectedCategory) && (
                  <span className="hero__search-query-tag">
                    Matching &ldquo;{selectedCategory || searchQuery}&rdquo;
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery("");
                        setSelectedCategory("");
                      }}
                      className="hero__search-query-clear"
                      title="Clear filter"
                    >
                      ×
                    </button>
                  </span>
                )}
              </div>
            </div>

            {/* Job Opportunities Display */}
            {loadingJobs ? (
              <div className="hero__search-loading">
                <div className="hero__search-spinner" />
                <p>Loading published opportunities…</p>
              </div>
            ) : filteredJobs.length === 0 ? (
              <div className="hero__search-empty">
                <AlertCircle size={32} className="hero__search-empty-icon" />
                <h4 className="hero__search-empty-title">
                  No jobs found matching &ldquo;{selectedCategory || searchQuery}&rdquo;
                </h4>
                <p className="hero__search-empty-text">
                  Try searching for different keywords, skills (React, Node, Python), or reset your query.
                </p>
                <button
                  type="button"
                  className="hero__search-reset-btn"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("");
                    setSelectedArrangement("all");
                  }}
                >
                  View All Opportunities
                </button>
              </div>
            ) : (
              <div className="hero__jobs-grid">
                {filteredJobs.map((job) => {
                  const company =
                    job.companyName ||
                    job.recruiter?.companyName ||
                    "TalentBridge Partner";
                  const loc = formatLocation(job.acceptableLocations);
                  const salary = formatSalary(job);
                  const isClosed = (job.status || "").toLowerCase() === "closed";

                  return (
                    <article
                      key={job._id}
                      className="seeker-card hero__job-card"
                      id={`hero-job-${job._id}`}
                    >
                      {/* Top Info */}
                      <div>
                        <div className="seeker-card__header">
                          <div className="seeker-card__logo">
                            <TalentBridgeLogo variant="paperplane" size={26} />
                          </div>
                          <div className="seeker-card__info">
                            <h3 className="seeker-card__title" title={job.jobTitle}>
                              {job.jobTitle}
                            </h3>
                            <p className="seeker-card__company">
                              <Building size={14} />
                              <span>{company}</span>
                            </p>
                            <p className="seeker-card__location">
                              <MapPin size={13} />
                              <span>{loc}</span>
                            </p>
                          </div>
                        </div>

                        {/* Badges / Tags */}
                        <div className="seeker-card__tags">
                          {job.employmentType && (
                            <span className="seeker-tag seeker-tag--blue">
                              {job.employmentType}
                            </span>
                          )}
                          {job.jobType && (
                            <span className="seeker-tag seeker-tag--green">
                              {job.jobType}
                            </span>
                          )}
                          {job.level && (
                            <span className="seeker-tag">{job.level}</span>
                          )}
                          {job.yearsOfExperience !== undefined && (
                            <span className="seeker-tag">
                              {job.yearsOfExperience === 0
                                ? "Freshers (0 exp)"
                                : `${job.yearsOfExperience}+ yrs exp`}
                            </span>
                          )}
                          {job.requiredSkills?.slice(0, 3).map((skill, i) => (
                            <span key={i} className="seeker-tag">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Footer: Salary & Actions */}
                      <div className="seeker-card__footer">
                        <div className="seeker-card__salary">
                          <span className="seeker-card__salary-label">Compensation</span>
                          <span className="seeker-card__salary-value">{salary}</span>
                        </div>

                        <div className="seeker-card__actions">
                          <button
                            type="button"
                            className="seeker-card__btn seeker-card__btn--view"
                            onClick={() => setViewingJob(job)}
                            id={`hero-view-${job._id}`}
                          >
                            View Details
                          </button>

                          {isClosed ? (
                            <button
                              type="button"
                              className="seeker-card__btn seeker-card__btn--closed"
                              disabled
                            >
                              Closed
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="seeker-card__btn seeker-card__btn--apply"
                              onClick={() => handleApplyClick(job)}
                              id={`hero-apply-${job._id}`}
                            >
                              <Send size={13} /> Apply Now
                            </button>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Hero Mockup Scene Image with Create Account Card */}
        <div className="hero__image-wrapper">
          {/* Left-side Create Account Card */}
          <div className="hero__account-card">
            <div className="account-card__icon-wrap">
              <Users size={28} className="account-card__icon" strokeWidth={2.2} />
            </div>
            <h3 className="account-card__title">
              Join Thousands of Job Seekers Today!
            </h3>
            <button
              type="button"
              className="account-card__btn"
              id="create-account-btn"
              onClick={() => openModal("role")}
            >
              Create Account
            </button>
          </div>

          {/* Laptop Mockup Image */}
          <img
            src={heroImg}
            alt="TalentBridge Platform Laptop Mockup"
            className="hero__mockup-img"
          />
        </div>
      </div>

      {/* ── "First login then search for job" Dialog Box ── */}
      {showLoginDialog && (
        <div
          className="auth-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="login-dialog-heading"
          onClick={() => setShowLoginDialog(false)}
        >
          <div
            className="auth-modal tb-login-dialog-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="auth-modal__close"
              onClick={() => setShowLoginDialog(false)}
              aria-label="Close dialog"
            >
              <X size={18} />
            </button>

            <div className="tb-login-dialog-body">
              <div className="tb-login-dialog-icon-wrap">
                <LogIn size={28} className="tb-login-dialog-icon" />
              </div>

              <h2 id="login-dialog-heading" className="tb-login-dialog-heading">
                First login then search for job
              </h2>

              <p className="tb-login-dialog-message">
                {selectedJobForApply ? (
                  <>
                    To apply for{" "}
                    <strong>
                      {selectedJobForApply.jobTitle}
                    </strong>
                    {selectedJobForApply?.companyName ? ` at ${selectedJobForApply.companyName}` : ""},
                    please log in to your account or create a new account to proceed.
                  </>
                ) : (
                  <>
                    Please log in to your account or create a new account to search, view details, and apply for jobs.
                  </>
                )}
              </p>

              <div className="tb-login-dialog-actions">
                <button
                  type="button"
                  className="tb-login-dialog-btn tb-login-dialog-btn--login"
                  id="login-dialog-btn-login"
                  onClick={() => {
                    setShowLoginDialog(false);
                    openModal("login", "jobseeker");
                  }}
                >
                  <LogIn size={16} />
                  <span>Log In</span>
                </button>

                <button
                  type="button"
                  className="tb-login-dialog-btn tb-login-dialog-btn--create"
                  id="login-dialog-btn-create"
                  onClick={() => {
                    setShowLoginDialog(false);
                    openModal("signup", "jobseeker");
                  }}
                >
                  <UserPlus size={16} />
                  <span>Create Account</span>
                </button>
              </div>

              <button
                type="button"
                className="tb-login-dialog-dismiss"
                onClick={() => setShowLoginDialog(false)}
              >
                Continue browsing jobs
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Job Details Modal ── */}
      {viewingJob && (
        <div
          className="auth-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="job-details-title"
          onClick={() => setViewingJob(null)}
        >
          <div
            className="auth-modal hero__job-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="auth-modal__close"
              onClick={() => setViewingJob(null)}
              aria-label="Close details"
            >
              <X size={18} />
            </button>

            <div className="hero__job-modal-header">
              <div className="seeker-card__logo">
                <TalentBridgeLogo variant="paperplane" size={28} />
              </div>
              <div>
                <h2 id="job-details-title" className="hero__job-modal-title">
                  {viewingJob.jobTitle}
                </h2>
                <p className="seeker-card__company">
                  <Building size={15} />
                  <span>{viewingJob.companyName || viewingJob.recruiter?.companyName || "TalentBridge Partner"}</span>
                </p>
                <p className="seeker-card__location">
                  <MapPin size={14} />
                  <span>{formatLocation(viewingJob.acceptableLocations)}</span>
                </p>
              </div>
            </div>

            <div className="hero__job-modal-meta">
              <span className="seeker-tag seeker-tag--blue">{viewingJob.employmentType || "Full-time"}</span>
              <span className="seeker-tag seeker-tag--green">{viewingJob.jobType || "Remote"}</span>
              {viewingJob.level && <span className="seeker-tag">{viewingJob.level}</span>}
              <span className="seeker-tag">
                {viewingJob.yearsOfExperience === 0
                  ? "Freshers (0 exp)"
                  : `${viewingJob.yearsOfExperience || 1}+ yrs exp`}
              </span>
            </div>

            <div className="hero__job-modal-body">
              <h4>Role Description</h4>
              <p>{viewingJob.description || "Exciting opportunity to build cutting-edge features with high-performing engineering teams."}</p>

              {viewingJob.requiredSkills?.length > 0 && (
                <>
                  <h4>Required Skills</h4>
                  <div className="hero__job-modal-skills">
                    {viewingJob.requiredSkills.map((s, i) => (
                      <span key={i} className="seeker-tag">{s}</span>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="hero__job-modal-footer">
              <div className="seeker-card__salary">
                <span className="seeker-card__salary-label">Compensation</span>
                <span className="seeker-card__salary-value">{formatSalary(viewingJob)}</span>
              </div>
              <button
                type="button"
                className="seeker-card__btn seeker-card__btn--apply"
                onClick={() => {
                  const jobToApply = viewingJob;
                  setViewingJob(null);
                  handleApplyClick(jobToApply);
                }}
              >
                <Send size={14} /> Apply Now
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default HeroSection;

