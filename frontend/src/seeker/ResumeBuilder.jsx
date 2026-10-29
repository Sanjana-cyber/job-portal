import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  FileText,
  Download,
  Printer,
  Plus,
  Trash2,
  ArrowLeft,
  Sparkles,
  User,
  Briefcase,
  GraduationCap,
  Code,
  FolderGit2,
  Award,
  ExternalLink,
  Mail,
  Phone,
  MapPin,
  Globe,
  X,
  LogIn,
  RefreshCw,
  Eye,
  CheckCircle2,
  LayoutTemplate
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import TalentBridgeLogo from "../components/TalentBridgeLogo/TalentBridgeLogo";
import { useAuthModal } from "../context/AuthModalContext";
import "./ResumeBuilder.css";

/* ── Default Sample Data for Initial Display ────────────────────────────── */
const INITIAL_RESUME_DATA = {
  personalInfo: {
    fullName: "Aarav Sharma",
    headline: "Senior Full Stack Engineer & Cloud Architect",
    email: "aarav.sharma@example.com",
    phone: "+91 98765 43210",
    location: "Bangalore, India",
    linkedin: "linkedin.com/in/aaravsharma",
    website: "github.com/aaravsharma",
  },
  summary:
    "Dynamic and results-driven Full Stack Engineer with 4+ years of expertise in building enterprise web applications and scalable microservices. Proficient in React, Node.js, TypeScript, and AWS cloud architectures. Recognized for optimizing platform performance by 40% and delivering reliable, high-throughput solutions.",
  experiences: [
    {
      id: "exp-1",
      role: "Lead Full Stack Developer",
      company: "Cognitive Cloud Solutions",
      location: "Bangalore, India",
      startDate: "2023",
      endDate: "Present",
      description:
        "Architected distributed React & Node.js microservices serving 200k+ active users. Improved API latency by 35% through Redis caching and query indexing. Mentored junior engineers and led sprint planning.",
    },
    {
      id: "exp-2",
      role: "Software Development Engineer",
      company: "Apex Tech Innovations",
      location: "Hyderabad, India",
      startDate: "2021",
      endDate: "2023",
      description:
        "Developed customer-facing dashboard interfaces using React, Redux, and TailwindCSS. Engineered secure JWT authentication mechanisms and RESTful endpoints using Express and MongoDB.",
    },
  ],
  education: [
    {
      id: "edu-1",
      degree: "Bachelor of Technology in Computer Science",
      institution: "National Institute of Technology (NIT)",
      location: "Bangalore",
      year: "2017 - 2021",
      score: "8.8 CGPA",
    },
  ],
  projects: [
    {
      id: "proj-1",
      title: "TalentBridge AI Hiring Platform",
      techStack: "React, Node.js, MongoDB, OpenAI API",
      link: "https://talentbridge.example.com",
      description:
        "Built an end-to-end AI-powered recruitment engine featuring resume parsing, ATS scoring, and automated candidate interview invitation workflows.",
    },
    {
      id: "proj-2",
      title: "Distributed Task Scheduler",
      techStack: "Go, Redis, Docker, PostgreSQL",
      link: "https://github.com/aaravsharma/task-runner",
      description:
        "Designed a high-throughput distributed task runner capable of scheduling 10k+ cron triggers per minute with automatic failover.",
    },
  ],
  skills: [
    "React.js",
    "Node.js",
    "TypeScript",
    "JavaScript (ES6+)",
    "Express.js",
    "MongoDB",
    "PostgreSQL",
    "Redis",
    "AWS (S3, EC2)",
    "Docker",
    "RESTful APIs",
    "Git & CI/CD",
  ],
  certifications: [
    {
      id: "cert-1",
      title: "AWS Certified Solutions Architect – Associate",
      issuer: "Amazon Web Services",
      year: "2023",
    },
    {
      id: "cert-2",
      title: "Meta Certified Frontend Developer",
      issuer: "Meta / Coursera",
      year: "2022",
    },
  ],
};

export default function ResumeBuilder() {
  const navigate = useNavigate();
  const { user, openModal } = useAuthModal();

  // Active form section tab: "personal" | "summary" | "experience" | "education" | "projects" | "skills" | "certifications"
  const [activeTab, setActiveTab] = useState("personal");

  // Mobile view switch: "form" | "preview"
  const [mobileView, setMobileView] = useState("form");

  // Theme styling: "modern-blue" | "executive-slate" | "emerald-clean"
  const [theme, setTheme] = useState("modern-blue");

  // Zoom level for document preview
  const [zoom, setZoom] = useState(1);

  // Resume state
  const [resumeData, setResumeData] = useState(() => {
    try {
      const saved = localStorage.getItem("tb_resume_draft");
      return saved ? JSON.parse(saved) : INITIAL_RESUME_DATA;
    } catch {
      return INITIAL_RESUME_DATA;
    }
  });

  // Toast state
  const [toastMessage, setToastMessage] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const resumeDocRef = useRef(null);

  // Auto-fill logged-in user name/email if blank
  useEffect(() => {
    if (user && resumeData.personalInfo.fullName === "Aarav Sharma") {
      setResumeData((prev) => ({
        ...prev,
        personalInfo: {
          ...prev.personalInfo,
          fullName: user.name || prev.personalInfo.fullName,
          email: user.email || prev.personalInfo.email,
        },
      }));
    }
  }, [user]);

  // Save draft to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("tb_resume_draft", JSON.stringify(resumeData));
    } catch {
      // storage unavailable
    }
  }, [resumeData]);

  /* ── Form Change Handlers ──────────────────────────────────────────────── */
  const handlePersonalInfoChange = (field, value) => {
    setResumeData((prev) => ({
      ...prev,
      personalInfo: { ...prev.personalInfo, [field]: value },
    }));
  };

  const handleSummaryChange = (value) => {
    setResumeData((prev) => ({ ...prev, summary: value }));
  };

  // Experience handlers
  const handleAddExperience = () => {
    setResumeData((prev) => ({
      ...prev,
      experiences: [
        ...prev.experiences,
        {
          id: `exp-${Date.now()}`,
          role: "",
          company: "",
          location: "",
          startDate: "",
          endDate: "Present",
          description: "",
        },
      ],
    }));
  };

  const handleUpdateExperience = (id, field, value) => {
    setResumeData((prev) => ({
      ...prev,
      experiences: prev.experiences.map((exp) =>
        exp.id === id ? { ...exp, [field]: value } : exp
      ),
    }));
  };

  const handleRemoveExperience = (id) => {
    setResumeData((prev) => ({
      ...prev,
      experiences: prev.experiences.filter((exp) => exp.id !== id),
    }));
  };

  // Education handlers
  const handleAddEducation = () => {
    setResumeData((prev) => ({
      ...prev,
      education: [
        ...prev.education,
        {
          id: `edu-${Date.now()}`,
          degree: "",
          institution: "",
          location: "",
          year: "",
          score: "",
        },
      ],
    }));
  };

  const handleUpdateEducation = (id, field, value) => {
    setResumeData((prev) => ({
      ...prev,
      education: prev.education.map((edu) =>
        edu.id === id ? { ...edu, [field]: value } : edu
      ),
    }));
  };

  const handleRemoveEducation = (id) => {
    setResumeData((prev) => ({
      ...prev,
      education: prev.education.filter((edu) => edu.id !== id),
    }));
  };

  // Project handlers
  const handleAddProject = () => {
    setResumeData((prev) => ({
      ...prev,
      projects: [
        ...prev.projects,
        {
          id: `proj-${Date.now()}`,
          title: "",
          techStack: "",
          link: "",
          description: "",
        },
      ],
    }));
  };

  const handleUpdateProject = (id, field, value) => {
    setResumeData((prev) => ({
      ...prev,
      projects: prev.projects.map((proj) =>
        proj.id === id ? { ...proj, [field]: value } : proj
      ),
    }));
  };

  const handleRemoveProject = (id) => {
    setResumeData((prev) => ({
      ...prev,
      projects: prev.projects.filter((proj) => proj.id !== id),
    }));
  };

  // Skill handlers
  const [skillInput, setSkillInput] = useState("");

  const handleAddSkill = (skill) => {
    const trimmed = (skill || skillInput).trim();
    if (!trimmed) return;
    if (!resumeData.skills.includes(trimmed)) {
      setResumeData((prev) => ({
        ...prev,
        skills: [...prev.skills, trimmed],
      }));
    }
    setSkillInput("");
  };

  const handleRemoveSkill = (skillToRemove) => {
    setResumeData((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skillToRemove),
    }));
  };

  // Certification handlers
  const handleAddCertification = () => {
    setResumeData((prev) => ({
      ...prev,
      certifications: [
        ...prev.certifications,
        {
          id: `cert-${Date.now()}`,
          title: "",
          issuer: "",
          year: "",
        },
      ],
    }));
  };

  const handleUpdateCertification = (id, field, value) => {
    setResumeData((prev) => ({
      ...prev,
      certifications: prev.certifications.map((c) =>
        c.id === id ? { ...c, [field]: value } : c
      ),
    }));
  };

  const handleRemoveCertification = (id) => {
    setResumeData((prev) => ({
      ...prev,
      certifications: prev.certifications.filter((c) => c.id !== id),
    }));
  };

  const handleResetSample = () => {
    if (window.confirm("Reset all resume data to sample template?")) {
      setResumeData(INITIAL_RESUME_DATA);
    }
  };

  /* ── Load Dynamic html2pdf Script ───────────────────────────────────────── */
  const loadHtml2Pdf = () => {
    return new Promise((resolve, reject) => {
      if (window.html2pdf) {
        resolve(window.html2pdf);
        return;
      }
      const existing = document.getElementById("html2pdf-cdn");
      if (existing) {
        existing.onload = () => resolve(window.html2pdf);
        return;
      }
      const script = document.createElement("script");
      script.id = "html2pdf-cdn";
      script.src =
        "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
      script.onload = () => resolve(window.html2pdf);
      script.onerror = () => reject(new Error("Failed to load PDF engine"));
      document.body.appendChild(script);
    });
  };

  /* ── PDF Export Handler with Login Enforcement ──────────────────────────── */
  const handleDownloadPDF = async () => {
    // 1. If not logged in, show toast first then open login dialog
    if (!user) {
      setToastMessage("Please login first to download your resume");
      setTimeout(() => {
        openModal("login", "jobseeker");
      }, 700);
      setTimeout(() => {
        setToastMessage(null);
      }, 4000);
      return;
    }

    // 2. Generate and download PDF
    setIsExporting(true);
    const element = document.getElementById("resume-preview-document");
    if (!element) {
      setIsExporting(false);
      return;
    }

    const safeName =
      (resumeData.personalInfo.fullName || "My_Resume")
        .trim()
        .replace(/\s+/g, "_") || "Resume";

    try {
      const html2pdf = await loadHtml2Pdf();
      const opt = {
        margin: [10, 10, 10, 10],
        filename: `${safeName}_Resume.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      };
      await html2pdf().set(opt).from(element).save();
    } catch {
      // Fallback to native browser print if script loading fails
      window.print();
    } finally {
      setIsExporting(false);
    }
  };

  /* ── Print / Save as PDF Native Trigger ──────────────────────────────────── */
  const handlePrint = () => {
    if (!user) {
      setToastMessage("Please login first to download your resume");
      setTimeout(() => {
        openModal("login", "jobseeker");
      }, 700);
      setTimeout(() => {
        setToastMessage(null);
      }, 4000);
      return;
    }
    window.print();
  };

  return (
    <div className={`rb-page theme-${theme}`}>
      {/* ── Toast Notification ── */}
      {toastMessage && (
        <div className="seeker-toast" role="alert">
          <div className="seeker-toast__content">
            <LogIn size={18} className="seeker-toast__icon" />
            <span className="seeker-toast__text">{toastMessage}</span>
          </div>
          <button
            type="button"
            className="seeker-toast__close"
            onClick={() => setToastMessage(null)}
            aria-label="Dismiss message"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── Top Header Bar ── */}
      <header className="rb-header">
        <div className="rb-header__left">


        </div>

        {/* Mobile View Switcher */}
        <div className="rb-mobile-toggle">
          <button
            type="button"
            className={`rb-toggle-btn ${mobileView === "form" ? "active" : ""}`}
            onClick={() => setMobileView("form")}
          >
            <Edit3Icon size={14} />
            <span>Edit Form</span>
          </button>
          <button
            type="button"
            className={`rb-toggle-btn ${mobileView === "preview" ? "active" : ""}`}
            onClick={() => setMobileView("preview")}
          >
            <Eye size={14} />
            <span>Live Preview</span>
          </button>
        </div>

        {/* Top Header Actions */}
        <div className="rb-header__right">
          {/* Theme Palette */}
          <div className="rb-theme-selector" title="Choose Template Accent">
            <LayoutTemplate size={15} className="rb-theme-icon" />
            <button
              type="button"
              className={`rb-theme-chip ${theme === "modern-blue" ? "active" : ""}`}
              onClick={() => setTheme("modern-blue")}
              title="Modern Blue"
            >
              <span className="dot dot--blue" />
              <span>Blue</span>
            </button>
            <button
              type="button"
              className={`rb-theme-chip ${theme === "executive-slate" ? "active" : ""}`}
              onClick={() => setTheme("executive-slate")}
              title="Executive Slate"
            >
              <span className="dot dot--slate" />
              <span>Slate</span>
            </button>

          </div>

          <button
            type="button"
            className="rb-btn rb-btn--reset"
            onClick={handleResetSample}
            title="Reset to sample data"
          >
            <RefreshCw size={14} />
            <span className="hide-sm">Sample</span>
          </button>

          <button
            type="button"
            className="rb-btn rb-btn--print"
            onClick={handlePrint}
            title="Print or Save via System Dialog"
          >
            <Printer size={15} />
            <span className="hide-sm">Print</span>
          </button>

          <button
            type="button"
            className="rb-btn rb-btn--download"
            onClick={handleDownloadPDF}
            disabled={isExporting}
            id="rb-download-pdf-btn"
          >
            {isExporting ? (
              <>
                <div className="rb-spinner" />
                <span>Exporting…</span>
              </>
            ) : (
              <>
                <Download size={15} />
                <span>Download PDF</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* ── Main Split-Screen Workspace ── */}
      <div className="rb-workspace">
        {/* ── LEFT SIDE: Live Document Preview ── */}
        <section
          className={`rb-preview-pane ${mobileView === "preview" ? "rb-pane--visible" : ""}`}
        >
          {/* Preview Toolbar */}
          <div className="rb-preview-toolbar">


          </div>

          {/* Printable Document Sheet Container */}
          <div className="rb-document-scroll">
            <div
              id="resume-preview-document"
              ref={resumeDocRef}
              className={`resume-sheet resume-sheet--${theme}`}
              style={{ transform: `scale(${zoom})`, transformOrigin: "top center" }}
            >
              {/* Header: Name, Headline, Contact */}
              <header className="rs-header">
                <h1 className="rs-name">
                  {resumeData.personalInfo.fullName || "Your Full Name"}
                </h1>
                <p className="rs-headline">
                  {resumeData.personalInfo.headline || "Professional Headline / Target Role"}
                </p>

                <div className="rs-contact-list">
                  {resumeData.personalInfo.email && (
                    <span className="rs-contact-item">
                      <Mail size={13} />
                      {resumeData.personalInfo.email}
                    </span>
                  )}
                  {resumeData.personalInfo.phone && (
                    <span className="rs-contact-item">
                      <Phone size={13} />
                      {resumeData.personalInfo.phone}
                    </span>
                  )}
                  {resumeData.personalInfo.location && (
                    <span className="rs-contact-item">
                      <MapPin size={13} />
                      {resumeData.personalInfo.location}
                    </span>
                  )}
                  {resumeData.personalInfo.linkedin && (
                    <span className="rs-contact-item">
                      <LinkedinIcon size={13} />
                      {resumeData.personalInfo.linkedin}
                    </span>
                  )}
                  {resumeData.personalInfo.website && (
                    <span className="rs-contact-item">
                      <Globe size={13} />
                      {resumeData.personalInfo.website}
                    </span>
                  )}
                </div>
              </header>

              {/* Summary */}
              {resumeData.summary && (
                <section className="rs-section">
                  <h2 className="rs-section-title">Professional Summary</h2>
                  <p className="rs-summary-text">{resumeData.summary}</p>
                </section>
              )}

              {/* Work Experience */}
              {resumeData.experiences?.length > 0 && (
                <section className="rs-section">
                  <h2 className="rs-section-title">Work Experience</h2>
                  <div className="rs-list">
                    {resumeData.experiences.map((exp) => (
                      <div key={exp.id} className="rs-item">
                        <div className="rs-item-row">
                          <h3 className="rs-item-title">{exp.role || "Job Title"}</h3>
                          <span className="rs-item-dates">
                            {exp.startDate || "Date"} &ndash; {exp.endDate || "Present"}
                          </span>
                        </div>
                        <div className="rs-item-sub">
                          <span className="rs-company">{exp.company || "Company"}</span>
                          {exp.location && (
                            <span className="rs-loc">&bull; {exp.location}</span>
                          )}
                        </div>
                        {exp.description && (
                          <p className="rs-item-desc">{exp.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Projects */}
              {resumeData.projects?.length > 0 && (
                <section className="rs-section">
                  <h2 className="rs-section-title">Key Projects</h2>
                  <div className="rs-list">
                    {resumeData.projects.map((proj) => (
                      <div key={proj.id} className="rs-item">
                        <div className="rs-item-row">
                          <h3 className="rs-item-title">{proj.title || "Project Name"}</h3>
                          {proj.link && (
                            <span className="rs-proj-link">
                              <ExternalLink size={11} />
                              {proj.link.replace(/^https?:\/\//, "")}
                            </span>
                          )}
                        </div>
                        {proj.techStack && (
                          <p className="rs-proj-tech">
                            <strong>Tech Stack:</strong> {proj.techStack}
                          </p>
                        )}
                        {proj.description && (
                          <p className="rs-item-desc">{proj.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Education */}
              {resumeData.education?.length > 0 && (
                <section className="rs-section">
                  <h2 className="rs-section-title">Education</h2>
                  <div className="rs-list">
                    {resumeData.education.map((edu) => (
                      <div key={edu.id} className="rs-item">
                        <div className="rs-item-row">
                          <h3 className="rs-item-title">{edu.degree || "Degree"}</h3>
                          <span className="rs-item-dates">{edu.year}</span>
                        </div>
                        <div className="rs-item-sub">
                          <span className="rs-company">{edu.institution || "Institution"}</span>
                          {edu.location && (
                            <span className="rs-loc">&bull; {edu.location}</span>
                          )}
                          {edu.score && (
                            <span className="rs-score">&bull; Grade: {edu.score}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Skills */}
              {resumeData.skills?.length > 0 && (
                <section className="rs-section">
                  <h2 className="rs-section-title">Skills &amp; Technologies</h2>
                  <div className="rs-skills-wrap">
                    {resumeData.skills.map((skill, idx) => (
                      <span key={idx} className="rs-skill-pill">
                        {skill}
                      </span>
                    ))}
                  </div>
                </section>
              )}

              {/* Certifications */}
              {resumeData.certifications?.length > 0 && (
                <section className="rs-section">
                  <h2 className="rs-section-title">Certifications &amp; Licenses</h2>
                  <div className="rs-certs-list">
                    {resumeData.certifications.map((c) => (
                      <div key={c.id} className="rs-cert-item">
                        <span className="rs-cert-title">{c.title || "Certificate"}</span>
                        <span className="rs-cert-meta">
                          {c.issuer ? `${c.issuer} (${c.year || ""})` : c.year}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </div>
        </section>

        {/* ── RIGHT SIDE: Form Builder Editor ── */}
        <section
          className={`rb-form-pane ${mobileView === "form" ? "rb-pane--visible" : ""}`}
        >
          {/* Navigation Tabs for Form Sections */}
          <nav className="rb-tabs-nav">
            <button
              type="button"
              className={`rb-tab ${activeTab === "personal" ? "active" : ""}`}
              onClick={() => setActiveTab("personal")}
            >
              <User size={15} />
              <span>Personal</span>
            </button>
            <button
              type="button"
              className={`rb-tab ${activeTab === "summary" ? "active" : ""}`}
              onClick={() => setActiveTab("summary")}
            >
              <FileText size={15} />
              <span>Summary</span>
            </button>
            <button
              type="button"
              className={`rb-tab ${activeTab === "experience" ? "active" : ""}`}
              onClick={() => setActiveTab("experience")}
            >
              <Briefcase size={15} />
              <span>Experience</span>
              {resumeData.experiences.length > 0 && (
                <span className="rb-tab-count">{resumeData.experiences.length}</span>
              )}
            </button>
            <button
              type="button"
              className={`rb-tab ${activeTab === "education" ? "active" : ""}`}
              onClick={() => setActiveTab("education")}
            >
              <GraduationCap size={15} />
              <span>Education</span>
            </button>
            <button
              type="button"
              className={`rb-tab ${activeTab === "projects" ? "active" : ""}`}
              onClick={() => setActiveTab("projects")}
            >
              <FolderGit2 size={15} />
              <span>Projects</span>
            </button>
            <button
              type="button"
              className={`rb-tab ${activeTab === "skills" ? "active" : ""}`}
              onClick={() => setActiveTab("skills")}
            >
              <Code size={15} />
              <span>Skills</span>
              <span className="rb-tab-count">{resumeData.skills.length}</span>
            </button>
            <button
              type="button"
              className={`rb-tab ${activeTab === "certifications" ? "active" : ""}`}
              onClick={() => setActiveTab("certifications")}
            >
              <Award size={15} />
              <span>Certificates</span>
            </button>
          </nav>

          {/* Form Content Area */}
          <div className="rb-form-scroll">
            {/* Tab 1: Personal Information */}
            {activeTab === "personal" && (
              <div className="rb-section-card">
                <div className="rb-section-header">
                  <User className="rb-section-icon" size={20} />
                  <div>
                    <h3 className="rb-section-title">Personal Details</h3>
                    <p className="rb-section-sub">
                      Your primary contact and identification information.
                    </p>
                  </div>
                </div>

                <div className="rb-form-grid">
                  <div className="rb-field rb-field--full">
                    <label>Full Name</label>
                    <input
                      type="text"
                      value={resumeData.personalInfo.fullName}
                      onChange={(e) => handlePersonalInfoChange("fullName", e.target.value)}
                      placeholder="e.g. Aarav Sharma"
                    />
                  </div>

                  <div className="rb-field rb-field--full">
                    <label>Professional Headline / Title</label>
                    <input
                      type="text"
                      value={resumeData.personalInfo.headline}
                      onChange={(e) => handlePersonalInfoChange("headline", e.target.value)}
                      placeholder="e.g. Senior Frontend Developer"
                    />
                  </div>

                  <div className="rb-field">
                    <label>Email Address</label>
                    <input
                      type="email"
                      value={resumeData.personalInfo.email}
                      onChange={(e) => handlePersonalInfoChange("email", e.target.value)}
                      placeholder="name@example.com"
                    />
                  </div>

                  <div className="rb-field">
                    <label>Phone Number</label>
                    <input
                      type="text"
                      value={resumeData.personalInfo.phone}
                      onChange={(e) => handlePersonalInfoChange("phone", e.target.value)}
                      placeholder="+91 98765 43210"
                    />
                  </div>

                  <div className="rb-field">
                    <label>Location</label>
                    <input
                      type="text"
                      value={resumeData.personalInfo.location}
                      onChange={(e) => handlePersonalInfoChange("location", e.target.value)}
                      placeholder="City, State"
                    />
                  </div>

                  <div className="rb-field">
                    <label>LinkedIn URL</label>
                    <input
                      type="text"
                      value={resumeData.personalInfo.linkedin}
                      onChange={(e) => handlePersonalInfoChange("linkedin", e.target.value)}
                      placeholder="linkedin.com/in/username"
                    />
                  </div>

                  <div className="rb-field rb-field--full">
                    <label>GitHub or Portfolio URL</label>
                    <input
                      type="text"
                      value={resumeData.personalInfo.website}
                      onChange={(e) => handlePersonalInfoChange("website", e.target.value)}
                      placeholder="github.com/username or yourportfolio.com"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Professional Summary */}
            {activeTab === "summary" && (
              <div className="rb-section-card">
                <div className="rb-section-header">
                  <FileText className="rb-section-icon" size={20} />
                  <div>
                    <h3 className="rb-section-title">Professional Summary</h3>
                    <p className="rb-section-sub">
                      Highlight your core strengths, experience, and top accomplishments in 2-4 sentences.
                    </p>
                  </div>
                </div>

                <div className="rb-field rb-field--full">
                  <textarea
                    rows={6}
                    value={resumeData.summary}
                    onChange={(e) => handleSummaryChange(e.target.value)}
                    placeholder="Write a compelling professional summary..."
                  />
                </div>
              </div>
            )}

            {/* Tab 3: Work Experience */}
            {activeTab === "experience" && (
              <div className="rb-section-card">
                <div className="rb-section-header-row">
                  <div className="rb-section-header">
                    <Briefcase className="rb-section-icon" size={20} />
                    <div>
                      <h3 className="rb-section-title">Work Experience</h3>
                      <p className="rb-section-sub">
                        List your professional roles, internships, or relevant experience.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="rb-add-btn"
                    onClick={handleAddExperience}
                  >
                    <Plus size={15} /> Add Role
                  </button>
                </div>

                {resumeData.experiences.map((exp, idx) => (
                  <div key={exp.id} className="rb-card-item">
                    <div className="rb-card-item__top">
                      <span className="rb-item-number">#{idx + 1}</span>
                      <button
                        type="button"
                        className="rb-delete-btn"
                        onClick={() => handleRemoveExperience(exp.id)}
                        title="Remove role"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                    <div className="rb-form-grid">
                      <div className="rb-field">
                        <label>Job Title</label>
                        <input
                          type="text"
                          value={exp.role}
                          onChange={(e) => handleUpdateExperience(exp.id, "role", e.target.value)}
                          placeholder="e.g. Software Engineer"
                        />
                      </div>
                      <div className="rb-field">
                        <label>Company Name</label>
                        <input
                          type="text"
                          value={exp.company}
                          onChange={(e) => handleUpdateExperience(exp.id, "company", e.target.value)}
                          placeholder="e.g. Google, Infosys"
                        />
                      </div>
                      <div className="rb-field">
                        <label>Location</label>
                        <input
                          type="text"
                          value={exp.location}
                          onChange={(e) => handleUpdateExperience(exp.id, "location", e.target.value)}
                          placeholder="e.g. Bangalore / Remote"
                        />
                      </div>
                      <div className="rb-field">
                        <label>Duration</label>
                        <div className="rb-dual-inputs">
                          <input
                            type="text"
                            value={exp.startDate}
                            onChange={(e) => handleUpdateExperience(exp.id, "startDate", e.target.value)}
                            placeholder="Start (2021)"
                          />
                          <span>to</span>
                          <input
                            type="text"
                            value={exp.endDate}
                            onChange={(e) => handleUpdateExperience(exp.id, "endDate", e.target.value)}
                            placeholder="End / Present"
                          />
                        </div>
                      </div>
                      <div className="rb-field rb-field--full">
                        <label>Responsibilities &amp; Achievements</label>
                        <textarea
                          rows={3}
                          value={exp.description}
                          onChange={(e) => handleUpdateExperience(exp.id, "description", e.target.value)}
                          placeholder="Bullet points or sentences highlighting quantifiable outcomes and tech stack used..."
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Tab 4: Education */}
            {activeTab === "education" && (
              <div className="rb-section-card">
                <div className="rb-section-header-row">
                  <div className="rb-section-header">
                    <GraduationCap className="rb-section-icon" size={20} />
                    <div>
                      <h3 className="rb-section-title">Education</h3>
                      <p className="rb-section-sub">Degrees, diplomas, and academic credentials.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="rb-add-btn"
                    onClick={handleAddEducation}
                  >
                    <Plus size={15} /> Add Education
                  </button>
                </div>

                {resumeData.education.map((edu, idx) => (
                  <div key={edu.id} className="rb-card-item">
                    <div className="rb-card-item__top">
                      <span className="rb-item-number">#{idx + 1}</span>
                      <button
                        type="button"
                        className="rb-delete-btn"
                        onClick={() => handleRemoveEducation(edu.id)}
                        title="Remove education"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                    <div className="rb-form-grid">
                      <div className="rb-field rb-field--full">
                        <label>Degree / Certificate</label>
                        <input
                          type="text"
                          value={edu.degree}
                          onChange={(e) => handleUpdateEducation(edu.id, "degree", e.target.value)}
                          placeholder="e.g. Bachelor of Technology in CS"
                        />
                      </div>
                      <div className="rb-field">
                        <label>Institution / University</label>
                        <input
                          type="text"
                          value={edu.institution}
                          onChange={(e) => handleUpdateEducation(edu.id, "institution", e.target.value)}
                          placeholder="e.g. Delhi University"
                        />
                      </div>
                      <div className="rb-field">
                        <label>Year of Graduation</label>
                        <input
                          type="text"
                          value={edu.year}
                          onChange={(e) => handleUpdateEducation(edu.id, "year", e.target.value)}
                          placeholder="e.g. 2019 - 2023"
                        />
                      </div>
                      <div className="rb-field">
                        <label>Grade / CGPA</label>
                        <input
                          type="text"
                          value={edu.score}
                          onChange={(e) => handleUpdateEducation(edu.id, "score", e.target.value)}
                          placeholder="e.g. 8.5 CGPA or 82%"
                        />
                      </div>
                      <div className="rb-field">
                        <label>Location</label>
                        <input
                          type="text"
                          value={edu.location}
                          onChange={(e) => handleUpdateEducation(edu.id, "location", e.target.value)}
                          placeholder="e.g. New Delhi"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Tab 5: Projects */}
            {activeTab === "projects" && (
              <div className="rb-section-card">
                <div className="rb-section-header-row">
                  <div className="rb-section-header">
                    <FolderGit2 className="rb-section-icon" size={20} />
                    <div>
                      <h3 className="rb-section-title">Projects</h3>
                      <p className="rb-section-sub">
                        Showcase personal projects, open-source work, or portfolio items.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="rb-add-btn"
                    onClick={handleAddProject}
                  >
                    <Plus size={15} /> Add Project
                  </button>
                </div>

                {resumeData.projects.map((proj, idx) => (
                  <div key={proj.id} className="rb-card-item">
                    <div className="rb-card-item__top">
                      <span className="rb-item-number">#{idx + 1}</span>
                      <button
                        type="button"
                        className="rb-delete-btn"
                        onClick={() => handleRemoveProject(proj.id)}
                        title="Remove project"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                    <div className="rb-form-grid">
                      <div className="rb-field">
                        <label>Project Title</label>
                        <input
                          type="text"
                          value={proj.title}
                          onChange={(e) => handleUpdateProject(proj.id, "title", e.target.value)}
                          placeholder="e.g. E-Commerce Platform"
                        />
                      </div>
                      <div className="rb-field">
                        <label>Live or GitHub Link</label>
                        <input
                          type="text"
                          value={proj.link}
                          onChange={(e) => handleUpdateProject(proj.id, "link", e.target.value)}
                          placeholder="https://github.com/..."
                        />
                      </div>
                      <div className="rb-field rb-field--full">
                        <label>Tech Stack</label>
                        <input
                          type="text"
                          value={proj.techStack}
                          onChange={(e) => handleUpdateProject(proj.id, "techStack", e.target.value)}
                          placeholder="e.g. React, Node.js, PostgreSQL, Docker"
                        />
                      </div>
                      <div className="rb-field rb-field--full">
                        <label>Description</label>
                        <textarea
                          rows={3}
                          value={proj.description}
                          onChange={(e) => handleUpdateProject(proj.id, "description", e.target.value)}
                          placeholder="Describe the problem solved, architecture choices, and impact..."
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Tab 6: Skills */}
            {activeTab === "skills" && (
              <div className="rb-section-card">
                <div className="rb-section-header">
                  <Code className="rb-section-icon" size={20} />
                  <div>
                    <h3 className="rb-section-title">Skills &amp; Technologies</h3>
                    <p className="rb-section-sub">
                      Add relevant keywords and technologies matching your target job descriptions.
                    </p>
                  </div>
                </div>

                <div className="rb-skill-input-wrap">
                  <input
                    type="text"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddSkill();
                      }
                    }}
                    placeholder="Type a skill and press Enter (e.g. React, Python, Docker)..."
                  />
                  <button
                    type="button"
                    className="rb-add-btn"
                    onClick={() => handleAddSkill()}
                  >
                    Add
                  </button>
                </div>

                {/* Popular suggestions */}
                <div className="rb-suggest-skills">
                  <span className="rb-suggest-label">Popular Suggestions:</span>
                  {["React.js", "Node.js", "Python", "TypeScript", "SQL", "Docker", "AWS", "Git", "Java", "MongoDB"].map(
                    (s) =>
                      !resumeData.skills.includes(s) && (
                        <button
                          key={s}
                          type="button"
                          className="rb-suggest-chip"
                          onClick={() => handleAddSkill(s)}
                        >
                          + {s}
                        </button>
                      )
                  )}
                </div>

                {/* Active Skill Pills */}
                <div className="rb-active-skills">
                  {resumeData.skills.map((skill) => (
                    <span key={skill} className="rb-skill-tag">
                      {skill}
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        aria-label={`Remove ${skill}`}
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 7: Certifications */}
            {activeTab === "certifications" && (
              <div className="rb-section-card">
                <div className="rb-section-header-row">
                  <div className="rb-section-header">
                    <Award className="rb-section-icon" size={20} />
                    <div>
                      <h3 className="rb-section-title">Certifications</h3>
                      <p className="rb-section-sub">Industry credentials, courses, and certifications.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="rb-add-btn"
                    onClick={handleAddCertification}
                  >
                    <Plus size={15} /> Add Certification
                  </button>
                </div>

                {resumeData.certifications.map((c, idx) => (
                  <div key={c.id} className="rb-card-item">
                    <div className="rb-card-item__top">
                      <span className="rb-item-number">#{idx + 1}</span>
                      <button
                        type="button"
                        className="rb-delete-btn"
                        onClick={() => handleRemoveCertification(c.id)}
                        title="Remove certification"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                    <div className="rb-form-grid">
                      <div className="rb-field rb-field--full">
                        <label>Certificate Name</label>
                        <input
                          type="text"
                          value={c.title}
                          onChange={(e) => handleUpdateCertification(c.id, "title", e.target.value)}
                          placeholder="e.g. AWS Solutions Architect"
                        />
                      </div>
                      <div className="rb-field">
                        <label>Issuing Organization</label>
                        <input
                          type="text"
                          value={c.issuer}
                          onChange={(e) => handleUpdateCertification(c.id, "issuer", e.target.value)}
                          placeholder="e.g. Amazon Web Services"
                        />
                      </div>
                      <div className="rb-field">
                        <label>Year</label>
                        <input
                          type="text"
                          value={c.year}
                          onChange={(e) => handleUpdateCertification(c.id, "year", e.target.value)}
                          placeholder="e.g. 2023"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

// Small icon helper for mobile toggle
function Edit3Icon({ size = 16 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  );
}

function LinkedinIcon({ size = 13 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
    </svg>
  );
}
