import { Link } from "react-router-dom";
import { useProfile } from "../../context/ProfileContext";

/**
 * ActiveResumeCard — Displays current active resume and version counts
 */
const ActiveResumeCard = () => {
  const { resumes, profileLoading } = useProfile();

  if (profileLoading) return null;

  const activeResume = resumes?.find(r => r.isActive);
  const count = resumes?.length || 0;

  return (
    <div className="active-resume-card">
      <div className="active-resume-header">
        <h2 className="active-resume-title">Active Resume</h2>
        {count > 0 && <span className="active-resume-count">{count} {count === 1 ? 'version' : 'versions'} saved</span>}
      </div>

      {activeResume ? (
        <div className="active-resume-body">
          <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(34,197,94,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>
            📄
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontWeight: "600", color: "var(--navy-900)", margin: "0 0 2px", fontSize: "14px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              <span style={{ fontSize: "11px", background: "rgba(34,197,94,0.15)", color: "var(--success-700)", padding: "2px 6px", borderRadius: "12px", marginRight: "6px" }}>v{activeResume.versionNumber}</span>
              {activeResume.title}
            </p>
            <p style={{ color: "var(--text-secondary)", fontSize: "12px", margin: 0 }}>
              Updated {new Date(activeResume.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </p>
          </div>
        </div>
      ) : (
        <div className="active-resume-empty">
          <p>No active resume selected.</p>
        </div>
      )}

      <div className="active-resume-actions">
        {activeResume && (
          <a 
            href={`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/profile/resumes/${activeResume._id}/download`}
            style={{ flex: 1, textAlign: "center", padding: "10px", border: "1.5px solid var(--navy-800)", borderRadius: "10px", color: "var(--navy-800)", textDecoration: "none", fontSize: "13px", fontWeight: "600", transition: "all 0.2s" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--cream-100)" }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent" }}
          >
            Download
          </a>
        )}
        <Link 
          to="/dashboard/profile?tab=resume"
          style={{ flex: activeResume ? 1 : "none", width: activeResume ? "auto" : "100%", textAlign: "center", padding: "10px", background: "var(--navy-800)", borderRadius: "10px", color: "var(--cream-50)", textDecoration: "none", fontSize: "13px", fontWeight: "600", transition: "all 0.2s" }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "var(--shadow-sm)" }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none" }}
        >
          Manage Resumes
        </Link>
      </div>
    </div>
  );
};

export default ActiveResumeCard;
