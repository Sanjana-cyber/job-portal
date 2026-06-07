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
 * ProfileStatusGrid — Grid of chips showing per-section completion status
 */
const ProfileStatusGrid = () => {
  const { profile, profileLoading } = useProfile();

  if (profileLoading) return null;

  return (
    <div style={{
      background: "var(--bg-surface)",
      borderRadius: "20px",
      padding: "24px",
      boxShadow: "var(--shadow-card)",
      border: "1px solid var(--border-subtle)",
    }}>
      <h2 style={{ color: "var(--navy-900)", fontFamily: "var(--font-display)", fontWeight: "600", fontSize: "18px", margin: "0 0 16px" }}>
        Profile Sections
      </h2>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
        gap: "10px",
      }}>
        {sections.map(({ key, label, icon, check }) => {
          const done = check(profile);
          return (
            <div key={key} style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 12px",
              borderRadius: "12px",
              background: done ? "var(--bg-surface)" : "var(--bg-page)",
              border: `1px solid ${done ? "var(--success-400)" : "var(--border-subtle)"}`,
              transition: "all 0.2s",
            }}>
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
              </div>
              <span style={{ fontSize: "13px", flexShrink: 0 }}>
                {done ? "✅" : "⚠️"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProfileStatusGrid;
