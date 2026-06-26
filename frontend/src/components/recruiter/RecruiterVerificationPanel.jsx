import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { submitVerification, getVerificationStatus } from "../../api/verificationApi";
import toast from "react-hot-toast";
import { Shield, Clock, CheckCircle, XCircle, ChevronRight, Building2, Mail, Globe, AlertTriangle } from "lucide-react";

/**
 * RecruiterVerificationPanel
 *
 * Shown on the recruiter dashboard. Displays the recruiter's current
 * verification status and provides a form to submit / re-submit.
 *
 * Status flow:
 *   none     → form to submit
 *   pending  → "Under Review" message
 *   approved → success badge (panel collapses)
 *   rejected → rejection note + form to re-submit
 */
const RecruiterVerificationPanel = ({ onStatusChange }) => {
  const { user } = useAuth();

  const [status, setStatus] = useState(null);       // verification data from API
  const [required, setRequired] = useState(false);  // verificationRequired global toggle
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    companyName: "",
    workEmail: "",
    companyWebsite: "",
  });

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await getVerificationStatus();
      const d = res.data.data;
      setStatus(d);
      setRequired(d.verificationRequired);
      // Pre-fill form with saved data
      setForm({
        companyName: d.companyName || "",
        workEmail: d.workEmail || user?.email || "",
        companyWebsite: d.companyWebsite || "",
      });
      // Auto-open form when status is none or rejected
      if (d.companyVerificationStatus === "none" || d.companyVerificationStatus === "rejected") {
        setShowForm(true);
      }
      onStatusChange?.(d);
    } catch (err) {
      console.error("Failed to load verification status", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.companyName.trim() || !form.workEmail.trim()) {
      toast.error("Company name and work email are required.");
      return;
    }
    try {
      setSubmitting(true);
      await submitVerification(form);
      toast.success("Verification request submitted! The admin will review it shortly.");
      await fetchStatus();
      setShowForm(false);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return null;

  const s = status?.companyVerificationStatus || "none";

  // Approved + enforcement OFF → don't show panel
  if (s === "approved" && !required) return null;

  // ── Badge config per status ───────────────────────────────────────────────
  const statusConfig = {
    none:     { icon: Shield,       color: "#6b7280", bg: "rgba(107,114,128,0.08)", label: "Not Submitted",  border: "rgba(107,114,128,0.2)" },
    pending:  { icon: Clock,        color: "#f59e0b", bg: "rgba(245,158,11,0.08)",  label: "Under Review",   border: "rgba(245,158,11,0.2)"  },
    approved: { icon: CheckCircle,  color: "#22c55e", bg: "rgba(34,197,94,0.08)",   label: "Verified ✓",    border: "rgba(34,197,94,0.2)"   },
    rejected: { icon: XCircle,      color: "#ef4444", bg: "rgba(239,68,68,0.08)",   label: "Rejected",       border: "rgba(239,68,68,0.2)"   },
  };
  const cfg = statusConfig[s];
  const Icon = cfg.icon;

  return (
    <div className="verif-panel" style={{ borderColor: cfg.border, background: cfg.bg }}>
      {/* ── Header row ─────────────────────────────────────────────────── */}
      <div className="verif-panel-header">
        <div className="verif-panel-title">
          <Icon size={18} style={{ color: cfg.color, flexShrink: 0 }} />
          <div>
            <span className="verif-panel-label">Company Verification</span>
            <span className="verif-status-badge" style={{ color: cfg.color, background: `${cfg.color}18` }}>
              {cfg.label}
            </span>
          </div>
        </div>

        {required && s !== "approved" && (
          <div className="verif-required-tag">
            <AlertTriangle size={13} /> Required to post jobs
          </div>
        )}
      </div>

      {/* ── Status-specific body ────────────────────────────────────────── */}
      {s === "pending" && (
        <div className="verif-pending-body">
          <p>Your request for <strong>{status.companyName}</strong> is under admin review.</p>
          <p className="verif-sub">We'll email you at <strong>{status.workEmail}</strong> when it's processed.</p>
        </div>
      )}

      {s === "approved" && required && (
        <div className="verif-approved-body">
          <CheckCircle size={16} style={{ color: "#22c55e" }} />
          <span>Your company <strong>{status.companyName}</strong> is verified. You can post jobs freely.</span>
        </div>
      )}

      {s === "rejected" && (
        <div className="verif-rejected-body">
          <div className="verif-rejection-note">
            <strong>Rejection reason:</strong> {status.companyVerificationNote || "No reason provided."}
          </div>
          <p className="verif-sub">Please update your details and re-submit below.</p>
        </div>
      )}

      {/* ── Submission form (none or rejected) ─────────────────────────── */}
      {(s === "none" || s === "rejected") && (
        <>
          {!showForm && (
            <button className="verif-open-form-btn" onClick={() => setShowForm(true)}>
              Submit Verification <ChevronRight size={14} />
            </button>
          )}
          {showForm && (
            <form onSubmit={handleSubmit} className="verif-form">
              <div className="verif-form-grid">
                <div className="form-group">
                  <label className="form-label">
                    <Building2 size={13} /> Company Name *
                  </label>
                  <input
                    className="form-input"
                    type="text"
                    placeholder="e.g. Acme Corp"
                    value={form.companyName}
                    onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                    required
                    disabled={submitting}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    <Mail size={13} /> Work Email *
                  </label>
                  <input
                    className="form-input"
                    type="email"
                    placeholder="you@company.com"
                    value={form.workEmail}
                    onChange={(e) => setForm({ ...form, workEmail: e.target.value })}
                    required
                    disabled={submitting}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    <Globe size={13} /> Company Website
                  </label>
                  <input
                    className="form-input"
                    type="url"
                    placeholder="https://company.com"
                    value={form.companyWebsite}
                    onChange={(e) => setForm({ ...form, companyWebsite: e.target.value })}
                    disabled={submitting}
                  />
                </div>
              </div>
              <div className="verif-form-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowForm(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? "Submitting…" : (s === "rejected" ? "Re-submit Request" : "Submit for Verification")}
                </button>
              </div>
            </form>
          )}
        </>
      )}
    </div>
  );
};

export default RecruiterVerificationPanel;
