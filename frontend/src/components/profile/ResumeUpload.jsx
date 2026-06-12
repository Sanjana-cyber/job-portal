import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { uploadResumeVersion, setActiveResume, deleteResumeVersion } from "../../api/profileApi";
import { parseResume as parseResumeApi } from "../../api/analysisApi";
import { useProfile } from "../../context/ProfileContext";
import ResumeParserReview from "./ResumeParserReview";

const ResumeUpload = () => {
  const { resumes, refetchProfile, setCompletionScore } = useProfile();
  const fileInputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [parsingId, setParsingId] = useState(null);           // which resume is being parsed
  const [parsedModalData, setParsedModalData] = useState(null); // { resumeId, parsedData }

  const handleFileSelect = (file) => {
    if (!file) return;
    if (file.type !== "application/pdf") { toast.error("Only PDF files are allowed"); return; }
    if (file.size > 5 * 1024 * 1024)    { toast.error("Resume must be under 5MB"); return; }
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) { toast.error("Please select a file to upload"); return; }
    if (!title.trim()) { toast.error("Please provide a title for this resume version"); return; }
    
    const formData = new FormData();
    formData.append("resume", selectedFile);
    formData.append("title", title.trim());
    
    try {
      setUploading(true);
      const res = await uploadResumeVersion(formData);
      setCompletionScore(res.data.data.completionScore);
      await refetchProfile();
      toast.success("Resume version uploaded successfully!");
      setTitle("");
      setSelectedFile(null);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSetActive = async (id) => {
    try {
      setUploading(true);
      const res = await setActiveResume(id);
      setCompletionScore(res.data.data.completionScore);
      await refetchProfile();
      toast.success("Active resume updated");
    } catch { toast.error("Failed to set active resume"); }
    finally { setUploading(false); }
  };

  const handleDelete = async (id) => {
    try {
      setUploading(true);
      const res = await deleteResumeVersion(id);
      setCompletionScore(res.data.data.completionScore);
      await refetchProfile();
      toast.success("Resume version deleted");
    } catch { toast.error("Failed to delete resume"); }
    finally { setUploading(false); }
  };

  const handleParse = async (resume) => {
    try {
      setParsingId(resume._id);
      toast.loading("Parsing resume with AI...", { id: "parse-toast" });
      const res = await parseResumeApi(resume._id);
      toast.success("Resume parsed! Review the extracted data.", { id: "parse-toast" });
      setParsedModalData({ resumeId: resume._id, parsedData: res.data.data.parsedData });
    } catch (err) {
      toast.error(err?.response?.data?.message || "Parsing failed. Please try again.", { id: "parse-toast" });
    } finally {
      setParsingId(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
  };

  return (
    <>
    <div className="resume-container">
      <h2 className="resume-header">
        Resume History <span className="resume-required">*</span>
      </h2>
      <p className="resume-subtitle">Upload multiple resume versions and choose which one is currently active.</p>

      {/* Upload Form Area */}
      <div 
        className={`resume-upload-box ${dragging ? "dragging" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        <p className="resume-upload-icon">{uploading ? "⏳" : "📁"}</p>
        
        {selectedFile ? (
          <div style={{ marginBottom: "16px" }}>
            <p style={{ color: "#1e293b", fontWeight: "600", margin: "0 0 8px" }}>Selected: {selectedFile.name}</p>
            <input 
              type="text" 
              className="resume-title-input" 
              placeholder="Resume Title (e.g., MERN Developer Resume)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={uploading}
            />
            <div>
              <button 
                type="button" 
                className="resume-file-btn secondary" 
                onClick={() => { setSelectedFile(null); setTitle(""); }}
                disabled={uploading}
                style={{ marginRight: "10px" }}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="resume-file-btn" 
                onClick={handleUpload}
                disabled={uploading}
              >
                {uploading ? "Uploading..." : "Save Version"}
              </button>
            </div>
          </div>
        ) : (
          <div>
            <p style={{ color: "#374151", fontWeight: "600", margin: "0 0 4px" }}>Drag & drop a new resume version here</p>
            <p style={{ color: "#94a3b8", fontSize: "13px", margin: "0 0 16px" }}>PDF only, max 5MB</p>
            <button 
              type="button" 
              className="resume-file-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              Choose File
            </button>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        style={{ display: "none" }}
        onChange={(e) => { const f = e.target.files[0]; handleFileSelect(f); e.target.value = ""; }}
      />

      {/* Versions List */}
      {resumes && resumes.length > 0 && (
        <div>
          <h3 className="resume-versions-header">Saved Versions ({resumes.length})</h3>
          <div className="resume-version-list">
            {resumes.map((resume) => (
              <div key={resume._id} className={`resume-item ${resume.isActive ? "active" : ""}`}>
                <div className="resume-item-info">
                  <div className="resume-item-icon">📄</div>
                  <div>
                    <h4 className="resume-item-title">
                      <span className="resume-badge version">v{resume.versionNumber}</span>
                      {resume.title}
                      {resume.isActive && <span className="resume-badge active-badge">Active</span>}
                    </h4>
                    <p className="resume-item-meta">
                      {resume.originalFileName} • Uploaded {new Date(resume.createdAt).toLocaleDateString("en-IN")}
                    </p>
                  </div>
                </div>
                <div className="resume-item-actions">
                  <a 
                    href={resume.fileUrl} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="resume-action-btn view"
                  >
                    View
                  </a>
                  {!resume.isActive && (
                    <button 
                      type="button" 
                      onClick={() => handleSetActive(resume._id)} 
                      disabled={uploading}
                      className="resume-action-btn set-active"
                    >
                      Set Active
                    </button>
                  )}
                  <button 
                    type="button" 
                    onClick={() => handleDelete(resume._id)} 
                    disabled={uploading}
                    className="resume-action-btn delete"
                  >
                    Delete
                  </button>
                  <button
                    type="button"
                    onClick={() => handleParse(resume)}
                    disabled={uploading || parsingId === resume._id}
                    className={`parse-resume-btn${parsingId === resume._id ? " loading" : ""}`}
                    title="Extract structured data from this resume using AI"
                  >
                    {parsingId === resume._id ? "Parsing…" : "✨ Parse"}
                    {resume.parsingStatus === "done" && parsingId !== resume._id && " ✓"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>

    {/* Parser Review Modal */}
    {parsedModalData && (
      <ResumeParserReview
        parsedData={parsedModalData.parsedData}
        resumeId={parsedModalData.resumeId}
        onClose={() => setParsedModalData(null)}
      />
    )}
    </>
  );
};

export default ResumeUpload;
