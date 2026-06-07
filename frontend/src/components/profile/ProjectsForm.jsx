import { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { addProject, updateProject, deleteProject } from "../../api/profileApi";
import { useProfile } from "../../context/ProfileContext";

const inputStyle = { width: "100%", padding: "10px 13px", border: "1.5px solid #e2e8f0", borderRadius: "10px", fontSize: "14px", color: "#1e293b", background: "#f8fafc", outline: "none", fontFamily: "inherit", boxSizing: "border-box" };

const ProjectsForm = () => {
  const { profile, refetchProfile, setCompletionScore } = useProfile();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId]     = useState(null);
  const [saving, setSaving]     = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [stackInput, setStackInput] = useState("");
  const [techStack, setTechStack]   = useState([]);

  const { register, handleSubmit, reset } = useForm({
    defaultValues: { name: "", description: "", githubLink: "", liveLink: "" },
  });

  const openAdd = () => { reset({ name: "", description: "", githubLink: "", liveLink: "" }); setTechStack([]); setStackInput(""); setEditId(null); setShowForm(true); };
  const openEdit = (proj) => { reset({ name: proj.name, description: proj.description, githubLink: proj.githubLink, liveLink: proj.liveLink }); setTechStack(proj.techStack || []); setStackInput(""); setEditId(proj._id); setShowForm(true); };

  const onSubmit = async (data) => {
    try {
      setSaving(true);
      const payload = { ...data, techStack };
      const res = editId ? await updateProject(editId, payload) : await addProject(payload);
      setCompletionScore(res.data.data.completionScore);
      await refetchProfile();
      setShowForm(false);
      toast.success(editId ? "Project updated!" : "Project added!");
    } catch (err) { toast.error(err?.response?.data?.message || "Save failed"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try { setDeletingId(id); const res = await deleteProject(id); setCompletionScore(res.data.data.completionScore); await refetchProfile(); toast.success("Project removed"); }
    catch { toast.error("Delete failed"); } finally { setDeletingId(null); }
  };

  const addStack = () => { if (stackInput.trim() && !techStack.includes(stackInput.trim())) { setTechStack([...techStack, stackInput.trim()]); setStackInput(""); } };

  const list = profile?.projects || [];

  return (
    <div style={{ background: "#fff", borderRadius: "20px", padding: "32px", boxShadow: "0 2px 16px rgba(0,0,0,0.06)", border: "1px solid #e2e8f0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <h2 style={{ color: "#1e293b", fontWeight: "700", fontSize: "18px", margin: 0 }}>Projects <span style={{ color: "#94a3b8", fontSize: "13px", fontWeight: "400" }}>(Optional)</span></h2>
        <button type="button" onClick={openAdd} style={{ padding: "8px 18px", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "#fff", border: "none", borderRadius: "10px", fontWeight: "600", fontSize: "13px", cursor: "pointer", fontFamily: "inherit" }}>+ Add Project</button>
      </div>

      {list.length === 0 && !showForm && (
        <div style={{ textAlign: "center", padding: "32px", color: "#94a3b8", background: "#f8fafc", borderRadius: "12px", border: "1.5px dashed #e2e8f0" }}>
          <p style={{ fontSize: "32px", margin: "0 0 8px" }}>🛠️</p>
          <p style={{ fontSize: "14px", margin: 0 }}>Showcase your work — add your best projects here.</p>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {list.map((proj) => (
          <div key={proj._id} style={{ border: "1.5px solid #e2e8f0", borderRadius: "14px", padding: "18px 20px", background: "#fafbff" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: "700", color: "#1e293b", margin: "0 0 4px", fontSize: "15px" }}>{proj.name}</p>
                <p style={{ color: "#64748b", fontSize: "13px", margin: "0 0 8px", lineHeight: "1.5" }}>{proj.description}</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", marginBottom: "8px" }}>
                  {(proj.techStack || []).map((t) => (
                    <span key={t} style={{ padding: "2px 10px", background: "rgba(99,102,241,0.1)", color: "#6366f1", borderRadius: "20px", fontSize: "11px", fontWeight: "600" }}>{t}</span>
                  ))}
                </div>
                <div style={{ display: "flex", gap: "12px" }}>
                  {proj.githubLink && <a href={proj.githubLink} target="_blank" rel="noreferrer" style={{ color: "#6366f1", fontSize: "12px", fontWeight: "600" }}>GitHub ↗</a>}
                  {proj.liveLink   && <a href={proj.liveLink}   target="_blank" rel="noreferrer" style={{ color: "#10b981", fontSize: "12px", fontWeight: "600" }}>Live Demo ↗</a>}
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                <button type="button" onClick={() => openEdit(proj)} style={{ padding: "6px 12px", border: "1.5px solid #6366f1", background: "transparent", color: "#6366f1", borderRadius: "8px", fontSize: "12px", cursor: "pointer", fontWeight: "600", fontFamily: "inherit" }}>Edit</button>
                <button type="button" onClick={() => handleDelete(proj._id)} disabled={deletingId === proj._id} style={{ padding: "6px 12px", border: "1.5px solid #ef4444", background: "transparent", color: "#ef4444", borderRadius: "8px", fontSize: "12px", cursor: "pointer", fontWeight: "600", fontFamily: "inherit" }}>{deletingId === proj._id ? "..." : "Delete"}</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div style={{ marginTop: "20px", border: "1.5px solid #e2e8f0", borderRadius: "14px", padding: "24px", background: "#fafbff" }}>
          <h3 style={{ color: "#1e293b", fontSize: "15px", fontWeight: "700", margin: "0 0 20px" }}>{editId ? "Edit Project" : "Add Project"}</h3>
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div><label style={{ fontSize: "12px", fontWeight: "600", color: "#374151", display: "block", marginBottom: "5px" }}>Project Name</label>
                <input {...register("name")} placeholder="e.g. Job Portal App" style={inputStyle} /></div>
              <div><label style={{ fontSize: "12px", fontWeight: "600", color: "#374151", display: "block", marginBottom: "5px" }}>Description</label>
                <textarea {...register("description")} rows={3} placeholder="Describe what the project does, your role, and impact..." style={{ ...inputStyle, resize: "vertical" }} /></div>
              <div>
                <label style={{ fontSize: "12px", fontWeight: "600", color: "#374151", display: "block", marginBottom: "5px" }}>Tech Stack</label>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input value={stackInput} onChange={(e) => setStackInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addStack(); } }} placeholder="e.g. React" style={{ ...inputStyle, flex: 1 }} />
                  <button type="button" onClick={addStack} style={{ padding: "10px 14px", background: "#6366f1", color: "#fff", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "600", fontSize: "13px", fontFamily: "inherit" }}>Add</button>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", marginTop: "8px" }}>
                  {techStack.map((t) => (
                    <span key={t} style={{ padding: "3px 10px", background: "rgba(99,102,241,0.1)", color: "#6366f1", borderRadius: "20px", fontSize: "12px", fontWeight: "600", display: "inline-flex", alignItems: "center", gap: "5px" }}>
                      {t}<button type="button" onClick={() => setTechStack(techStack.filter((s) => s !== t))} style={{ background: "none", border: "none", cursor: "pointer", color: "#6366f1", fontSize: "13px", padding: 0 }}>×</button>
                    </span>
                  ))}
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div><label style={{ fontSize: "12px", fontWeight: "600", color: "#374151", display: "block", marginBottom: "5px" }}>GitHub Link</label>
                  <input {...register("githubLink")} placeholder="https://github.com/..." style={inputStyle} /></div>
                <div><label style={{ fontSize: "12px", fontWeight: "600", color: "#374151", display: "block", marginBottom: "5px" }}>Live Link</label>
                  <input {...register("liveLink")} placeholder="https://yourproject.com" style={inputStyle} /></div>
              </div>
            </div>
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "18px" }}>
              <button type="button" onClick={() => setShowForm(false)} style={{ padding: "10px 20px", background: "#f1f5f9", border: "none", borderRadius: "10px", color: "#64748b", fontWeight: "600", fontSize: "13px", cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
              <button type="submit" disabled={saving} style={{ padding: "10px 24px", background: saving ? "#94a3b8" : "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "#fff", border: "none", borderRadius: "10px", fontWeight: "600", fontSize: "13px", cursor: saving ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default ProjectsForm;
