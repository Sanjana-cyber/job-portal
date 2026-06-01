import { useAuth } from "../context/AuthContext";
import {
  Search,
  FileText,
  BookmarkCheck,
  Bell,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";
import "./Dashboard.css";

/**
 * Job Seeker Dashboard
 * Displays welcome message, quick stats, and activity overview
 */
const JobSeekerDashboard = () => {
  const { user } = useAuth();

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        {/* Welcome Section */}
        <div className="welcome-section animate-fade-in-up">
          <div className="welcome-text">
            <h1>
              Welcome back, <span className="gradient-text">{user?.name}</span>
            </h1>
            <p>Here's an overview of your job search activity.</p>
          </div>
          <div className="welcome-badge role-jobseeker">
            <Search size={16} />
            Job Seeker
          </div>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card glass" style={{ animationDelay: "0.1s" }}>
            <div className="stat-card-icon icon-blue">
              <FileText size={22} />
            </div>
            <div className="stat-card-info">
              <span className="stat-card-value">0</span>
              <span className="stat-card-label">Applications</span>
            </div>
          </div>

          <div className="stat-card glass" style={{ animationDelay: "0.2s" }}>
            <div className="stat-card-icon icon-green">
              <CheckCircle size={22} />
            </div>
            <div className="stat-card-info">
              <span className="stat-card-value">0</span>
              <span className="stat-card-label">Shortlisted</span>
            </div>
          </div>

          <div className="stat-card glass" style={{ animationDelay: "0.3s" }}>
            <div className="stat-card-icon icon-amber">
              <Clock size={22} />
            </div>
            <div className="stat-card-info">
              <span className="stat-card-value">0</span>
              <span className="stat-card-label">Pending</span>
            </div>
          </div>

          <div className="stat-card glass" style={{ animationDelay: "0.4s" }}>
            <div className="stat-card-icon icon-purple">
              <BookmarkCheck size={22} />
            </div>
            <div className="stat-card-info">
              <span className="stat-card-value">0</span>
              <span className="stat-card-label">Saved Jobs</span>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="dashboard-grid">
          {/* Recent Activity */}
          <div className="dashboard-card glass animate-fade-in-up">
            <div className="card-header">
              <h3>
                <Bell size={18} />
                Recent Activity
              </h3>
            </div>
            <div className="empty-state">
              <TrendingUp size={40} className="empty-icon" />
              <p>No recent activity</p>
              <span>Start applying to jobs to see your activity here.</span>
            </div>
          </div>

          {/* Profile Completion */}
          <div className="dashboard-card glass animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
            <div className="card-header">
              <h3>
                <CheckCircle size={18} />
                Profile Status
              </h3>
            </div>
            <div className="profile-checklist">
              <div className="checklist-item completed">
                <CheckCircle size={16} />
                <span>Account created</span>
              </div>
              <div className={`checklist-item ${user?.isVerified ? "completed" : ""}`}>
                {user?.isVerified ? <CheckCircle size={16} /> : <XCircle size={16} />}
                <span>Email verified</span>
              </div>
              <div className="checklist-item">
                <XCircle size={16} />
                <span>Resume uploaded</span>
              </div>
              <div className="checklist-item">
                <XCircle size={16} />
                <span>Profile completed</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobSeekerDashboard;
