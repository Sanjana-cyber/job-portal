import { useAuth } from "../context/AuthContext";
import {
  Shield,
  Users,
  Briefcase,
  Activity,
  Settings,
  Database,
  Bell,
  TrendingUp,
} from "lucide-react";
import "./Dashboard.css";

/**
 * Admin Dashboard
 * Displays system overview, user management stats, and admin tools
 */
const AdminDashboard = () => {
  const { user } = useAuth();

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        {/* Welcome Section */}
        <div className="welcome-section animate-fade-in-up">
          <div className="welcome-text">
            <h1>
              Welcome, <span className="gradient-text-admin">{user?.name}</span>
            </h1>
            <p>System administration and monitoring dashboard.</p>
          </div>
          <div className="welcome-badge role-admin">
            <Shield size={16} />
            Administrator
          </div>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card glass" style={{ animationDelay: "0.1s" }}>
            <div className="stat-card-icon icon-red">
              <Users size={22} />
            </div>
            <div className="stat-card-info">
              <span className="stat-card-value">0</span>
              <span className="stat-card-label">Total Users</span>
            </div>
          </div>

          <div className="stat-card glass" style={{ animationDelay: "0.2s" }}>
            <div className="stat-card-icon icon-blue">
              <Briefcase size={22} />
            </div>
            <div className="stat-card-info">
              <span className="stat-card-value">0</span>
              <span className="stat-card-label">Total Jobs</span>
            </div>
          </div>

          <div className="stat-card glass" style={{ animationDelay: "0.3s" }}>
            <div className="stat-card-icon icon-green">
              <Activity size={22} />
            </div>
            <div className="stat-card-info">
              <span className="stat-card-value">0</span>
              <span className="stat-card-label">Active Sessions</span>
            </div>
          </div>

          <div className="stat-card glass" style={{ animationDelay: "0.4s" }}>
            <div className="stat-card-icon icon-purple">
              <Database size={22} />
            </div>
            <div className="stat-card-info">
              <span className="stat-card-value">OK</span>
              <span className="stat-card-label">System Status</span>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="dashboard-grid">
          {/* Admin Tools */}
          <div className="dashboard-card glass animate-fade-in-up">
            <div className="card-header">
              <h3>
                <Settings size={18} />
                Admin Tools
              </h3>
            </div>
            <div className="quick-actions">
              <button className="action-btn admin-action">
                <Users size={20} />
                <span>Manage Users</span>
              </button>
              <button className="action-btn admin-action">
                <Briefcase size={20} />
                <span>Manage Jobs</span>
              </button>
              <button className="action-btn admin-action">
                <Activity size={20} />
                <span>System Logs</span>
              </button>
            </div>
          </div>

          {/* System Activity */}
          <div className="dashboard-card glass animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
            <div className="card-header">
              <h3>
                <Bell size={18} />
                System Activity
              </h3>
            </div>
            <div className="empty-state">
              <TrendingUp size={40} className="empty-icon" />
              <p>System monitoring active</p>
              <span>All systems running normally.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
