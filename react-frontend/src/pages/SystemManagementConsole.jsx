import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import {
  Shield, Users, CheckCircle, XCircle, Clock,
  AlertTriangle, ToggleLeft, ToggleRight, Building2,
  Globe, Mail, Search, RefreshCw, Trash2, Briefcase
} from "lucide-react";
import {
  getAdminStats,
  getVerificationQueue,
  approveRecruiter,
  rejectRecruiter,
  updateVerificationSettings,
  deleteVerificationRequest
} from "../api/verificationApi";

/**
 * System Management Console — Admin Panel
 *
 * Features:
 * • Verification toggle (Start / Stop Verification enforcement)
 * • Stats strip (Pending / Approved / Rejected / Total recruiters)
 * • Recruiter verification queue with Approve & Reject actions
 * • Rejection modal with reason input
 */
const SystemManagementConsole = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    toast.success("Logged out successfully");
    navigate("/");
  };

  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0, total: 0, verificationRequired: false });
  const [queue, setQueue] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  // Reject modal
  const [rejectModal, setRejectModal] = useState(null); // { id, name }
  const [rejectNote, setRejectNote] = useState("");
  const [rejecting, setRejecting] = useState(false);

  useEffect(() => {
    fetchAll();
  }, []);

  useEffect(() => {
    applyFilter();
  }, [queue, search, filterStatus]);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [statsRes, queueRes] = await Promise.all([getAdminStats(), getVerificationQueue()]);
      setStats(statsRes.data.data);
      setQueue(queueRes.data.data);
    } catch (err) {
      toast.error("Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };

  const applyFilter = () => {
    let data = [...queue];
    if (filterStatus !== "all") data = data.filter((r) => r.companyVerificationStatus === filterStatus);
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(
        (r) =>
          r.name?.toLowerCase().includes(q) ||
          r.email?.toLowerCase().includes(q) ||
          r.companyName?.toLowerCase().includes(q)
      );
    }
    setFiltered(data);
  };

  /* ─── Toggle ─────────────────────────────────────────────────────────── */
  const handleToggle = async () => {
    try {
      setToggling(true);
      const newVal = !stats.verificationRequired;
      await updateVerificationSettings({ verificationRequired: newVal });
      setStats((s) => ({ ...s, verificationRequired: newVal }));
      toast.success(`Verification enforcement ${newVal ? "enabled" : "disabled"}.`);
    } catch (err) {
      toast.error("Failed to update settings");
    } finally {
      setToggling(false);
    }
  };

  /* ─── Approve ────────────────────────────────────────────────────────── */
  const handleApprove = async (id, name) => {
    try {
      await approveRecruiter(id);
      toast.success(`${name} approved.`);
      await fetchAll();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to approve");
    }
  };

  /* ─── Reject ─────────────────────────────────────────────────────────── */
  const openReject = (recruiter) => {
    setRejectModal({ id: recruiter._id, name: recruiter.name });
    setRejectNote("");
  };

  const handleReject = async () => {
    if (!rejectNote.trim()) { toast.error("Please provide a rejection reason."); return; }
    try {
      setRejecting(true);
      await rejectRecruiter(rejectModal.id, { note: rejectNote });
      toast.success(`${rejectModal.name} rejected.`);
      setRejectModal(null);
      await fetchAll();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to reject");
    } finally {
      setRejecting(false);
    }
  };

  /* ─── Delete Request ─────────────────────────────────────────────────── */
  const handleDeleteRequest = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete the verification request for ${name}? This will reset their verification status.`)) {
      return;
    }
    try {
      await deleteVerificationRequest(id);
      toast.success(`Verification request for ${name} deleted.`);
      await fetchAll();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete request");
    }
  };

  const statusLabel = { none: "Not Submitted", pending: "Pending", approved: "Approved", rejected: "Rejected" };
  const statusColor = { none: "#6b7280", pending: "#f59e0b", approved: "#22c55e", rejected: "#ef4444" };

  return (
    <div className="admin-page" style={{ minHeight: "100vh", background: "#c0c0c0", paddingBottom: "40px" }}>
      
      {/* ── Black Navigation Bar ── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 100, background: "#111111", borderBottom: "1px solid #2a2a2a",
        display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 28px", height: "64px"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }} onClick={() => window.location.href = "/"}>
            <div style={{ width: "32px", height: "32px", background: "#fff", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Briefcase size={20} color="#111" />
            </div>
            <span style={{ fontWeight: 700, fontSize: "18px", color: "#fff" }}>JobPortal</span>
          </div>
          <div style={{ width: "1px", height: "24px", background: "#333", margin: "0 8px" }}></div>
          <Shield size={20} color="#ef4444" />
          <h1 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#fff" }}>System Management Console</h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ padding: "5px 14px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "20px", color: "#ef4444", fontSize: "12px", fontWeight: 700 }}>
            Administrator
          </div>
          <button 
            onClick={handleLogout}
            style={{ padding: "6px 14px", background: "transparent", color: "#ff7875", border: "1.5px solid rgba(255,120,116,0.4)", borderRadius: "20px", fontSize: "13px", fontWeight: 500, cursor: "pointer", transition: "0.2s" }}
            onMouseOver={(e) => e.target.style.background = "rgba(255,120,116,0.12)"}
            onMouseOut={(e) => e.target.style.background = "transparent"}
          >
            Logout
          </button>
        </div>
      </header>

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "32px 20px", display: "flex", flexDirection: "column", gap: "20px" }}>

        {/* ── Welcome Banner ── */}
        <div style={{
          background: "#ffffff", borderRadius: "20px", padding: "28px 32px",
          display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px",
          border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 1px 3px rgba(0,0,0,0.06)"
        }}>
          <div>
            <p style={{ color: "#888", fontSize: "16px", margin: "0 0 8px", fontWeight: 600 }}>Admin Panel</p>
            <h2 style={{ margin: 0, fontSize: "44px", fontWeight: 900, color: "#111", letterSpacing: "-1px" }}>Welcome back, {user?.name}!</h2>
            <p style={{ color: "#555", fontSize: "18px", margin: "8px 0 0" }}>Manage recruiter verification and portal settings.</p>
          </div>
        </div>

        {/* ── Verification Toggle Card ── */}
        <div style={{
          background: "#111111", borderRadius: "16px", padding: "24px 28px",
          display: "flex", justifyContent: "space-between", alignItems: "center", gap: "20px", flexWrap: "wrap",
          border: "1px solid #2a2a2a"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{
              width: "48px", height: "48px", borderRadius: "12px", border: "1.5px solid",
              background: stats.verificationRequired ? "rgba(34,197,94,0.1)" : "rgba(255,255,255,0.05)",
              borderColor: stats.verificationRequired ? "rgba(34,197,94,0.3)" : "rgba(255,255,255,0.1)",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <Shield size={22} color={stats.verificationRequired ? "#22c55e" : "#888"} />
            </div>
            <div>
              <h3 style={{ margin: "0 0 4px", fontSize: "16px", fontWeight: 700, color: "#fff" }}>Recruiter Verification Enforcement</h3>
              <p style={{ margin: 0, fontSize: "13px", color: "#888" }}>
                {stats.verificationRequired
                  ? "Recruiters must be approved before posting jobs."
                  : "Recruiters can post jobs without company verification."}
              </p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <span style={{ fontSize: "14px", fontWeight: 800, color: stats.verificationRequired ? "#22c55e" : "#888" }}>
              {stats.verificationRequired ? "ON" : "OFF"}
            </span>
            <button
              onClick={handleToggle}
              disabled={toggling || loading}
              style={{
                width: "52px", height: "28px", borderRadius: "14px", background: stats.verificationRequired ? "#22c55e" : "#333",
                position: "relative", transition: "background 0.3s", border: "none", cursor: "pointer", display: "flex", alignItems: "center"
              }}
            >
              <div style={{
                position: "absolute", left: stats.verificationRequired ? "28px" : "4px", width: "20px", height: "20px",
                borderRadius: "50%", background: "#fff", transition: "left 0.3s", boxShadow: "0 1px 4px rgba(0,0,0,0.3)"
              }}></div>
            </button>
          </div>
        </div>

        {/* ── Stats Strip (Black) ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "16px" }}>
          <div style={{ background: "#111111", border: "1px solid #2a2a2a", borderRadius: "14px", padding: "20px", display: "flex", flexDirection: "column", gap: "4px", alignItems: "center", textAlign: "center" }}>
            <span style={{ fontSize: "28px", fontWeight: 800, color: "#f59e0b", lineHeight: 1 }}>{loading ? "—" : stats.pending}</span>
            <span style={{ fontSize: "12px", color: "#888", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.5px" }}>Pending</span>
          </div>
          <div style={{ background: "#111111", border: "1px solid #2a2a2a", borderRadius: "14px", padding: "20px", display: "flex", flexDirection: "column", gap: "4px", alignItems: "center", textAlign: "center" }}>
            <span style={{ fontSize: "28px", fontWeight: 800, color: "#22c55e", lineHeight: 1 }}>{loading ? "—" : stats.approved}</span>
            <span style={{ fontSize: "12px", color: "#888", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.5px" }}>Approved</span>
          </div>
          <div style={{ background: "#111111", border: "1px solid #2a2a2a", borderRadius: "14px", padding: "20px", display: "flex", flexDirection: "column", gap: "4px", alignItems: "center", textAlign: "center" }}>
            <span style={{ fontSize: "28px", fontWeight: 800, color: "#ef4444", lineHeight: 1 }}>{loading ? "—" : stats.rejected}</span>
            <span style={{ fontSize: "12px", color: "#888", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.5px" }}>Rejected</span>
          </div>
          <div style={{ background: "#111111", border: "1px solid #2a2a2a", borderRadius: "14px", padding: "20px", display: "flex", flexDirection: "column", gap: "4px", alignItems: "center", textAlign: "center" }}>
            <span style={{ fontSize: "28px", fontWeight: 800, color: "#fff", lineHeight: 1 }}>{loading ? "—" : stats.total}</span>
            <span style={{ fontSize: "12px", color: "#888", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.5px" }}>Total Recruiters</span>
          </div>
        </div>

        {/* ── Recruiter Queue ──────────────────────────────────────────── */}
        <div className="dashboard-card glass animate-fade-in-up" style={{ marginTop: "24px" }}>
          <div className="admin-queue-header">
            <h3><Users size={18} /> Recruiter Verification Queue</h3>
            <div className="admin-queue-controls">
              {/* Search */}
              <div className="input-group admin-search" style={{ maxWidth: "220px" }}>
                <Search className="input-icon" size={15} />
                <input
                  type="text"
                  className="auth-input"
                  placeholder="Search recruiters…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              {/* Status filter */}
              <select
                className="admin-filter-select"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="none">Not Submitted</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
              <button className="btn-ghost" onClick={fetchAll} title="Refresh" style={{ padding: "6px" }}>
                <RefreshCw size={16} />
              </button>
            </div>
          </div>

          {loading ? (
            <div style={{ padding: "60px", textAlign: "center", color: "var(--text-secondary)" }}>Loading queue…</div>
          ) : filtered.length === 0 ? (
            <div className="empty-state" style={{ padding: "50px" }}>
              <Users size={36} className="empty-icon" />
              <p>No recruiters found</p>
              <span>Try adjusting the search or filter.</span>
            </div>
          ) : (
            <div className="admin-queue-table-wrap">
              <table className="admin-queue-table">
                <thead>
                  <tr>
                    <th>Recruiter</th>
                    <th>Company</th>
                    <th>Contact</th>
                    <th>Status</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={r._id}>
                      <td>
                        <div className="admin-recruiter-cell">
                          <div className="admin-recruiter-avatar">
                            {r.name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="admin-recruiter-name">{r.name}</div>
                            <div className="admin-recruiter-email">{r.email}</div>
                            {r.provider === "google" && (
                              <span className="admin-provider-badge">Google</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        {r.companyName ? (
                          <div className="admin-company-cell">
                            <Building2 size={13} />
                            <span>{r.companyName}</span>
                          </div>
                        ) : (
                          <span className="admin-not-provided">—</span>
                        )}
                      </td>
                      <td>
                        {r.workEmail ? (
                          <div className="admin-company-cell">
                            <Mail size={13} />
                            <span style={{ fontSize: "12px" }}>{r.workEmail}</span>
                          </div>
                        ) : null}
                        {r.companyWebsite ? (
                          <div className="admin-company-cell" style={{ marginTop: "4px" }}>
                            <Globe size={13} />
                            <a href={r.companyWebsite} target="_blank" rel="noopener noreferrer"
                               style={{ fontSize: "12px", color: "var(--navy-600)", textDecoration: "none" }}>
                              Website ↗
                            </a>
                          </div>
                        ) : null}
                        {!r.workEmail && !r.companyWebsite && (
                          <span className="admin-not-provided">Not submitted</span>
                        )}
                      </td>
                      <td>
                        <span
                          className="admin-status-chip"
                          style={{
                            color: statusColor[r.companyVerificationStatus] || "#6b7280",
                            background: `${statusColor[r.companyVerificationStatus] || "#6b7280"}18`,
                            border: `1px solid ${statusColor[r.companyVerificationStatus] || "#6b7280"}30`,
                          }}
                        >
                          {statusLabel[r.companyVerificationStatus] || "Unknown"}
                        </span>
                        {r.companyVerificationNote && (
                          <div
                            className="admin-rejection-note"
                            title={r.companyVerificationNote}
                            style={{
                              color: r.companyVerificationNote.includes("NOT FOUND") ? "#dc2626"
                                    : r.companyVerificationNote.includes("APPROVED") ? "#16a34a"
                                    : r.companyVerificationNote.includes("ERROR") ? "#d97706"
                                    : "#6b7280",
                              background: r.companyVerificationNote.includes("NOT FOUND") ? "#fef2f2"
                                         : r.companyVerificationNote.includes("APPROVED") ? "#f0fdf4"
                                         : r.companyVerificationNote.includes("ERROR") ? "#fffbeb"
                                         : "transparent",
                            }}
                          >
                            {r.companyVerificationNote.slice(0, 60)}{r.companyVerificationNote.length > 60 ? "…" : ""}
                          </div>
                        )}
                      </td>
                      <td style={{ fontSize: "12px", color: "var(--text-tertiary)" }}>
                        {new Date(r.createdAt).toLocaleDateString()}
                      </td>
                      <td>
                        <div className="admin-action-btns">
                          {r.companyVerificationStatus !== "approved" && r.companyName && (
                            <button
                              className="admin-approve-btn"
                              onClick={() => handleApprove(r._id, r.name)}
                            >
                              <CheckCircle size={13} /> Approve
                            </button>
                          )}
                          {r.companyVerificationStatus !== "rejected" && r.companyName && (
                            <button
                              className="admin-reject-btn"
                              onClick={() => openReject(r)}
                            >
                              <XCircle size={13} /> Reject
                            </button>
                          )}
                          {r.companyName && (
                            <button
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                padding: "6px 12px",
                                background: "#fee2e2",
                                color: "#dc2626",
                                border: "none",
                                borderRadius: "6px",
                                fontSize: "12px",
                                fontWeight: "600",
                                cursor: "pointer",
                                transition: "all 0.2s"
                              }}
                              onClick={() => handleDeleteRequest(r._id, r.name)}
                            >
                              <Trash2 size={13} /> Delete
                            </button>
                          )}
                          {!r.companyName && (
                            <span className="admin-not-provided">Awaiting submission</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Reject Modal ─────────────────────────────────────────────────── */}
      {rejectModal && (
        <div className="modal-overlay" onClick={() => setRejectModal(null)}>
          <div
            className="reject-modal animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="reject-modal-header">
              <XCircle size={22} style={{ color: "#ef4444" }} />
              <h3>Reject {rejectModal.name}</h3>
            </div>
            <p className="reject-modal-desc">
              Please provide a reason. This will be sent to the recruiter via email so they can re-submit.
            </p>
            <div className="form-group">
              <label className="form-label">Rejection Reason *</label>
              <textarea
                className="form-input"
                rows={4}
                placeholder="e.g. The company website URL appears to be invalid. Please provide a working URL with your company details."
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
              />
            </div>
            <div className="form-actions">
              <button className="btn-secondary" onClick={() => setRejectModal(null)} disabled={rejecting}>
                Cancel
              </button>
              <button
                className="btn-danger"
                onClick={handleReject}
                disabled={rejecting || !rejectNote.trim()}
              >
                {rejecting ? "Rejecting…" : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemManagementConsole;
