import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Users,
  Briefcase,
  Eye,
  UserCheck,
  Plus,
  Edit2,
  Trash2,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { getMyJobs, createJob, updateJob, deleteJob } from "../api/jobApi";
import JobForm from "../components/recruiter/JobForm";
import ManageApplications from "../components/recruiter/ManageApplications";
import RecruiterVerificationPanel from "../components/recruiter/RecruiterVerificationPanel";

/**
 * Recruiter Dashboard
 * Displays welcome message, hiring stats, job management, and company verification panel.
 */
const RecruiterDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Verification state (driven by the panel's callback)
  const [verifStatus, setVerifStatus] = useState("none");
  const [verifRequired, setVerifRequired] = useState(false);

  // Modals
  const [isJobFormOpen, setIsJobFormOpen] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [isAppsOpen, setIsAppsOpen] = useState(false);
  const [selectedJobForApps, setSelectedJobForApps] = useState(null);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const res = await getMyJobs();
      setJobs(res.data.data);
    } catch (err) {
      toast.error("Failed to load your jobs");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrUpdateJob = async (jobData, id) => {
    if (id) {
      await updateJob(id, jobData);
      toast.success("Job updated successfully");
    } else {
      await createJob(jobData);
      toast.success("Job posted successfully");
    }
    fetchJobs();
  };

  const handleDeleteJob = async (id) => {
    if (window.confirm("Are you sure you want to delete this job? All applications will also be deleted.")) {
      try {
        await deleteJob(id);
        toast.success("Job deleted");
        fetchJobs();
      } catch (err) {
        toast.error("Failed to delete job");
      }
    }
  };

  const openEditJob = (job) => { setEditingJob(job); setIsJobFormOpen(true); };
  const openCreateJob = () => {
    // Block if verification required and not approved
    if (verifRequired && verifStatus !== "approved") {
      toast.error("Company verification required. Please submit your company details below.");
      return;
    }
    setEditingJob(null);
    setIsJobFormOpen(true);
  };
  const openManageApps = (job) => { setSelectedJobForApps(job); setIsAppsOpen(true); };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully");
      navigate("/");
    } catch (err) {
      toast.error("Failed to logout");
    }
  };

  // Called by the verification panel when status changes
  const handleVerifStatusChange = (data) => {
    setVerifStatus(data.companyVerificationStatus);
    setVerifRequired(data.verificationRequired);
  };

  const canPost = !verifRequired || verifStatus === "approved";

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
          <div className="welcome-actions">
            <div className="welcome-badge role-recruiter">
              <Users size={16} />
              Recruiter
            </div>
            {verifStatus === "approved" && (
              <div className="verif-badge-approved">
                <ShieldCheck size={14} /> Verified
              </div>
            )}
            <button className="btn-logout" onClick={handleLogout} title="Logout">
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>

        {/* Verification Panel */}
        <RecruiterVerificationPanel onStatusChange={handleVerifStatusChange} />

        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card glass" style={{ animationDelay: "0.1s" }}>
            <div className="stat-card-icon icon-purple">
              <Briefcase size={22} />
            </div>
            <div className="stat-card-info">
              <span className="stat-card-value">{jobs.length}</span>
              <span className="stat-card-label">Active Jobs</span>
            </div>
          </div>
          <div className="stat-card glass" style={{ animationDelay: "0.2s" }}>
            <div className="stat-card-icon icon-blue">
              <Users size={22} />
            </div>
            <div className="stat-card-info">
              <span className="stat-card-value">--</span>
              <span className="stat-card-label">Total Applicants</span>
            </div>
          </div>
          <div className="stat-card glass" style={{ animationDelay: "0.3s" }}>
            <div className="stat-card-icon icon-green">
              <UserCheck size={22} />
            </div>
            <div className="stat-card-info">
              <span className="stat-card-value">--</span>
              <span className="stat-card-label">Shortlisted</span>
            </div>
          </div>
          <div className="stat-card glass" style={{ animationDelay: "0.4s" }}>
            <div className="stat-card-icon icon-amber">
              <Eye size={22} />
            </div>
            <div className="stat-card-info">
              <span className="stat-card-value">--</span>
              <span className="stat-card-label">Profile Views</span>
            </div>
          </div>
        </div>

        {/* Job Postings */}
        <div className="dashboard-grid" style={{ gridTemplateColumns: "1fr", marginTop: "30px" }}>
          <div className="dashboard-card glass animate-fade-in-up">
            <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3>
                <Briefcase size={18} />
                My Job Postings
              </h3>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                {verifRequired && verifStatus !== "approved" && (
                  <span style={{ fontSize: "12px", color: "var(--warning-500)", display: "flex", alignItems: "center", gap: "5px" }}>
                    ⚠ Verification required to post
                  </span>
                )}
                <button
                  className="btn-primary"
                  onClick={openCreateJob}
                  disabled={!canPost}
                  style={{ padding: "8px 16px", opacity: canPost ? 1 : 0.5 }}
                  title={canPost ? "Post a new job" : "Company verification required"}
                >
                  <Plus size={16} /> Post a Job
                </button>
              </div>
            </div>

            {loading ? (
              <div style={{ padding: "40px", textAlign: "center" }}>Loading jobs...</div>
            ) : jobs.length === 0 ? (
              <div className="empty-state">
                <Briefcase size={40} className="empty-icon" />
                <p>No jobs posted yet</p>
                <span>Click "Post a Job" to start receiving applications.</span>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "15px", marginTop: "20px" }}>
                {jobs.map((job) => (
                  <div key={job._id} className="job-card">
                    <div className="job-card-info">
                      <h4>{job.title}</h4>
                      <p>
                        {job.company} • {job.location || "Location not specified"} • Posted {new Date(job.createdAt).toLocaleDateString()}
                      </p>
                      <div className="job-card-skills">
                        {job.requiredSkills.slice(0, 3).map((skill, i) => (
                          <span key={i} className="badge badge-navy">{skill}</span>
                        ))}
                        {job.requiredSkills.length > 3 && (
                          <span className="badge badge-navy">+{job.requiredSkills.length - 3} more</span>
                        )}
                      </div>
                    </div>
                    <div className="job-card-actions">
                      <button
                        className="btn-secondary"
                        onClick={() => openManageApps(job)}
                        style={{ padding: "6px 12px", fontSize: "13px" }}
                      >
                        <Users size={16} /> Applications
                      </button>
                      <button className="btn-ghost" onClick={() => openEditJob(job)} title="Edit Job" style={{ padding: "6px" }}>
                        <Edit2 size={16} />
                      </button>
                      <button
                        className="btn-ghost"
                        onClick={() => handleDeleteJob(job._id)}
                        style={{ padding: "6px", color: "var(--error-500)" }}
                        title="Delete Job"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <JobForm
        isOpen={isJobFormOpen}
        onClose={() => setIsJobFormOpen(false)}
        initialData={editingJob}
        onSubmit={handleCreateOrUpdateJob}
      />
      <ManageApplications
        isOpen={isAppsOpen}
        onClose={() => setIsAppsOpen(false)}
        job={selectedJobForApps}
      />
    </div>
  );
};

export default RecruiterDashboard;
