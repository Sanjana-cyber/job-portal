import { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { addCertification, updateCertification, deleteCertification } from "../../api/profileApi";
import { useProfile } from "../../context/ProfileContext";

const inputStyle = { width: "100%", padding: "10px 13px", border: "1.5px solid #e2e8f0", borderRadius: "10px", fontSize: "14px", color: "#1e293b", background: "#f8fafc", outline: "none", fontFamily: "inherit", boxSizing: "border-box" };

const CertificationsForm = () => {
  const { profile, refetchProfile, setCompletionScore } = useProfile();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId]     = useState(null);
  const [saving, setSaving]     = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const { register, handleSubmit, reset } = useForm({
    defaultValues: { name: "", issuer: "", issueDate: "", credentialUrl: "" },
  });

  const openAdd  = () => { reset({ name: "", issuer: "", issueDate: "", credentialUrl: "" }); setEditId(null); setShowForm(true); };
  const openEdit = (c)  => { reset({ ...c, issueDate: c.issueDate ? c.issueDate.slice(0, 10) : "" }); setEditId(c._id); setShowForm(true); };

  const onSubmit = async (data) => {
    try {
      setSaving(true);
      const res = editId ? await updateCertification(editId, data) : await addCertification(data);
      setCompletionScore(res.data.data.completionScore);
      await refetchProfile();
      setShowForm(false);
      toast.success(editId ? "Certification updated!" : "Certification added!");
    } catch (err) { toast.error(err?.response?.data?.message || "Save failed"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try { setDeletingId(id); const res = await deleteCertification(id); setCompletionScore(res.data.data.completionScore); await refetchProfile(); toast.success("Certification removed"); }
    catch { toast.error("Delete failed"); } finally { setDeletingId(null); }
  };

  const list = profile?.certifications || [];

  return (
    <div style={{ background: "#fff", borderRadius: "20px", padding: "32px", boxShadow: "0 2px 16px rgba(0,0,0,0.06)", border: "1px solid #e2e8f0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <h2 style={{ color: "#1e293b", fontWeight: "700", fontSize: "18px", margin: 0 }}>Certifications <span style={{ color: "#94a3b8", fontSize: "13px", fontWeight: "400" }}>(Optional)</span></h2>
        <button type="button" onClick={openAdd} style={{ padding: "8px 18px", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "#fff", border: "none", borderRadius: "10px", fontWeight: "600", fontSize: "13px", cursor: "pointer", fontFamily: "inherit" }}>+ Add Certification</button>
      </div>

      {list.length === 0 && !showForm && (
        <div style={{ textAlign: "center", padding: "32px", color: "#94a3b8", background: "#f8fafc", borderRadius: "12px", border: "1.5px dashed #e2e8f0" }}>
          <p style={{ fontSize: "32px", margin: "0 0 8px" }}>🏅</p>
          <p style={{ fontSize: "14px", margin: 0 }}>Add certifications to stand out to recruiters.</p>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {list.map((cert) => (
          <div key={cert._id} style={{ border: "1.5px solid #e2e8f0", borderRadius: "14px", padding: "18px 20px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px", background: "#fafbff" }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: "700", color: "#1e293b", margin: "0 0 4px", fontSize: "15px" }}>{cert.name}</p>
              <p style={{ color: "#6366f1", fontWeight: "600", margin: "0 0 4px", fontSize: "13px" }}>{cert.issuer}</p>
              <p style={{ color: "#94a3b8", fontSize: "12px", margin: "0 0 6px" }}>
                {cert.issueDate ? new Date(cert.issueDate).toLocaleDateString("en-IN", { month: "long", year: "numeric" }) : ""}
              </p>
              {cert.credentialUrl && (
                <a href={cert.credentialUrl} target="_blank" rel="noreferrer" style={{ color: "#6366f1", fontSize: "12px", fontWeight: "600" }}>View Credential ↗</a>
              )}
            </div>
            <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
              <button type="button" onClick={() => openEdit(cert)} style={{ padding: "6px 12px", border: "1.5px solid #6366f1", background: "transparent", color: "#6366f1", borderRadius: "8px", fontSize: "12px", cursor: "pointer", fontWeight: "600", fontFamily: "inherit" }}>Edit</button>
              <button type="button" onClick={() => handleDelete(cert._id)} disabled={deletingId === cert._id} style={{ padding: "6px 12px", border: "1.5px solid #ef4444", background: "transparent", color: "#ef4444", borderRadius: "8px", fontSize: "12px", cursor: "pointer", fontWeight: "600", fontFamily: "inherit" }}>
                {deletingId === cert._id ? "..." : "Delete"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div style={{ marginTop: "20px", border: "1.5px solid #e2e8f0", borderRadius: "14px", padding: "24px", background: "#fafbff" }}>
          <h3 style={{ color: "#1e293b", fontSize: "15px", fontWeight: "700", margin: "0 0 20px" }}>{editId ? "Edit Certification" : "Add Certification"}</h3>
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px" }}>
              <div><label style={{ fontSize: "12px", fontWeight: "600", color: "#374151", display: "block", marginBottom: "5px" }}>Certificate Name</label>
                <input {...register("name")} placeholder="e.g. AWS Solutions Architect" style={inputStyle} /></div>
              <div><label style={{ fontSize: "12px", fontWeight: "600", color: "#374151", display: "block", marginBottom: "5px" }}>Issuing Organization</label>
                <input {...register("issuer")} placeholder="e.g. Amazon Web Services" style={inputStyle} /></div>
              <div><label style={{ fontSize: "12px", fontWeight: "600", color: "#374151", display: "block", marginBottom: "5px" }}>Issue Date</label>
                <input {...register("issueDate")} type="date" style={inputStyle} /></div>
              <div><label style={{ fontSize: "12px", fontWeight: "600", color: "#374151", display: "block", marginBottom: "5px" }}>Credential URL</label>
                <input {...register("credentialUrl")} placeholder="https://..." style={inputStyle} /></div>
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

export default CertificationsForm;
