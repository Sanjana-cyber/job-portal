import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { useProfile } from "../../context/ProfileContext";
import { useNavigate, Link } from "react-router-dom";

/**
 * HamburgerMenu — ☰ button + slide-in drawer from the right
 * Drawer contains: Avatar, Name, Role Badge, Logout ONLY
 */
const HamburgerMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const drawerRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handleOutside = (e) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e) => { if (e.key === "Escape") setIsOpen(false); };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  return (
    <>
      {/* ☰ Hamburger Button */}
      <button
        id="hamburger-btn"
        onClick={() => setIsOpen(true)}
        aria-label="Open menu"
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "8px",
          display: "flex",
          flexDirection: "column",
          gap: "5px",
          borderRadius: "8px",
          transition: "background 0.2s",
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
        onMouseLeave={(e) => e.currentTarget.style.background = "none"}
      >
        <span style={{ display: "block", width: "22px", height: "2px", background: "var(--navy-800)", borderRadius: "2px", transition: "all 0.3s" }} />
        <span style={{ display: "block", width: "22px", height: "2px", background: "var(--navy-800)", borderRadius: "2px", transition: "all 0.3s" }} />
        <span style={{ display: "block", width: "14px", height: "2px", background: "var(--navy-800)", borderRadius: "2px", transition: "all 0.3s" }} />
      </button>

      {/* Backdrop Overlay */}
      <div
        onClick={() => setIsOpen(false)}
        style={{
          position: "fixed", inset: 0, zIndex: 998,
          background: "rgba(0,0,0,0.45)",
          backdropFilter: "blur(2px)",
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "all" : "none",
          transition: "opacity 0.3s ease",
        }}
      />

      {/* Slide-in Drawer */}
      <div
        ref={drawerRef}
        style={{
          position: "fixed", top: 0, right: 0, bottom: 0, zIndex: 999,
          width: "280px",
          background: "var(--navy-900)",
          boxShadow: "-8px 0 32px rgba(0,0,0,0.4)",
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.35s cubic-bezier(0.4,0,0.2,1)",
          display: "flex",
          flexDirection: "column",
          padding: "32px 24px",
          gap: "24px",
        }}
      >
        {/* Close Button */}
        <button
          onClick={() => setIsOpen(false)}
          aria-label="Close menu"
          style={{
            alignSelf: "flex-end",
            background: "rgba(255,255,255,0.08)",
            border: "none",
            color: "var(--navy-300)",
            width: "32px", height: "32px",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "18px",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "background 0.2s, color 0.2s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.15)"; e.currentTarget.style.color = "var(--cream-50)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "var(--navy-300)"; }}
        >✕</button>

        {/* Avatar */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", paddingTop: "8px" }}>
          <div style={{
            width: "80px", height: "80px", borderRadius: "50%",
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "28px", fontWeight: "700", color: "#fff",
            boxShadow: "0 0 0 4px rgba(145, 118, 110, 0.3)",
            overflow: "hidden",
          }}>
            {profile?.photo?.url ? (
              <img src={profile.photo.url} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              initials
            )}
          </div>

          {/* Name */}
          <div style={{ textAlign: "center" }}>
            <p style={{ color: "var(--cream-50)", fontWeight: "600", fontSize: "16px", margin: 0 }}>
              {user?.name || "User"}
            </p>
            <p style={{ color: "var(--navy-300)", fontSize: "13px", margin: "4px 0 0" }}>
              {user?.email || ""}
            </p>
          </div>

          {/* Role Badge */}
          <span style={{
            background: "var(--amber-100)",
            color: "var(--amber-700)", fontSize: "11px", fontWeight: "600",
            padding: "4px 12px", borderRadius: "20px",
            textTransform: "capitalize", letterSpacing: "0.5px",
          }}>
            {user?.role || "jobseeker"}
          </span>
        </div>

        {/* Divider */}
        <div style={{ height: "1px", background: "rgba(255,255,255,0.08)", margin: "0 -24px" }} />

        {/* Navigation Links */}
        <nav style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <Link
            to="/dashboard"
            id="drawer-dashboard-link"
            onClick={() => setIsOpen(false)}
            style={{
              display: "flex", alignItems: "center", gap: "12px",
              padding: "12px 16px",
              borderRadius: "10px",
              color: "var(--cream-100)",
              textDecoration: "none",
              fontSize: "14px", fontWeight: "500",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
            </svg>
            Dashboard
          </Link>

          <Link
            to="/dashboard/jobs"
            id="drawer-find-jobs-link"
            onClick={() => setIsOpen(false)}
            style={{
              display: "flex", alignItems: "center", gap: "12px",
              padding: "12px 16px",
              borderRadius: "10px",
              color: "var(--cream-100)",
              textDecoration: "none",
              fontSize: "14px", fontWeight: "500",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            Find Jobs
          </Link>

          <Link
            to="/dashboard/profile"
            id="drawer-profile-link"
            onClick={() => setIsOpen(false)}
            style={{
              display: "flex", alignItems: "center", gap: "12px",
              padding: "12px 16px",
              borderRadius: "10px",
              color: "var(--cream-100)",
              textDecoration: "none",
              fontSize: "14px", fontWeight: "500",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
            Build Profile
          </Link>

          <Link
            to="/resume-builder"
            id="drawer-resume-builder-link"
            onClick={() => setIsOpen(false)}
            style={{
              display: "flex", alignItems: "center", gap: "12px",
              padding: "12px 16px",
              borderRadius: "10px",
              color: "var(--cream-100)",
              textDecoration: "none",
              fontSize: "14px", fontWeight: "500",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
            </svg>
            Build Resume
          </Link>
        </nav>

        <div style={{ height: "1px", background: "rgba(255,255,255,0.08)", margin: "0 -24px" }} />

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Logout Button */}
        <button
          id="drawer-logout-btn"
          onClick={handleLogout}
          style={{
            width: "100%",
            padding: "12px",
            background: "rgba(192,80,74,0.12)",
            border: "1px solid rgba(192,80,74,0.3)",
            borderRadius: "12px",
            color: "var(--error-400)",
            fontWeight: "600",
            fontSize: "14px",
            cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(192,80,74,0.22)"; e.currentTarget.style.borderColor = "rgba(192,80,74,0.5)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(192,80,74,0.12)"; e.currentTarget.style.borderColor = "rgba(192,80,74,0.3)"; }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Sign Out
        </button>
      </div>
    </>
  );
};

export default HamburgerMenu;
