import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { updatePersonalInfo } from "../../api/profileApi";
import { useProfile } from "../../context/ProfileContext";
import ProfilePhotoUpload from "./ProfilePhotoUpload";

const schema = z.object({
  phone:     z.string().min(7, "Phone must be at least 7 digits").max(15),
  location:  z.string().min(2, "Location is required").max(100),
  linkedin:  z.string().url("Must be a valid URL").or(z.literal("")).optional(),
  github:    z.string().url("Must be a valid URL").or(z.literal("")).optional(),
  portfolio: z.string().url("Must be a valid URL").or(z.literal("")).optional(),
});

// ─── Reusable styled input ────────────────────────────────────────────────
const Field = ({ label, required, error, children }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
    <label style={{ fontSize: "13px", fontWeight: "600", color: "#374151" }}>
      {label}
      {required && <span style={{ color: "#ef4444", marginLeft: "3px" }}>*</span>}
    </label>
    {children}
    {error && <span style={{ color: "#ef4444", fontSize: "12px" }}>{error}</span>}
  </div>
);

const inputStyle = (hasError) => ({
  width: "100%", padding: "11px 14px",
  border: `1.5px solid ${hasError ? "#ef4444" : "#e2e8f0"}`,
  borderRadius: "10px", fontSize: "14px", color: "#1e293b",
  background: "#f8fafc", outline: "none", fontFamily: "inherit",
  transition: "border-color 0.2s, box-shadow 0.2s",
  boxSizing: "border-box",
});

const PersonalInfoForm = () => {
  const { profile, refetchProfile, setCompletionScore } = useProfile();
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      phone: "", location: "", linkedin: "", github: "", portfolio: "",
    },
  });

  // Pre-fill form with saved data
  useEffect(() => {
    if (profile) {
      reset({
        phone:     profile.phone || "",
        location:  profile.location || "",
        linkedin:  profile.linkedin || "",
        github:    profile.github || "",
        portfolio: profile.portfolio || "",
      });
    }
  }, [profile, reset]);

  const onSubmit = async (data) => {
    try {
      const res = await updatePersonalInfo(data);
      setCompletionScore(res.data.data.completionScore);
      await refetchProfile();
      toast.success("Personal info saved!");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Save failed");
    }
  };

  return (
    <div style={{ background: "#fff", borderRadius: "20px", padding: "32px", boxShadow: "0 2px 16px rgba(0,0,0,0.06)", border: "1px solid #e2e8f0" }}>
      {/* Photo upload lives at the top of this form */}
      <ProfilePhotoUpload />

      <div style={{ height: "1px", background: "#f1f5f9", margin: "8px 0 28px" }} />

      <h2 style={{ color: "#1e293b", fontWeight: "700", fontSize: "18px", margin: "0 0 24px" }}>Personal Information</h2>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "20px" }}>

          <Field label="Phone Number" required error={errors.phone?.message}>
            <input
              {...register("phone")}
              placeholder="e.g. +91 98765 43210"
              style={inputStyle(!!errors.phone)}
              onFocus={(e) => { e.target.style.borderColor = "#6366f1"; e.target.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.1)"; }}
              onBlur={(e) => { e.target.style.borderColor = errors.phone ? "#ef4444" : "#e2e8f0"; e.target.style.boxShadow = "none"; }}
            />
          </Field>

          <Field label="Location" required error={errors.location?.message}>
            <input
              {...register("location")}
              placeholder="e.g. Mumbai, Maharashtra"
              style={inputStyle(!!errors.location)}
              onFocus={(e) => { e.target.style.borderColor = "#6366f1"; e.target.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.1)"; }}
              onBlur={(e) => { e.target.style.borderColor = errors.location ? "#ef4444" : "#e2e8f0"; e.target.style.boxShadow = "none"; }}
            />
          </Field>

          <Field label="LinkedIn Profile" error={errors.linkedin?.message}>
            <input
              {...register("linkedin")}
              placeholder="https://linkedin.com/in/your-profile"
              style={inputStyle(!!errors.linkedin)}
              onFocus={(e) => { e.target.style.borderColor = "#6366f1"; e.target.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.1)"; }}
              onBlur={(e) => { e.target.style.borderColor = errors.linkedin ? "#ef4444" : "#e2e8f0"; e.target.style.boxShadow = "none"; }}
            />
          </Field>

          <Field label="GitHub Profile" error={errors.github?.message}>
            <input
              {...register("github")}
              placeholder="https://github.com/your-username"
              style={inputStyle(!!errors.github)}
              onFocus={(e) => { e.target.style.borderColor = "#6366f1"; e.target.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.1)"; }}
              onBlur={(e) => { e.target.style.borderColor = errors.github ? "#ef4444" : "#e2e8f0"; e.target.style.boxShadow = "none"; }}
            />
          </Field>

          <Field label="Portfolio / Website" error={errors.portfolio?.message}>
            <input
              {...register("portfolio")}
              placeholder="https://yourportfolio.com"
              style={inputStyle(!!errors.portfolio)}
              onFocus={(e) => { e.target.style.borderColor = "#6366f1"; e.target.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.1)"; }}
              onBlur={(e) => { e.target.style.borderColor = errors.portfolio ? "#ef4444" : "#e2e8f0"; e.target.style.boxShadow = "none"; }}
            />
          </Field>
        </div>

        <div style={{ marginTop: "28px", display: "flex", justifyContent: "flex-end" }}>
          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              padding: "12px 32px",
              background: isSubmitting ? "#94a3b8" : "linear-gradient(135deg, #6366f1, #8b5cf6)",
              color: "#fff", border: "none", borderRadius: "12px",
              fontWeight: "600", fontSize: "14px", cursor: isSubmitting ? "not-allowed" : "pointer",
              boxShadow: isSubmitting ? "none" : "0 4px 14px rgba(99,102,241,0.35)",
              transition: "all 0.2s", fontFamily: "inherit",
            }}
          >
            {isSubmitting ? "Saving..." : "Save Personal Info"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PersonalInfoForm;
