import React from "react";
import { useAuthModal } from "../context/AuthModalContext";
import TalentBridgeLogo from "../components/TalentBridgeLogo/TalentBridgeLogo";
import "./Pages.css";

export default function SeekerPage() {
  const { user, logout } = useAuthModal();

  return (
    <div className="page-container">
      {/* Top Header */}
      <header className="page-header">
        <div className="page-brand">
          <TalentBridgeLogo variant="paperplane" style={{ width: 32, height: 32 }} />
          <span className="page-brand-name">TALENT BRIDGE</span>
          <span className="page-badge page-badge--seeker">Job Seeker</span>
        </div>
        <button className="page-logout-btn" onClick={logout} id="seeker-logout-btn">
          Logout
        </button>
      </header>

      {/* Main Dummy Content */}
      <main className="page-main">
        <div className="page-card">
          <div className="page-icon-wrap">🎯</div>
          <h1 className="page-title">Job Seeker Page</h1>
          <p className="page-subtitle">
            Welcome, <strong>{user?.name || "Job Seeker"}</strong>! You are successfully authenticated.
          </p>

          <div className="page-info-box">
            <div className="page-info-row">
              <span className="page-label">Email:</span>
              <span className="page-value">{user?.email || "N/A"}</span>
            </div>
            <div className="page-info-row">
              <span className="page-label">Role:</span>
              <span className="page-value">{user?.role || "jobseeker"}</span>
            </div>
          </div>

          <p className="page-note">
            This is your dummy job seeker page. You can add job search, application history, and resume upload features here next.
          </p>

          <button className="page-action-btn" onClick={logout}>
            Logout & Return to Home
          </button>
        </div>
      </main>
    </div>
  );
}
