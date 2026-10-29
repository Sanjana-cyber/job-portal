import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SearchBar from "./SearchBar";
import { useAuthModal } from "../context/AuthModalContext";
import "./SeekerJobs.css";

/**
 * SeekerNavbar — Unified dark navy navbar for Seeker Pages
 * Used identically across:
 *   - Jobs Page (SeekerJobs.jsx)
 *   - Candidate Dashboard Page (CreateDashboardForm.jsx)
 *   - Build Resume Page (ResumeBuilder.jsx)
 *
 * Props:
 *   activeTab      — "jobs" | "dashboard" | "resume"
 *   searchQuery    — current search string
 *   onSearchChange — optional callback when search changes
 *   onTabChange    — optional callback for tab switches
 */
export default function SeekerNavbar({
  activeTab = "jobs",
  searchQuery = "",
  onSearchChange,
  onTabChange,
}) {
  const navigate = useNavigate();
  const { user, logout, openModal } = useAuthModal();
  const [internalQuery, setInternalQuery] = useState(searchQuery);

  useEffect(() => {
    setInternalQuery(searchQuery);
  }, [searchQuery]);

  const initials = user?.name
    ? user.name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase()
    : "JS";

  const handleBrandClick = () => {
    navigate("/");
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    setTimeout(() => {
      const hero = document.getElementById("hero");
      if (hero) hero.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 60);
  };

  const handleTabClick = (tabKey) => {
    if (onTabChange) {
      onTabChange(tabKey);
      return;
    }

    if (tabKey === "jobs") {
      navigate("/seeker/jobs");
    } else if (tabKey === "dashboard") {
      navigate("/seeker/create-dashboard");
    } else if (tabKey === "resume") {
      navigate("/seeker/resume-builder");
    }
  };

  const handleSearchChange = (val) => {
    setInternalQuery(val);
    if (onSearchChange) {
      onSearchChange(val);
    }
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter") {
      if (onSearchChange) {
        onSearchChange(internalQuery);
      } else {
        navigate(`/seeker/jobs?search=${encodeURIComponent(internalQuery)}`);
      }
    }
  };

  return (
    <nav className="seeker-navbar" id="seeker-navbar">
      {/* SearchBar — rendered on Jobs page only */}
      {activeTab === "jobs" && (
        <div className="seeker-navbar__search">
          <SearchBar
            value={searchQuery}
            onChange={onSearchChange}
            onKeyDown={handleSearchKeyDown}
            placeholder="Search jobs by title, skills, company…"
            variant="navbar"
            id="seeker-navbar-search"
          />
        </div>
      )}

      {/* Nav Tabs (Clean text headings without icons) */}
      <div className="seeker-navbar__nav">
        <button
          type="button"
          className={`seeker-navbar__nav-item${activeTab === "jobs" ? " seeker-navbar__nav-item--active" : ""}`}
          onClick={() => handleTabClick("jobs")}
          id="seeker-nav-jobs"
          title="Explore Job Openings"
        >
          Jobs
        </button>

        <button
          type="button"
          className={`seeker-navbar__nav-item${activeTab === "dashboard" ? " seeker-navbar__nav-item--active" : ""}`}
          onClick={() => handleTabClick("dashboard")}
          id="seeker-nav-create-dashboard"
          title="Candidate Dashboard & Profile"
        >
          Create Dashboard
        </button>

        <button
          type="button"
          className={`seeker-navbar__nav-item${activeTab === "resume" ? " seeker-navbar__nav-item--active" : ""}`}
          onClick={() => handleTabClick("resume")}
          id="seeker-nav-resume-builder"
          title="Build Professional Resume"
        >
          Build Resume
        </button>
      </div>

      {/* Profile & Logout / Sign in */}
      <div className="seeker-navbar__right">
        {user ? (
          <>
            <div
              className="seeker-navbar__avatar"
              title={user.name || "Job Seeker"}
              onClick={() => handleTabClick("dashboard")}
            >
              {initials}
            </div>
            <button
              className="seeker-navbar__logout"
              onClick={logout}
              id="seeker-logout-btn"
              title="Log out of TalentBridge and return to hero section"
            >
              Logout
            </button>
          </>
        ) : (
          <button
            className="seeker-navbar__signin"
            onClick={() => openModal && openModal("login")}
            id="seeker-signin-btn"
            title="Sign in to your account"
          >
            Sign In
          </button>
        )}
      </div>
    </nav>
  );
}
