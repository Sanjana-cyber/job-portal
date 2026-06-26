import { Link } from "react-router-dom";
import { ArrowLeft, Search } from "lucide-react";
import { ProfileProvider } from "../context/ProfileContext";
import HamburgerMenu from "../components/dashboard/HamburgerMenu";
import JobsPage from "./JobsPage";

/**
 * DashboardJobsPage
 * Wraps the public JobsPage inside the seeker dashboard shell
 * (sticky header with logo, back-to-dashboard link, hamburger menu).
 * Rendered at /dashboard/jobs — protected to jobseeker role.
 */
const DashboardJobsPageContent = () => (
  <div style={{ minHeight: "100vh", background: "var(--bg-page)", fontFamily: "var(--font-body)" }}>

    {/* ── Dashboard Header ── */}
    <header style={{
      position: "sticky", top: 0, zIndex: 100,
      background: "var(--bg-surface)",
      borderBottom: "1px solid var(--border-subtle)",
      boxShadow: "var(--shadow-sm)",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 24px", height: "64px",
    }}>
      {/* Logo */}
      <Link to="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "10px" }}>
        <div style={{
          width: "32px", height: "32px", background: "var(--navy-800)",
          borderRadius: "8px", display: "flex", alignItems: "center",
          justifyContent: "center", color: "var(--cream-50)", fontSize: "16px",
        }}>💼</div>
        <span style={{
          color: "var(--navy-900)", fontWeight: "700", fontSize: "18px",
          letterSpacing: "-0.3px", fontFamily: "var(--font-display)",
        }}>JobPortal</span>
      </Link>

      {/* Right side */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <Link
          to="/dashboard"
          style={{
            display: "inline-flex", alignItems: "center", gap: "6px",
            padding: "7px 14px",
            color: "var(--text-secondary)",
            border: "1px solid var(--border-default)",
            borderRadius: "var(--radius-full)",
            textDecoration: "none", fontSize: "13px", fontWeight: "500",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--cream-200)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
        >
          <ArrowLeft size={14} /> Dashboard
        </Link>
        <span style={{
          background: "var(--amber-100)", border: "1px solid var(--amber-200)",
          color: "var(--amber-700)", padding: "4px 12px",
          borderRadius: "20px", fontSize: "12px", fontWeight: "600",
        }}>Candidate</span>
        <HamburgerMenu />
      </div>
    </header>

    {/* ── Jobs Page Content (padding-top adjusted since header is sticky) ── */}
    <div style={{ paddingTop: "0" }}>
      <JobsPage inDashboard />
    </div>
  </div>
);

const DashboardJobsPage = () => (
  <ProfileProvider>
    <DashboardJobsPageContent />
  </ProfileProvider>
);

export default DashboardJobsPage;
