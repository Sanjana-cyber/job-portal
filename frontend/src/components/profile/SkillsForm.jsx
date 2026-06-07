import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { updateSkills } from "../../api/profileApi";
import { useProfile } from "../../context/ProfileContext";

const SkillGroup = ({ label, required, color, skills, onAdd, onRemove, inputRef }) => {
  const [input, setInput] = useState("");

  const handleKey = (e) => {
    if ((e.key === "Enter" || e.key === ",") && input.trim()) {
      e.preventDefault();
      onAdd(input.trim());
      setInput("");
    }
    if (e.key === "Backspace" && !input && skills.length) {
      onRemove(skills[skills.length - 1]);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <label style={{ fontSize: "13px", fontWeight: "600", color: "#374151" }}>
        {label}
        {required && <span style={{ color: "#ef4444", marginLeft: "3px" }}>*</span>}
        <span style={{ color: "#94a3b8", fontWeight: "400", fontSize: "11px", marginLeft: "8px" }}>
          Press Enter or , to add
        </span>
      </label>
      <div
        onClick={() => inputRef?.current?.focus()}
        style={{
          minHeight: "48px",
          border: "1.5px solid #e2e8f0",
          borderRadius: "10px",
          padding: "8px 12px",
          display: "flex", flexWrap: "wrap", gap: "6px", alignItems: "center",
          background: "#f8fafc",
          cursor: "text",
          transition: "border-color 0.2s",
        }}
        onFocus={() => {}}
      >
        {skills.map((skill) => (
          <span key={skill} style={{
            display: "inline-flex", alignItems: "center", gap: "5px",
            padding: "3px 10px", borderRadius: "20px",
            background: `${color}18`, border: `1px solid ${color}40`,
            color: color, fontSize: "12px", fontWeight: "600",
          }}>
            {skill}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onRemove(skill); }}
              style={{ background: "none", border: "none", cursor: "pointer", color, padding: 0, fontSize: "13px", lineHeight: 1, display: "flex" }}
            >×</button>
          </span>
        ))}
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder={skills.length === 0 ? `Add ${label.toLowerCase()}...` : ""}
          style={{
            border: "none", outline: "none", background: "transparent",
            fontSize: "14px", color: "#1e293b", minWidth: "120px", fontFamily: "inherit",
          }}
        />
      </div>
    </div>
  );
};

const SkillsForm = () => {
  const { profile, refetchProfile, setCompletionScore } = useProfile();
  const [techSkills,  setTechSkills]  = useState([]);
  const [tools,       setTools]       = useState([]);
  const [softSkills,  setSoftSkills]  = useState([]);
  const [saving, setSaving] = useState(false);
  const techRef = useRef(null);
  const toolRef = useRef(null);
  const softRef = useRef(null);

  useEffect(() => {
    if (profile) {
      setTechSkills(profile.technicalSkills || []);
      setTools(profile.tools || []);
      setSoftSkills(profile.softSkills || []);
    }
  }, [profile]);

  const addTo  = (setter, arr) => (val) => { if (!arr.includes(val)) setter([...arr, val]); };
  const removeFrom = (setter, arr) => (val) => setter(arr.filter((s) => s !== val));

  const handleSave = async () => {
    if (techSkills.length === 0) { toast.error("Add at least one technical skill"); return; }
    try {
      setSaving(true);
      const res = await updateSkills({ technicalSkills: techSkills, tools, softSkills });
      setCompletionScore(res.data.data.completionScore);
      await refetchProfile();
      toast.success("Skills saved!");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ background: "#fff", borderRadius: "20px", padding: "32px", boxShadow: "0 2px 16px rgba(0,0,0,0.06)", border: "1px solid #e2e8f0" }}>
      <h2 style={{ color: "#1e293b", fontWeight: "700", fontSize: "18px", margin: "0 0 24px" }}>Skills</h2>

      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <SkillGroup label="Technical Skills" required color="#6366f1" skills={techSkills}
          onAdd={addTo(setTechSkills, techSkills)} onRemove={removeFrom(setTechSkills, techSkills)} inputRef={techRef} />
        <SkillGroup label="Tools & Technologies" color="#0ea5e9" skills={tools}
          onAdd={addTo(setTools, tools)} onRemove={removeFrom(setTools, tools)} inputRef={toolRef} />
        <SkillGroup label="Soft Skills" color="#10b981" skills={softSkills}
          onAdd={addTo(setSoftSkills, softSkills)} onRemove={removeFrom(setSoftSkills, softSkills)} inputRef={softRef} />
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "28px" }}>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: "12px 32px",
            background: saving ? "#94a3b8" : "linear-gradient(135deg, #6366f1, #8b5cf6)",
            color: "#fff", border: "none", borderRadius: "12px",
            fontWeight: "600", fontSize: "14px", cursor: saving ? "not-allowed" : "pointer",
            boxShadow: saving ? "none" : "0 4px 14px rgba(99,102,241,0.35)",
            transition: "all 0.2s", fontFamily: "inherit",
          }}
        >{saving ? "Saving..." : "Save Skills"}</button>
      </div>
    </div>
  );
};

export default SkillsForm;
