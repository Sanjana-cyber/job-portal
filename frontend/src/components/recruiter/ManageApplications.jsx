import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { X, Users, CheckCircle, XCircle, Clock, FileText } from "lucide-react";
import { getJobApplications, updateApplicationStatus } from "../../api/applicationApi";

/**
 * ManageApplications Modal Component
 * Used by Recruiters to view and update applications for a specific job.
 */
const ManageApplications = ({ isOpen, onClose, job }) => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && job) {
      fetchApplications();
    }
  }, [isOpen, job]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const res = await getJobApplications(job._id);
      setApplications(res.data.data);
    } catch (err) {
      toast.error("Failed to load applications");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (appId, newStatus) => {
    try {
      await updateApplicationStatus(appId, newStatus);
      toast.success(`Application marked as ${newStatus}`);
      
      // Update local state
      setApplications(apps => apps.map(app => 
        app._id === appId ? { ...app, status: newStatus } : app
      ));
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  if (!isOpen || !job) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content profile-form-modal animate-scale-in" style={{ maxWidth: "800px", width: "95%" }}>
        <button className="modal-close" onClick={onClose}>
          <X size={20} />
        </button>
        
        <div className="modal-header">
          <div className="modal-icon-wrapper" style={{ background: "rgba(34, 197, 94, 0.15)", color: "var(--success-500)" }}>
            <Users size={24} />
          </div>
          <div>
            <h2 className="modal-title">Applications</h2>
            <p className="modal-subtitle">Reviewing candidates for <strong>{job.title}</strong></p>
          </div>
        </div>

        <div className="profile-form-body" style={{ maxHeight: "70vh", overflowY: "auto", paddingRight: "10px" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "40px" }}>Loading applicants...</div>
          ) : applications.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", color: "var(--text-secondary)" }}>
              No applications received yet.
            </div>
          ) : (
            <div className="applications-list" style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              {applications.map((app) => (
                <div key={app._id} style={{ border: "1px solid var(--border-default)", borderRadius: "8px", padding: "15px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <h4 style={{ margin: "0 0 5px", fontSize: "16px" }}>{app.applicant.name}</h4>
                    <p style={{ margin: "0 0 8px", fontSize: "13px", color: "var(--text-secondary)" }}>{app.applicant.email}</p>
                    
                    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                      <a 
                        href={`http://localhost:5000/api/profile/resumes/${app.resume._id}/download`} 
                        className="badge badge-navy" 
                        style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "4px" }}
                      >
                        <FileText size={12} /> View Resume
                      </a>
                      
                      <span className="badge" style={{ 
                        background: app.status === "shortlisted" || app.status === "hired" ? "rgba(34, 197, 94, 0.15)" : 
                                    app.status === "rejected" ? "rgba(239, 68, 68, 0.15)" : "var(--cream-200)",
                        color: app.status === "shortlisted" || app.status === "hired" ? "var(--success-500)" : 
                               app.status === "rejected" ? "var(--error-500)" : "var(--text-secondary)"
                      }}>
                        {app.status.toUpperCase()}
                      </span>
                    </div>
                    
                    {app.coverLetter && (
                      <div style={{ marginTop: "10px", padding: "10px", background: "var(--cream-50)", borderRadius: "6px", fontSize: "13px" }}>
                        <strong>Cover Letter:</strong><br/>{app.coverLetter}
                      </div>
                    )}
                    
                    {app.atsScore !== undefined && app.atsScore !== null && (
                      <div style={{ marginTop: "12px", padding: "12px", background: "var(--cream-50)", borderRadius: "6px", borderLeft: "3px solid var(--navy-800)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                          <strong>ATS Score</strong>
                          <span style={{ fontWeight: "bold", color: app.atsScore >= 80 ? "var(--success-500)" : app.atsScore >= 60 ? "var(--warning-500)" : "var(--error-500)" }}>
                            {app.atsScore}%
                          </span>
                        </div>
                        {app.matchedKeywords?.length > 0 && (
                          <div style={{ marginBottom: "6px" }}>
                            <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Matched: </span>
                            {app.matchedKeywords.map((k, i) => <span key={i} className="badge badge-navy" style={{ background: "rgba(34, 197, 94, 0.1)", color: "var(--success-600)", border: "1px solid rgba(34, 197, 94, 0.2)", fontSize: "11px", padding: "2px 6px" }}>{k}</span>)}
                          </div>
                        )}
                        {app.missingKeywords?.length > 0 && (
                          <div>
                            <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Missing: </span>
                            {app.missingKeywords.map((k, i) => <span key={i} className="badge badge-navy" style={{ background: "rgba(239, 68, 68, 0.1)", color: "var(--error-600)", border: "1px solid rgba(239, 68, 68, 0.2)", fontSize: "11px", padding: "2px 6px" }}>{k}</span>)}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {app.status !== "shortlisted" && (
                      <button 
                        onClick={() => handleStatusChange(app._id, "shortlisted")}
                        style={{ padding: "6px 12px", background: "rgba(34, 197, 94, 0.1)", color: "var(--success-500)", border: "1px solid rgba(34, 197, 94, 0.3)", borderRadius: "4px", fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px" }}
                      >
                        <CheckCircle size={14} /> Shortlist
                      </button>
                    )}
                    {app.status !== "rejected" && (
                      <button 
                        onClick={() => handleStatusChange(app._id, "rejected")}
                        style={{ padding: "6px 12px", background: "rgba(239, 68, 68, 0.1)", color: "var(--error-500)", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: "4px", fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px" }}
                      >
                        <XCircle size={14} /> Reject
                      </button>
                    )}
                    {app.status === "pending" && (
                      <button 
                        onClick={() => handleStatusChange(app._id, "reviewed")}
                        style={{ padding: "6px 12px", background: "var(--cream-200)", color: "var(--text-primary)", border: "1px solid var(--border-default)", borderRadius: "4px", fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px" }}
                      >
                        <Clock size={14} /> Mark Reviewed
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageApplications;
