import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AuthModal from "../components/AuthModal";
import {
  Search,
  Briefcase,
  Users,
  ArrowRight,
  Shield,
  Zap,
  Globe,
  Star,
} from "lucide-react";
import "./HomePage.css";

/**
 * Home Page — Public Landing Page
 * Features:
 * - Hero section with gradient background and floating particles
 * - Two premium role cards (Job Seeker & Recruiter)
 * - Features section
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
        jobseeker: "/jobseeker/dashboard",
        recruiter: "/recruiter/dashboard",
        admin: "/admin/dashboard",
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
      {/* Floating Particles Background */}
      <div className="particles">
        {[...Array(6)].map((_, i) => (
          <div key={i} className={`particle particle-${i + 1}`} />
        ))}
      </div>

      {/* Ambient Glow Effects */}
      <div className="ambient-glow glow-1" />
      <div className="ambient-glow glow-2" />

      {/* Hero Section */}
      <section className="hero-section" id="hero-section">
        <div className="hero-content animate-fade-in-up">
          <div className="hero-badge">
            <Zap size={14} />
            <span>Powered by AI-Driven Matching</span>
          </div>

          <h1 className="hero-title">
            Find Your <span className="gradient-text">Dream Career</span>
            <br />
            Start Today
          </h1>

          <p className="hero-subtitle">
            Connect with top companies and talented professionals. 
            Our intelligent platform makes hiring and job searching seamless.
          </p>

          <div className="hero-stats">
            <div className="stat-item">
              <span className="stat-number">10K+</span>
              <span className="stat-label">Active Jobs</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <span className="stat-number">5K+</span>
              <span className="stat-label">Companies</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <span className="stat-number">50K+</span>
              <span className="stat-label">Hired</span>
            </div>
          </div>
        </div>

        {/* Role Selection Cards */}
        <div className="role-cards" id="role-cards">
          {/* Job Seeker Card */}
          <div
            className="role-card card-jobseeker"
            onClick={() => handleRoleClick("jobseeker")}
            id="card-jobseeker"
          >
            <div className="card-glow" />
            <div className="card-icon-wrapper">
              <Search size={28} />
            </div>
            <h3 className="card-title">Job Seeker</h3>
            <p className="card-description">
              Discover opportunities that match your skills. Get personalized 
              recommendations and apply with one click.
            </p>
            <ul className="card-features">
              <li>
                <Star size={14} />
                AI-powered job matching
              </li>
              <li>
                <Star size={14} />
                One-click applications
              </li>
              <li>
                <Star size={14} />
                Track application status
              </li>
            </ul>
            <div className="card-action">
              <span>Get Started</span>
              <ArrowRight size={18} />
            </div>
          </div>

          {/* Recruiter Card */}
          <div
            className="role-card card-recruiter"
            onClick={() => handleRoleClick("recruiter")}
            id="card-recruiter"
          >
            <div className="card-glow" />
            <div className="card-icon-wrapper recruiter-icon">
              <Users size={28} />
            </div>
            <h3 className="card-title">Recruiter</h3>
            <p className="card-description">
              Find the perfect candidates for your team. Post jobs and manage 
              applications efficiently.
            </p>
            <ul className="card-features">
              <li>
                <Star size={14} />
                Smart candidate filtering
              </li>
              <li>
                <Star size={14} />
                Applicant tracking system
              </li>
              <li>
                <Star size={14} />
                Analytics dashboard
              </li>
            </ul>
            <div className="card-action">
              <span>Start Hiring</span>
              <ArrowRight size={18} />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section" id="features-section">
        <h2 className="section-title">
          Why Choose <span className="gradient-text">JobPortal</span>?
        </h2>
        <div className="features-grid">
          <div className="feature-card glass">
            <div className="feature-icon">
              <Shield size={24} />
            </div>
            <h4>Enterprise Security</h4>
            <p>Bank-grade encryption and secure authentication to protect your data.</p>
          </div>
          <div className="feature-card glass">
            <div className="feature-icon">
              <Zap size={24} />
            </div>
            <h4>Lightning Fast</h4>
            <p>Optimized platform delivering instant search results and smooth interactions.</p>
          </div>
          <div className="feature-card glass">
            <div className="feature-icon">
              <Globe size={24} />
            </div>
            <h4>Global Reach</h4>
            <p>Connect with opportunities and talent from around the world.</p>
          </div>
          <div className="feature-card glass">
            <div className="feature-icon">
              <Briefcase size={24} />
            </div>
            <h4>Smart Matching</h4>
            <p>AI-powered algorithms to match the right candidates with the right roles.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="home-footer">
        <p>© {new Date().getFullYear()} JobPortal. All rights reserved.</p>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        role={selectedRole}
      />
    </div>
  );
};

export default HomePage;
