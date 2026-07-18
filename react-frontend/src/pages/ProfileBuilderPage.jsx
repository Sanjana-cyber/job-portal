import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ProfileProvider } from "../context/ProfileContext";
import HamburgerMenu from "../components/dashboard/HamburgerMenu";
import SectionTabs from "../components/profile/SectionTabs";
import PersonalInfoForm from "../components/profile/PersonalInfoForm";
import ProfessionalForm from "../components/profile/ProfessionalForm";
import SkillsForm from "../components/profile/SkillsForm";
import EducationForm from "../components/profile/EducationForm";
import ExperienceForm from "../components/profile/ExperienceForm";
import ProjectsForm from "../components/profile/ProjectsForm";
import CertificationsForm from "../components/profile/CertificationsForm";
import ResumeUpload from "../components/profile/ResumeUpload";

const VALID_TABS = ["personal", "professional", "skills", "education", "experience", "projects", "certifications", "resume"];

const TAB_COMPONENTS = {
  personal:       <PersonalInfoForm />,
  professional:   <ProfessionalForm />,
  skills:         <SkillsForm />,
  education:      <EducationForm />,
  experience:     <ExperienceForm />,
  projects:       <ProjectsForm />,
  certifications: <CertificationsForm />,
  resume:         <ResumeUpload />,
};

const ProfileBuilderContent = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Read ?tab= from URL; fall back to "personal" if missing or invalid
  const initialTab = VALID_TABS.includes(searchParams.get("tab"))
    ? searchParams.get("tab")
    : "personal";

  const [activeTab, setActiveTab] = useState(initialTab);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab }, { replace: true });
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f3f4f6", fontFamily: "var(--font-body)" }}>

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
        {/* Back to dashboard */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <Link to="/dashboard" style={{
            color: "var(--navy-500)", textDecoration: "none", fontSize: "13px", fontWeight: "600",
            display: "flex", alignItems: "center", gap: "6px",
            padding: "6px 12px", borderRadius: "8px",
            transition: "all 0.2s",
            border: "1px solid var(--border-subtle)",
          }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "var(--navy-800)"; e.currentTarget.style.background = "var(--cream-100)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "var(--navy-500)"; e.currentTarget.style.background = "transparent"; }}
          >
            ← Dashboard
          </Link>
          <div style={{ width: "1px", height: "24px", background: "var(--border-default)" }} />
          <span style={{ color: "var(--navy-900)", fontWeight: "700", fontSize: "16px", fontFamily: "var(--font-display)" }}>Profile Builder</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <span style={{
            background: "var(--amber-100)",
            border: "1px solid var(--amber-200)",
            color: "var(--amber-700)", padding: "4px 12px",
            borderRadius: "20px", fontSize: "12px", fontWeight: "600",
          }}>Candidate</span>
          <HamburgerMenu />
        </div>
      </header>

      {/* ── Page Content ── */}
      <main style={{ maxWidth: "900px", margin: "0 auto", padding: "28px 20px", display: "flex", flexDirection: "column", gap: "20px" }}>

        {/* Page Header */}
        <div>
          <h1 style={{ color: "var(--navy-900)", fontWeight: "600", fontSize: "clamp(20px, 4vw, 28px)", margin: "0 0 4px", fontFamily: "var(--font-display)" }}>
            Build Your Profile
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px", margin: 0 }}>
            Fill in the sections below. Fields marked <span style={{ color: "var(--error-500)", fontWeight: "700" }}>*</span> are required.
          </p>
        </div>

        {/* Tab Navigation */}
        <SectionTabs activeTab={activeTab} onTabChange={handleTabChange} />

        {/* Active Tab Form */}
        <div key={activeTab} style={{ animation: "fadeIn 0.2s ease" }}>
          {TAB_COMPONENTS[activeTab]}
        </div>

        {/* Tab Navigation Footer Arrows */}
        <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "20px" }}>
          {(() => {
            const tabs = VALID_TABS;
            const idx  = tabs.indexOf(activeTab);
            return (
              <>
                <button
                  type="button"
                  onClick={() => handleTabChange(tabs[idx - 1])}
                  disabled={idx === 0}
                  style={{
                    padding: "10px 20px",
                    border: "1.5px solid var(--border-default)",
                    borderRadius: "10px",
                    background: "var(--bg-surface)",
                    color: idx === 0 ? "var(--text-tertiary)" : "var(--navy-800)",
                    fontWeight: "600", fontSize: "13px",
                    cursor: idx === 0 ? "default" : "pointer",
                    fontFamily: "inherit",
                    transition: "all 0.2s",
                  }}
                >← Previous</button>
                <button
                  type="button"
                  onClick={() => {
                    if (idx === tabs.length - 1) {
                      navigate("/dashboard");
                    } else {
                      handleTabChange(tabs[idx + 1]);
                    }
                  }}
                  style={{
                    padding: "10px 20px",
                    border: "none",
                    borderRadius: "10px",
                    background: idx === tabs.length - 1 ? "#059669" : "var(--navy-800)",
                    color: "var(--cream-50)",
                    fontWeight: "600", fontSize: "13px",
                    cursor: "pointer",
                    boxShadow: idx === tabs.length - 1 ? "0 4px 14px rgba(5, 150, 105, 0.3)" : "var(--shadow-sm)",
                    fontFamily: "inherit",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
                >{idx === tabs.length - 1 ? "Complete Profile ✓" : "Next →"}</button>
              </>
            );
          })()}
        </div>
      </main>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin    { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

const ProfileBuilderPage = () => (
  <ProfileProvider>
    <ProfileBuilderContent />
  </ProfileProvider>
);

export default ProfileBuilderPage;
