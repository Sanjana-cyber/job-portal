import { useAuth } from "../../context/AuthContext";

/**
 * WelcomeBanner — Personalized greeting with animated gradient text
 */
const WelcomeBanner = () => {
  const { user } = useAuth();
  const firstName = user?.name?.split(" ")[0] || "there";

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div style={{
      background: "var(--bg-surface)",
      borderRadius: "20px",
      padding: "32px 36px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      flexWrap: "wrap",
      gap: "16px",
      boxShadow: "var(--shadow-card)",
      border: "1px solid var(--border-subtle)",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Background glow */}
      <div style={{
        position: "absolute", top: "-40px", right: "-40px",
        width: "200px", height: "200px",
        background: "radial-gradient(circle, var(--cream-200) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <div>
        <p style={{ color: "var(--text-secondary)", fontSize: "14px", margin: "0 0 6px", fontWeight: "500" }}>
          {greeting} 👋
        </p>
        <h1 style={{
          margin: 0,
          fontSize: "clamp(22px, 4vw, 32px)",
          fontWeight: "700",
          fontFamily: "var(--font-display)",
          color: "var(--navy-900)",
          lineHeight: 1.2,
        }}>
          Welcome back, {firstName}!
        </h1>
        <p style={{ color: "var(--text-tertiary)", fontSize: "14px", margin: "8px 0 0" }}>
          Build your profile to attract the best opportunities.
        </p>
      </div>

      {/* Decorative badge */}
      <div style={{
        background: "var(--amber-100)",
        border: "1px solid var(--amber-200)",
        borderRadius: "16px",
        padding: "12px 20px",
        textAlign: "center",
        minWidth: "120px",
      }}>
        <p style={{ color: "var(--amber-700)", fontWeight: "700", fontSize: "24px", margin: 0 }}>🚀</p>
        <p style={{ color: "var(--amber-700)", fontSize: "12px", margin: "4px 0 0", fontWeight: "600" }}>
          {user?.role === "jobseeker" ? "Job Seeker" : user?.role}
        </p>
      </div>
    </div>
  );
};

export default WelcomeBanner;
