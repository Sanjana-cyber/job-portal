import { useNavigate } from "react-router-dom";
import { useProfile } from "../../context/ProfileContext";

const sections = [
  { key: "personal",       label: "Personal Info",    icon: "👤", check: (p) => !!(p?.phone && p?.location) },
  { key: "professional",   label: "Professional",     icon: "💼", check: (p) => !!(p?.headline && p?.about) },
  { key: "skills",         label: "Skills",           icon: "⚡", check: (p) => !!(p?.technicalSkills?.length > 0) },
  { key: "education",      label: "Education",        icon: "🎓", check: (p) => !!(p?.education?.length > 0) },
  { key: "experience",     label: "Experience",       icon: "🏢", check: (p) => !!(p?.experience?.length > 0) },
  { key: "projects",       label: "Projects",         icon: "🛠️", check: (p) => !!(p?.projects?.length > 0) },
  { key: "certifications", label: "Certifications",   icon: "🏅", check: (p) => !!(p?.certifications?.length > 0) },
  { key: "resume",         label: "Resume",           icon: "📄", check: (p) => !!(p?.resume?.url) },
];

/**
 * ProfileStatusGrid — Grid of chips showing per-section completion status.
 * All chips are clickable and navigate to that section in the profile builder.
 * Complete chips show a green style; incomplete chips show a warning style with a hover prompt.
 */
const ProfileStatusGrid = () => {
  const { profile, profileLoading } = useProfile();
  const navigate = useNavigate();

  if (profileLoading) return null;

  return (
    <div style={{
      background: "var(--bg-surface)",
      borderRadius: "20px",
      padding: "24px",
      boxShadow: "var(--shadow-card)",
      border: "1px solid var(--border-subtle)",
    }}>
      <h2 style={{ color: "var(--navy-900)", fontFamily: "var(--font-display)", fontWeight: "600", fontSize: "18px", margin: "0 0 6px" }}>
        Profile Sections
      </h2>
      <p style={{ color: "var(--text-secondary)", fontSize: "13px", margin: "0 0 16px" }}>
        Click any section to view or update it.
      </p>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
        gap: "10px",
      }}>
        {sections.map(({ key, label, icon, check }) => {
          const done = check(profile);

          // Resume chip: show filename as subtitle when uploaded
          const subtitle = key === "resume" && done && profile?.resume?.originalName
            ? profile.resume.originalName
            : done
              ? "Edit ✏️"
              : "Tap to fill →";

          return (
            <button
              key={key}
              id={`dashboard-chip-${key}`}
              onClick={() => navigate(`/dashboard/profile?tab=${key}`)}
              title={done ? `Edit ${label}` : `Complete your ${label}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 12px",
                borderRadius: "12px",
                background: done ? "var(--bg-surface)" : "var(--bg-page)",
                border: `1px solid ${done ? "var(--success-400)" : "var(--border-subtle)"}`,
                cursor: "pointer",
                textAlign: "left",
                fontFamily: "inherit",
                transition: "all 0.18s ease",
                width: "100%",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "var(--shadow-md)";
                e.currentTarget.style.borderColor = done ? "var(--success-500)" : "var(--navy-400)";
                e.currentTarget.style.background = done ? "rgba(34,197,94,0.06)" : "var(--cream-100)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.borderColor = done ? "var(--success-400)" : "var(--border-subtle)";
                e.currentTarget.style.background = done ? "var(--bg-surface)" : "var(--bg-page)";
              }}
            >
              <span style={{ fontSize: "16px" }}>{icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  margin: 0,
                  fontSize: "12px",
                  fontWeight: "600",
                  color: done ? "var(--success-500)" : "var(--text-secondary)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}>
                  {label}
                </p>
                <p style={{
                  margin: "2px 0 0",
                  fontSize: "10px",
                  fontWeight: "500",
                  color: done ? "var(--text-tertiary)" : "var(--text-tertiary)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  maxWidth: "110px",
                }} title={key === "resume" && done ? profile?.resume?.originalName : undefined}>
                  {subtitle}
                </p>
              </div>
              <span style={{ fontSize: "13px", flexShrink: 0 }}>
                {done ? "✅" : "⚠️"}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ProfileStatusGrid;
