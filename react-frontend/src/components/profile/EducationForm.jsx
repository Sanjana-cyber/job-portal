import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { addEducation, updateEducation, deleteEducation } from "../../api/profileApi";
import { useProfile } from "../../context/ProfileContext";

const inputStyle = { width: "100%", padding: "10px 13px", border: "1.5px solid #e2e8f0", borderRadius: "10px", fontSize: "14px", color: "#1e293b", background: "#f8fafc", outline: "none", fontFamily: "inherit", boxSizing: "border-box" };

const EducationForm = () => {
  const { profile, refetchProfile, setCompletionScore } = useProfile();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: { degree: "", college: "", specialization: "", startYear: "", endYear: "", cgpa: "" },
  });

  const openAdd = () => { reset({ degree: "", college: "", specialization: "", startYear: "", endYear: "", cgpa: "" }); setEditId(null); setShowForm(true); };
  const openEdit = (edu) => { reset({ ...edu, startYear: edu.startYear, endYear: edu.endYear }); setEditId(edu._id); setShowForm(true); };

  const onSubmit = async (data) => {
    try {
      setSaving(true);
      let res;
      if (editId) res = await updateEducation(editId, data);
      else        res = await addEducation(data);
      setCompletionScore(res.data.data.completionScore);
      await refetchProfile();
      setShowForm(false);
      toast.success(editId ? "Education updated!" : "Education added!");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Save failed");
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try {
      setDeletingId(id);
      const res = await deleteEducation(id);
      setCompletionScore(res.data.data.completionScore);
      await refetchProfile();
      toast.success("Education removed");
    } catch { toast.error("Delete failed"); }
    finally { setDeletingId(null); }
  };

  const educationList = profile?.education || [];

  return (
    <div style={{ background: "#fff", borderRadius: "20px", padding: "32px", boxShadow: "0 2px 16px rgba(0,0,0,0.06)", border: "1px solid #e2e8f0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <h2 style={{ color: "#1e293b", fontWeight: "700", fontSize: "18px", margin: 0 }}>Education</h2>
        <button type="button" onClick={openAdd} style={{ padding: "8px 18px", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "#fff", border: "none", borderRadius: "10px", fontWeight: "600", fontSize: "13px", cursor: "pointer", fontFamily: "inherit" }}>
          + Add Education
        </button>
      </div>

      {/* Existing Entries */}
      {educationList.length === 0 && !showForm && (
        <div style={{ textAlign: "center", padding: "32px", color: "#94a3b8", background: "#f8fafc", borderRadius: "12px", border: "1.5px dashed #e2e8f0" }}>
          <p style={{ fontSize: "32px", margin: "0 0 8px" }}>🎓</p>
          <p style={{ fontSize: "14px", margin: 0 }}>No education added yet. Click "+ Add Education" to get started.</p>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {educationList.map((edu) => (
          <div key={edu._id} style={{ border: "1.5px solid #e2e8f0", borderRadius: "14px", padding: "18px 20px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px", background: "#fafbff" }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: "700", color: "#1e293b", margin: "0 0 4px", fontSize: "15px" }}>{edu.degree}</p>
              <p style={{ color: "#6366f1", fontWeight: "600", margin: "0 0 4px", fontSize: "13px" }}>{edu.college}</p>
              {edu.specialization && <p style={{ color: "#64748b", fontSize: "12px", margin: "0 0 4px" }}>{edu.specialization}</p>}
              <p style={{ color: "#94a3b8", fontSize: "12px", margin: 0 }}>{edu.startYear} – {edu.endYear}{edu.cgpa ? ` · ${edu.cgpa} CGPA` : ""}</p>
            </div>
            <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
              <button type="button" onClick={() => openEdit(edu)} style={{ padding: "6px 12px", border: "1.5px solid #6366f1", background: "transparent", color: "#6366f1", borderRadius: "8px", fontSize: "12px", cursor: "pointer", fontWeight: "600", fontFamily: "inherit" }}>Edit</button>
              <button type="button" onClick={() => handleDelete(edu._id)} disabled={deletingId === edu._id} style={{ padding: "6px 12px", border: "1.5px solid #ef4444", background: "transparent", color: "#ef4444", borderRadius: "8px", fontSize: "12px", cursor: "pointer", fontWeight: "600", fontFamily: "inherit" }}>
                {deletingId === edu._id ? "..." : "Delete"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div style={{ marginTop: "20px", border: "1.5px solid #e2e8f0", borderRadius: "14px", padding: "24px", background: "#fafbff" }}>
          <h3 style={{ color: "#1e293b", fontSize: "15px", fontWeight: "700", margin: "0 0 20px" }}>
            {editId ? "Edit Education" : "Add Education"}
          </h3>
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px" }}>
              <div>
                <label style={{ fontSize: "12px", fontWeight: "600", color: "#374151", display: "block", marginBottom: "5px" }}>Degree <span style={{ color: "#ef4444" }}>*</span></label>
                <input {...register("degree", { required: true })} placeholder="e.g. B.Tech, MCA" style={{ ...inputStyle, borderColor: errors.degree ? "#ef4444" : "#e2e8f0" }} />
              </div>
              <div>
                <label style={{ fontSize: "12px", fontWeight: "600", color: "#374151", display: "block", marginBottom: "5px" }}>College / University <span style={{ color: "#ef4444" }}>*</span></label>
                <input {...register("college", { required: true })} placeholder="e.g. IIT Mumbai" style={{ ...inputStyle, borderColor: errors.college ? "#ef4444" : "#e2e8f0" }} />
              </div>
              <div>
                <label style={{ fontSize: "12px", fontWeight: "600", color: "#374151", display: "block", marginBottom: "5px" }}>Specialization</label>
                <input {...register("specialization")} placeholder="e.g. Computer Science" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: "12px", fontWeight: "600", color: "#374151", display: "block", marginBottom: "5px" }}>Start Year <span style={{ color: "#ef4444" }}>*</span></label>
                <input {...register("startYear", { required: true })} type="number" placeholder="e.g. 2020" style={{ ...inputStyle, borderColor: errors.startYear ? "#ef4444" : "#e2e8f0" }} />
              </div>
              <div>
                <label style={{ fontSize: "12px", fontWeight: "600", color: "#374151", display: "block", marginBottom: "5px" }}>End Year <span style={{ color: "#ef4444" }}>*</span></label>
                <input {...register("endYear", { required: true })} type="number" placeholder="e.g. 2024" style={{ ...inputStyle, borderColor: errors.endYear ? "#ef4444" : "#e2e8f0" }} />
              </div>
              <div>
                <label style={{ fontSize: "12px", fontWeight: "600", color: "#374151", display: "block", marginBottom: "5px" }}>CGPA / Percentage</label>
                <input {...register("cgpa")} placeholder="e.g. 8.5 or 85%" style={inputStyle} />
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

export default EducationForm;
