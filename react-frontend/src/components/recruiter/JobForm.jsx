import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { X, Briefcase } from "lucide-react";

/**
 * JobForm Modal Component
 * Used for Creating or Updating a Job post.
 */
const JobForm = ({ isOpen, onClose, initialData = null, onSubmit }) => {
  const [formData, setFormData] = useState({
    title: "",
    company: "",
    location: "",
    experienceRequired: "",
    description: "",
    requiredSkills: "",
    preferredSkills: "",
  });
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData && isOpen) {
      setFormData({
        title: initialData.title || "",
        company: initialData.company || "",
        location: initialData.location || "",
        experienceRequired: initialData.experienceRequired || "",
        description: initialData.description || "",
        requiredSkills: initialData.requiredSkills?.join(", ") || "",
        preferredSkills: initialData.preferredSkills?.join(", ") || "",
      });
    } else {
      setFormData({
        title: "", company: "", location: "", experienceRequired: "", description: "", requiredSkills: "", preferredSkills: ""
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.company) {
      toast.error("Title and Company are required.");
      return;
    }

    setLoading(true);
    
    // Process skills to array
    const reqSkills = formData.requiredSkills.split(",").map(s => s.trim()).filter(Boolean);
    const prefSkills = formData.preferredSkills.split(",").map(s => s.trim()).filter(Boolean);

    const payload = {
      ...formData,
      requiredSkills: reqSkills,
      preferredSkills: prefSkills,
    };

    try {
      await onSubmit(payload, initialData?._id);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content profile-form-modal animate-scale-in" style={{ maxWidth: "600px", width: "95%" }}>
        <button className="modal-close" onClick={onClose} disabled={loading}>
          <X size={20} />
        </button>
        
        <div className="modal-header" style={{ display: "flex", alignItems: "center", gap: "16px", textAlign: "left", marginBottom: "24px" }}>
          <div className="modal-icon-wrapper" style={{ background: "rgba(160, 120, 80, 0.15)", color: "var(--amber-700)" }}>
            <Briefcase size={24} />
          </div>
          <div>
            <h2 className="modal-title">{initialData ? "Edit Job Post" : "Create New Job"}</h2>
            <p className="modal-subtitle">Fill in the details for this job listing.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="profile-form-body" style={{ maxHeight: "70vh", overflowY: "auto", paddingRight: "10px" }}>
          
          <div className="form-group">
            <label className="form-label">Job Title *</label>
            <input 
              type="text" name="title" className="form-input" 
              value={formData.title} onChange={handleChange} 
              placeholder="e.g. Senior Frontend Developer" required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Company *</label>
            <input 
              type="text" name="company" className="form-input" 
              value={formData.company} onChange={handleChange} 
              placeholder="e.g. Acme Corp" required
              disabled={loading}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Location</label>
              <input 
                type="text" name="location" className="form-input" 
                value={formData.location} onChange={handleChange} 
                placeholder="e.g. Remote, New York"
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Experience</label>
              <input 
                type="text" name="experienceRequired" className="form-input" 
                value={formData.experienceRequired} onChange={handleChange} 
                placeholder="e.g. 3-5 Years"
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea 
              name="description" className="form-input" 
              value={formData.description} onChange={handleChange} 
              placeholder="Describe the job role and responsibilities..."
              rows={4}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Required Skills (comma separated)</label>
            <input 
              type="text" name="requiredSkills" className="form-input" 
              value={formData.requiredSkills} onChange={handleChange} 
              placeholder="React, Node.js, TypeScript"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Preferred Skills (comma separated)</label>
            <input 
              type="text" name="preferredSkills" className="form-input" 
              value={formData.preferredSkills} onChange={handleChange} 
              placeholder="GraphQL, Docker, AWS"
              disabled={loading}
            />
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Saving..." : (initialData ? "Update Job" : "Post Job")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JobForm;
