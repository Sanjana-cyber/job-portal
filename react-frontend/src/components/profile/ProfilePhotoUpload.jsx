import { useRef, useState, useEffect } from "react";
import { uploadPhoto, deletePhoto } from "../../api/profileApi";
import { useProfile } from "../../context/ProfileContext";
import toast from "react-hot-toast";

/**
 * ProfilePhotoUpload
 * Lives at the top of PersonalInfoForm.
 * Click the circle → file picker → instant preview → upload to Cloudinary.
 */
const ProfilePhotoUpload = () => {
  const { profile, refetchProfile } = useProfile();
  const fileInputRef = useRef(null);
  const [preview, setPreview]   = useState(profile?.photo?.url || "");
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    if (profile?.photo?.url) {
      setPreview(profile.photo.url);
    } else {
      setPreview("");
    }
  }, [profile?.photo?.url]);

  const initials = (() => {
    try {
      const stored = JSON.parse(localStorage.getItem("user") || "{}");
      return (stored.name || "?").split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
    } catch { return "?"; }
  })();

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Photo must be under 2MB");
      return;
    }
    // Show preview immediately
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    // Upload to Cloudinary via backend
    const formData = new FormData();
    formData.append("photo", file);
    try {
      setLoading(true);
      await uploadPhoto(formData);
      await refetchProfile();
      toast.success("Photo updated!");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Upload failed");
      setPreview(profile?.photo?.url || "");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async () => {
    try {
      setLoading(true);
      await deletePhoto();
      setPreview("");
      await refetchProfile();
      toast.success("Photo removed");
    } catch {
      toast.error("Failed to remove photo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
      {/* Clickable Circle */}
      <div
        onClick={() => !loading && fileInputRef.current?.click()}
        style={{
          width: "100px", height: "100px",
          borderRadius: "50%",
          background: preview
            ? "transparent"
            : "linear-gradient(135deg, #6366f1, #8b5cf6)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "32px", fontWeight: "700", color: "#fff",
          cursor: loading ? "not-allowed" : "pointer",
          overflow: "hidden",
          border: "3px solid rgba(99,102,241,0.4)",
          boxShadow: "0 4px 20px rgba(99,102,241,0.25)",
          position: "relative",
          transition: "box-shadow 0.2s",
        }}
        onMouseEnter={(e) => { if (!loading) e.currentTarget.querySelector(".overlay").style.opacity = "1"; }}
        onMouseLeave={(e) => { const o = e.currentTarget.querySelector(".overlay"); if (o) o.style.opacity = "0"; }}
      >
        {preview
          ? <img src={preview} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : <span>{loading ? "⏳" : initials}</span>
        }
        {/* Hover overlay */}
        <div className="overlay" style={{
          position: "absolute", inset: 0,
          background: "rgba(0,0,0,0.45)",
          display: "flex", alignItems: "center", justifyContent: "center",
          opacity: 0, transition: "opacity 0.2s",
          borderRadius: "50%",
          fontSize: "20px",
        }}>📷</div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        style={{ display: "none" }}
        onChange={handleFileChange}
        id="photo-file-input"
      />

      <div style={{ display: "flex", gap: "8px" }}>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
          style={{
            padding: "6px 14px", fontSize: "12px", fontWeight: "600",
            borderRadius: "8px", border: "1px solid #6366f1",
            color: "#6366f1", background: "transparent",
            cursor: loading ? "not-allowed" : "pointer",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "#6366f1"; e.currentTarget.style.color = "#fff"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#6366f1"; }}
        >
          {preview ? "Change Photo" : "Upload Photo"}
        </button>
        {preview && (
          <button
            type="button"
            onClick={handleRemove}
            disabled={loading}
            style={{
              padding: "6px 14px", fontSize: "12px", fontWeight: "600",
              borderRadius: "8px", border: "1px solid #ef4444",
              color: "#ef4444", background: "transparent",
              cursor: loading ? "not-allowed" : "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#ef4444"; e.currentTarget.style.color = "#fff"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#ef4444"; }}
          >Remove</button>
        )}
      </div>
      <p style={{ color: "#94a3b8", fontSize: "11px", margin: 0 }}>JPEG, PNG or WebP · Max 2MB</p>
    </div>
  );
};

export default ProfilePhotoUpload;
