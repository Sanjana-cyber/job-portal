import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { uploadResume, deleteResume } from "../../api/profileApi";
import { useProfile } from "../../context/ProfileContext";

const ResumeUpload = () => {
  const { profile, refetchProfile, setCompletionScore } = useProfile();
  const fileInputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  const hasResume  = !!profile?.resume?.url;
  const resumeName = profile?.resume?.originalName || "resume.pdf";
  const resumeUrl  = profile?.resume?.url || "";
  const uploadedAt = profile?.resume?.uploadedAt
    ? new Date(profile.resume.uploadedAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
    : "";

  const handleUpload = async (file) => {
    if (!file) return;
    if (file.type !== "application/pdf") { toast.error("Only PDF files are allowed"); return; }
    if (file.size > 5 * 1024 * 1024)    { toast.error("Resume must be under 5MB"); return; }
    const formData = new FormData();
    formData.append("resume", file);
    try {
      setUploading(true);
      const res = await uploadResume(formData);
      setCompletionScore(res.data.data.completionScore);
      await refetchProfile();
      toast.success("Resume uploaded successfully!");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setUploading(true);
      const res = await deleteResume();
      setCompletionScore(res.data.data.completionScore);
      await refetchProfile();
      toast.success("Resume removed");
    } catch { toast.error("Failed to remove resume"); }
    finally { setUploading(false); }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  };

  return (
    <div style={{ background: "#fff", borderRadius: "20px", padding: "32px", boxShadow: "0 2px 16px rgba(0,0,0,0.06)", border: "1px solid #e2e8f0" }}>
      <h2 style={{ color: "#1e293b", fontWeight: "700", fontSize: "18px", margin: "0 0 8px" }}>
        Resume <span style={{ color: "#ef4444" }}>*</span>
      </h2>
      <p style={{ color: "#94a3b8", fontSize: "13px", margin: "0 0 24px" }}>Upload your resume in PDF format. Max file size: 5MB.</p>

      {/* Existing Resume Card */}
      {hasResume && (
        <div style={{
          border: "1.5px solid rgba(34,197,94,0.3)",
          borderRadius: "14px",
          padding: "20px 24px",
          background: "rgba(34,197,94,0.04)",
          display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px",
          marginBottom: "20px",
          flexWrap: "wrap",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "rgba(239,68,68,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px" }}>📄</div>
            <div>
              <p style={{ fontWeight: "600", color: "#1e293b", margin: "0 0 2px", fontSize: "14px" }}>{resumeName}</p>
              {uploadedAt && <p style={{ color: "#94a3b8", fontSize: "12px", margin: 0 }}>Uploaded on {uploadedAt}</p>}
            </div>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <a
              href={resumeUrl}
              target="_blank"
              rel="noreferrer"
              style={{ padding: "8px 16px", border: "1.5px solid #6366f1", borderRadius: "10px", color: "#6366f1", textDecoration: "none", fontSize: "13px", fontWeight: "600" }}
            >Preview ↗</a>
            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}
              style={{ padding: "8px 16px", border: "1.5px solid #f59e0b", background: "transparent", borderRadius: "10px", color: "#d97706", fontSize: "13px", fontWeight: "600", cursor: "pointer", fontFamily: "inherit" }}>
              Replace
            </button>
            <button type="button" onClick={handleDelete} disabled={uploading}
              style={{ padding: "8px 16px", border: "1.5px solid #ef4444", background: "transparent", borderRadius: "10px", color: "#ef4444", fontSize: "13px", fontWeight: "600", cursor: "pointer", fontFamily: "inherit" }}>
              Remove
            </button>
          </div>
        </div>
      )}

      {/* Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: `2px dashed ${dragging ? "#6366f1" : "#e2e8f0"}`,
          borderRadius: "14px",
          padding: "40px 24px",
          textAlign: "center",
          cursor: uploading ? "not-allowed" : "pointer",
          background: dragging ? "rgba(99,102,241,0.04)" : "#f8fafc",
          transition: "all 0.2s",
        }}
      >
        <p style={{ fontSize: "36px", margin: "0 0 12px" }}>{uploading ? "⏳" : "📁"}</p>
        <p style={{ color: "#374151", fontWeight: "600", margin: "0 0 4px" }}>
          {uploading ? "Uploading..." : hasResume ? "Drop to replace your resume" : "Drag & drop your resume here"}
        </p>
        <p style={{ color: "#94a3b8", fontSize: "13px", margin: "0 0 16px" }}>or click to browse — PDF only, max 5MB</p>
        {!uploading && (
          <span style={{ padding: "8px 20px", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "#fff", borderRadius: "10px", fontSize: "13px", fontWeight: "600" }}>
            {hasResume ? "Replace Resume" : "Choose File"}
          </span>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        style={{ display: "none" }}
        id="resume-file-input"
        onChange={(e) => { const f = e.target.files[0]; if (f) handleUpload(f); e.target.value = ""; }}
      />
    </div>
  );
};

export default ResumeUpload;
