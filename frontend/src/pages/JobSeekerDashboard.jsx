import { useState } from "react";
import { Link } from "react-router-dom";
import { ProfileProvider } from "../context/ProfileContext";
import HamburgerMenu from "../components/dashboard/HamburgerMenu";
import WelcomeBanner from "../components/dashboard/WelcomeBanner";
import ProfileCompletionRing from "../components/dashboard/ProfileCompletionRing";
import ProfileStatusGrid from "../components/dashboard/ProfileStatusGrid";

const DashboardContent = () => {
  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--bg-page)",
      fontFamily: "var(--font-body)",
    }}>
      {/* ── Fixed Top Bar ── */}
      <header style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        background: "var(--bg-surface)",
        borderBottom: "1px solid var(--border-subtle)",
        boxShadow: "var(--shadow-sm)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
        height: "64px",
      }}>
        {/* Logo */}
        <Link to="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: "32px", height: "32px",
            background: "var(--navy-800)",
            borderRadius: "8px",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "var(--cream-50)",
            fontSize: "16px",
          }}>💼</div>
          <span style={{
            color: "var(--navy-900)",
            fontWeight: "700",
            fontSize: "18px",
            letterSpacing: "-0.3px",
            fontFamily: "var(--font-display)"
          }}>JobPortal</span>
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <span style={{
            background: "var(--amber-100)",
            border: "1px solid var(--amber-200)",
            color: "var(--amber-700)",
            padding: "4px 12px",
            borderRadius: "20px",
            fontSize: "12px",
            fontWeight: "600",
          }}>Candidate</span>
          <HamburgerMenu />
        </div>
      </header>

      {/* ── Page Content ── */}
      <main style={{ maxWidth: "1100px", margin: "0 auto", padding: "32px 20px", display: "flex", flexDirection: "column", gap: "24px" }}>

        {/* Welcome Banner — full width */}
        <WelcomeBanner />

        {/* Middle row: Completion Ring + Status Grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "220px 1fr",
          gap: "24px",
          alignItems: "start",
        }}>
          <ProfileCompletionRing />
          <ProfileStatusGrid />
        </div>

        {/* Build Profile CTA */}
        <div style={{
          background: "var(--gradient-brand)",
          borderRadius: "20px",
          padding: "28px 36px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "20px",
          flexWrap: "wrap",
          boxShadow: "var(--shadow-lg)",
        }}>
          <div>
            <h2 style={{ color: "var(--cream-50)", fontWeight: "700", fontSize: "20px", margin: "0 0 6px", fontFamily: "var(--font-display)" }}>
              Ready to build your profile?
            </h2>
            <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "14px", margin: 0 }}>
              Complete your profile to get discovered by top recruiters.
            </p>
          </div>
          <Link
            to="/dashboard/profile"
            id="build-profile-btn"
            style={{
              padding: "14px 32px",
              background: "var(--cream-50)",
              color: "var(--navy-800)",
              textDecoration: "none",
              borderRadius: "12px",
              fontWeight: "700",
              fontSize: "14px",
              whiteSpace: "nowrap",
              boxShadow: "var(--shadow-md)",
              transition: "transform 0.2s, box-shadow 0.2s",
              display: "inline-block",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "var(--shadow-lg)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "var(--shadow-md)"; }}
          >
            Build Profile →
          </Link>
        </div>
      </main>
    </div>
  );
};

const JobSeekerDashboard = () => (
  <ProfileProvider>
    <DashboardContent />
  </ProfileProvider>
);

export default JobSeekerDashboard;
