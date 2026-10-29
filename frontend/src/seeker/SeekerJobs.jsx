import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthModal } from "../context/AuthModalContext";
import { api } from "../services/api";
import TalentBridgeLogo from "../components/TalentBridgeLogo/TalentBridgeLogo";
import SearchBar from "./SearchBar";
import ViewJobPage from "../pages/recruiter/ViewJobPage";
import ApplyForm from "./ApplyForm";
import CreateDashboardForm from "./CreateDashboardForm";
import SeekerNavbar from "./SeekerNavbar";
import {
  MapPin,
  Clock,
  CheckCircle,
  LayoutGrid,
  List,
  Sparkles,
  ArrowRight,
  Send,
  X,
  Building,
  CheckCircle2,
  AlertCircle,
  LogIn
} from "lucide-react";
import "./SeekerJobs.css";

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

function getDeadlineLabel(deadline) {
  if (!deadline) return null;
  const now = new Date();
  const d = new Date(deadline);
  const diffDays = Math.ceil((d - now) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return { text: "Registration Closed", closed: true };
  if (diffDays === 0) return { text: "Closes today!", urgent: true };
  if (diffDays <= 3) return { text: `${diffDays} days left`, urgent: true };
  return { text: `${diffDays} days left`, urgent: false };
}

/* ── Precise Category Matchers for Category Chips ─────────────────────────── */
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

function matchJobWithQuery(job, rawQuery) {
  if (!rawQuery || !rawQuery.trim()) return true;

  const q = rawQuery.trim().toLowerCase();

  const title = (job.jobTitle || "").toLowerCase();
  const company = (job.companyName || job.recruiter?.companyName || "").toLowerCase();
  const location = formatLocation(job.acceptableLocations).toLowerCase();
  const skills = Array.isArray(job.requiredSkills) ? job.requiredSkills.join(" ").toLowerCase() : "";
  const tech = Array.isArray(job.techStack) ? job.techStack.join(" ").toLowerCase() : "";
  const desc = (job.description || "").toLowerCase();
  const resp = Array.isArray(job.responsibilities) ? job.responsibilities.join(" ").toLowerCase() : "";
  const reqs = Array.isArray(job.requirements) ? job.requirements.join(" ").toLowerCase() : "";
  const level = (job.level || "").toLowerCase();

  const searchableText = `${title} ${company} ${location} ${skills} ${tech} ${desc} ${resp} ${reqs} ${level}`;

  // 1. If clicked a known category chip, use the precise category matcher
  if (CATEGORY_MATCHERS[q]) {
    return CATEGORY_MATCHERS[q](title, searchableText);
  }

  // 2. Standard user search: all typed words must appear in searchableText
  const tokens = q.split(/[\s\-_]+/).filter((t) => t.length > 0);
  return tokens.every((tok) => searchableText.includes(tok));
}

export default function SeekerJobs() {
  const navigate = useNavigate();
  const { user, logout, openModal } = useAuthModal();

  // State
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all"); // "all" | "remote" | "fulltime" | "internship"
  const [selectedArrangement, setSelectedArrangement] = useState("all");
  const [sortKey, setSortKey] = useState("newest");
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "list"

  // Selected job for full page view
  const [selectedJob, setSelectedJob] = useState(null);

  // Application Modal state
  const [appliedJob, setAppliedJob] = useState(null);
  const [applySuccessModal, setApplySuccessModal] = useState(null);

  // Create Dashboard view state
  const [showCreateDashboard, setShowCreateDashboard] = useState(false);

  // Toast notification for login requirement
  const [toastMessage, setToastMessage] = useState(null);

  /* ── Fetch Jobs from Existing Backend GET API ───────────────────────────── */
  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/jobs");
      const list = res.data?.jobs || [];
      setJobs(list);
    } catch (err) {
      console.error("[SeekerJobs] Fetch error:", err);
      setError(err.message || "Failed to load jobs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Sync search query from URL if navigating from another page (e.g. Dashboard, ResumeBuilder)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const q = params.get("search");
      if (q) setSearchQuery(q);
    } catch {
      // ignore
    }
  }, []);

  /* ── Filtering & Searching ──────────────────────────────────────────────── */
  const filteredJobs = useMemo(() => {
    let result = [...jobs];

    // Exclude Drafts from seeker view
    result = result.filter(
      (j) => (j.status || "").toLowerCase() !== "draft"
    );

    // Intelligent keyword & category matching (jobTitle, techStack, skills, description, etc.)
    if (searchQuery.trim()) {
      result = result.filter((j) => matchJobWithQuery(j, searchQuery));
    }

    // Tabs filter
    if (activeTab === "remote") {
      result = result.filter(
        (j) =>
          (j.jobType || "").toLowerCase() === "remote" ||
          formatLocation(j.acceptableLocations).toLowerCase().includes("remote")
      );
    } else if (activeTab === "fulltime") {
      result = result.filter(
        (j) => (j.employmentType || "").toLowerCase() === "full-time"
      );
    } else if (activeTab === "internship") {
      result = result.filter((j) => {
        const emp = (j.employmentType || "").toLowerCase();
        const lvl = (j.level || "").toLowerCase();
        return (
          emp.includes("intern") ||
          lvl.includes("intern") ||
          lvl.includes("entry") ||
          j.yearsOfExperience === 0
        );
      });
    }

    // Arrangement chip filter
    if (selectedArrangement !== "all") {
      result = result.filter(
        (j) =>
          (j.jobType || "").toLowerCase() === selectedArrangement.toLowerCase()
      );
    }

    // Sorting
    if (sortKey === "newest") {
      result.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    } else if (sortKey === "salary") {
      result.sort((a, b) => (Number(b.salaryMax) || 0) - (Number(a.salaryMax) || 0));
    } else if (sortKey === "closingSoon") {
      result.sort((a, b) => {
        if (!a.applicationDeadline) return 1;
        if (!b.applicationDeadline) return -1;
        return new Date(a.applicationDeadline) - new Date(b.applicationDeadline);
      });
    }

    return result;
  }, [jobs, searchQuery, activeTab, selectedArrangement, sortKey]);

  /* ── User Initials for Avatar ───────────────────────────────────────────── */
  const initials = (user?.name || "Job Seeker")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  /* ── Apply Handler — checks authentication first ──────────────────────────── */
  const handleApply = (job) => {
    if (job.status === "Closed") return;

    if (!user) {
      // 1. Show toast notification
      setToastMessage("Please login first to apply for this job");

      // 2. Open login dialog box shortly after toast
      setTimeout(() => {
        openModal("login", "jobseeker");
      }, 700);

      // Auto dismiss toast after 4s
      setTimeout(() => {
        setToastMessage(null);
      }, 4000);
      return;
    }

    if (user.role === "recruiter") {
      alert("Recruiters cannot apply for jobs. Please log in as a job seeker.");
      return;
    }

    setAppliedJob(job);
  };

  /* ── Render Full Page View if a job is selected for apply ───────────────── */
  if (appliedJob) {
    return <ApplyForm job={appliedJob} onBack={() => setAppliedJob(null)} />;
  }

  /* ── Render Create Dashboard View if triggered ──────────────────────────── */
  if (showCreateDashboard) {
    return (
      <CreateDashboardForm
        onBack={() => setShowCreateDashboard(false)}
        user={user}
      />
    );
  }

  /* ── Render Full Page View if a job is selected ─────────────────────────── */
  if (selectedJob) {
    return (
      <ViewJobPage
        job={selectedJob}
        companyName={selectedJob.companyName || selectedJob.recruiter?.companyName}
        onBack={() => setSelectedJob(null)}
        onApply={(job) => {
          setSelectedJob(null);
          handleApply(job);
        }}
      />
    );
  }

  return (
    <div className="seeker-page">
      {/* ── Toast Notification: Login first to apply ── */}
      {toastMessage && (
        <div className="seeker-toast" role="alert">
          <div className="seeker-toast__content">
            <LogIn size={18} className="seeker-toast__icon" />
            <span className="seeker-toast__text">{toastMessage}</span>
          </div>
          <button
            type="button"
            className="seeker-toast__close"
            onClick={() => setToastMessage(null)}
            aria-label="Dismiss message"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── Top Navbar (Professional Dark Navy matching Recruiter Navbar) ── */}
      <SeekerNavbar
        activeTab={showCreateDashboard ? "dashboard" : "jobs"}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onTabChange={(tab) => {
          if (tab === "dashboard") setShowCreateDashboard(true);
          else if (tab === "jobs") setShowCreateDashboard(false);
        }}
      />

      {/* ── Hero Section ─────────────────────────────────────────────────── */}
      <header className="seeker-hero">
        <div className="seeker-hero__inner">
          <h1 className="seeker-hero__title">
            {filteredJobs.length > 0 ? `${filteredJobs.length}+ Jobs in India` : "Jobs in India"}
          </h1>
          <p className="seeker-hero__subtitle">
            Search &amp; apply for freshers, work from home and entry-level job vacancies in India.
          </p>
          {/* Category chips */}
          <div className="seeker-hero__categories">
            {["Content Writing", "Digital Marketing", "Data Science", "Accounting", "Backend Developer", "Full Stack Developer", "Electronics", "HR", "Sales"].map((cat) => (
              <button
                key={cat}
                className={`seeker-category-chip${cat === searchQuery ? " seeker-category-chip--active" : ""}`}
                onClick={() => {
                  setSearchQuery(cat === searchQuery ? "" : cat);
                  setSelectedArrangement("all");
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ── Sub-bar: filters + sort + view toggle ───────────────────────── */}
      <div className="seeker-subbar">
        <div className="seeker-subbar__inner">
          <div className="seeker-subbar__left">
            <button className="seeker-filter-pill">
              <span>⊟</span> Filters
              {selectedArrangement !== "all" && (
                <span className="seeker-filter-pill__badge">1</span>
              )}
            </button>
            {["Remote", "Hybrid", "On-site"].map((arr) => (
              <button
                key={arr}
                className={`seeker-filter-pill${selectedArrangement.toLowerCase() === arr.toLowerCase() ? " seeker-filter-chip--active" : ""}`}
                onClick={() => setSelectedArrangement(arr)}
              >
                {arr}
              </button>
            ))}
            <button className="seeker-filter-pill">Location</button>
            <button className="seeker-filter-pill">Roles</button>
            <select
              className="seeker-sort-select"
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value)}
            >
              <option value="newest">↑↓ Sort By: Newest</option>
              <option value="salary">↑↓ Sort By: Salary</option>
              <option value="closingSoon">↑↓ Sort By: Closing Soon</option>
            </select>
          </div>
          <div className="seeker-subbar__right">
            <div className="seeker-view-toggle">
              <button
                className={`seeker-view-btn ${viewMode === "grid" ? "seeker-view-btn--active" : ""}`}
                onClick={() => setViewMode("grid")}
                aria-label="Grid view"
              >
                <LayoutGrid size={15} />
              </button>
              <button
                className={`seeker-view-btn ${viewMode === "list" ? "seeker-view-btn--active" : ""}`}
                onClick={() => setViewMode("list")}
                aria-label="List view"
              >
                <List size={15} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Canvas ──────────────────────────────────────────────────── */}
      <main className="seeker-main">
        <div className="seeker-main__listings">

          {/* Loading State */}
          {loading && (
            <div className="seeker-loading">
              <p>Loading published opportunities…</p>
            </div>
          )}

          {/* Error State */}
          {!loading && error && (
            <div className="seeker-empty">
              <div className="seeker-empty__icon">
                <AlertCircle size={28} />
              </div>
              <h3 className="seeker-empty__title">Unable to Load Jobs</h3>
              <p className="seeker-empty__text">{error}</p>
              <button className="seeker-empty__btn" onClick={fetchJobs}>
                Try Again
              </button>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && filteredJobs.length === 0 && (
            <div className="seeker-empty">
              <div className="seeker-empty__icon">

              </div>
              <h3 className="seeker-empty__title">No Jobs Found</h3>
              <p className="seeker-empty__text">
                {searchQuery
                  ? `No opportunities match your search "${searchQuery}". Try adjusting your keywords or filters.`
                  : "There are currently no active job openings in this category. Check back soon!"}
              </p>
              {(searchQuery || selectedArrangement !== "all" || activeTab !== "all") && (
                <button
                  className="seeker-empty__btn"
                  onClick={() => {
                    setSearchQuery("");
                    setActiveTab("all");
                    setSelectedArrangement("all");
                  }}
                >
                  Reset All Filters
                </button>
              )}
            </div>
          )}

          {/* Jobs List / Grid */}
          {!loading && !error && filteredJobs.length > 0 && (
            <div className={viewMode === "grid" ? "seeker-grid" : "seeker-list"}>
              {filteredJobs.map((job) => {
                const company =
                  job.companyName ||
                  job.recruiter?.companyName ||
                  "";
                const loc = formatLocation(job.acceptableLocations);
                const salary = formatSalary(job);
                const deadline = getDeadlineLabel(job.applicationDeadline);
                const isClosed = job.status === "Closed" || deadline?.closed;

                return (
                  <article
                    key={job._id}
                    className="seeker-card"
                    id={`seeker-job-${job._id}`}
                  >
                    {/* Top info */}
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

                      {/* Tags */}
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
                        {job.requiredSkills?.slice(0, 2).map((skill, i) => (
                          <span key={i} className="seeker-tag">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="seeker-card__footer">
                      <div className="seeker-card__salary">
                        <span className="seeker-card__salary-label">Compensation</span>
                        <span className="seeker-card__salary-value">{salary}</span>
                      </div>

                      <div className="seeker-card__actions">
                        <button
                          className="seeker-card__btn seeker-card__btn--view"
                          onClick={() => setSelectedJob(job)}
                          id={`btn-view-${job._id}`}
                        >
                          View Details
                        </button>

                        {isClosed ? (
                          <button
                            className="seeker-card__btn seeker-card__btn--closed"
                            disabled
                          >
                            Closed
                          </button>
                        ) : (
                          <button
                            className="seeker-card__btn seeker-card__btn--apply"
                            onClick={() => handleApply(job)}
                            id={`btn-apply-${job._id}`}
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
        </div>{/* end seeker-main__listings */}
      </main>

    </div>
  );
}
