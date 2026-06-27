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

      {/* ── Resume Showcase Section ──────────────────────── */}
      <section className="resume-showcase-section">
        <div className="showcase-container">
          <div className="showcase-content">
            <div className="section-label">
              <CheckCircle size={12} />
              Resume Builder
            </div>
            <h2 className="showcase-title">
              Craft a standout <span className="gradient-text-amber">resume</span> in minutes
            </h2>
            <p className="showcase-description">
              Our smart builder formats your resume according to recruiter standards. Focus on your story while we take care of the design, ensuring alignment with ATS requirements.
            </p>
            <div className="showcase-cta">
              <button
                className="btn-showcase-primary"
                onClick={() => navigate("/resume-builder")}
              >
                Build Your Resume
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
          <div className="showcase-visual">
            <div className="resume-drawing-container">
              {/* Modern SVG Resume Drawing */}
              <svg
                width="320"
                height="320"
                viewBox="0 0 320 320"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="resume-svg-drawing"
              >
                {/* Background glow shadow */}
                <circle cx="160" cy="160" r="120" fill="url(#glow-gradient)" opacity="0.15" />
                
                {/* Resume Document Frame */}
                <g className="resume-document-group">
                  {/* Document Shadow */}
                  <rect x="64" y="44" width="160" height="220" rx="16" fill="black" opacity="0.04" />
                  <rect x="62" y="42" width="160" height="220" rx="16" fill="black" opacity="0.06" />
                  
                  {/* Document Body */}
                  <rect x="60" y="40" width="160" height="220" rx="16" fill="#FFFFFF" stroke="var(--border-subtle)" strokeWidth="1.5" />
                  
                  {/* Dog-ear Folded Corner at Top-Right */}
                  <path d="M204 40.75 H214 C216.5 40.75 220 44 220 46.5 V56" stroke="var(--border-subtle)" strokeWidth="1.5" />
                  <path d="M204 40.75 V56 H220 L204 40.75 Z" fill="#F5EFE9" stroke="var(--border-subtle)" strokeWidth="1.5" />

                  {/* Resume Header Area */}
                  {/* Avatar/Icon Circle */}
                  <circle cx="88" cy="72" r="14" fill="#F5EFE9" />
                  <circle cx="88" cy="72" r="6" fill="var(--navy-600)" />
                  
                  {/* Name lines */}
                  <rect x="112" y="64" width="64" height="6" rx="3" fill="var(--navy-800)" />
                  <rect x="112" y="74" width="44" height="4" rx="2" fill="var(--navy-400)" />

                  {/* Section Divider 1 */}
                  <line x1="76" y1="96" x2="204" y2="96" stroke="var(--border-subtle)" strokeWidth="1" strokeDasharray="2 2" />

                  {/* Work Experience Section */}
                  {/* Title */}
                  <rect x="76" y="106" width="50" height="5" rx="2.5" fill="var(--navy-800)" />
                  {/* Subtitle */}
                  <rect x="76" y="116" width="30" height="3" rx="1.5" fill="var(--navy-400)" />
                  {/* Bullet lines */}
                  <rect x="76" y="126" width="128" height="3.5" rx="1.75" fill="var(--navy-200)" />
                  <rect x="76" y="134" width="118" height="3.5" rx="1.75" fill="var(--navy-200)" />
                  <rect x="76" y="142" width="88" height="3.5" rx="1.75" fill="var(--navy-200)" />

                  {/* Section Divider 2 */}
                  <line x1="76" y1="156" x2="204" y2="156" stroke="var(--border-subtle)" strokeWidth="1" strokeDasharray="2 2" />

                  {/* Skills Section */}
                  {/* Title */}
                  <rect x="76" y="166" width="35" height="5" rx="2.5" fill="var(--navy-800)" />
                  {/* Pill items (tags) */}
                  <rect x="76" y="176" width="36" height="10" rx="5" fill="#F5EFE9" />
                  <rect x="116" y="176" width="44" height="10" rx="5" fill="#F5EFE9" />
                  <rect x="164" y="176" width="32" height="10" rx="5" fill="#F5EFE9" />
                  
                  <rect x="76" y="190" width="42" height="10" rx="5" fill="#F5EFE9" />
                  <rect x="122" y="190" width="36" height="10" rx="5" fill="#F5EFE9" />

                  {/* Section Divider 3 */}
                  <line x1="76" y1="210" x2="204" y2="210" stroke="var(--border-subtle)" strokeWidth="1" strokeDasharray="2 2" />

                  {/* Signature/Verification line at bottom */}
                  <rect x="76" y="222" width="60" height="4" rx="2" fill="var(--amber-400)" />
                  <path d="M184 220 L204 225" stroke="var(--navy-400)" strokeWidth="1.5" strokeLinecap="round" />
                </g>

                {/* Pencil Group */}
                <g className="resume-pencil-group">
                  {/* Pencil shadow */}
                  <path d="M192 192 L234 150 L242 158 L200 200 Z" fill="black" opacity="0.06" />
                  
                  {/* Pencil Lead/Tip */}
                  <path d="M176 208 L185 197 L193 205 Z" fill="var(--navy-900)" />
                  
                  {/* Pencil Wood Cone */}
                  <path d="M185 197 L195 187 L203 195 L193 205 Z" fill="#EAD5C3" />
                  
                  {/* Pencil Body (Gold/Amber) */}
                  <path d="M195 187 L235 147 C237.5 144.5 241.5 144.5 244 147 L249 152 C251.5 154.5 251.5 158.5 249 161 L209 201 Z" fill="var(--amber-400)" />
                  
                  {/* Pencil Stripes (Espresso) */}
                  <path d="M201 181 L238 144 C239 143 241 143 242 144 L244 146 C245 147 245 149 244 150 L207 187 Z" fill="var(--navy-800)" />
                  
                  {/* Metal Band & Eraser */}
                  <path d="M239 143 L245 137 C247 135 250 135 252 137 L255 140 C257 142 257 145 255 147 L249 153 Z" fill="var(--navy-300)" />
                  <path d="M248 134 L251 131 C252.5 129.5 255.5 129.5 257 131 L260 134 C261.5 135.5 261.5 138.5 260 140 L257 143 Z" fill="#F4A261" />
                </g>

                {/* Gradients */}
                <defs>
                  <radialGradient id="glow-gradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                    <stop offset="0%" stopColor="var(--amber-400)" />
                    <stop offset="100%" stopColor="var(--amber-100)" stopOpacity="0" />
                  </radialGradient>
                </defs>
              </svg>
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
