import { useAuth } from "../context/AuthContext";
import { Shield, AlertTriangle } from "lucide-react";

/**
 * System Management Console (Admin Dashboard Placeholder)
 * Confirms role-based security access for admin users
 */
const SystemManagementConsole = () => {
  const { user } = useAuth();

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        {/* Welcome Section */}
        <div className="welcome-section animate-fade-in-up">
          <div className="welcome-text">
            <h1>
              System Management <span className="gradient-text-admin">Console</span>
            </h1>
            <p>Welcome back, {user?.name}. Admin controls foundation loaded.</p>
          </div>
          <div className="welcome-badge role-admin">
            <Shield size={16} />
            Administrator
          </div>
        </div>

        {/* Placeholder Info Panel */}
        <div className="dashboard-card glass animate-fade-in-up" style={{ padding: "40px", textAlign: "center", marginTop: "20px" }}>
          <div style={{ display: "inline-flex", padding: "16px", borderRadius: "50%", background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", marginBottom: "20px" }}>
            <Shield size={48} />
          </div>
          <h2 style={{ fontSize: "24px", fontWeight: "700", marginBottom: "10px", color: "var(--text-primary)" }}>
            System Management Console
          </h2>
          <p style={{ color: "var(--text-secondary)", maxWidth: "500px", margin: "0 auto 30px auto", lineHeight: "1.6" }}>
            Admin functionality coming soon. The database role checking and route protection are fully operational.
          </p>

          <div style={{ display: "inline-flex", alignItems: "center", gap: "10px", padding: "12px 20px", borderRadius: "8px", background: "rgba(245, 158, 11, 0.08)", border: "1px solid rgba(245, 158, 11, 0.2)", color: "#f59e0b", fontSize: "14px" }}>
            <AlertTriangle size={16} />
            <span>Authorized access only. Security logs active.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemManagementConsole;
