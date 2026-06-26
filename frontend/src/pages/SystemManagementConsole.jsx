import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import {
  Shield, Users, CheckCircle, XCircle, Clock,
  AlertTriangle, ToggleLeft, ToggleRight, Building2,
  Globe, Mail, Search, RefreshCw,
} from "lucide-react";
import {
  getAdminStats,
  getVerificationQueue,
  approveRecruiter,
  rejectRecruiter,
  updateVerificationSettings,
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
  const { user } = useAuth();

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

  const statusLabel = { none: "Not Submitted", pending: "Pending", approved: "Approved", rejected: "Rejected" };
  const statusColor = { none: "#6b7280", pending: "#f59e0b", approved: "#22c55e", rejected: "#ef4444" };

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="welcome-section animate-fade-in-up">
          <div className="welcome-text">
            <h1>
              System <span className="gradient-text-admin">Management Console</span>
            </h1>
            <p>Welcome back, {user?.name}. Manage recruiter verification and portal settings.</p>
          </div>
          <div className="welcome-badge role-admin">
            <Shield size={16} /> Administrator
          </div>
        </div>

        {/* ── Verification Toggle Card ─────────────────────────────────── */}
        <div className="admin-toggle-card glass animate-fade-in-up">
          <div className="admin-toggle-left">
            <div className="admin-toggle-icon" style={{ background: stats.verificationRequired ? "rgba(34,197,94,0.1)" : "rgba(107,114,128,0.08)" }}>
              <Shield size={22} style={{ color: stats.verificationRequired ? "#22c55e" : "#6b7280" }} />
            </div>
            <div>
              <h3 className="admin-toggle-title">Recruiter Verification Enforcement</h3>
              <p className="admin-toggle-desc">
                {stats.verificationRequired
                  ? "Recruiters must be approved before posting jobs."
                  : "Recruiters can post jobs without company verification."}
              </p>
            </div>
          </div>
          <div className="admin-toggle-right">
            <span className="admin-toggle-state" style={{ color: stats.verificationRequired ? "#22c55e" : "#6b7280" }}>
              {stats.verificationRequired ? "ON" : "OFF"}
            </span>
            <button
              className="admin-toggle-btn"
              onClick={handleToggle}
              disabled={toggling || loading}
              title={stats.verificationRequired ? "Disable verification enforcement" : "Enable verification enforcement"}
            >
              {stats.verificationRequired
                ? <ToggleRight size={42} style={{ color: "#22c55e" }} />
                : <ToggleLeft  size={42} style={{ color: "#9ca3af" }} />}
            </button>
          </div>
        </div>

        {/* ── Stats Strip ─────────────────────────────────────────────── */}
        {loading ? (
          <div className="admin-stats-strip">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="admin-stat-item glass" style={{ opacity: 0.4 }}>
                <span className="admin-stat-value">—</span>
                <span className="admin-stat-label">Loading…</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="admin-stats-strip">
            <div className="admin-stat-item glass">
              <span className="admin-stat-value" style={{ color: "#f59e0b" }}>{stats.pending}</span>
              <span className="admin-stat-label"><Clock size={13} /> Pending</span>
            </div>
            <div className="admin-stat-item glass">
              <span className="admin-stat-value" style={{ color: "#22c55e" }}>{stats.approved}</span>
              <span className="admin-stat-label"><CheckCircle size={13} /> Approved</span>
            </div>
            <div className="admin-stat-item glass">
              <span className="admin-stat-value" style={{ color: "#ef4444" }}>{stats.rejected}</span>
              <span className="admin-stat-label"><XCircle size={13} /> Rejected</span>
            </div>
            <div className="admin-stat-item glass">
              <span className="admin-stat-value" style={{ color: "var(--text-primary)" }}>{stats.total}</span>
              <span className="admin-stat-label"><Users size={13} /> Total Recruiters</span>
            </div>
          </div>
        )}

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
                        {r.companyVerificationNote && r.companyVerificationStatus === "rejected" && (
                          <div className="admin-rejection-note" title={r.companyVerificationNote}>
                            {r.companyVerificationNote.slice(0, 40)}{r.companyVerificationNote.length > 40 ? "…" : ""}
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
