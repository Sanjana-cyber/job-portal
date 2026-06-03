import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AuthModal from "../components/AuthModal";
import {
  Search,
  Briefcase,
  Users,
  ArrowRight,
  ArrowUpRight,
  Shield,
  Zap,
  Globe,
  CheckCircle,
} from "lucide-react";

/**
 * Home Page — Public Landing Page
 * Features:
 * - Hero section with dark navy background and role cards
 * - Features section
 * - About section
 * - Auth modal opens on role card click
 */
const HomePage = () => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState("jobseeker");
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  // Redirect authenticated users to their dashboard
  useEffect(() => {
    if (isAuthenticated && user) {
      const routes = {
        jobseeker: "/dashboard",
        recruiter: "/recruiter/dashboard",
        admin: "/admin",
      };
      navigate(routes[user.role] || "/");
    }
  }, [isAuthenticated, user, navigate]);

  const handleRoleClick = (role) => {
    setSelectedRole(role);
    setShowAuthModal(true);
  };

  return (
    <div className="home-page">

      {/* ── Hero ────────────────────────────────────────── */}
      <section className="hero-section" id="hero-section">
        <div className="hero-inner">

          {/* Left — Headline */}
          <div className="hero-content animate-fade-in-up">
            <div className="hero-eyebrow">
              <Zap size={12} />
              <span>AI-Driven ATS Platform</span>
            </div>

            <h1 className="hero-title">
              Where Talent Meets<br />
              <em className="accent">Opportunity</em>
            </h1>

            <p className="hero-description">
              A modern hiring platform connecting exceptional candidates
              with forward-thinking companies. Built for clarity, speed,
              and results.
            </p>

            <div className="hero-cta">
              <button
                className="btn-hero-primary"
                onClick={() => handleRoleClick("jobseeker")}
                id="hero-find-jobs-btn"
              >
                Find Jobs
                <ArrowRight size={16} />
              </button>
              <button
                className="btn-hero-secondary"
                onClick={() => handleRoleClick("recruiter")}
                id="hero-hire-talent-btn"
              >
                Hire Talent
              </button>
            </div>
          </div>

          {/* Right — Role Cards */}
          <div className="hero-cards" id="role-cards">

            {/* Job Seeker Card */}
            <div
              className="role-card card-jobseeker animate-fade-in-up"
              onClick={() => handleRoleClick("jobseeker")}
              id="card-jobseeker"
            >
              <div className="card-header-row">
                <div className="card-icon-wrapper">
                  <Search size={22} />
                </div>
                <ArrowUpRight size={18} className="card-arrow" />
              </div>
              <h3 className="card-title">Job Seeker</h3>
              <p className="card-description">
                Discover roles matched to your skills and experience.
                Apply with one click and track every application.
              </p>
              <ul className="card-features">
                <li>
                  <CheckCircle size={13} />
                  AI-powered job matching
                </li>
                <li>
                  <CheckCircle size={13} />
                  Resume builder & ATS check
                </li>
                <li>
                  <CheckCircle size={13} />
                  Real-time application tracking
                </li>
              </ul>
              <div className="card-action">
                <span>Get Started</span>
                <ArrowRight size={14} />
              </div>
            </div>

            {/* Recruiter Card */}
            <div
              className="role-card card-recruiter animate-fade-in-up"
              onClick={() => handleRoleClick("recruiter")}
              id="card-recruiter"
              style={{ animationDelay: "0.1s" }}
            >
              <div className="card-header-row">
                <div className="card-icon-wrapper">
                  <Users size={22} />
                </div>
                <ArrowUpRight size={18} className="card-arrow" />
              </div>
              <h3 className="card-title">Recruiter</h3>
              <p className="card-description">
                Post roles, screen candidates intelligently, and manage
                your entire hiring pipeline from one dashboard.
              </p>
              <ul className="card-features">
                <li>
                  <CheckCircle size={13} />
                  Smart candidate filtering
                </li>
                <li>
                  <CheckCircle size={13} />
                  Integrated applicant tracking
                </li>
                <li>
                  <CheckCircle size={13} />
                  Pipeline analytics
                </li>
              </ul>
              <div className="card-action">
                <span>Start Hiring</span>
                <ArrowRight size={14} />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────── */}
      <section className="features-section" id="features">
        <div className="section-label">
          <Briefcase size={12} />
          Why TalentBridge
        </div>
        <h2 className="section-title">
          Built for modern hiring
        </h2>
        <p>
          Everything you need to find the right role or the right person —
          without the noise.
        </p>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">
              <Shield size={20} />
            </div>
            <h4>Enterprise Security</h4>
            <p>End-to-end encryption and SOC 2-compliant infrastructure protect every interaction.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <Zap size={20} />
            </div>
            <h4>Instant Matching</h4>
            <p>Semantic AI surfaces the most relevant roles and candidates in seconds, not hours.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <Globe size={20} />
            </div>
            <h4>Global Reach</h4>
            <p>Access remote-first and location-based roles across every major industry and market.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <Briefcase size={20} />
            </div>
            <h4>ATS-Optimized</h4>
            <p>Resume parsing and scoring tools ensure candidates pass automated screening with confidence.</p>
          </div>
        </div>
      </section>

      {/* ── About ───────────────────────────────────────── */}
      <section className="about-section" id="about">
        <h2 className="section-title">
          About <span className="gradient-text">TalentBridge</span>
        </h2>
        <p>
          TalentBridge is an AI-driven Applicant Tracking System and job board
          designed to make hiring human again. We give job seekers the tools to
          present themselves effectively and recruiters the intelligence to hire
          with confidence — all in one streamlined platform.
        </p>
      </section>

      {/* ── Footer ──────────────────────────────────────── */}
      <footer className="home-footer">
        <p>© {new Date().getFullYear()} TalentBridge. All rights reserved.</p>
      </footer>

      {/* ── Auth Modal ──────────────────────────────────── */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        role={selectedRole}
      />
    </div>
  );
};

export default HomePage;
