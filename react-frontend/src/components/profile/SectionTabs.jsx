const TABS = [
  { id: "personal",       label: "Personal",       icon: "👤" },
  { id: "professional",   label: "Professional",   icon: "💼" },
  { id: "skills",         label: "Skills",         icon: "⚡" },
  { id: "education",      label: "Education",      icon: "🎓" },
  { id: "experience",     label: "Experience",     icon: "🏢" },
  { id: "projects",       label: "Projects",       icon: "🛠️" },
  { id: "certifications", label: "Certifications", icon: "🏅" },
  { id: "resume",         label: "Resume",         icon: "📄" },
];

/**
 * SectionTabs — Horizontal scrollable tab bar for the profile builder
 */
const SectionTabs = ({ activeTab, onTabChange }) => {
  return (
    <div style={{
      background: "var(--bg-surface)",
      borderRadius: "16px",
      padding: "6px",
      boxShadow: "var(--shadow-card)",
      border: "1px solid var(--border-subtle)",
      overflowX: "auto",
      WebkitOverflowScrolling: "touch",
    }}>
      <div style={{
        display: "flex",
        gap: "4px",
        minWidth: "max-content",
      }}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`tab-${tab.id}`}
              onClick={() => onTabChange(tab.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "10px 16px",
                borderRadius: "10px",
                border: "none",
                cursor: "pointer",
                fontFamily: "var(--font-body)",
                fontWeight: isActive ? "600" : "500",
                fontSize: "13px",
                whiteSpace: "nowrap",
                transition: "all 0.2s ease",
                background: isActive
                  ? "var(--navy-800)"
                  : "transparent",
                color: isActive ? "var(--cream-50)" : "var(--text-secondary)",
                boxShadow: isActive ? "var(--shadow-sm)" : "none",
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.background = "var(--cream-100)";
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.background = "transparent";
              }}
            >
              <span style={{ fontSize: "14px" }}>{tab.icon}</span>
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default SectionTabs;
