import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, CheckCircle2, ArrowRight, ShieldCheck, Home } from "lucide-react";
import TalentBridgeLogo from "../components/TalentBridgeLogo/TalentBridgeLogo";
import { useAuthModal } from "../context/AuthModalContext";
import "./LogoutPage.css";

export default function LogoutPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthModal();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoggedOut, setIsLoggedOut] = useState(!user);

  // If user lands here while logged in and wants to log out
  const handleLogout = async () => {
    setIsProcessing(true);
    try {
      await logout();
      setIsLoggedOut(true);
    } catch {
      // Even if API fails, user state is cleared
      setIsLoggedOut(true);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGoHome = () => {
    navigate("/");
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    setTimeout(() => {
      const hero = document.getElementById("hero");
      if (hero) hero.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  return (
    <div className="logout-page">
      {/* Background Decorative Accents */}
      <div className="logout-page__glow logout-page__glow--1" aria-hidden="true" />
      <div className="logout-page__glow logout-page__glow--2" aria-hidden="true" />

      <div className="logout-container">
        {/* Brand Header */}
        <div className="logout-brand" onClick={handleGoHome} role="button" tabIndex={0}>
          <TalentBridgeLogo variant="paperplane" size={36} />
          <span className="logout-brand__title">TALENT BRIDGE</span>
        </div>

        {/* Card */}
        <div className="logout-card">
          {user && !isLoggedOut ? (
            /* Active User Confirmation View */
            <div className="logout-card__content">
              <div className="logout-card__icon-wrapper logout-card__icon-wrapper--warn">
                <LogOut size={32} className="logout-card__icon" />
              </div>

              <h1 className="logout-card__heading">Confirm Sign Out</h1>
              <p className="logout-card__subheading">
                Are you sure you want to log out of your TalentBridge account?
              </p>

              <div className="logout-user-box">
                <div className="logout-user-avatar">
                  {user.name
                    ? user.name
                        .split(" ")
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase()
                    : "U"}
                </div>
                <div className="logout-user-meta">
                  <span className="logout-user-name">{user.name || "Authenticated User"}</span>
                  <span className="logout-user-email">{user.email}</span>
                  <span className="logout-user-role">
                    {user.role === "recruiter" ? "Recruiter" : "Job Seeker"}
                  </span>
                </div>
              </div>

              <div className="logout-info-pill">
                <ShieldCheck size={16} className="text-blue" />
                <span>Your session will end securely and return to the main hero section.</span>
              </div>

              <div className="logout-card__actions">
                <button
                  type="button"
                  className="logout-btn logout-btn--cancel"
                  onClick={() => navigate(-1)}
                  disabled={isProcessing}
                >
                  Stay Signed In
                </button>
                <button
                  type="button"
                  className="logout-btn logout-btn--danger"
                  onClick={handleLogout}
                  disabled={isProcessing}
                  id="confirm-logout-btn"
                >
                  {isProcessing ? (
                    <>
                      <span className="logout-spinner" />
                      <span>Logging out…</span>
                    </>
                  ) : (
                    <>
                      <LogOut size={16} />
                      <span>Log Out Now</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* Logged Out / Success View */
            <div className="logout-card__content">
              <div className="logout-card__icon-wrapper logout-card__icon-wrapper--success">
                <CheckCircle2 size={34} className="logout-card__icon logout-card__icon--green" />
              </div>

              <h1 className="logout-card__heading">You're Signed Out</h1>
              <p className="logout-card__subheading">
                Thank you for using TalentBridge. You have been safely logged out.
              </p>

              <div className="logout-success-details">
                <div className="logout-check-line">
                  <CheckCircle2 size={16} className="text-emerald" />
                  <span>Session tokens and credentials cleared</span>
                </div>
                <div className="logout-check-line">
                  <CheckCircle2 size={16} className="text-emerald" />
                  <span>Resume drafts saved safely on this device</span>
                </div>
              </div>

              <div className="logout-card__actions">
                <button
                  type="button"
                  className="logout-btn logout-btn--primary"
                  onClick={handleGoHome}
                  id="return-hero-btn"
                >
                  <Home size={16} />
                  <span>Go to Hero Section</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <p className="logout-footer-note">
          Need to access your account again? You can sign in anytime from the hero section or jobs board.
        </p>
      </div>
    </div>
  );
}
