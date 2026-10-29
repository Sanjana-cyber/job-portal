import React, { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { verifyInterviewInvitation } from "../../services/api";
import "./InterviewInvitationPage.css";

export default function InterviewInvitationPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("verifying"); // 'valid' | 'invalid' | 'expired' | 'completed'
  const [invitationData, setInvitationData] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [showAiNotice, setShowAiNotice] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function checkToken() {
      if (!token) {
        if (isMounted) {
          setStatus("invalid");
          setErrorMessage("No invitation token was provided in the link. Please check the URL in your email.");
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      try {
        const res = await verifyInterviewInvitation(token);
        if (!isMounted) return;

        if (res?.valid && res?.data) {
          setStatus("valid");
          setInvitationData(res.data);
        } else if (res?.reason === "expired") {
          setStatus("expired");
          setErrorMessage(res.message || "This interview invitation has expired.");
          if (res.data) setInvitationData(res.data);
        } else if (res?.reason === "completed") {
          setStatus("completed");
          setErrorMessage(res.message || "This interview invitation has already been completed.");
        } else {
          setStatus("invalid");
          setErrorMessage(res?.message || "This invitation link is not valid.");
        }
      } catch (err) {
        if (!isMounted) return;
        const reason = err?.data?.reason;
        if (reason === "expired" || err?.status === 410) {
          setStatus("expired");
          setErrorMessage(err?.message || "This interview invitation has expired.");
          if (err?.data?.data) setInvitationData(err.data.data);
        } else {
          setStatus("invalid");
          setErrorMessage(err?.message || "Invalid or unverified interview invitation link.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    checkToken();
    return () => {
      isMounted = false;
    };
  }, [token]);

  return (
    <div className="interview-page">
      {/* ── Top Navbar ─────────────────────────────────────────────────── */}
      <nav className="interview-navbar">
        <Link to="/" className="interview-navbar__brand">
          <span>Talent Bridge</span>
        </Link>
        <span className="interview-navbar__badge">Candidate Portal</span>
      </nav>

      {/* ── Main Canvas ────────────────────────────────────────────────── */}
      <div className="interview-container">
        {loading ? (
          <div className="interview-status-card">
            <div className="interview-spinner" />
            <h2 className="interview-status-title">Authenticating Invitation</h2>
            <p className="interview-status-desc">
              Verifying your secure invitation credentials with Talent Bridge…
            </p>
          </div>
        ) : status === "expired" ? (
          <div className="interview-status-card">
            <h2 className="interview-status-title">Invitation Expired</h2>
            <p className="interview-status-desc">
              {errorMessage ||
                `This interview invitation has expired. Please contact the recruitment team at ${
                  invitationData?.companyName || "the company"
                } to request a new invitation link.`}
            </p>
            <Link to="/" className="interview-return-btn">
              Back to Home
            </Link>
          </div>
        ) : status === "completed" ? (
          <div className="interview-status-card">
            <h2 className="interview-status-title">Interview Completed</h2>
            <p className="interview-status-desc">
              {errorMessage || "You have already completed this stage of the interview process. Thank you!"}
            </p>
            <Link to="/" className="interview-return-btn">
              Back to Home
            </Link>
          </div>
        ) : status === "invalid" ? (
          <div className="interview-status-card">
            <h2 className="interview-status-title">Invalid Invitation</h2>
            <p className="interview-status-desc">
              {errorMessage ||
                "This invitation link is invalid or incomplete. Please check the URL in your email or contact the recruiter."}
            </p>
            <Link to="/" className="interview-return-btn">
              Back to Home
            </Link>
          </div>
        ) : (
          <div className="interview-card">
            {/* Header Badge */}
            <div className="interview-card__badge-row">
              <span className="interview-verified-badge">
                Official Interview Invitation
              </span>
              {invitationData?.expiresAt && (
                <span className="interview-expiry-tag">
                  Valid until {new Date(invitationData.expiresAt).toLocaleDateString()}
                </span>
              )}
            </div>

            {/* Position & Company */}
            <h1 className="interview-card__title">
              {invitationData?.jobTitle || "Job Position"}
            </h1>
            <div className="interview-card__company">
              {invitationData?.companyName || "Talent Bridge Partner"}
            </div>

            {/* Job Metadata */}
            <div className="interview-meta-row">
              <span className="interview-meta-item">
                Job Type: <strong>{invitationData?.jobType || "Full-time"}</strong>
              </span>
              <span className="interview-meta-item">
                Location: <strong>{invitationData?.location || "Remote"}</strong>
              </span>
            </div>

            {/* Greeting & Text */}
            <div className="interview-card__greeting">
              Dear {invitationData?.candidateName || "Candidate"},
            </div>
            <p className="interview-card__text">
              Congratulations! You have been selected to proceed to the next stage of the recruitment process for the position of <strong>{invitationData?.jobTitle}</strong> at <strong>{invitationData?.companyName}</strong>.
            </p>
            <p className="interview-card__text">
              Click the button below to access your interview session. Please ensure you are in a quiet environment when you begin.
            </p>

            {/* Actions */}
            <div className="interview-action-section">
              <button
                className="interview-primary-btn"
                onClick={() => setShowAiNotice(true)}
                id="continue-interview-btn"
              >
                Continue to Interview
              </button>

              {showAiNotice && (
                <div className="interview-notice-box" id="interview-ai-notice">
                  <strong>Interview Session Preparation</strong>
                  The AI interview experience will be available here. Your invitation has been successfully authenticated, and this stage is currently in preparation. Thank you for your patience!
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="interview-footer">
        © {new Date().getFullYear()} Talent Bridge Recruitment Platform. Secure Candidate Portal.
      </footer>
    </div>
  );
}
