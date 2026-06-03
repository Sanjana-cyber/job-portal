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
  Mail,
  Phone,
  MessageCircle,
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
        {/* Golden wave decoration */}
        <div className="hero-waves">
          <svg viewBox="0 0 1440 320" preserveAspectRatio="none" className="wave wave-1">
            <path d="M0,224L60,213.3C120,203,240,181,360,186.7C480,192,600,224,720,234.7C840,245,960,235,1080,213.3C1200,192,1320,160,1380,144L1440,128L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z" />
          </svg>
          <svg viewBox="0 0 1440 320" preserveAspectRatio="none" className="wave wave-2">
            <path d="M0,288L48,272C96,256,192,224,288,213.3C384,203,480,213,576,229.3C672,245,768,267,864,261.3C960,256,1056,224,1152,208C1248,192,1344,192,1392,192L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z" />
          </svg>
          <div className="hero-shimmer"></div>
        </div>

        <div className="hero-center animate-fade-in-up">
          <h1 className="hero-brand-name">
            TalentBridge
          </h1>
          <p className="hero-tagline">Where talent meets opportunity</p>
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
        <div className="footer-container">
          <div className="footer-brand-col">
            <div className="footer-logo">
              <span className="logo-icon"><Briefcase size={18} /></span>
              <span className="logo-text">Talent<em>Bridge</em></span>
            </div>
            <p className="footer-brand-description">
              Next-generation Applicant Tracking System and recruitment engine, bringing clarity, speed, and precision to the hiring ecosystem.
            </p>
          </div>

          <div className="footer-links-col">
            <h4 className="footer-col-title">Quick Links</h4>
            <ul className="footer-links-list">
              <li><a href="#hero-section">Home</a></li>
              <li><a href="#features">Features</a></li>
              <li><a href="#about">About Us</a></li>
              <li><span className="footer-link-dummy" onClick={() => handleRoleClick("jobseeker")}>Find a Job</span></li>
              <li><span className="footer-link-dummy" onClick={() => handleRoleClick("recruiter")}>Post a Job</span></li>
            </ul>
          </div>

          <div className="footer-contact-col">
            <h4 className="footer-col-title">Contact Information</h4>
            <ul className="footer-contact-list">
              <li className="contact-person">
                <strong>Sanjana Pandey</strong>
                <span className="person-role">Platform Administrator</span>
              </li>
              <li>
                <a href="mailto:sanjanpandey29256@gmail.com" className="contact-item">
                  <Mail size={16} />
                  <span>sanjanpandey29256@gmail.com</span>
                </a>
              </li>
              <li>
                <a href="tel:9877932989" className="contact-item">
                  <Phone size={16} />
                  <span>+91 98779 32989</span>
                </a>
              </li>
              <li>
                <a href="https://wa.me/919877932989" target="_blank" rel="noopener noreferrer" className="contact-item whatsapp-link">
                  <MessageCircle size={16} />
                  <span>WhatsApp: +91 98779 32989</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom-bar">
          <p>© {new Date().getFullYear()} TalentBridge. All rights reserved.</p>
        </div>
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
