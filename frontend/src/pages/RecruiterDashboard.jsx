import { useAuth } from "../context/AuthContext";
import {
  Users,
  Briefcase,
  Eye,
  UserCheck,
  Bell,
  TrendingUp,
  Plus,
  BarChart3,
} from "lucide-react";

/**
 * Recruiter Dashboard
 * Displays welcome message, hiring stats, and job management overview
 */
const RecruiterDashboard = () => {
  const { user } = useAuth();

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        {/* Welcome Section */}
        <div className="welcome-section animate-fade-in-up">
          <div className="welcome-text">
            <h1>
              Welcome back, <span className="gradient-text-recruiter">{user?.name}</span>
            </h1>
            <p>Here's your recruiting activity overview.</p>
          </div>
          <div className="welcome-badge role-recruiter">
            <Users size={16} />
            Recruiter
          </div>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card glass" style={{ animationDelay: "0.1s" }}>
            <div className="stat-card-icon icon-purple">
              <Briefcase size={22} />
            </div>
            <div className="stat-card-info">
              <span className="stat-card-value">0</span>
              <span className="stat-card-label">Active Jobs</span>
            </div>
          </div>

          <div className="stat-card glass" style={{ animationDelay: "0.2s" }}>
            <div className="stat-card-icon icon-blue">
              <Users size={22} />
            </div>
            <div className="stat-card-info">
              <span className="stat-card-value">0</span>
              <span className="stat-card-label">Applicants</span>
            </div>
          </div>

          <div className="stat-card glass" style={{ animationDelay: "0.3s" }}>
            <div className="stat-card-icon icon-green">
              <UserCheck size={22} />
            </div>
            <div className="stat-card-info">
              <span className="stat-card-value">0</span>
              <span className="stat-card-label">Shortlisted</span>
            </div>
          </div>

          <div className="stat-card glass" style={{ animationDelay: "0.4s" }}>
            <div className="stat-card-icon icon-amber">
              <Eye size={22} />
            </div>
            <div className="stat-card-info">
              <span className="stat-card-value">0</span>
              <span className="stat-card-label">Profile Views</span>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="dashboard-grid">
          {/* Quick Actions */}
          <div className="dashboard-card glass animate-fade-in-up">
            <div className="card-header">
              <h3>
                <Plus size={18} />
                Quick Actions
              </h3>
            </div>
            <div className="quick-actions">
              <button className="action-btn">
                <Briefcase size={20} />
                <span>Post a Job</span>
              </button>
              <button className="action-btn">
                <Users size={20} />
                <span>Browse Candidates</span>
              </button>
              <button className="action-btn">
                <BarChart3 size={20} />
                <span>View Analytics</span>
              </button>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="dashboard-card glass animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
            <div className="card-header">
              <h3>
                <Bell size={18} />
                Recent Activity
              </h3>
            </div>
            <div className="empty-state">
              <TrendingUp size={40} className="empty-icon" />
              <p>No recent activity</p>
              <span>Post your first job to start receiving applications.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecruiterDashboard;
