import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  ArrowLeft,
  Search,
  RefreshCw,
  FileText,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Sparkles,
  ExternalLink,
  Phone,
  Mail,
  Calendar,
  ChevronDown,
  ChevronUp,
  UserCheck,
  UserX
} from "lucide-react";
import {
  getJobApplications,
  updateApplicationStatus,
  retryApplicationAts,
  api
} from "../../services/api";
import tokenService from "../../services/tokenService";
import TalentBridgeLogo from "../../components/TalentBridgeLogo/TalentBridgeLogo";
import "./recruiter.css";

function formatSubmissionDate(dateStr) {
  if (!dateStr) return "Recently";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "Recently";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getScoreBadgeClass(score) {
  if (score >= 80) return "recruiter-score-badge--high";
  if (score >= 60) return "recruiter-score-badge--mid";
  return "recruiter-score-badge--low";
}

export default function JobApplicationsView({ job, onBack }) {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [retryingId, setRetryingId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [expandedCoverLetterId, setExpandedCoverLetterId] = useState(null);

  const isPollingRef = useRef(false);
  const pollTimerRef = useRef(null);

  // ── Fetch Applications ──────────────────────────────────────────────────
  const fetchApplications = useCallback(async (isSilent = false) => {
    if (!job?._id) return;
    if (!isSilent) setLoading(true);
    setError(null);

    try {
      const res = await getJobApplications(job._id);
      const list = res?.data || [];
      setApplications(list);
    } catch (err) {
      if (!isSilent) {
        setError(err.message || "Failed to load applications");
      }
    } finally {
      if (!isSilent) setLoading(false);
      isPollingRef.current = false;
    }
  }, [job?._id]);

  useEffect(() => {
    fetchApplications(false);
  }, [fetchApplications]);

  // ── Smart Polling for in-progress ATS screening ──────────────────────────
  useEffect(() => {
    const hasActiveScreening = applications.some(
      (app) => app.atsStatus === "pending" || app.atsStatus === "processing"
    );

    if (hasActiveScreening) {
      pollTimerRef.current = setTimeout(async () => {
        if (!isPollingRef.current) {
          isPollingRef.current = true;
          await fetchApplications(true);
        }
      }, 4000);
    }

    return () => {
      if (pollTimerRef.current) {
        clearTimeout(pollTimerRef.current);
      }
    };
  }, [applications, fetchApplications]);

  // ── Update Recruitment Decision Status ──────────────────────────────────
  const handleStatusChange = async (appId, newStatus) => {
    setUpdatingId(appId);
    try {
      await updateApplicationStatus(appId, newStatus);
      setApplications((prev) =>
        prev.map((app) => (app._id === appId ? { ...app, status: newStatus } : app))
      );
    } catch (err) {
      alert(err.message || "Failed to update application status");
    } finally {
      setUpdatingId(null);
    }
  };

  // ── Retry ATS Screening ─────────────────────────────────────────────────
  const handleRetryAts = async (appId) => {
    setRetryingId(appId);
    try {
      await retryApplicationAts(appId);
      // Immediately set local atsStatus to pending and trigger silent refresh
      setApplications((prev) =>
        prev.map((app) =>
          app._id === appId ? { ...app, atsStatus: "pending", atsExplanation: "" } : app
        )
      );
      fetchApplications(true);
    } catch (err) {
      alert(err.message || "Failed to restart ATS screening");
    } finally {
      setRetryingId(null);
    }
  };

  // ── Open Resume Safely ──────────────────────────────────────────────────
  const handleViewResume = (app) => {
    const token = tokenService.getToken() || localStorage.getItem("token") || "";
    const resumeUrl = `${api.defaults.baseURL}/applications/${app._id}/resume?token=${encodeURIComponent(token)}`;
    window.open(resumeUrl, "_blank", "noopener,noreferrer");
  };

  // ── Filter & Search Applications ────────────────────────────────────────
  const filteredApps = applications.filter((app) => {
    if (statusFilter !== "all" && app.status !== statusFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const name = (app.applicantName || app.applicant?.name || "").toLowerCase();
      const email = (app.applicantEmail || app.applicant?.email || "").toLowerCase();
      return name.includes(q) || email.includes(q);
    }
    return true;
  });

  return (
    <div className="recruiter-page recruiter-applications-page">
      {/* ── Top Navbar ── */}
      <nav className="recruiter-navbar">
        <div className="recruiter-navbar__left" style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <button className="view-job-page__back-btn" onClick={onBack} id="apps-back-btn">
            <ArrowLeft size={18} />
            <span>Back to Dashboard</span>
          </button>
          <span className="view-job-page__breadcrumb-sep">/</span>
          <span style={{ fontWeight: 600, color: "var(--color-navy-dark, #0f172a)" }}>
            Applications for {job?.jobTitle || "Job"}
          </span>
        </div>

        <div className="recruiter-navbar__right" style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <button
            className="recruiter-toolbar__btn"
            onClick={() => fetchApplications(false)}
            title="Refresh applications list"
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? "spin" : ""} />
            Refresh
          </button>
        </div>
      </nav>

      {/* ── Main Container ── */}
      <div className="recruiter-content" style={{ maxWidth: "1280px", margin: "0 auto", padding: "1.5rem" }}>
        {/* Header Summary */}
        <div className="recruiter-apps-header">
          <div>
            <h1 className="recruiter-apps-title">{job?.jobTitle} — Candidates</h1>
            <p className="recruiter-apps-subtitle">
              Screened candidates, Gemini ATS match scores, keyword breakdown, and hiring decisions.
            </p>
          </div>

          <div className="recruiter-apps-stats">
            <div className="recruiter-apps-stat-card">
              <span className="recruiter-apps-stat-num">{applications.length}</span>
              <span className="recruiter-apps-stat-label">Total Applicants</span>
            </div>
            <div className="recruiter-apps-stat-card">
              <span className="recruiter-apps-stat-num">
                {applications.filter((a) => a.status === "shortlisted").length}
              </span>
              <span className="recruiter-apps-stat-label">Shortlisted</span>
            </div>
            <div className="recruiter-apps-stat-card">
              <span className="recruiter-apps-stat-num">
                {applications.filter((a) => a.atsStatus === "completed").length}
              </span>
              <span className="recruiter-apps-stat-label">AI Screened</span>
            </div>
          </div>
        </div>

        {/* Filters Toolbar */}
        <div className="recruiter-apps-toolbar">
          <div className="recruiter-apps-filters">
            {["all", "pending", "shortlisted", "reviewed", "rejected", "hired"].map((st) => (
              <button
                key={st}
                className={`recruiter-apps-filter-btn${statusFilter === st ? " recruiter-apps-filter-btn--active" : ""}`}
                onClick={() => setStatusFilter(st)}
              >
                {st.charAt(0).toUpperCase() + st.slice(1)}
              </button>
            ))}
          </div>

          <div className="recruiter-apps-search">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* List Content */}
        {loading ? (
          <div className="recruiter-loading" style={{ padding: "4rem 0" }}>
            <div className="recruiter-spinner" />
            <span className="recruiter-loading__text">Loading candidate applications…</span>
          </div>
        ) : error ? (
          <div className="recruiter-error">
            <AlertTriangle size={32} />
            <h3>Unable to load applications</h3>
            <p>{error}</p>
            <button className="recruiter-error__retry-btn" onClick={() => fetchApplications(false)}>
              Try Again
            </button>
          </div>
        ) : filteredApps.length === 0 ? (
          <div className="recruiter-empty" style={{ padding: "4rem 1rem" }}>
            <FileText size={36} />
            <h3>No applications found</h3>
            <p>
              {searchQuery.trim() || statusFilter !== "all"
                ? "No applications match your selected filter or search."
                : "No candidates have applied to this job yet."}
            </p>
          </div>
        ) : (
          <div className="recruiter-apps-list">
            {filteredApps.map((app) => {
              const applicantName = app.applicantName || app.applicant?.name || "Anonymous Applicant";
              const applicantEmail = app.applicantEmail || app.applicant?.email || "No email";
              const applicantPhone = app.applicantPhone || app.applicant?.phone || "";
              const isCoverLetterOpen = expandedCoverLetterId === app._id;

              return (
                <div key={app._id} className="recruiter-app-card" id={`application-${app._id}`}>
                  {/* Card Top Row: Candidate info + ATS status */}
                  <div className="recruiter-app-card__header">
                    <div className="recruiter-app-candidate-info">
                      <div className="recruiter-app-avatar">
                        {applicantName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                      <div>
                        <h3 className="recruiter-app-name">{applicantName}</h3>
                        <div className="recruiter-app-contact-row">
                          <span className="recruiter-app-contact-item">
                            <Mail size={13} /> {applicantEmail}
                          </span>
                          {applicantPhone && (
                            <span className="recruiter-app-contact-item">
                              <Phone size={13} /> {applicantPhone}
                            </span>
                          )}
                          <span className="recruiter-app-contact-item">
                            <Calendar size={13} /> Applied {formatSubmissionDate(app.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* ATS Status Indicator */}
                    <div className="recruiter-app-ats-status-wrap">
                      {app.atsStatus === "pending" && (
                        <div className="recruiter-ats-pill recruiter-ats-pill--pending">
                          <Clock size={13} />
                          <span>Pending screening</span>
                        </div>
                      )}
                      {app.atsStatus === "processing" && (
                        <div className="recruiter-ats-pill recruiter-ats-pill--processing">
                          <RefreshCw size={13} className="spin" />
                          <span>Screening in progress…</span>
                        </div>
                      )}
                      {app.atsStatus === "completed" && (
                        <div className="recruiter-ats-pill recruiter-ats-pill--completed">
                          <CheckCircle2 size={13} />
                          <span>Screening completed</span>
                        </div>
                      )}
                      {app.atsStatus === "failed" && (
                        <div className="recruiter-ats-pill recruiter-ats-pill--failed">
                          <AlertTriangle size={13} />
                          <span>Screening failed — manual review required</span>
                          <button
                            className="recruiter-app-retry-btn"
                            onClick={() => handleRetryAts(app._id)}
                            disabled={retryingId === app._id}
                          >
                            {retryingId === app._id ? "Retrying…" : "Retry"}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Body: ATS Score & Evidence Breakdown */}
                  <div className="recruiter-app-card__body">
                    {/* ATS Score Box */}
                    <div className="recruiter-app-score-box">
                      <div className="recruiter-app-score-box__label">
                        <Sparkles size={14} /> ATS Match Score
                      </div>
                      {app.atsStatus === "completed" && app.atsScore !== null && app.atsScore !== undefined ? (
                        <div className={`recruiter-score-display ${getScoreBadgeClass(app.atsScore)}`}>
                          <span className="recruiter-score-num">{app.atsScore}</span>
                          <span className="recruiter-score-max">/100</span>
                        </div>
                      ) : app.atsStatus === "failed" ? (
                        <div className="recruiter-score-display recruiter-score-display--na">
                          <span className="recruiter-score-num">—</span>
                          <span className="recruiter-score-desc">Manual Review</span>
                        </div>
                      ) : (
                        <div className="recruiter-score-display recruiter-score-display--pending">
                          <RefreshCw size={18} className="spin" />
                          <span className="recruiter-score-desc">Evaluating…</span>
                        </div>
                      )}
                    </div>

                    {/* Matched & Missing Keywords */}
                    <div className="recruiter-app-keywords-box">
                      <div className="recruiter-keyword-section">
                        <span className="recruiter-keyword-title recruiter-keyword-title--matched">
                          <CheckCircle2 size={13} /> Matched Skills & Keywords ({(app.matchedKeywords || []).length})
                        </span>
                        <div className="recruiter-keyword-tags">
                          {(app.matchedKeywords || []).length > 0 ? (
                            app.matchedKeywords.map((kw, i) => (
                              <span key={i} className="recruiter-tag recruiter-tag--matched">
                                {kw}
                              </span>
                            ))
                          ) : (
                            <span className="recruiter-tag-empty">
                              {app.atsStatus === "completed" ? "No direct skill matches identified" : "Awaiting screening"}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="recruiter-keyword-section">
                        <span className="recruiter-keyword-title recruiter-keyword-title--missing">
                          <XCircle size={13} /> Missing Job Requirements ({(app.missingKeywords || []).length})
                        </span>
                        <div className="recruiter-keyword-tags">
                          {(app.missingKeywords || []).length > 0 ? (
                            app.missingKeywords.map((kw, i) => (
                              <span key={i} className="recruiter-tag recruiter-tag--missing">
                                {kw}
                              </span>
                            ))
                          ) : (
                            <span className="recruiter-tag-empty">
                              {app.atsStatus === "completed" ? "All core requirements evidenced" : "Awaiting screening"}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* AI Evidence Explanation */}
                      {app.atsExplanation && (
                        <div className="recruiter-app-explanation">
                          <strong>AI Analysis:</strong> {app.atsExplanation}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Optional Cover Letter Collapse */}
                  {app.coverLetter && (
                    <div className="recruiter-app-cover-letter-wrapper">
                      <button
                        className="recruiter-app-cover-toggle"
                        onClick={() =>
                          setExpandedCoverLetterId(isCoverLetterOpen ? null : app._id)
                        }
                      >
                        <FileText size={13} />
                        <span>Cover Letter</span>
                        {isCoverLetterOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                      </button>
                      {isCoverLetterOpen && (
                        <div className="recruiter-app-cover-content">
                          <p>{app.coverLetter}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Card Footer: Hiring Actions & Resume Link */}
                  <div className="recruiter-app-card__footer">
                    <div className="recruiter-app-decision-group">
                      <span className="recruiter-app-status-badge recruiter-app-status-badge--current">
                        Decision: <strong>{app.status.toUpperCase()}</strong>
                      </span>

                      <button
                        className={`recruiter-app-action-btn recruiter-app-action-btn--shortlist${app.status === "shortlisted" ? " is-active" : ""}`}
                        onClick={() => handleStatusChange(app._id, "shortlisted")}
                        disabled={updatingId === app._id || app.status === "shortlisted"}
                      >
                        <UserCheck size={14} />
                        Shortlist
                      </button>

                      <button
                        className={`recruiter-app-action-btn recruiter-app-action-btn--reject${app.status === "rejected" ? " is-active" : ""}`}
                        onClick={() => handleStatusChange(app._id, "rejected")}
                        disabled={updatingId === app._id || app.status === "rejected"}
                      >
                        <UserX size={14} />
                        Reject
                      </button>

                      <select
                        className="recruiter-app-status-select"
                        value={app.status}
                        onChange={(e) => handleStatusChange(app._id, e.target.value)}
                        disabled={updatingId === app._id}
                      >
                        <option value="pending">Pending</option>
                        <option value="reviewed">Reviewed</option>
                        <option value="shortlisted">Shortlisted</option>
                        <option value="rejected">Rejected</option>
                        <option value="hired">Hired</option>
                      </select>
                    </div>

                    <div className="recruiter-app-resume-group">
                      <button
                        className="recruiter-app-view-resume-btn"
                        onClick={() => handleViewResume(app)}
                      >
                        <ExternalLink size={14} />
                        View Stored Resume
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
