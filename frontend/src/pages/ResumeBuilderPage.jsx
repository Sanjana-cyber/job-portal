import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import html2pdf from "html2pdf.js";
import { Download, Plus, Trash2, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import AuthModal from "../components/AuthModal";

const ResumeBuilderPage = () => {
  const resumeRef = useRef(null);
  const { isAuthenticated } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const [personalInfo, setPersonalInfo] = useState({
    fullName: "",
    email: "",
    phone: "",
    location: "",
    linkedin: "",
    github: "",
    portfolio: "",
    summary: ""
  });

  const [education, setEducation] = useState([]);
  const [experience, setExperience] = useState([]);
  const [projects, setProjects] = useState([]);
  const [skills, setSkills] = useState("");

  const handlePersonalInfoChange = (e) => {
    setPersonalInfo({ ...personalInfo, [e.target.name]: e.target.value });
  };

  // Education Helpers
  const addEducation = () => {
    setEducation([...education, { institution: "", degree: "", startYear: "", endYear: "", grade: "" }]);
  };
  const updateEducation = (index, field, value) => {
    const newEd = [...education];
    newEd[index][field] = value;
    setEducation(newEd);
  };
  const removeEducation = (index) => setEducation(education.filter((_, i) => i !== index));

  // Experience Helpers
  const addExperience = () => {
    setExperience([...experience, { company: "", role: "", startDate: "", endDate: "", description: "" }]);
  };
  const updateExperience = (index, field, value) => {
    const newExp = [...experience];
    newExp[index][field] = value;
    setExperience(newExp);
  };
  const removeExperience = (index) => setExperience(experience.filter((_, i) => i !== index));

  // Projects Helpers
  const addProject = () => {
    setProjects([...projects, { name: "", link: "", description: "" }]);
  };
  const updateProject = (index, field, value) => {
    const newProj = [...projects];
    newProj[index][field] = value;
    setProjects(newProj);
  };
  const removeProject = (index) => setProjects(projects.filter((_, i) => i !== index));

  const handleDownload = () => {
    if (!isAuthenticated) {
      toast.error("Please login to download your resume.");
      setShowAuthModal(true);
      return;
    }
    
    const element = resumeRef.current;
    if (!element) return;
    
    // Simple black and white ATS-friendly styling options
    const opt = {
      margin: 10,
      filename: `${personalInfo.fullName.replace(/\s+/g, '_') || 'Resume'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    const loadingToast = toast.loading("Generating PDF...");
    html2pdf().from(element).set(opt).save().then(() => {
      toast.success("Resume downloaded successfully!", { id: loadingToast });
    }).catch(err => {
      console.error(err);
      toast.error("Failed to generate PDF.", { id: loadingToast });
    });
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-page)", fontFamily: "var(--font-body)", display: "flex", flexDirection: "column" }}>
      
      {/* Header */}
      <header style={{ padding: "15px 24px", background: "var(--bg-surface)", borderBottom: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          <Link to="/" style={{ color: "var(--text-secondary)", textDecoration: "none", display: "flex", alignItems: "center", gap: "5px" }}>
            <ArrowLeft size={18} /> Back
          </Link>
          <h1 style={{ margin: 0, fontSize: "20px", color: "var(--navy-900)" }}>ATS Resume Builder</h1>
        </div>
        <button className="btn-primary" onClick={handleDownload} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Download size={16} /> Download PDF
        </button>
      </header>

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        
        {/* Left Side: Form */}
        <div style={{ width: "45%", padding: "30px", overflowY: "auto", borderRight: "1px solid var(--border-subtle)", background: "var(--bg-surface)" }}>
          <h2 style={{ fontSize: "18px", marginBottom: "20px" }}>Enter Your Details</h2>
          
          {/* Personal Info */}
          <div style={{ marginBottom: "30px" }}>
            <h3 style={{ fontSize: "15px", borderBottom: "1px solid var(--border-default)", paddingBottom: "8px", marginBottom: "15px" }}>Personal Information</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
              <input type="text" name="fullName" placeholder="Full Name" value={personalInfo.fullName} onChange={handlePersonalInfoChange} className="form-input" />
              <input type="email" name="email" placeholder="Email" value={personalInfo.email} onChange={handlePersonalInfoChange} className="form-input" />
              <input type="text" name="phone" placeholder="Phone Number" value={personalInfo.phone} onChange={handlePersonalInfoChange} className="form-input" />
              <input type="text" name="location" placeholder="Location (e.g. City, State)" value={personalInfo.location} onChange={handlePersonalInfoChange} className="form-input" />
              <input type="text" name="linkedin" placeholder="LinkedIn URL" value={personalInfo.linkedin} onChange={handlePersonalInfoChange} className="form-input" />
              <input type="text" name="github" placeholder="GitHub URL" value={personalInfo.github} onChange={handlePersonalInfoChange} className="form-input" />
              <input type="text" name="portfolio" placeholder="Portfolio/Website URL" value={personalInfo.portfolio} onChange={handlePersonalInfoChange} className="form-input" />
            </div>
            <textarea name="summary" placeholder="Professional Summary (2-3 sentences)" value={personalInfo.summary} onChange={handlePersonalInfoChange} className="form-input" rows={3} style={{ marginTop: "15px" }} />
          </div>

          {/* Education */}
          <div style={{ marginBottom: "30px" }}>
            <h3 style={{ fontSize: "15px", borderBottom: "1px solid var(--border-default)", paddingBottom: "8px", marginBottom: "15px", display: "flex", justifyContent: "space-between" }}>
              Education
              <button onClick={addEducation} style={{ background: "none", border: "none", color: "var(--brand-600)", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontSize: "13px" }}><Plus size={14}/> Add</button>
            </h3>
            {education.map((edu, idx) => (
              <div key={idx} style={{ background: "var(--cream-50)", padding: "15px", borderRadius: "8px", marginBottom: "15px", position: "relative" }}>
                <button onClick={() => removeEducation(idx)} style={{ position: "absolute", top: "10px", right: "10px", background: "none", border: "none", color: "var(--error-500)", cursor: "pointer" }}><Trash2 size={16} /></button>
                <input type="text" placeholder="Institution Name" value={edu.institution} onChange={(e) => updateEducation(idx, 'institution', e.target.value)} className="form-input" style={{ marginBottom: "10px" }} />
                <input type="text" placeholder="Degree (e.g. B.S. Computer Science)" value={edu.degree} onChange={(e) => updateEducation(idx, 'degree', e.target.value)} className="form-input" style={{ marginBottom: "10px" }} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                  <input type="text" placeholder="Start Year" value={edu.startYear} onChange={(e) => updateEducation(idx, 'startYear', e.target.value)} className="form-input" />
                  <input type="text" placeholder="End Year" value={edu.endYear} onChange={(e) => updateEducation(idx, 'endYear', e.target.value)} className="form-input" />
                  <input type="text" placeholder="Grade/GPA" value={edu.grade} onChange={(e) => updateEducation(idx, 'grade', e.target.value)} className="form-input" />
                </div>
              </div>
            ))}
          </div>

          {/* Experience */}
          <div style={{ marginBottom: "30px" }}>
            <h3 style={{ fontSize: "15px", borderBottom: "1px solid var(--border-default)", paddingBottom: "8px", marginBottom: "15px", display: "flex", justifyContent: "space-between" }}>
              Work Experience
              <button onClick={addExperience} style={{ background: "none", border: "none", color: "var(--brand-600)", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontSize: "13px" }}><Plus size={14}/> Add</button>
            </h3>
            {experience.map((exp, idx) => (
              <div key={idx} style={{ background: "var(--cream-50)", padding: "15px", borderRadius: "8px", marginBottom: "15px", position: "relative" }}>
                <button onClick={() => removeExperience(idx)} style={{ position: "absolute", top: "10px", right: "10px", background: "none", border: "none", color: "var(--error-500)", cursor: "pointer" }}><Trash2 size={16} /></button>
                <input type="text" placeholder="Company Name" value={exp.company} onChange={(e) => updateExperience(idx, 'company', e.target.value)} className="form-input" style={{ marginBottom: "10px" }} />
                <input type="text" placeholder="Job Title" value={exp.role} onChange={(e) => updateExperience(idx, 'role', e.target.value)} className="form-input" style={{ marginBottom: "10px" }} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
                  <input type="text" placeholder="Start Date (e.g. Jan 2020)" value={exp.startDate} onChange={(e) => updateExperience(idx, 'startDate', e.target.value)} className="form-input" />
                  <input type="text" placeholder="End Date (e.g. Present)" value={exp.endDate} onChange={(e) => updateExperience(idx, 'endDate', e.target.value)} className="form-input" />
                </div>
                <textarea placeholder="Description (Bullet points recommended, separated by newlines)" value={exp.description} onChange={(e) => updateExperience(idx, 'description', e.target.value)} className="form-input" rows={4} />
              </div>
            ))}
          </div>

          {/* Projects */}
          <div style={{ marginBottom: "30px" }}>
            <h3 style={{ fontSize: "15px", borderBottom: "1px solid var(--border-default)", paddingBottom: "8px", marginBottom: "15px", display: "flex", justifyContent: "space-between" }}>
              Projects
              <button onClick={addProject} style={{ background: "none", border: "none", color: "var(--brand-600)", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontSize: "13px" }}><Plus size={14}/> Add</button>
            </h3>
            {projects.map((proj, idx) => (
              <div key={idx} style={{ background: "var(--cream-50)", padding: "15px", borderRadius: "8px", marginBottom: "15px", position: "relative" }}>
                <button onClick={() => removeProject(idx)} style={{ position: "absolute", top: "10px", right: "10px", background: "none", border: "none", color: "var(--error-500)", cursor: "pointer" }}><Trash2 size={16} /></button>
                <input type="text" placeholder="Project Name" value={proj.name} onChange={(e) => updateProject(idx, 'name', e.target.value)} className="form-input" style={{ marginBottom: "10px" }} />
                <input type="text" placeholder="Project Link (Optional)" value={proj.link} onChange={(e) => updateProject(idx, 'link', e.target.value)} className="form-input" style={{ marginBottom: "10px" }} />
                <textarea placeholder="Description" value={proj.description} onChange={(e) => updateProject(idx, 'description', e.target.value)} className="form-input" rows={3} />
              </div>
            ))}
          </div>

          {/* Skills */}
          <div style={{ marginBottom: "30px" }}>
            <h3 style={{ fontSize: "15px", borderBottom: "1px solid var(--border-default)", paddingBottom: "8px", marginBottom: "15px" }}>Skills</h3>
            <textarea placeholder="Enter skills separated by commas (e.g. JavaScript, React, Node.js)" value={skills} onChange={(e) => setSkills(e.target.value)} className="form-input" rows={3} />
          </div>

        </div>

        {/* Right Side: Live Preview (A4 Size) */}
        <div style={{ width: "55%", padding: "30px", overflowY: "auto", display: "flex", justifyContent: "center", background: "#e5e7eb" }}>
          
          {/* Resume Paper Container */}
          <div 
            ref={resumeRef}
            style={{ 
              width: "210mm", 
              minHeight: "297mm", 
              background: "white", 
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
              padding: "20mm 20mm",
              boxSizing: "border-box",
              fontFamily: "Arial, sans-serif", // ATS friendly font
              color: "#000", // strictly black text
              lineHeight: "1.4"
            }}
          >
            {/* Header */}
            <div style={{ textAlign: "center", marginBottom: "15px" }}>
              <h1 style={{ fontSize: "24px", fontWeight: "bold", margin: "0 0 5px 0", textTransform: "uppercase" }}>
                {personalInfo.fullName || "YOUR NAME"}
              </h1>
              <div style={{ fontSize: "12px", display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "10px" }}>
                {personalInfo.location && <span>{personalInfo.location}</span>}
                {personalInfo.phone && <span>{personalInfo.phone}</span>}
                {personalInfo.email && <span>{personalInfo.email}</span>}
              </div>
              <div style={{ fontSize: "12px", display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "10px", marginTop: "4px" }}>
                {personalInfo.linkedin && <span>{personalInfo.linkedin}</span>}
                {personalInfo.github && <span>{personalInfo.github}</span>}
                {personalInfo.portfolio && <span>{personalInfo.portfolio}</span>}
              </div>
            </div>

            {/* Summary */}
            {personalInfo.summary && (
              <div style={{ marginBottom: "15px" }}>
                <div style={{ borderBottom: "1px solid #000", fontWeight: "bold", fontSize: "14px", textTransform: "uppercase", marginBottom: "5px" }}>Professional Summary</div>
                <div style={{ fontSize: "12px" }}>{personalInfo.summary}</div>
              </div>
            )}

            {/* Experience */}
            {experience.length > 0 && (
              <div style={{ marginBottom: "15px" }}>
                <div style={{ borderBottom: "1px solid #000", fontWeight: "bold", fontSize: "14px", textTransform: "uppercase", marginBottom: "5px" }}>Experience</div>
                {experience.map((exp, idx) => (
                  <div key={idx} style={{ marginBottom: "10px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <strong style={{ fontSize: "13px" }}>{exp.company}</strong>
                      <span style={{ fontSize: "12px" }}>{exp.startDate} {exp.endDate ? `- ${exp.endDate}` : ""}</span>
                    </div>
                    <div style={{ fontSize: "13px", fontStyle: "italic", marginBottom: "4px" }}>{exp.role}</div>
                    {exp.description && (
                      <ul style={{ margin: "0", paddingLeft: "15px", fontSize: "12px" }}>
                        {exp.description.split('\n').map((line, i) => line.trim() ? <li key={i}>{line.trim()}</li> : null)}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Education */}
            {education.length > 0 && (
              <div style={{ marginBottom: "15px" }}>
                <div style={{ borderBottom: "1px solid #000", fontWeight: "bold", fontSize: "14px", textTransform: "uppercase", marginBottom: "5px" }}>Education</div>
                {education.map((edu, idx) => (
                  <div key={idx} style={{ marginBottom: "8px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <strong style={{ fontSize: "13px" }}>{edu.institution}</strong>
                      <span style={{ fontSize: "12px" }}>{edu.startYear} {edu.endYear ? `- ${edu.endYear}` : ""}</span>
                    </div>
                    <div style={{ fontSize: "12px" }}>
                      {edu.degree} {edu.grade ? `| GPA: ${edu.grade}` : ""}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Projects */}
            {projects.length > 0 && (
              <div style={{ marginBottom: "15px" }}>
                <div style={{ borderBottom: "1px solid #000", fontWeight: "bold", fontSize: "14px", textTransform: "uppercase", marginBottom: "5px" }}>Projects</div>
                {projects.map((proj, idx) => (
                  <div key={idx} style={{ marginBottom: "8px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <strong style={{ fontSize: "13px" }}>{proj.name}</strong>
                      {proj.link && <span style={{ fontSize: "12px" }}>{proj.link}</span>}
                    </div>
                    <div style={{ fontSize: "12px" }}>{proj.description}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Skills */}
            {skills && (
              <div style={{ marginBottom: "15px" }}>
                <div style={{ borderBottom: "1px solid #000", fontWeight: "bold", fontSize: "14px", textTransform: "uppercase", marginBottom: "5px" }}>Skills</div>
                <div style={{ fontSize: "12px" }}>
                  {skills.split(',').map(s => s.trim()).filter(Boolean).join(' • ')}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
      
      {/* Auth Modal for unauthenticated users trying to download */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        role="jobseeker"
      />
    </div>
  );
};

export default ResumeBuilderPage;
