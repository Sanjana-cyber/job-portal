import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { useProfile } from "../../context/ProfileContext";

/**
 * ProfileCompletionRing — Animated circular progress ring
 * Shows profile completion percentage with color-coded status
 */
const ProfileCompletionRing = () => {
  const { completionScore, profileLoading } = useProfile();

  const getColor = (score) => {
    if (score >= 80) return "var(--success-500)";
    if (score >= 50) return "var(--warning-500)";
    return "var(--navy-600)";
  };

  const getLabel = (score) => {
    if (score >= 80) return "Looking great!";
    if (score >= 50) return "Almost there";
    if (score > 0)   return "Keep going";
    return "Let's get started";
  };

  const color = getColor(completionScore);

  return (
    <div style={{
      background: "var(--bg-surface)",
      borderRadius: "20px",
      padding: "28px 24px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "16px",
      boxShadow: "var(--shadow-card)",
      border: "1px solid var(--border-subtle)",
    }}>
      <h2 style={{ color: "var(--navy-900)", fontFamily: "var(--font-display)", fontWeight: "600", fontSize: "18px", margin: 0, textAlign: "center" }}>
        Profile Completion
      </h2>

      {profileLoading ? (
        <div style={{ width: "120px", height: "120px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{
            width: "40px", height: "40px",
            border: "3px solid var(--border-default)",
            borderTopColor: "var(--navy-600)",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }} />
        </div>
      ) : (
        <div style={{ width: "130px", height: "130px" }}>
          <CircularProgressbar
            value={completionScore}
            text={`${completionScore}%`}
            styles={buildStyles({
              textSize: "18px",
              textColor: color,
              pathColor: color,
              trailColor: "var(--cream-200)",
              pathTransitionDuration: 0.8,
            })}
          />
        </div>
      )}

      <div style={{ textAlign: "center" }}>
        <p style={{
          color,
          fontWeight: "600",
          fontSize: "13px",
          margin: 0,
          padding: "4px 12px",
          background: "var(--bg-page)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "20px",
          display: "inline-block",
        }}>
          {getLabel(completionScore)}
        </p>
      </div>
    </div>
  );
};

export default ProfileCompletionRing;
