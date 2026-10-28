import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  ArrowLeft,
  Search,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  ExternalLink,
  Trophy,
  Medal,
  Award,
  BarChart2,
  ChevronDown,
  ChevronUp,
  UserCheck,
  UserX,
  Briefcase,
  FileText,
} from "lucide-react";
import { getJobApplications, updateApplicationStatus, retryApplicationAts, api } from "../../services/api";
import tokenService from "../../services/tokenService";
import "./AtsRankingPage.css";

// ── Helpers ────────────────────────────────────────────────────────────────────

function getRankIcon(rank) {
  if (rank === 1) return <Trophy size={16} className="ats-rank-icon ats-rank-icon--gold" />;
  if (rank === 2) return <Medal size={16} className="ats-rank-icon ats-rank-icon--silver" />;
  if (rank === 3) return <Award size={16} className="ats-rank-icon ats-rank-icon--bronze" />;
  return null;
}

function getScoreColorClass(score) {
  if (score >= 80) return "ats-score--high";
  if (score >= 60) return "ats-score--mid";
  if (score >= 40) return "ats-score--low";
  return "ats-score--very-low";
}

function getScoreLabel(score) {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Good";
  if (score >= 40) return "Fair";
  return "Weak";
}

function getInitials(name) {
  return (name || "?")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getAvatarColor(name) {
  const colors = [
    "#6366f1","#8b5cf6","#06b6d4","#10b981","#f59e0b",
    "#ef4444","#ec4899","#14b8a6","#3b82f6","#a855f7",
  ];
  let hash = 0;
  for (let i = 0; i < (name || "").length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function AtsRankingPage({ job, onBack }) {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortMode, setSortMode] = useState("score-desc");
  const [expandedId, setExpandedId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [retryingId, setRetryingId] = useState(null);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const sortRef = useRef(null);
  const pollRef = useRef(null);
  const isPollingRef = useRef(false);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchApplications = useCallback(async (silent = false) => {
    if (!job?._id) return;
    if (!silent) setLoading(true);
    setError(null);
    try {
      const res = await getJobApplications(job._id);
      setApplications(res?.data || []);
    } catch (err) {
      if (!silent) setError(err.message || "Failed to load applications.");
    } finally {
      if (!silent) setLoading(false);
      isPollingRef.current = false;
    }
  }, [job?._id]);

  useEffect(() => { fetchApplications(false); }, [fetchApplications]);

  // ── Smart polling while ATS is processing ─────────────────────────────────
  useEffect(() => {
    const hasPending = applications.some(
      (a) => a.atsStatus === "pending" || a.atsStatus === "processing"
    );
    if (hasPending) {
      pollRef.current = setTimeout(async () => {
        if (!isPollingRef.current) {
          isPollingRef.current = true;
          await fetchApplications(true);
        }
      }, 4000);
    }
    return () => { if (pollRef.current) clearTimeout(pollRef.current); };
  }, [applications, fetchApplications]);

  // ── Sort dropdown outside-click ────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (sortRef.current && !sortRef.current.contains(e.target)) {
        setShowSortMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Actions ────────────────────────────────────────────────────────────────
  const handleStatusChange = async (appId, newStatus) => {
    setUpdatingId(appId);
    try {
      await updateApplicationStatus(appId, newStatus);
      setApplications((prev) =>
        prev.map((a) => (a._id === appId ? { ...a, status: newStatus } : a))
      );
    } catch (err) {
      alert(err.message || "Failed to update status.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRetryAts = async (appId) => {
    setRetryingId(appId);
    try {
      await retryApplicationAts(appId);
      setApplications((prev) =>
        prev.map((a) =>
          a._id === appId ? { ...a, atsStatus: "pending", atsExplanation: "" } : a
        )
      );
      fetchApplications(true);
    } catch (err) {
      alert(err.message || "Failed to retry ATS.");
    } finally {
      setRetryingId(null);
    }
  };

  const handleViewResume = (app) => {
    const token = tokenService.getToken() || localStorage.getItem("token") || "";
    const url = `${api.defaults.baseURL}/applications/${app._id}/resume?token=${encodeURIComponent(token)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  // ── Partition: scored vs not-scored ────────────────────────────────────────
  const scoredApps = applications.filter(
    (a) => a.atsStatus === "completed" && a.atsScore !== null && a.atsScore !== undefined
  );
  const pendingApps = applications.filter(
    (a) => !(a.atsStatus === "completed" && a.atsScore !== null && a.atsScore !== undefined)
  );

  // ── Sort scored apps ────────────────────────────────────────────────────────
  const sortedScored = [...scoredApps].sort((a, b) => {
    switch (sortMode) {
      case "score-asc": return a.atsScore - b.atsScore;
      case "name-asc":  return (a.applicantName || "").localeCompare(b.applicantName || "");
      case "newest":    return new Date(b.createdAt) - new Date(a.createdAt);
      default:          return b.atsScore - a.atsScore; // score-desc
    }
  });

  // ── Search filter ──────────────────────────────────────────────────────────
  const q = searchQuery.trim().toLowerCase();
  const filteredScored = q
    ? sortedScored.filter(
        (a) =>
          (a.applicantName || "").toLowerCase().includes(q) ||
          (a.applicantEmail || "").toLowerCase().includes(q)
      )
    : sortedScored;

  const filteredPending = q
    ? pendingApps.filter(
        (a) =>
          (a.applicantName || "").toLowerCase().includes(q) ||
          (a.applicantEmail || "").toLowerCase().includes(q)
      )
    : pendingApps;

  const SORT_LABELS = {
    "score-desc": "Highest Score First",
    "score-asc":  "Lowest Score First",
    "name-asc":   "Name A → Z",
    "newest":     "Newest First",
  };

  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="ats-page">
      {/* ── Top Navbar (matching recruiter navbar) ─────────────────────────── */}
      <nav className="recruiter-navbar ats-navbar">
        <div className="recruiter-navbar__left" style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <button className="view-job-page__back-btn ats-back-btn" onClick={onBack} id="ats-back-btn">
            <ArrowLeft size={18} />
            <span>Back to Dashboard</span>
          </button>
          <span className="view-job-page__breadcrumb-sep">/</span>
          <span style={{ fontWeight: 600, color: "rgba(255, 255, 255, 0.95)", fontSize: "0.92rem" }}>
            ATS Ranking — {job?.jobTitle || "Job"}
          </span>
        </div>
        <div className="recruiter-navbar__right" style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginLeft: "auto" }}>
          <button
            className="ats-refresh-btn"
            onClick={() => fetchApplications(false)}
            disabled={loading}
            title="Refresh list"
          >
            <RefreshCw size={14} className={loading ? "ats-spin" : ""} />
            <span>Refresh</span>
          </button>
        </div>
      </nav>

      {/* ── Page Body ─────────────────────────────────────────────────────── */}
      <div className="ats-body">

        {/* Clean Professional Header */}
        <header className="ats-header">
          <div className="ats-header__text">
            <h1 className="ats-header__title">Candidate ATS Ranking</h1>
            <p className="ats-header__subtitle">
              {job?.jobTitle || "Job"} · Candidates evaluated and ranked by keyword match and qualifications
            </p>
          </div>
        </header>

        {/* Toolbar */}
        {!loading && !error && (
          <div className="ats-toolbar">
            <div className="ats-search-wrap">
              <Search size={15} className="ats-search-icon" />
              <input
                id="ats-search-input"
                className="ats-search-input"
                type="text"
                placeholder="Search candidates by name or email…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button className="ats-search-clear" onClick={() => setSearchQuery("")} aria-label="Clear search">
                  ×
                </button>
              )}
            </div>

            <div className="ats-sort-wrap" ref={sortRef}>
              <button
                id="ats-sort-btn"
                className={`ats-sort-btn${showSortMenu ? " ats-sort-btn--open" : ""}`}
                onClick={() => setShowSortMenu((p) => !p)}
              >
                <BarChart2 size={14} />
                <span>{SORT_LABELS[sortMode]}</span>
                <ChevronDown size={12} />
              </button>
              {showSortMenu && (
                <div className="ats-sort-dropdown">
                  {Object.entries(SORT_LABELS).map(([key, label]) => (
                    <button
                      key={key}
                      className={`ats-sort-option${sortMode === key ? " ats-sort-option--active" : ""}`}
                      onClick={() => { setSortMode(key); setShowSortMenu(false); }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Content ───────────────────────────────────────────────────────── */}
        {loading ? (
          <div className="ats-loading">
            <div className="ats-spinner" />
            <span>Loading and ranking candidates…</span>
          </div>
        ) : error ? (
          <div className="ats-error">
            <AlertTriangle size={32} />
            <h3>Failed to load applications</h3>
            <p>{error}</p>
            <button className="ats-error__retry" onClick={() => fetchApplications(false)}>Try Again</button>
          </div>
        ) : applications.length === 0 ? (
          <div className="ats-empty">
            <Briefcase size={38} className="ats-empty__icon" />
            <h3>No applications yet</h3>
            <p>Candidates who apply to this job will appear here ranked by their ATS score.</p>
          </div>
        ) : (
          <>
            {/* ── Ranked Candidates ─────────────────────────────────────── */}
            {filteredScored.length > 0 && (
              <section className="ats-section">
                <div className="ats-section__header">
                  <CheckCircle2 size={16} className="ats-section__icon ats-section__icon--scored" />
                  <h2 className="ats-section__title">
                    Ranked Candidates
                    <span className="ats-section__count">{filteredScored.length}</span>
                  </h2>
                </div>

                <div className="ats-cards">
                  {filteredScored.map((app, idx) => {
                    const rank = idx + 1;
                    const name = app.applicantName || app.applicant?.name || "Anonymous";
                    const email = app.applicantEmail || app.applicant?.email || "";
                    const isExpanded = expandedId === app._id;
                    const avatarColor = getAvatarColor(name);
                    const circumference = 2 * Math.PI * 34; // r=34

                    return (
                      <div
                        key={app._id}
                        id={`ats-card-${app._id}`}
                        className={`ats-card${rank <= 3 ? ` ats-card--top-${rank}` : ""}${isExpanded ? " ats-card--expanded" : ""}`}
                      >
                        {rank <= 3 && (
                          <div className={`ats-rank-badge ats-rank-badge--${rank}`}>
                            Rank #{rank}
                          </div>
                        )}

                        <div className="ats-card__top">
                          {/* Identity */}
                          <div className="ats-card__identity">
                            <div className="ats-card__avatar" style={{ backgroundColor: avatarColor }}>
                              {getInitials(name)}
                            </div>
                            <div className="ats-card__info">
                              <div className="ats-card__name-row">
                                {getRankIcon(rank)}
                                <span className="ats-card__name">{name}</span>
                                {rank > 3 && <span className="ats-card__rank-num">#{rank}</span>}
                              </div>
                              <span className="ats-card__email">{email}</span>
                              <span className={`ats-status-badge ats-status-badge--${app.status}`}>
                                {app.status.toUpperCase()}
                              </span>
                            </div>
                          </div>

                          {/* Score Dial */}
                          <div className={`ats-score-dial ${getScoreColorClass(app.atsScore)}`}>
                            <svg viewBox="0 0 80 80" className="ats-score-dial__svg">
                              <circle cx="40" cy="40" r="34" fill="none" strokeWidth="8" className="ats-score-dial__track" />
                              <circle
                                cx="40" cy="40" r="34"
                                fill="none" strokeWidth="8" strokeLinecap="round"
                                className="ats-score-dial__fill"
                                strokeDasharray={`${(app.atsScore / 100) * circumference} ${circumference}`}
                                transform="rotate(-90 40 40)"
                              />
                            </svg>
                            <div className="ats-score-dial__label">
                              <span className="ats-score-dial__num">{app.atsScore}</span>
                              <span className="ats-score-dial__max">/100</span>
                            </div>
                            <span className="ats-score-dial__grade">{getScoreLabel(app.atsScore)}</span>
                          </div>
                        </div>

                        {/* Skills preview */}
                        <div className="ats-card__skills-preview">
                          <div className="ats-skills-col">
                            <span className="ats-skills-col__label ats-skills-col__label--matched">
                              <CheckCircle2 size={12} />
                              Matched ({(app.matchedKeywords || []).length})
                            </span>
                            <div className="ats-tags">
                              {(app.matchedKeywords || []).slice(0, 5).map((kw, i) => (
                                <span key={i} className="ats-tag ats-tag--matched">{kw}</span>
                              ))}
                              {(app.matchedKeywords || []).length > 5 && (
                                <span className="ats-tag ats-tag--more">+{(app.matchedKeywords || []).length - 5} more</span>
                              )}
                              {(app.matchedKeywords || []).length === 0 && (
                                <span className="ats-tags__empty">None identified</span>
                              )}
                            </div>
                          </div>

                          <div className="ats-skills-col">
                            <span className="ats-skills-col__label ats-skills-col__label--missing">
                              <XCircle size={12} />
                              Missing ({(app.missingKeywords || []).length})
                            </span>
                            <div className="ats-tags">
                              {(app.missingKeywords || []).slice(0, 5).map((kw, i) => (
                                <span key={i} className="ats-tag ats-tag--missing">{kw}</span>
                              ))}
                              {(app.missingKeywords || []).length > 5 && (
                                <span className="ats-tag ats-tag--more">+{(app.missingKeywords || []).length - 5} more</span>
                              )}
                              {(app.missingKeywords || []).length === 0 && (
                                <span className="ats-tags__empty">All requirements met</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Expand toggle */}
                        <button
                          className="ats-card__expand-btn"
                          onClick={() => setExpandedId(isExpanded ? null : app._id)}
                        >
                          {isExpanded ? <><ChevronUp size={13} /> Less details</> : <><ChevronDown size={13} /> More details</>}
                        </button>

                        {isExpanded && (
                          <div className="ats-card__expanded">
                            <div className="ats-expanded-skills">
                              <div className="ats-skills-col">
                                <span className="ats-skills-col__label ats-skills-col__label--matched">
                                  <CheckCircle2 size={12} /> All Matched Skills
                                </span>
                                <div className="ats-tags">
                                  {(app.matchedKeywords || []).map((kw, i) => (
                                    <span key={i} className="ats-tag ats-tag--matched">{kw}</span>
                                  ))}
                                  {(app.matchedKeywords || []).length === 0 && (
                                    <span className="ats-tags__empty">No direct matches</span>
                                  )}
                                </div>
                              </div>
                              <div className="ats-skills-col">
                                <span className="ats-skills-col__label ats-skills-col__label--missing">
                                  <XCircle size={12} /> All Missing Requirements
                                </span>
                                <div className="ats-tags">
                                  {(app.missingKeywords || []).map((kw, i) => (
                                    <span key={i} className="ats-tag ats-tag--missing">{kw}</span>
                                  ))}
                                  {(app.missingKeywords || []).length === 0 && (
                                    <span className="ats-tags__empty">All requirements evidenced</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {app.atsExplanation && (
                              <div className="ats-explanation">
                                <div className="ats-explanation__header">
                                  <strong>Candidate Match Evaluation:</strong>
                                </div>
                                <div className="ats-explanation__content">{app.atsExplanation}</div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Footer */}
                        <div className="ats-card__footer">
                          <div className="ats-card__decision">
                            <button
                              className={`ats-action-btn ats-action-btn--shortlist${app.status === "shortlisted" ? " ats-action-btn--active" : ""}`}
                              onClick={() => handleStatusChange(app._id, "shortlisted")}
                              disabled={updatingId === app._id || app.status === "shortlisted"}
                              id={`ats-shortlist-${app._id}`}
                            >
                              <UserCheck size={13} />
                              {app.status === "shortlisted" ? "Shortlisted" : "Shortlist"}
                            </button>
                            <button
                              className={`ats-action-btn ats-action-btn--reject${app.status === "rejected" ? " ats-action-btn--active" : ""}`}
                              onClick={() => handleStatusChange(app._id, "rejected")}
                              disabled={updatingId === app._id || app.status === "rejected"}
                              id={`ats-reject-${app._id}`}
                            >
                              <UserX size={13} />
                              {app.status === "rejected" ? "Rejected" : "Reject"}
                            </button>
                            <select
                              className="ats-status-select"
                              value={app.status}
                              onChange={(e) => handleStatusChange(app._id, e.target.value)}
                              disabled={updatingId === app._id}
                              id={`ats-status-select-${app._id}`}
                            >
                              <option value="pending">Pending</option>
                              <option value="reviewed">Reviewed</option>
                              <option value="shortlisted">Shortlisted</option>
                              <option value="rejected">Rejected</option>
                              <option value="hired">Hired</option>
                            </select>
                          </div>
                          <button
                            className="ats-resume-btn"
                            onClick={() => handleViewResume(app)}
                            id={`ats-resume-${app._id}`}
                          >
                            <ExternalLink size={13} />
                            View Resume
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* ── Pending / Failed ──────────────────────────────────────── */}
            {filteredPending.length > 0 && (
              <section className="ats-section ats-section--pending">
                <div className="ats-section__header">
                  <Clock size={16} className="ats-section__icon ats-section__icon--pending" />
                  <h2 className="ats-section__title">
                    Awaiting ATS Screening
                    <span className="ats-section__count">{filteredPending.length}</span>
                  </h2>
                </div>

                <div className="ats-pending-list">
                  {filteredPending.map((app) => {
                    const name = app.applicantName || app.applicant?.name || "Anonymous";
                    const email = app.applicantEmail || app.applicant?.email || "";
                    const avatarColor = getAvatarColor(name);
                    const isFailed = app.atsStatus === "failed";
                    const isProcessing = app.atsStatus === "processing";

                    return (
                      <div key={app._id} id={`ats-pending-${app._id}`} className="ats-pending-card">
                        <div className="ats-pending-card__avatar" style={{ backgroundColor: avatarColor }}>
                          {getInitials(name)}
                        </div>
                        <div className="ats-pending-card__info">
                          <span className="ats-pending-card__name">{name}</span>
                          <span className="ats-pending-card__email">{email}</span>
                        </div>
                        <div className="ats-pending-card__status">
                          {isFailed ? (
                            <span className="ats-pill ats-pill--failed">
                              <AlertTriangle size={12} /> Screening failed
                            </span>
                          ) : isProcessing ? (
                            <span className="ats-pill ats-pill--processing">
                              <RefreshCw size={12} className="ats-spin" /> Processing…
                            </span>
                          ) : (
                            <span className="ats-pill ats-pill--pending">
                              <Clock size={12} /> Pending
                            </span>
                          )}
                        </div>
                        <div className="ats-pending-card__actions">
                          {isFailed && (
                            <button
                              className="ats-retry-btn"
                              onClick={() => handleRetryAts(app._id)}
                              disabled={retryingId === app._id}
                            >
                              <RefreshCw size={12} />
                              {retryingId === app._id ? "Retrying…" : "Retry"}
                            </button>
                          )}
                          <button
                            className="ats-resume-btn ats-resume-btn--sm"
                            onClick={() => handleViewResume(app)}
                          >
                            <ExternalLink size={12} />
                            Resume
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Empty search result */}
            {q && filteredScored.length === 0 && filteredPending.length === 0 && (
              <div className="ats-empty">
                <Search size={36} className="ats-empty__icon" />
                <h3>No candidates match "{searchQuery}"</h3>
                <p>Try a different name or email.</p>
                <button className="ats-clear-search" onClick={() => setSearchQuery("")}>Clear search</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
