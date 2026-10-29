import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  ArrowLeft,
  Search,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  Briefcase,
  MapPin,
  Tag,
  FileText,
  Mail,
  Plus,
  Clock,
  User,
  History,
  MoreVertical,
  Sparkles,
  Link2,
  HelpCircle,
  Video,
  Calendar,
  Edit3,
  Copy,
  Check,
} from "lucide-react";
import TalentBridgeLogo from "../../components/TalentBridgeLogo/TalentBridgeLogo";
import {
  getJobApplications,
  updateApplicationStatus,
  retryApplicationAts,
  selectCandidateForInterview,
  deleteApplication,
  api,
} from "../../services/api";
import tokenService from "../../services/tokenService";
import "./AtsRankingPage.css";

// ── Helpers ────────────────────────────────────────────────────────────────────

function getBaselineId(id) {
  if (!id) return "1000000";
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return String(1000000 + (hash % 9000000));
}

function getScoreColorClass(score) {
  if (score >= 80) return "high";
  if (score >= 60) return "mid";
  if (score >= 40) return "low";
  return "very-low";
}

function getScoreLabel(score) {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Good";
  if (score >= 40) return "Fair";
  return "Weak";
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function AtsRankingPage({ job, onBack }) {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortMode, setSortMode] = useState("score-desc");
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [retryingId, setRetryingId] = useState(null);
  const [selectingId, setSelectingId] = useState(null);
  const [confirmCandidate, setConfirmCandidate] = useState(null);
  const [modalZoomLink, setModalZoomLink] = useState("");
  const [modalInterviewTiming, setModalInterviewTiming] = useState("");
  const [modalNotes, setModalNotes] = useState("");
  const [detailZoomLink, setDetailZoomLink] = useState("");
  const [detailInterviewTiming, setDetailInterviewTiming] = useState("");
  const [detailNotes, setDetailNotes] = useState("");
  const [detailCopied, setDetailCopied] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState(null);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const sortRef = useRef(null);
  const pollRef = useRef(null);
  const isPollingRef = useRef(false);

  // Sync candidate detail inputs whenever selected candidate changes
  useEffect(() => {
    if (selectedCandidate) {
      setDetailZoomLink(selectedCandidate.interviewInvitation?.zoomLink || "");
      setDetailInterviewTiming(selectedCandidate.interviewInvitation?.interviewTiming || "");
      setDetailNotes(selectedCandidate.interviewInvitation?.notes || "");
    }
  }, [
    selectedCandidate?._id,
    selectedCandidate?.interviewInvitation?.sentAt,
    selectedCandidate?.interviewInvitation?.zoomLink,
    selectedCandidate?.interviewInvitation?.interviewTiming,
  ]);

  // ── Fetch applications ───────────────────────────────────────────────────────
  const fetchApplications = useCallback(
    async (silent = false) => {
      if (!job?._id) return;
      if (!silent) setLoading(true);
      setError(null);
      try {
        const res = await getJobApplications(job._id);
        const data = (res?.data || []).filter((a) => a.status !== "rejected");
        setApplications(data);

        // Keep selected candidate in sync with fresh data without creating dependency loops
        setSelectedCandidate((prev) => {
          if (!prev) return null;
          return data.find((a) => a._id === prev._id) || prev;
        });
      } catch (err) {
        if (!silent) setError(err.message || "Failed to load applications.");
      } finally {
        if (!silent) setLoading(false);
        isPollingRef.current = false;
      }
    },
    [job?._id]
  );

  useEffect(() => {
    fetchApplications(false);
  }, [fetchApplications]);

  // ── Smart polling for pending ATS screening ─────────────────────────────────
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
    return () => {
      if (pollRef.current) clearTimeout(pollRef.current);
    };
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

  // ── Keyboard shortcut: Escape returns to Candidate List ───────────────────
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && selectedCandidate && !confirmCandidate) {
        setSelectedCandidate(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedCandidate, confirmCandidate]);

  // ── Navigation handlers ────────────────────────────────────────────────────
  const handleBackToList = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setSelectedCandidate(null);
  };
  const handleBackToCandidateList = handleBackToList;

  const handleNavbarBack = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (selectedCandidate) {
      setSelectedCandidate(null);
    } else if (typeof onBack === "function") {
      onBack();
    }
  };

  // ── Actions ────────────────────────────────────────────────────────────────
  const handleStatusChange = async (appId, newStatus) => {
    setUpdatingId(appId);
    try {
      if (newStatus === "rejected") {
        try {
          await deleteApplication(appId);
        } catch {
          await updateApplicationStatus(appId, "rejected");
        }
        setApplications((prev) => prev.filter((a) => a._id !== appId));
        if (selectedCandidate?._id === appId) {
          setSelectedCandidate(null);
        }
        setFeedbackMessage({
          type: "success",
          text: "Candidate has been rejected and permanently deleted.",
        });
      } else {
        await updateApplicationStatus(appId, newStatus);
        setApplications((prev) =>
          prev.map((a) => (a._id === appId ? { ...a, status: newStatus } : a))
        );
        setSelectedCandidate((prev) =>
          prev && prev._id === appId ? { ...prev, status: newStatus } : prev
        );
      }
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
      setSelectedCandidate((prev) =>
        prev && prev._id === appId
          ? { ...prev, atsStatus: "pending", atsExplanation: "" }
          : prev
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

  const handleCopyZoomLink = (link) => {
    if (!link) return;
    navigator.clipboard.writeText(link);
    setDetailCopied(true);
    setTimeout(() => setDetailCopied(false), 2000);
  };

  const handleOpenSelectModal = (app) => {
    setConfirmCandidate(app);
    const existingZoom =
      selectedCandidate && selectedCandidate._id === app._id && detailZoomLink !== ""
        ? detailZoomLink
        : app.interviewInvitation?.zoomLink || "";
    const existingTiming =
      selectedCandidate && selectedCandidate._id === app._id && detailInterviewTiming !== ""
        ? detailInterviewTiming
        : app.interviewInvitation?.interviewTiming || "";
    const existingNotes =
      selectedCandidate && selectedCandidate._id === app._id && detailNotes !== ""
        ? detailNotes
        : app.interviewInvitation?.notes || "";

    setModalZoomLink(existingZoom);
    setModalInterviewTiming(existingTiming);
    setModalNotes(existingNotes);
  };

  const handleConfirmSelection = async (resend = false) => {
    if (!confirmCandidate) return;
    const appId = confirmCandidate._id;
    const candidateEmail =
      confirmCandidate.applicantEmail || confirmCandidate.applicant?.email || "the seeker";
    setSelectingId(appId);
    try {
      const res = await selectCandidateForInterview(appId, {
        zoomLink: modalZoomLink.trim(),
        interviewTiming: modalInterviewTiming.trim(),
        notes: modalNotes.trim(),
        resend,
      });

      if (res?.success) {
        const updatedApp = res.data || {
          ...confirmCandidate,
          status: "selected",
          interviewInvitation: {
            zoomLink: modalZoomLink.trim(),
            interviewTiming: modalInterviewTiming.trim(),
            notes: modalNotes.trim(),
            status: res.emailSent ? "sent" : "failed",
            sentAt: new Date(),
          },
        };

        setApplications((prev) =>
          prev.map((a) => (a._id === appId ? { ...a, ...updatedApp } : a))
        );
        setSelectedCandidate((prev) =>
          prev && prev._id === appId ? { ...prev, ...updatedApp } : prev
        );
        setDetailZoomLink(modalZoomLink.trim());
        setDetailInterviewTiming(modalInterviewTiming.trim());
        setDetailNotes(modalNotes.trim());

        if (res.emailSent) {
          setFeedbackMessage({
            type: "success",
            text: `🎉 Selection email with Zoom link and interview timing was successfully sent to ${candidateEmail}!`,
          });
        } else if (res.emailError) {
          setFeedbackMessage({
            type: "warning",
            text: `⚠️ Candidate selected, but email delivery failed (${res.emailError}). Please verify SMTP settings in backend/.env.`,
          });
        } else {
          setFeedbackMessage({
            type: "info",
            text: res.message || "Candidate selected successfully.",
          });
        }
      } else {
        setFeedbackMessage({
          type: "error",
          text: res?.message || "Failed to select candidate.",
        });
      }
    } catch (err) {
      setFeedbackMessage({
        type: "error",
        text: err.message || "Failed to select candidate for interview.",
      });
    } finally {
      setSelectingId(null);
      setConfirmCandidate(null);
    }
  };

  const handleSaveAndSendInterview = async () => {
    if (!selectedCandidate) return;
    const appId = selectedCandidate._id;
    const candidateEmail =
      selectedCandidate.applicantEmail || selectedCandidate.applicant?.email || "the seeker";
    setSelectingId(appId);
    try {
      const res = await selectCandidateForInterview(appId, {
        zoomLink: detailZoomLink.trim(),
        interviewTiming: detailInterviewTiming.trim(),
        notes: detailNotes.trim(),
        resend: selectedCandidate.status === "selected",
      });

      if (res?.success) {
        const updatedApp = res.data || {
          ...selectedCandidate,
          status: "selected",
          interviewInvitation: {
            zoomLink: detailZoomLink.trim(),
            interviewTiming: detailInterviewTiming.trim(),
            notes: detailNotes.trim(),
            status: res.emailSent ? "sent" : "failed",
            sentAt: new Date(),
          },
        };

        setApplications((prev) =>
          prev.map((a) => (a._id === appId ? { ...a, ...updatedApp } : a))
        );
        setSelectedCandidate(updatedApp);

        if (res.emailSent) {
          setFeedbackMessage({
            type: "success",
            text: `🎉 Selection email with Zoom link and interview timing was successfully sent to ${candidateEmail}!`,
          });
        } else if (res.emailError) {
          setFeedbackMessage({
            type: "warning",
            text: `⚠️ Candidate selected, but email delivery failed (${res.emailError}). Please verify SMTP settings in backend/.env.`,
          });
        } else {
          setFeedbackMessage({
            type: "info",
            text: res.message || "Candidate interview details updated and email dispatched.",
          });
        }
      } else {
        setFeedbackMessage({
          type: "error",
          text: res?.message || "Failed to dispatch interview email.",
        });
      }
    } catch (err) {
      setFeedbackMessage({
        type: "error",
        text: err.message || "Failed to dispatch interview email.",
      });
    } finally {
      setSelectingId(null);
    }
  };

  // ── Partition: scored vs un-scored ─────────────────────────────────────────
  const scoredApps = applications.filter(
    (a) => a.atsStatus === "completed" && a.atsScore !== null && a.atsScore !== undefined
  );
  const pendingApps = applications.filter(
    (a) => !(a.atsStatus === "completed" && a.atsScore !== null && a.atsScore !== undefined)
  );

  // ── Sort scored candidates ─────────────────────────────────────────────────
  const sortedScored = [...scoredApps].sort((a, b) => {
    switch (sortMode) {
      case "score-asc":
        return a.atsScore - b.atsScore;
      case "name-asc":
        return (a.applicantName || "").localeCompare(b.applicantName || "");
      case "newest":
        return new Date(b.createdAt) - new Date(a.createdAt);
      default:
        return b.atsScore - a.atsScore; // score-desc
    }
  });

  // ── Filter by search query ─────────────────────────────────────────────────
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
    "score-desc": "Highest Match First",
    "score-asc": "Lowest Match First",
    "name-asc": "Name A to Z",
    "newest": "Newest Applicants",
  };

  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="ats-page">
      {/* ── Neutral Top Navigation Header (no blue background) ─────────────── */}
      <header className="ats-navbar" id="ats-navbar">
        <div className="ats-navbar__left">
          <button
            type="button"
            className="ats-back-btn"
            onClick={handleNavbarBack}
            id="ats-back-btn"
            aria-label={selectedCandidate ? "Back to Candidate List" : "Back to Dashboard"}
          >
            <ArrowLeft size={16} />
            <span>{selectedCandidate ? "Back to Candidate List" : "Back to Dashboard"}</span>
          </button>
          <span className="ats-navbar__sep">/</span>
          <span className="ats-navbar__title">
            ATS Ranking — {job?.jobTitle || "Job"}
          </span>
        </div>
        <div className="ats-navbar__right">
          <button
            type="button"
            className="ats-refresh-btn"
            onClick={() => fetchApplications(false)}
            disabled={loading}
            title="Refresh list"
          >
            <RefreshCw size={13} className={loading ? "ats-spin" : ""} />
            <span>Refresh</span>
          </button>
        </div>
      </header>

      {/* ── Main Container ────────────────────────────────────────────────── */}
      <main className="ats-container">
        {/* Feedback Alert Banner */}
        {feedbackMessage && (
          <div
            className={`ats-feedback-banner ats-feedback-banner--${feedbackMessage.type}`}
            role="alert"
          >
            <span className="ats-feedback-banner__text">{feedbackMessage.text}</span>
            <button
              type="button"
              className="ats-feedback-banner__close"
              onClick={() => setFeedbackMessage(null)}
              aria-label="Dismiss notification"
            >

            </button>
          </div>
        )}

        {/* ── VIEW 1: Candidate Details Page (Exact Layout matching reference) ── */}
        {selectedCandidate ? (
          <div className="ats-details-view" id={`ats-details-${selectedCandidate._id}`}>
            {/* Action Bar: Back button & Status Actions */}
            <div className="ats-details-topbar">
              <button
                type="button"
                className="ats-details-back-link"
                onClick={handleBackToCandidateList}
                id="ats-details-back-btn"
                aria-label="Back to Candidate List"
              >
                <ArrowLeft size={15} />
                <span>Back to Candidate List</span>
              </button>

              <div className="ats-details-top-actions">
                <button
                  type="button"
                  className={`ats-btn ats-btn--select${selectedCandidate.status === "selected" ? " ats-btn--selected" : ""}`}
                  onClick={() => handleOpenSelectModal(selectedCandidate)}
                  disabled={selectingId === selectedCandidate._id}
                  id={`ats-details-select-${selectedCandidate._id}`}
                >
                  {selectingId === selectedCandidate._id
                    ? "Processing…"
                    : selectedCandidate.status === "selected"
                      ? "Selected · Resend Invite"
                      : "Select Candidate"}
                </button>
                <button
                  type="button"
                  className={`ats-btn ats-btn--reject${selectedCandidate.status === "rejected" ? " ats-btn--rejected" : ""}`}
                  onClick={() => handleStatusChange(selectedCandidate._id, "rejected")}
                  disabled={updatingId === selectedCandidate._id || selectedCandidate.status === "rejected"}
                  id={`ats-details-reject-${selectedCandidate._id}`}
                >
                  {selectedCandidate.status === "rejected" ? "Rejected" : "Reject Candidate"}
                </button>
                <button
                  type="button"
                  className="ats-btn ats-btn--resume"
                  onClick={() => handleViewResume(selectedCandidate)}
                  id={`ats-details-resume-${selectedCandidate._id}`}
                >
                  <ExternalLink size={13} />
                  <span>View Resume</span>
                </button>
                <select
                  className="ats-details-status-select"
                  value={selectedCandidate.status}
                  onChange={(e) => handleStatusChange(selectedCandidate._id, e.target.value)}
                  disabled={updatingId === selectedCandidate._id}
                >
                  <option value="pending">Pending</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="shortlisted">Shortlisted</option>
                  <option value="selected">Selected</option>
                  <option value="rejected">Rejected</option>
                  <option value="hired">Hired</option>
                </select>
              </div>
            </div>

            {/* Profile Hero Header Card (Top of the reference screenshot) */}
            <div className="ats-profile-hero">
              <div className="ats-profile-hero__top">
                {/* Circular Profile Avatar with TalentBridge Logo */}
                <div className="ats-profile-hero__avatar-wrap">
                  <div className="ats-profile-hero__avatar">
                    <TalentBridgeLogo variant="paperplane" size={38} />
                  </div>
                </div>

                {/* Main Profile Info */}
                <div className="ats-profile-hero__info">
                  <div className="ats-profile-hero__name-row">
                    <h1 className="ats-profile-hero__name">
                      {selectedCandidate.applicantName ||
                        selectedCandidate.applicant?.name ||
                        "Anonymous Candidate"}
                    </h1>
                    <span className="ats-profile-hero__recruiter-badge">
                      <span className="ats-profile-hero__recruiter-dot">P</span>
                      <span>Paige</span>
                    </span>
                    <button type="button" className="ats-profile-hero__more-btn" title="Options">
                      <MoreVertical size={16} />
                    </button>
                  </div>

                  <div className="ats-profile-hero__meta">
                    <div className="ats-profile-hero__meta-item">

                      <span>{job?.jobTitle || "Job Position"}</span>
                    </div>
                    <div className="ats-profile-hero__meta-item">

                      <span>
                        {selectedCandidate.applicantLocation ||
                          selectedCandidate.applicantAddress ||
                          selectedCandidate.applicantPhone ||
                          "United States"}
                      </span>
                    </div>
                  </div>

                  {/* Badges / Chips Row */}
                  <div className="ats-profile-hero__chips">
                    <span className="ats-hero-chip ats-hero-chip--green">
                      <span className="ats-hero-chip__dot ats-hero-chip__dot--green" />
                      <span>Available</span>
                    </span>
                    <span className="ats-hero-chip ats-hero-chip--purple">
                      <span className="ats-hero-chip__dot ats-hero-chip__dot--purple" />
                      <span>Important</span>
                    </span>
                    <span className="ats-hero-chip ats-hero-chip--blue">
                      <Tag size={12} />
                      <span>{selectedCandidate.status === "selected" ? "Selected" : "Senior"}</span>
                    </span>
                    <span className="ats-hero-chip ats-hero-chip--plain">
                     
                    </span>
                  </div>
                </div>
              </div>

            </div>

            {/* Two-Column Main Content (matching reference layout) */}
            <div className="ats-hero-grid">
              {/* ── Left Column: Candidate Details ────────────────────────── */}
              <div className="ats-hero-col-left">
                <div className="ats-hero-card">
                  <div className="ats-hero-card__header">
                    <h2 className="ats-hero-card__title">Candidate Details</h2>
                  </div>

                  <div className="ats-hero-card__body">
                    <div className="ats-kv-table">
                      <div className="ats-kv-row">
                        <div className="ats-kv-label">Candidate Reference</div>
                        <div className="ats-kv-value">{selectedCandidate._id.slice(-8).toUpperCase()}</div>
                      </div>

                      <div className="ats-kv-row">
                        <div className="ats-kv-label">Candidate Name</div>
                        <div className="ats-kv-value">
                          {selectedCandidate.applicantName ||
                            selectedCandidate.applicant?.name ||
                            "Anonymous Candidate"}
                        </div>
                      </div>

                      <div className="ats-kv-row">
                        <div className="ats-kv-label">Job Role</div>
                        <div className="ats-kv-value">{job?.jobTitle || "Job Position"}</div>
                      </div>

                      <div className="ats-kv-row">
                        <div className="ats-kv-label">ATS Match Score</div>
                        <div className="ats-kv-value">
                          <span className={`ats-kv-score ats-score-text--${getScoreColorClass(selectedCandidate.atsScore)}`}>
                            {selectedCandidate.atsScore !== null && selectedCandidate.atsScore !== undefined
                              ? `${selectedCandidate.atsScore}% (${getScoreLabel(selectedCandidate.atsScore)} Match)`
                              : "Pending Screening"}
                          </span>
                        </div>
                      </div>

                      <div className="ats-kv-row">
                        <div className="ats-kv-label">Current Status</div>
                        <div className="ats-kv-value">
                          <span className={`ats-status-pill ats-status-pill--${selectedCandidate.status}`}>
                            {selectedCandidate.status.toUpperCase()}
                          </span>
                          {selectedCandidate.interviewInvitation?.sentAt && (
                            <span className="ats-invitation-pill" style={{ marginLeft: "0.5rem" }}>
                              Invitation Sent
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="ats-kv-row">
                        <div className="ats-kv-label">Applied Date</div>
                        <div className="ats-kv-value">
                          {new Date(selectedCandidate.createdAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </div>
                      </div>

                      <div className="ats-kv-row">
                        <div className="ats-kv-label">Candidate Email Address</div>
                        <div className="ats-kv-value ats-kv-value--email">
                          <span className="ats-kv-email-text">
                            {selectedCandidate.applicantEmail || selectedCandidate.applicant?.email || "No email"}
                          </span>
                          {selectedCandidate.applicantEmail && (
                            <button
                              type="button"
                              className="ats-compose-btn"
                              onClick={() => {
                                window.location.href = `mailto:${selectedCandidate.applicantEmail}`;
                              }}
                            >
                              COMPOSE
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="ats-kv-row">
                        <div className="ats-kv-label">Candidate Phone Number</div>
                        <div className="ats-kv-value">
                          {selectedCandidate.applicantPhone || "(+001) 50232778xx"}
                        </div>
                      </div>

                      <div className="ats-kv-row">
                        <div className="ats-kv-label">Resume Document</div>
                        <div className="ats-kv-value">
                          <button
                            type="button"
                            className="ats-resume-inline-link"
                            onClick={() => handleViewResume(selectedCandidate)}
                          >
                            <span>Attached Resume (PDF/DOC)</span>
                            <ExternalLink size={12} />
                          </button>
                        </div>
                      </div>

                      <div className="ats-kv-row">
                        <div className="ats-kv-label">Interview Invitation</div>
                        <div className="ats-kv-value">
                          {selectedCandidate.interviewInvitation?.sentAt ? (
                            <span style={{ color: "#059669", fontWeight: 600 }}>
                              Sent on {new Date(selectedCandidate.interviewInvitation.sentAt).toLocaleDateString()}
                              {selectedCandidate.interviewInvitation?.interviewTiming && (
                                <span style={{ display: "block", color: "#2563eb", fontSize: "0.82rem", marginTop: "2px" }}>
                                  🕒 {selectedCandidate.interviewInvitation.interviewTiming}
                                </span>
                              )}
                            </span>
                          ) : (
                            <span style={{ color: "#64748b" }}>Not scheduled yet</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Zoom Meeting & Interview Schedule Card ── */}
                <div className="ats-hero-card ats-zoom-card" id={`ats-zoom-section-${selectedCandidate._id}`}>
                  <div className="ats-hero-card__header ats-zoom-card__header">
                    <div className="ats-zoom-card__title-wrap">
                      <div className="ats-zoom-icon-badge">
                        <Video size={16} />
                      </div>
                      <div>
                        <h2 className="ats-hero-card__title">Zoom Meeting & Interview Schedule</h2>
                        <span className="ats-zoom-card__subtitle">Configure Zoom link and timing to dispatch to the seeker</span>
                      </div>
                    </div>
                    <span
                      className={`ats-zoom-status-pill ats-zoom-status-pill--${
                        selectedCandidate.interviewInvitation?.status === "sent"
                          ? "sent"
                          : selectedCandidate.interviewInvitation?.status === "failed"
                          ? "failed"
                          : selectedCandidate.status === "selected"
                          ? "selected"
                          : "none"
                      }`}
                    >
                      {selectedCandidate.interviewInvitation?.status === "sent"
                        ? "✓ Invite Dispatched"
                        : selectedCandidate.interviewInvitation?.status === "failed"
                        ? "⚠️ Delivery Failed"
                        : selectedCandidate.status === "selected"
                        ? "Selected"
                        : "Not Scheduled"}
                    </span>
                  </div>

                  <div className="ats-hero-card__body ats-zoom-card__body">
                    <p className="ats-zoom-intro">
                      Set the Zoom meeting URL and interview date/time below. When you select or update this candidate, an official selection email containing the Zoom link and schedule will be immediately sent to <strong>{selectedCandidate.applicantEmail || selectedCandidate.applicant?.email || "the candidate"}</strong>.
                    </p>

                    <div className="ats-zoom-form">
                      {/* Zoom Meeting Link */}
                      <div className="ats-zoom-form-group">
                        <label className="ats-zoom-label" htmlFor="ats-zoom-link-input">
                          <Video size={13} className="ats-zoom-label-icon" />
                          <span>Zoom Meeting URL</span>
                        </label>
                        <div className="ats-zoom-input-wrap">
                          <input
                            id="ats-zoom-link-input"
                            type="url"
                            className="ats-zoom-input"
                            placeholder="https://zoom.us/j/1234567890 (or paste your Zoom invite link)"
                            value={detailZoomLink}
                            onChange={(e) => setDetailZoomLink(e.target.value)}
                          />
                          {detailZoomLink && (
                            <div className="ats-zoom-input-actions">
                              <button
                                type="button"
                                className="ats-zoom-tool-btn"
                                onClick={() => handleCopyZoomLink(detailZoomLink)}
                                title="Copy Zoom meeting URL"
                              >
                                {detailCopied ? <Check size={13} color="#16a34a" /> : <Copy size={13} />}
                                <span>{detailCopied ? "Copied" : "Copy"}</span>
                              </button>
                              <a
                                href={detailZoomLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="ats-zoom-tool-btn ats-zoom-tool-btn--join"
                                title="Open Zoom link in new tab"
                              >
                                <ExternalLink size={13} />
                                <span>Join</span>
                              </a>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Interview Timing */}
                      <div className="ats-zoom-form-group">
                        <label className="ats-zoom-label" htmlFor="ats-interview-timing-input">
                          <Calendar size={13} className="ats-zoom-label-icon" />
                          <span>Interview Timing & Date</span>
                        </label>
                        <input
                          id="ats-interview-timing-input"
                          type="text"
                          className="ats-zoom-input"
                          placeholder="e.g. Tomorrow at 3:00 PM EST or Nov 2, 2026, 2:30 PM"
                          value={detailInterviewTiming}
                          onChange={(e) => setDetailInterviewTiming(e.target.value)}
                        />
                      </div>

                      {/* Recruiter Notes */}
                      <div className="ats-zoom-form-group">
                        <label className="ats-zoom-label" htmlFor="ats-interview-notes-input">
                          <Edit3 size={13} className="ats-zoom-label-icon" />
                          <span>Recruiter Note / Instructions (Optional)</span>
                        </label>
                        <textarea
                          id="ats-interview-notes-input"
                          className="ats-zoom-textarea"
                          rows={2}
                          placeholder="Special instructions (e.g. Please join 5 minutes early with webcam active and have your portfolio ready)..."
                          value={detailNotes}
                          onChange={(e) => setDetailNotes(e.target.value)}
                        />
                      </div>

                      {/* Sent summary if applicable */}
                      {selectedCandidate.interviewInvitation?.sentAt && (
                        <div className="ats-zoom-sent-box">
                          <div className="ats-zoom-sent-row">
                            <span className="ats-zoom-sent-label">Last Dispatched:</span>
                            <span className="ats-zoom-sent-value">
                              {new Date(selectedCandidate.interviewInvitation.sentAt).toLocaleString()}
                            </span>
                          </div>
                          <div className="ats-zoom-sent-row">
                            <span className="ats-zoom-sent-label">Candidate Email:</span>
                            <span className="ats-zoom-sent-value">
                              {selectedCandidate.applicantEmail || selectedCandidate.applicant?.email}
                            </span>
                          </div>
                          {selectedCandidate.interviewInvitation.interviewTiming && (
                            <div className="ats-zoom-sent-row">
                              <span className="ats-zoom-sent-label">Scheduled Timing:</span>
                              <span className="ats-zoom-sent-value" style={{ color: "#1d4ed8", fontWeight: 700 }}>
                                🕒 {selectedCandidate.interviewInvitation.interviewTiming}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Submit / Dispatch button */}
                      <div className="ats-zoom-footer-actions">
                        <button
                          type="button"
                          className="ats-btn ats-btn--select ats-zoom-send-btn"
                          onClick={handleSaveAndSendInterview}
                          disabled={selectingId === selectedCandidate._id}
                          id="ats-zoom-submit-btn"
                        >
                          {selectingId === selectedCandidate._id ? (
                            "Sending Selection Email…"
                          ) : selectedCandidate.status === "selected" ? (
                            <>
                              <Mail size={14} />
                              <span>Update Schedule & Resend Email</span>
                            </>
                          ) : (
                            <>
                              <Mail size={14} />
                              <span>Select Candidate & Send Email with Zoom Link</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Right Column: Skills & Recent History ─────────────────── */}
              <div className="ats-hero-col-right">
                {/* Skills Card */}
                <div className="ats-hero-card">
                  <div className="ats-hero-card__header ats-hero-card__header--flex">
                    <h2 className="ats-hero-card__title">Skills</h2>
                    <button type="button" className="ats-hero-card__add-btn" title="Add or view skills">
                      <Plus size={14} />
                    </button>
                  </div>

                  <div className="ats-hero-card__body">
                    <div className="ats-skills-wrap">
                      {(selectedCandidate.matchedKeywords || []).map((kw, i) => (
                        <div key={i} className="ats-skill-pill-img">
                          <span className="ats-skill-badge-num">10</span>
                          <span className="ats-skill-label-text">{kw}</span>
                        </div>
                      ))}

                      {(selectedCandidate.missingKeywords || []).map((kw, i) => (
                        <div key={i} className="ats-skill-pill-img ats-skill-pill-img--missing">
                          <span className="ats-skill-badge-num ats-skill-badge-num--missing">!</span>
                          <span className="ats-skill-label-text">{kw}</span>
                        </div>
                      ))}

                      {(!selectedCandidate.matchedKeywords || selectedCandidate.matchedKeywords.length === 0) &&
                        (!selectedCandidate.missingKeywords || selectedCandidate.missingKeywords.length === 0) && (
                          <div className="ats-empty-hint" style={{ padding: "0.5rem 0" }}>
                            No specific keywords extracted yet.
                          </div>
                        )}
                    </div>
                  </div>
                </div>

                {/* Recent History Card */}
                <div className="ats-hero-card" style={{ marginTop: "1rem" }}>
                  <div className="ats-hero-card__header">
                    <h2 className="ats-hero-card__title">Recent History</h2>
                  </div>

                  <div className="ats-hero-card__body">
                    <div className="ats-history-list">
                      {selectedCandidate.interviewInvitation?.sentAt && (
                        <div className="ats-history-item">
                          <div className="ats-history-item__avatar">
                            <span className="ats-history-avatar-text">P</span>
                          </div>
                          <div className="ats-history-item__content">
                            <div className="ats-history-item__text">
                              <span className="ats-history-actor">Paige</span> moved candidate{" "}
                              <span className="ats-history-target">
                                {selectedCandidate.applicantName || "Candidate"}
                              </span>{" "}
                              to stage Interview Scheduled
                            </div>
                            <div className="ats-history-item__date">
                              {new Date(selectedCandidate.interviewInvitation.sentAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="ats-history-item">
                        <div className="ats-history-item__avatar ats-history-item__avatar--ai">
                          <Sparkles size={12} />
                        </div>
                        <div className="ats-history-item__content">
                          <div className="ats-history-item__text">
                            <span className="ats-history-actor">Gemini ATS</span> screened candidate with{" "}
                            <strong>{selectedCandidate.atsScore ?? 0}%</strong> qualification match
                          </div>
                          <div className="ats-history-item__date">
                            {new Date(selectedCandidate.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      <div className="ats-history-item">
                        <div className="ats-history-item__avatar">
                          <User size={12} />
                        </div>
                        <div className="ats-history-item__content">
                          <div className="ats-history-item__text">
                            <span className="ats-history-actor">
                              {selectedCandidate.applicantName || "Candidate"}
                            </span>{" "}
                            submitted application for{" "}
                            <span className="ats-history-target">{job?.jobTitle || "Job Position"}</span>
                          </div>
                          <div className="ats-history-item__date">
                            {new Date(selectedCandidate.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>

                    {selectedCandidate.atsExplanation && (
                      <div className="ats-hero-eval-box">
                        <div className="ats-hero-eval-title">ATS Recommendation & Summary</div>
                        <div className="ats-hero-eval-text">{selectedCandidate.atsExplanation}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ── VIEW 2: ATS Ranking Dashboard (Table Layout) ────────────────── */
          <>
            {/* Header Title */}
            <div className="ats-page-heading">
              <h1 className="ats-page-title">Candidate ATS Ranking</h1>
              <p className="ats-page-desc">
                {job?.jobTitle || "Job"} · Candidates evaluated and ranked by qualification match
              </p>
            </div>

            {/* Toolbar (Search & Sort) */}
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
                    <button
                      className="ats-search-clear"
                      onClick={() => setSearchQuery("")}
                      aria-label="Clear search"
                    >
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
                    <span>Sort: {SORT_LABELS[sortMode]}</span>
                    <ChevronDown size={14} />
                  </button>
                  {showSortMenu && (
                    <div className="ats-sort-dropdown">
                      {Object.entries(SORT_LABELS).map(([key, label]) => (
                        <button
                          key={key}
                          className={`ats-sort-option${sortMode === key ? " ats-sort-option--active" : ""}`}
                          onClick={() => {
                            setSortMode(key);
                            setShowSortMenu(false);
                          }}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Content States */}
            {loading ? (
              <div className="ats-state-box">
                <div className="ats-spinner" />
                <span>Loading and evaluating candidates…</span>
              </div>
            ) : error ? (
              <div className="ats-error-banner">
                <div>
                  <strong>Failed to load applications:</strong> {error}
                </div>
                <button className="ats-btn ats-btn--retry" onClick={() => fetchApplications(false)}>
                  Try Again
                </button>
              </div>
            ) : applications.length === 0 ? (
              <div className="ats-state-box">
                <h3 className="ats-state-title">No applications yet</h3>
                <p className="ats-state-desc">
                  Candidates who apply to this job will appear here ranked by their ATS match score.
                </p>
              </div>
            ) : (
              <>
                {/* ── Table: Ranked Candidates (Minimalist Layout matching reference) ── */}
                {filteredScored.length > 0 && (
                  <div className="ats-table-card ats-table-card--minimal">
                    <div className="ats-table-responsive">
                      <table className="ats-table ats-table--minimal" id="ats-candidates-table">
                        <thead>
                          <tr>
                            <th className="ats-th-no">No.</th>
                            <th className="ats-th-player">Player name</th>
                            <th className="ats-th-baseline">Baseline ID</th>
                            <th className="ats-th-club">Club</th>
                            <th className="ats-th-ranking">
                              <span className="ats-th-ranking-wrap">
                                <span>Ranking</span>
                                <HelpCircle size={13} className="ats-th-help-icon" />
                              </span>
                            </th>
                            <th className="ats-th-diff">+/-</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredScored.map((app, idx) => {
                            const rank = idx + 1;
                            const name = app.applicantName || app.applicant?.name || "Anonymous";
                            const baselineId = getBaselineId(app._id);
                            const isSelected = app.status === "selected";
                            const diff = isSelected ? "+1" : "0";

                            return (
                              <tr
                                key={app._id}
                                id={`ats-row-${app._id}`}
                                className="ats-table-row ats-table-row--minimal"
                                onClick={() => setSelectedCandidate(app)}
                                title="Click to view candidate details"
                              >
                                <td className="ats-td-no">{rank}</td>
                                <td className="ats-td-player">
                                  <div className="ats-player-cell">
                                    <div className="ats-player-logo-badge">
                                      <TalentBridgeLogo variant="paperplane" size={20} />
                                    </div>
                                    <div className="ats-player-info">
                                      <span className="ats-player-name">{name}</span>
                                      <span className="ats-player-sub">
                                        {app.applicantLocation || app.applicantEmail || "Applicant"}
                                        {app.interviewInvitation?.zoomLink && (
                                          <span className="ats-table-zoom-pill" title={`Zoom scheduled: ${app.interviewInvitation.interviewTiming || 'Pending timing'}`}>
                                            <Video size={10} />
                                            <span>Zoom</span>
                                          </span>
                                        )}
                                      </span>
                                    </div>
                                  </div>
                                </td>
                                <td className="ats-td-baseline">
                                  <span className="ats-baseline-pill">
                                    <Link2 size={13} className="ats-baseline-icon" />
                                    <span>{baselineId}</span>
                                  </span>
                                </td>
                                <td className="ats-td-club">
                                  <span className="ats-club-text">{job?.jobTitle || "Job Position"}</span>
                                </td>
                                <td className="ats-td-ranking">
                                  <span className="ats-ranking-num">
                                    {app.atsScore !== null && app.atsScore !== undefined ? app.atsScore : 0}
                                  </span>
                                </td>
                                <td className="ats-td-diff">
                                  <span className="ats-diff-num">{diff}</span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* ── Table: Awaiting ATS Screening ───────────────────────── */}
                {filteredPending.length > 0 && (
                  <div className="ats-pending-section">
                    <h2 className="ats-subtable-heading">
                      Awaiting Screening ({filteredPending.length})
                    </h2>
                    <div className="ats-table-card ats-table-card--minimal">
                      <div className="ats-table-responsive">
                        <table className="ats-table ats-table--minimal">
                          <thead>
                            <tr>
                              <th className="ats-th-no">No.</th>
                              <th className="ats-th-player">Player name</th>
                              <th className="ats-th-baseline">Baseline ID</th>
                              <th className="ats-th-club">Club</th>
                              <th className="ats-th-ranking">
                                <span className="ats-th-ranking-wrap">
                                  <span>Ranking</span>
                                  <HelpCircle size={13} className="ats-th-help-icon" />
                                </span>
                              </th>
                              <th className="ats-th-diff">+/-</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredPending.map((app, idx) => {
                              const name = app.applicantName || app.applicant?.name || "Anonymous";
                              const baselineId = getBaselineId(app._id);
                              const isFailed = app.atsStatus === "failed";
                              const isProcessing = app.atsStatus === "processing";

                              return (
                                <tr
                                  key={app._id}
                                  id={`ats-row-${app._id}`}
                                  className="ats-table-row ats-table-row--minimal"
                                  onClick={() => setSelectedCandidate(app)}
                                  title="Click to view candidate details"
                                >
                                  <td className="ats-td-no">{idx + 1}</td>
                                  <td className="ats-td-player">
                                    <div className="ats-player-cell">
                                      <div className="ats-player-logo-badge">
                                        <TalentBridgeLogo variant="paperplane" size={20} />
                                      </div>
                                      <div className="ats-player-info">
                                        <span className="ats-player-name">{name}</span>
                                        <span className="ats-player-sub">
                                          {app.applicantLocation || app.applicantEmail || "Applicant"}
                                          {app.interviewInvitation?.zoomLink && (
                                            <span className="ats-table-zoom-pill" title={`Zoom scheduled: ${app.interviewInvitation.interviewTiming || 'Pending timing'}`}>
                                              <Video size={10} />
                                              <span>Zoom</span>
                                            </span>
                                          )}
                                        </span>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="ats-td-baseline">
                                    <span className="ats-baseline-pill">
                                      <Link2 size={13} className="ats-baseline-icon" />
                                      <span>{baselineId}</span>
                                    </span>
                                  </td>
                                  <td className="ats-td-club">
                                    <span className="ats-club-text">{job?.jobTitle || "Job Position"}</span>
                                  </td>
                                  <td className="ats-td-ranking">
                                    <span className="ats-pending-badge">
                                      {isFailed ? "Failed" : isProcessing ? "Processing…" : "Pending"}
                                    </span>
                                  </td>
                                  <td className="ats-td-diff">
                                    <span className="ats-diff-num">0</span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* Empty search state */}
                {q && filteredScored.length === 0 && filteredPending.length === 0 && (
                  <div className="ats-state-box">
                    <h3 className="ats-state-title">No candidates match "{searchQuery}"</h3>
                    <p className="ats-state-desc">Try searching with a different candidate name or email.</p>
                    <button className="ats-btn ats-btn--secondary" onClick={() => setSearchQuery("")}>
                      Clear search
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>

      {/* ── Selection Confirmation Modal ────────────────────────────────────── */}
      {confirmCandidate && (
        <div
          className="ats-modal-backdrop"
          onClick={() => !selectingId && setConfirmCandidate(null)}
        >
          <div className="ats-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ats-modal__header">
              <h3 className="ats-modal__title">Select Candidate for Interview</h3>
              <button
                className="ats-modal__close"
                onClick={() => !selectingId && setConfirmCandidate(null)}
                aria-label="Close dialog"
              >
                ×
              </button>
            </div>
            <div className="ats-modal__body">
              <p className="ats-modal__lead">
                Confirm selection of <strong>{confirmCandidate.applicantName || confirmCandidate.applicant?.name || "this candidate"}</strong> for the position of <strong>{job?.jobTitle || "Job"}</strong>.
              </p>
              <div className="ats-modal__details">
                <div className="ats-modal__row">
                  <span className="ats-modal__label">Candidate:</span>
                  <span className="ats-modal__val">
                    {confirmCandidate.applicantName || confirmCandidate.applicant?.name || "Anonymous"}
                  </span>
                </div>
                <div className="ats-modal__row">
                  <span className="ats-modal__label">Recipient Email:</span>
                  <span className="ats-modal__val">
                    {confirmCandidate.applicantEmail || confirmCandidate.applicant?.email || "No email on file"}
                  </span>
                </div>
                <div className="ats-modal__row">
                  <span className="ats-modal__label">ATS Match Score:</span>
                  <span className="ats-modal__val">
                    {confirmCandidate.atsScore !== null && confirmCandidate.atsScore !== undefined
                      ? `${confirmCandidate.atsScore}%`
                      : "Not evaluated"}
                  </span>
                </div>
              </div>

              {/* Modal Inputs for Zoom Link, Timing, Notes */}
              <div className="ats-modal__inputs">
                <div className="ats-modal__field">
                  <label className="ats-modal__input-label" htmlFor="modal-zoom-link-input">
                    <Video size={13} />
                    <span>Zoom Meeting URL</span>
                  </label>
                  <input
                    type="url"
                    id="modal-zoom-link-input"
                    className="ats-modal__input"
                    placeholder="https://zoom.us/j/1234567890 (or paste your Zoom invite)"
                    value={modalZoomLink}
                    onChange={(e) => setModalZoomLink(e.target.value)}
                  />
                </div>

                <div className="ats-modal__field">
                  <label className="ats-modal__input-label" htmlFor="modal-interview-timing-input">
                    <Calendar size={13} />
                    <span>Interview Timing & Date</span>
                  </label>
                  <input
                    type="text"
                    id="modal-interview-timing-input"
                    className="ats-modal__input"
                    placeholder="e.g. Tomorrow at 3:00 PM EST or Nov 2, 2026, 2:30 PM"
                    value={modalInterviewTiming}
                    onChange={(e) => setModalInterviewTiming(e.target.value)}
                  />
                </div>

                <div className="ats-modal__field">
                  <label className="ats-modal__input-label" htmlFor="modal-notes-input">
                    <Edit3 size={13} />
                    <span>Recruiter Note / Instructions (Optional)</span>
                  </label>
                  <textarea
                    id="modal-notes-input"
                    className="ats-modal__textarea"
                    rows={2}
                    placeholder="Any special notes or preparation requirements for the candidate..."
                    value={modalNotes}
                    onChange={(e) => setModalNotes(e.target.value)}
                  />
                </div>
              </div>

              <p className="ats-modal__notice">
                {confirmCandidate.status === "selected"
                  ? "This candidate has already been selected. Confirming will update their interview schedule and dispatch an updated selection email with the Zoom link and timing to their inbox."
                  : "Upon confirmation, this candidate's status will update to Selected, and an official selection email containing the Zoom meeting link and interview timing will be sent directly to their email address."}
              </p>
            </div>
            <div className="ats-modal__footer">
              <button
                className="ats-modal__btn ats-modal__btn--cancel"
                onClick={() => setConfirmCandidate(null)}
                disabled={selectingId === confirmCandidate._id}
              >
                Cancel
              </button>
              <button
                className="ats-modal__btn ats-modal__btn--confirm"
                onClick={() => handleConfirmSelection(confirmCandidate.status === "selected")}
                disabled={selectingId === confirmCandidate._id}
                id="ats-confirm-select-btn"
              >
                {selectingId === confirmCandidate._id
                  ? "Sending Invitation…"
                  : confirmCandidate.status === "selected"
                    ? "Resend Invitation Email"
                    : "Confirm Selection & Send Invite"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
