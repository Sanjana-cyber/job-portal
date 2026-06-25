import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import {
  Users,
  Briefcase,
  Eye,
  UserCheck,
  Bell,
  TrendingUp,
  Plus,
  BarChart3,
  Edit2,
  Trash2,
  List
} from "lucide-react";
import { getMyJobs, createJob, updateJob, deleteJob } from "../api/jobApi";
import JobForm from "../components/recruiter/JobForm";
import ManageApplications from "../components/recruiter/ManageApplications";

/**
 * Recruiter Dashboard
 * Displays welcome message, hiring stats, and job management overview
 */
const RecruiterDashboard = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modals state
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

  const openEditJob = (job) => {
    setEditingJob(job);
    setIsJobFormOpen(true);
  };

  const openCreateJob = () => {
    setEditingJob(null);
    setIsJobFormOpen(true);
  };

  const openManageApps = (job) => {
    setSelectedJobForApps(job);
    setIsAppsOpen(true);
  };

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

        {/* Main Content Grid */}
        <div className="dashboard-grid" style={{ gridTemplateColumns: "1fr", marginTop: "30px" }}>
          
          <div className="dashboard-card glass animate-fade-in-up">
            <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3>
                <Briefcase size={18} />
                My Job Postings
              </h3>
              <button className="btn-primary" onClick={openCreateJob} style={{ padding: "8px 16px" }}>
                <Plus size={16} /> Post a Job
              </button>
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
                {jobs.map(job => (
                  <div key={job._id} style={{ padding: "20px", border: "1px solid var(--border-subtle)", borderRadius: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <h4 style={{ margin: "0 0 5px", fontSize: "18px" }}>{job.title}</h4>
                      <p style={{ margin: "0 0 10px", color: "var(--text-secondary)", fontSize: "14px" }}>
                        {job.company} • {job.location || "Location not specified"} • Posted {new Date(job.createdAt).toLocaleDateString()}
                      </p>
                      <div style={{ display: "flex", gap: "10px" }}>
                        {job.requiredSkills.slice(0, 3).map((skill, i) => (
                          <span key={i} className="badge badge-navy">{skill}</span>
                        ))}
                        {job.requiredSkills.length > 3 && (
                          <span className="badge badge-navy">+{job.requiredSkills.length - 3} more</span>
                        )}
                      </div>
                    </div>
                    
                    <div style={{ display: "flex", gap: "10px" }}>
                      <button 
                        className="btn-secondary" 
                        onClick={() => openManageApps(job)}
                        style={{ padding: "6px 12px", fontSize: "13px" }}
                      >
                        <Users size={16} /> Applications
                      </button>
                      <button 
                        className="btn-ghost" 
                        onClick={() => openEditJob(job)}
                        title="Edit Job"
                        style={{ padding: "6px" }}
                      >
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
