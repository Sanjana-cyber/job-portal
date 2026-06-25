import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import { Search, MapPin, Briefcase, Clock, FileText } from "lucide-react";
import { getJobs } from "../api/jobApi";
import { applyToJob } from "../api/applicationApi";

/**
 * JobsPage
 * For Candidates to view active jobs and apply to them.
 */
const JobsPage = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [applyingTo, setApplyingTo] = useState(null);
  const [coverLetter, setCoverLetter] = useState("");

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async (searchQuery = "") => {
    try {
      setLoading(true);
      const res = await getJobs(searchQuery);
      setJobs(res.data.data);
    } catch (err) {
      toast.error("Failed to load jobs");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchJobs(search);
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

  return (
    <div className="jobs-page" style={{ padding: "100px 20px 40px", maxWidth: "1200px", margin: "0 auto" }}>
      <div className="jobs-header" style={{ textAlign: "center", marginBottom: "40px" }}>
        <h1 className="section-title">Find Your Next Role</h1>
        <p className="section-subtitle">Browse open positions and apply directly with your active profile.</p>
        
        <form onSubmit={handleSearch} style={{ display: "flex", gap: "10px", justifyContent: "center", marginTop: "30px" }}>
          <div className="input-group" style={{ maxWidth: "400px", flex: 1 }}>
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

      <div className="jobs-list" style={{ display: "grid", gap: "20px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px" }}>Loading jobs...</div>
        ) : jobs.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: "var(--text-secondary)" }}>
            No jobs found. Try adjusting your search.
          </div>
        ) : (
          jobs.map(job => (
            <div key={job._id} className="job-card glass-strong" style={{ padding: "25px", borderRadius: "12px", display: "flex", flexDirection: "column", gap: "15px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <h3 style={{ margin: "0 0 5px", fontSize: "20px", color: "var(--text-primary)" }}>{job.title}</h3>
                  <div style={{ display: "flex", gap: "15px", color: "var(--text-secondary)", fontSize: "14px", flexWrap: "wrap" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: "5px" }}><Briefcase size={16} /> {job.company}</span>
                    {job.location && <span style={{ display: "flex", alignItems: "center", gap: "5px" }}><MapPin size={16} /> {job.location}</span>}
                    {job.experienceRequired && <span style={{ display: "flex", alignItems: "center", gap: "5px" }}><Clock size={16} /> {job.experienceRequired}</span>}
                  </div>
                </div>
                {user?.role === "jobseeker" ? (
                  <button className="btn-primary" onClick={() => setApplyingTo(job)}>Apply Now</button>
                ) : (
                  <button className="btn-secondary" onClick={() => toast.error("Only job seekers can apply")}>Apply Now</button>
                )}
              </div>

              <div style={{ fontSize: "15px", color: "var(--text-primary)", whiteSpace: "pre-wrap" }}>
                {job.description}
              </div>

              {job.requiredSkills && job.requiredSkills.length > 0 && (
                <div style={{ marginTop: "10px" }}>
                  <h4 style={{ fontSize: "14px", marginBottom: "8px", color: "var(--text-secondary)" }}>Required Skills:</h4>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
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

      {/* Apply Modal */}
      {applyingTo && (
        <div className="modal-overlay">
          <div className="modal-content animate-scale-in" style={{ maxWidth: "500px", width: "95%", background: "white", borderRadius: "12px", padding: "24px", position: "relative" }}>
            <button className="modal-close" onClick={() => setApplyingTo(null)} style={{ position: "absolute", top: "15px", right: "15px", background: "none", border: "none", cursor: "pointer" }}>
              <X size={20} />
            </button>
            <h2 style={{ marginBottom: "5px", fontSize: "20px" }}>Apply to {applyingTo.title}</h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: "20px" }}>at {applyingTo.company}</p>
            
            <div style={{ padding: "15px", background: "rgba(34, 197, 94, 0.1)", borderRadius: "8px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px", color: "var(--success-500)", fontSize: "14px" }}>
              <FileText size={18} />
              Your currently active resume will be sent to the recruiter automatically.
            </div>

            <form onSubmit={handleApply}>
              <div className="form-group" style={{ marginBottom: "20px" }}>
                <label className="form-label" style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: "500" }}>Cover Letter (Optional)</label>
                <textarea 
                  className="auth-input" 
                  rows={5} 
                  placeholder="Why are you a good fit for this role?"
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border-subtle)" }}
                />
              </div>
              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button type="button" className="btn-secondary" onClick={() => setApplyingTo(null)}>Cancel</button>
                <button type="submit" className="btn-primary">Submit Application</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobsPage;
