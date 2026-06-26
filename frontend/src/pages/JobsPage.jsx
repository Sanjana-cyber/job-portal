import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import AuthModal from "../components/AuthModal";
import toast from "react-hot-toast";
import { Search, MapPin, Briefcase, Clock, FileText, X } from "lucide-react";
import { getJobs } from "../api/jobApi";
import { applyToJob } from "../api/applicationApi";

/**
 * JobsPage — Public browsing, auth-gated applying
 *
 * Flow:
 *  • Any visitor can browse all jobs
 *  • Unauthenticated visitor clicks "Apply Now" → sees a friendly prompt
 *    → "Sign Up / Login" opens AuthModal pre-set to jobseeker role
 *  • Logged-in jobseeker clicks "Apply Now" → cover-letter form
 *  • Logged-in non-seeker → button disabled with tooltip
 */
const JobsPage = ({ inDashboard = false }) => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // State for apply flow (authenticated seekers)
  const [applyingTo, setApplyingTo] = useState(null);
  const [coverLetter, setCoverLetter] = useState("");

  // State for auth-gate flow (unauthenticated)
  const [authGateJob, setAuthGateJob] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => { fetchJobs(); }, []);

  const fetchJobs = async (q = "") => {
    try {
      setLoading(true);
      const res = await getJobs(q);
      setJobs(res.data.data);
    } catch {
      toast.error("Failed to load jobs");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => { e.preventDefault(); fetchJobs(search); };

  /** Central "Apply Now" handler — branches by auth state */
  const handleApplyClick = (job) => {
    if (!user) {
      setAuthGateJob(job);
    } else if (user.role === "jobseeker") {
      setApplyingTo(job);
    } else {
      toast.error("Only job seekers can apply for jobs.");
    }
  };

  const handleApply = async (e) => {
    e.preventDefault();
    if (!applyingTo) return;
    try {
      await applyToJob(applyingTo._id, { coverLetter });
      toast.success("Application submitted successfully!");
      setApplyingTo(null);
      setCoverLetter("");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to apply");
    }
  };

  const closeAuthGate = () => { setAuthGateJob(null); setShowAuthModal(false); };

  return (
    <div className="jobs-page" style={inDashboard ? { paddingTop: "32px" } : {}}>
      {/* ── Header ── */}
      <div className="jobs-header">
        <h1 className="section-title">Find Your Next Role</h1>
        <p className="section-subtitle">
          Browse open positions and apply directly with your active profile.
        </p>
        <form onSubmit={handleSearch} className="jobs-search-form">
          <div className="input-group jobs-search-input">
            <Search className="input-icon" size={18} />
            <input
              type="text"
              className="auth-input"
              placeholder="Search by title, company, or skills..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-primary">Search</button>
        </form>
      </div>

      {/* ── Listings ── */}
      <div className="jobs-list">
        {loading ? (
          <div className="jobs-loading">
            <div className="loading-spinner" />
            <span>Loading jobs...</span>
          </div>
        ) : jobs.length === 0 ? (
          <div className="empty-state">
            <Briefcase size={40} className="empty-icon" />
            <p>No jobs found</p>
            <span>Try adjusting your search terms.</span>
          </div>
        ) : (
          jobs.map((job) => (
            <div key={job._id} className="job-listing-card glass-strong">
              <div className="job-listing-top">
                <div className="job-listing-info">
                  <h3 className="job-listing-title">{job.title}</h3>
                  <div className="job-listing-meta">
                    <span><Briefcase size={14} /> {job.company}</span>
                    {job.location && <span><MapPin size={14} /> {job.location}</span>}
                    {job.experienceRequired && <span><Clock size={14} /> {job.experienceRequired}</span>}
                  </div>
                </div>

                {/* Apply button — state-aware */}
                {user?.role === "jobseeker" ? (
                  <button className="btn-primary job-apply-btn" onClick={() => handleApplyClick(job)}>
                    Apply Now
                  </button>
                ) : user ? (
                  <button className="btn-secondary job-apply-btn" disabled title="Only job seekers can apply">
                    Apply Now
                  </button>
                ) : (
                  <button className="btn-apply-gate job-apply-btn" onClick={() => handleApplyClick(job)}>
                    Apply Now
                  </button>
                )}
              </div>

              {job.description && (
                <p className="job-listing-desc">{job.description}</p>
              )}

              {job.requiredSkills?.length > 0 && (
                <div className="job-listing-skills">
                  <span className="skills-label">Required Skills</span>
                  <div className="skills-list">
                    {job.requiredSkills.map((skill, i) => (
                      <span key={i} className="badge badge-navy">{skill}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* ── Auth Gate: prompt for unauthenticated user ── */}
      {authGateJob && !showAuthModal && (
        <div className="modal-overlay" onClick={closeAuthGate}>
          <div className="auth-gate-modal animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="auth-gate-icon">🔐</div>
            <h2 className="auth-gate-title">Join to Apply</h2>
            <p className="auth-gate-job">
              Applying for <strong>{authGateJob.title}</strong>
            </p>
            <p className="auth-gate-company">at {authGateJob.company}</p>
            <p className="auth-gate-body">
              Create a free job seeker account or log in to submit your
              application along with your profile and resume.
            </p>
            <div className="auth-gate-actions">
              <button className="btn-secondary" onClick={closeAuthGate}>
                Maybe Later
              </button>
              <button className="btn-primary" onClick={() => setShowAuthModal(true)}>
                Sign Up / Login
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AuthModal pre-set to jobseeker */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={closeAuthGate}
        role="jobseeker"
      />

      {/* ── Apply Modal (authenticated jobseeker) ── */}
      {applyingTo && (
        <div className="modal-overlay">
          <div className="apply-modal animate-scale-in">
            <button className="modal-close" onClick={() => setApplyingTo(null)}>
              <X size={18} />
            </button>
            <h2 className="apply-modal-title">Apply to {applyingTo.title}</h2>
            <p className="apply-modal-company">at {applyingTo.company}</p>

            <div className="apply-resume-notice">
              <FileText size={18} />
              Your active resume will be sent to the recruiter automatically.
            </div>

            <form onSubmit={handleApply}>
              <div className="form-group">
                <label className="form-label">
                  Cover Letter{" "}
                  <span style={{ color: "var(--text-tertiary)", fontWeight: 400 }}>
                    (Optional)
                  </span>
                </label>
                <textarea
                  className="form-input"
                  rows={5}
                  placeholder="Why are you a good fit for this role?"
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                />
              </div>
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setApplyingTo(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobsPage;
