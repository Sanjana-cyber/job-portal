/**
 * ResumeParserReview.jsx
 *
 * Modal that shows the Gemini-parsed resume data in an editable review form.
 * User can verify/fix the data before it is used for ATS analysis.
 * Purely visual — does NOT mutate the profile (user edits are passed down/used in ATS flow).
 */
import { useState } from "react";
import toast from "react-hot-toast";

const ChipEditor = ({ label, chips, onChange }) => {
  const [inputVal, setInputVal] = useState("");

  const handleKeyDown = (e) => {
    if ((e.key === "Enter" || e.key === ",") && inputVal.trim()) {
      e.preventDefault();
      if (!chips.includes(inputVal.trim())) {
        onChange([...chips, inputVal.trim()]);
      }
      setInputVal("");
    }
    if (e.key === "Backspace" && !inputVal && chips.length > 0) {
      onChange(chips.slice(0, -1));
    }
  };

  return (
    <div className="parser-field">
      <label>{label}</label>
      <div className="parser-chips">
        {chips.map((chip, i) => (
          <span key={i} className="parser-chip">
            {chip}
            <button
              type="button"
              className="parser-chip-remove"
              onClick={() => onChange(chips.filter((_, idx) => idx !== i))}
            >
              ×
            </button>
          </span>
        ))}
        <input
          className="parser-chip-input"
          placeholder="Type & press Enter"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={handleKeyDown}
        />
      </div>
    </div>
  );
};

const ResumeParserReview = ({ parsedData, resumeId, onClose }) => {
  const [form, setForm] = useState({
    fullName:        parsedData?.fullName       || "",
    email:           parsedData?.email          || "",
    phone:           parsedData?.phone          || "",
    location:        parsedData?.location       || "",
    linkedin:        parsedData?.linkedin       || "",
    github:          parsedData?.github         || "",
    headline:        parsedData?.headline       || "",
    about:           parsedData?.about          || "",
    technicalSkills: parsedData?.technicalSkills || [],
    tools:           parsedData?.tools           || [],
    softSkills:      parsedData?.softSkills      || [],
  });

  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSave = () => {
    toast.success("Parsed data confirmed! You can now run ATS Match from any job listing.");
    onClose();
  };

  return (
    <div className="parser-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="parser-modal">
        {/* Header */}
        <div className="parser-modal-header">
          <div>
            <h2>✨ Review Parsed Resume Data</h2>
            <p>AI extracted the following from your resume. Verify and correct any errors before using for ATS matching.</p>
          </div>
          <button className="parser-modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        {/* Body */}
        <div className="parser-modal-body">
          {/* Personal Information */}
          <section>
            <div className="parser-section-title">👤 Personal Information</div>
            <div className="parser-grid-2">
              <div className="parser-field">
                <label>Full Name</label>
                <input type="text" value={form.fullName} onChange={set("fullName")} placeholder="Full Name" />
              </div>
              <div className="parser-field">
                <label>Email</label>
                <input type="email" value={form.email} onChange={set("email")} placeholder="email@example.com" />
              </div>
              <div className="parser-field">
                <label>Phone</label>
                <input type="text" value={form.phone} onChange={set("phone")} placeholder="+91 XXXXX XXXXX" />
              </div>
              <div className="parser-field">
                <label>Location</label>
                <input type="text" value={form.location} onChange={set("location")} placeholder="City, Country" />
              </div>
              <div className="parser-field">
                <label>LinkedIn</label>
                <input type="url" value={form.linkedin} onChange={set("linkedin")} placeholder="https://linkedin.com/in/..." />
              </div>
              <div className="parser-field">
                <label>GitHub</label>
                <input type="url" value={form.github} onChange={set("github")} placeholder="https://github.com/..." />
              </div>
            </div>
          </section>

          {/* Professional */}
          <section>
            <div className="parser-section-title">💼 Professional Summary</div>
            <div className="parser-field" style={{ marginBottom: "1rem" }}>
              <label>Headline / Title</label>
              <input type="text" value={form.headline} onChange={set("headline")} placeholder="e.g. Full Stack Developer" />
            </div>
            <div className="parser-field">
              <label>About / Summary</label>
              <textarea rows={4} value={form.about} onChange={set("about")} placeholder="Professional summary..." />
            </div>
          </section>

          {/* Skills */}
          <section>
            <div className="parser-section-title">🛠 Skills</div>
            <ChipEditor
              label="Technical Skills"
              chips={form.technicalSkills}
              onChange={(chips) => setForm((p) => ({ ...p, technicalSkills: chips }))}
            />
            <div style={{ marginTop: "0.75rem" }}>
              <ChipEditor
                label="Tools & Technologies"
                chips={form.tools}
                onChange={(chips) => setForm((p) => ({ ...p, tools: chips }))}
              />
            </div>
            <div style={{ marginTop: "0.75rem" }}>
              <ChipEditor
                label="Soft Skills"
                chips={form.softSkills}
                onChange={(chips) => setForm((p) => ({ ...p, softSkills: chips }))}
              />
            </div>
          </section>

          {/* Experience preview (read-only) */}
          {parsedData?.experience?.length > 0 && (
            <section>
              <div className="parser-section-title">📋 Experience Detected</div>
              {parsedData.experience.map((exp, i) => (
                <div key={i} style={{ marginBottom: "0.6rem", padding: "0.75rem", background: "rgba(255,255,255,0.04)", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div style={{ color: "#e0e7ff", fontWeight: 600, fontSize: "0.9rem" }}>{exp.role} <span style={{ color: "#64748b" }}>@ {exp.company}</span></div>
                  <div style={{ color: "#64748b", fontSize: "0.78rem", marginTop: "2px" }}>{exp.startDate} – {exp.endDate}</div>
                </div>
              ))}
            </section>
          )}

          {/* Education preview (read-only) */}
          {parsedData?.education?.length > 0 && (
            <section>
              <div className="parser-section-title">🎓 Education Detected</div>
              {parsedData.education.map((edu, i) => (
                <div key={i} style={{ marginBottom: "0.6rem", padding: "0.75rem", background: "rgba(255,255,255,0.04)", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div style={{ color: "#e0e7ff", fontWeight: 600, fontSize: "0.9rem" }}>{edu.degree} {edu.field}</div>
                  <div style={{ color: "#64748b", fontSize: "0.78rem", marginTop: "2px" }}>{edu.institution} · {edu.startYear} – {edu.endYear}</div>
                </div>
              ))}
            </section>
          )}
        </div>

        {/* Footer */}
        <div className="parser-modal-footer">
          <button className="parser-btn-cancel" onClick={onClose}>Discard</button>
          <button className="parser-btn-save" onClick={handleSave}>
            ✓ Confirm & Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResumeParserReview;
