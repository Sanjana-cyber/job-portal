import React from "react";
import { Users, Search, FileText, LayoutDashboard } from "lucide-react";
import { useNavigate } from "react-router-dom";
import TalentBridgeLogo from "../TalentBridgeLogo/TalentBridgeLogo";
import heroImg from "./hero.png";
import { useAuthModal } from "../../context/AuthModalContext";
import "./HeroSection.css";

function HeroSection() {
  const navigate = useNavigate();
  const { user, openModal } = useAuthModal();

  const handleSearchClick = () => {
    navigate("/seeker/jobs");
  };

  const handleBuildResumeClick = () => {
    navigate("/seeker/resume-builder");
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
              className="hero__circular-btn hero__circular-btn--search"
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
            <span className="hero__circular-label hero__circular-label--resume">Build Resume</span>
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
    </section>
  );
}

export default HeroSection;
