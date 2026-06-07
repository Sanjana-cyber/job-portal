import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { updateProfessional } from "../../api/profileApi";
import { useProfile } from "../../context/ProfileContext";

const schema = z.object({
  headline: z.string().min(5, "Headline must be at least 5 characters").max(120),
  about:    z.string().min(20, "Tell us more — at least 20 characters").max(1000),
});

const inputStyle = (hasError) => ({
  width: "100%", padding: "11px 14px",
  border: `1.5px solid ${hasError ? "#ef4444" : "#e2e8f0"}`,
  borderRadius: "10px", fontSize: "14px", color: "#1e293b",
  background: "#f8fafc", outline: "none", fontFamily: "inherit",
  transition: "border-color 0.2s, box-shadow 0.2s",
  boxSizing: "border-box",
});

const ProfessionalForm = () => {
  const { profile, refetchProfile, setCompletionScore } = useProfile();
  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { headline: "", about: "" },
  });

  const aboutValue = watch("about", "");

  useEffect(() => {
    if (profile) reset({ headline: profile.headline || "", about: profile.about || "" });
  }, [profile, reset]);

  const onSubmit = async (data) => {
    try {
      const res = await updateProfessional(data);
      setCompletionScore(res.data.data.completionScore);
      await refetchProfile();
      toast.success("Professional info saved!");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Save failed");
    }
  };

  return (
    <div style={{ background: "#fff", borderRadius: "20px", padding: "32px", boxShadow: "0 2px 16px rgba(0,0,0,0.06)", border: "1px solid #e2e8f0" }}>
      <h2 style={{ color: "#1e293b", fontWeight: "700", fontSize: "18px", margin: "0 0 24px" }}>Professional Information</h2>

      <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

        {/* Headline */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label style={{ fontSize: "13px", fontWeight: "600", color: "#374151" }}>
            Professional Headline <span style={{ color: "#ef4444" }}>*</span>
          </label>
          <input
            {...register("headline")}
            placeholder="e.g. Full Stack Developer | React & Node.js | Open to Work"
            style={inputStyle(!!errors.headline)}
            onFocus={(e) => { e.target.style.borderColor = "#6366f1"; e.target.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.1)"; }}
            onBlur={(e) => { e.target.style.borderColor = errors.headline ? "#ef4444" : "#e2e8f0"; e.target.style.boxShadow = "none"; }}
          />
          {errors.headline && <span style={{ color: "#ef4444", fontSize: "12px" }}>{errors.headline.message}</span>}
        </div>

        {/* About Me */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label style={{ fontSize: "13px", fontWeight: "600", color: "#374151", display: "flex", justifyContent: "space-between" }}>
            <span>About Me <span style={{ color: "#ef4444" }}>*</span></span>
            <span style={{ color: "#94a3b8", fontWeight: "400" }}>{aboutValue.length}/1000</span>
          </label>
          <textarea
            {...register("about")}
            rows={5}
            placeholder="Write a brief summary about yourself, your skills, and what you're looking for..."
            style={{
              ...inputStyle(!!errors.about),
              resize: "vertical",
              lineHeight: "1.6",
              minHeight: "120px",
            }}
            onFocus={(e) => { e.target.style.borderColor = "#6366f1"; e.target.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.1)"; }}
            onBlur={(e) => { e.target.style.borderColor = errors.about ? "#ef4444" : "#e2e8f0"; e.target.style.boxShadow = "none"; }}
          />
          {errors.about && <span style={{ color: "#ef4444", fontSize: "12px" }}>{errors.about.message}</span>}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
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
            {isSubmitting ? "Saving..." : "Save Professional Info"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfessionalForm;
