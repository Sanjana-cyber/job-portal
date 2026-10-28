import React, { useState, useEffect, useCallback, useRef } from "react";
import { useAuthModal } from "../../context/AuthModalContext";
import { api } from "../../services/api";
import TalentBridgeLogo from "../../components/TalentBridgeLogo/TalentBridgeLogo";
import SearchBar from "./SearchBar";
import CreateJob from "./CreateJob";
import ViewJobPage from "./ViewJobPage";
import AtsRankingPage from "./AtsRankingPage";
import NotificationBell from "../../components/NotificationBell/NotificationBell";
import {
  Plus,
  ChevronDown,
  MoreVertical,
  Clock,
  FolderCheck,
  FolderX,
  FileText,
  LayoutGrid,
  List,
  ArrowUpDown,
  X,
  AlertTriangle,
  Eye,
  Pencil,
  Trash2,
  FolderOpen,
  Search,
  MapPin,
  CheckCircle2,
  XCircle,
  Briefcase
} from "lucide-react";
import "./recruiter.css";

/* ─── Helpers ──────────────────────────────────────────────────────────────── */

/**
 * Calculate a human-readable deadline label relative to today.
 * Returns { text, variant } where variant is "expired" | "soon" | "ok".
 */
function getDeadlineInfo(deadline) {
  if (!deadline) return null;
  const now = new Date();
  const d = new Date(deadline);
  const diffMs = d - now;
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return { text: "Expired", variant: "expired" };
  if (diffDays === 0) return { text: "Expires today", variant: "soon" };
  if (diffDays === 1) return { text: "Expires in 1 day", variant: "soon" };
  if (diffDays <= 7)
    return { text: `Expires in ${diffDays} days`, variant: "soon" };
  return { text: `Expires in ${diffDays} days`, variant: "ok" };
}

/** Capitalise the first letter of a string. */
function capitalize(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/** Format a location array or string into a readable label. */
function formatLocation(locations) {
  if (!locations) return null;
  if (Array.isArray(locations)) {
    const filtered = locations.filter(Boolean);
    if (filtered.length === 0) return null;
    return filtered.join(", ");
  }
  return String(locations);
}

/* ─── Status badge CSS class mapping ───────────────────────────────────────── */
function statusClass(status) {
  switch ((status || "").toLowerCase()) {
    case "open":
      return "recruiter-job-card__tag--status-open";
    case "closed":
      return "recruiter-job-card__tag--status-closed";
    case "draft":
      return "recruiter-job-card__tag--status-draft";
    default:
      return "recruiter-job-card__tag--type";
  }
}

/* ─── Sort options ─────────────────────────────────────────────────────────── */
const SORT_OPTIONS = [
  { key: "newest", label: "Newest first" },
  { key: "oldest", label: "Oldest first" },
  { key: "title-asc", label: "Title A → Z" },
  { key: "title-desc", label: "Title Z → A" },
];

function sortJobs(jobs, sortKey) {
  const sorted = [...jobs];
  switch (sortKey) {
    case "newest":
      return sorted.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
    case "oldest":
      return sorted.sort(
        (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
      );
    case "title-asc":
      return sorted.sort((a, b) =>
        (a.jobTitle || "").localeCompare(b.jobTitle || "")
      );
    case "title-desc":
      return sorted.sort((a, b) =>
        (b.jobTitle || "").localeCompare(a.jobTitle || "")
      );
    default:
      return sorted;
  }
}

/* ─── Status filter tabs ───────────────────────────────────────────────────── */
const STATUS_TABS = [
  { key: "all", label: "Open Jobs", icon: FolderCheck },
  { key: "Closed", label: "Closed Jobs", icon: FolderX },
  { key: "Draft", label: "Drafted Jobs", icon: FileText },
];

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  RecruiterPage Component                                                   */
/* ═══════════════════════════════════════════════════════════════════════════ */
export default function RecruiterPage() {
  const { user, logout } = useAuthModal();

  // ── Data state ──────────────────────────────────────────────────────────
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ── UI state ────────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [sortKey, setSortKey] = useState("newest");
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "list"
  const [currentView, setCurrentView] = useState("jobs"); // "jobs" | "create"

  // ── Card overflow menu state ────────────────────────────────────────────
  const [openMenuId, setOpenMenuId] = useState(null);

  // ── Modal state (view job) ──────────────────────────────────────────────
  const [viewJob, setViewJob] = useState(null);
  const [viewJobLoading, setViewJobLoading] = useState(false);

  // ── Create / Edit job state ─────────────────────────────────────────────
  const [editJob, setEditJob] = useState(null); // null = create, object = edit

  // ── Delete confirm state ────────────────────────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // ── ATS Ranking view state ───────────────────────────────────────────────
  const [atsJob, setAtsJob] = useState(null);

  // ── Toast state ─────────────────────────────────────────────────────────
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  // Ref for sort dropdown outside click
  const sortRef = useRef(null);

  /* ── Fetch all jobs ─────────────────────────────────────────────────────── */
  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/jobs");
      setJobs(res.data?.jobs || []);
    } catch (err) {
      setError(err.message || "Failed to load jobs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  /* ── Toast helper ───────────────────────────────────────────────────────── */
  const showToast = useCallback((message, type = "success") => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, type });
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  }, []);

  /* ── Close sort dropdown on outside click ───────────────────────────────── */
  useEffect(() => {
    const handler = (e) => {
      if (sortRef.current && !sortRef.current.contains(e.target)) {
        setShowSortDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* ── Close card overflow menu on outside click ──────────────────────────── */
  useEffect(() => {
    if (openMenuId === null) return;
    const handler = () => setOpenMenuId(null);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [openMenuId]);

  /* ── Filter & sort jobs ─────────────────────────────────────────────────── */
  const filteredJobs = (() => {
    let result = jobs;

    // Status tab filter
    if (activeTab === "all") {
      // "Open Jobs" tab shows Open + jobs without an explicit status
      result = result.filter(
        (j) => !j.status || j.status.toLowerCase() === "open"
      );
    } else {
      result = result.filter(
        (j) => (j.status || "").toLowerCase() === activeTab.toLowerCase()
      );
    }

    // Search filter by title
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter((j) =>
        (j.jobTitle || "").toLowerCase().includes(q)
      );
    }

    // Sort
    result = sortJobs(result, sortKey);

    return result;
  })();

  // Determine if any jobs exist with certain statuses (for showing tabs)
  const hasClosedJobs = jobs.some(
    (j) => (j.status || "").toLowerCase() === "closed"
  );
  const hasDraftJobs = jobs.some(
    (j) => (j.status || "").toLowerCase() === "draft"
  );

  /* ── View Job ───────────────────────────────────────────────────────────── */
  const handleViewJob = async (job) => {
    setOpenMenuId(null);
    setViewJob(job);
    setCurrentView("view");
    setViewJobLoading(true);
    try {
      const res = await api.get(`/jobs/${job._id}`);
      if (res.data?.job) {
        setViewJob(res.data.job);
      }
    } catch {
      // If fetch fails, keep the cached card data
    } finally {
      setViewJobLoading(false);
    }
  };

  /* ── Delete Job ─────────────────────────────────────────────────────────── */
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/jobs/${deleteTarget._id}`);
      setJobs((prev) => prev.filter((j) => j._id !== deleteTarget._id));
      showToast("Job deleted successfully");
      setDeleteTarget(null);
    } catch (err) {
      showToast(err.message || "Failed to delete job", "error");
    } finally {
      setDeleting(false);
    }
  };

  /* ── Toggle Job Registration (Open / Closed) ────────────────────────────── */
  const handleToggleJobStatus = async (job) => {
    setOpenMenuId(null);
    const newStatus = job.status === "Closed" ? "Open" : "Closed";
    try {
      await api.put(`/jobs/${job._id}`, { status: newStatus });
      fetchJobs();
      showToast(
        newStatus === "Closed"
          ? "Job registration closed successfully!"
          : "Job registration reopened successfully!"
      );
    } catch (err) {
      showToast(err.message || "Failed to update registration status", "error");
    }
  };

  /* ── Create / Edit Job ──────────────────────────────────────────────────── */
  const openCreateModal = () => {
    setEditJob(null);
    setCurrentView("create");
  };

  const openEditModal = (job) => {
    setOpenMenuId(null);
    setEditJob(job);
    setCurrentView("create");
  };

  /* ── Notification click → open ATS Ranking for that job ─────────────────── */
  const handleNotificationSelect = useCallback(async (notif) => {
    // Notifications carry a job reference; extract its _id
    const jobId = notif?.job?._id || notif?.job;
    if (!jobId) return;

    // Fetch the full job object so AtsRankingPage has title, description, etc.
    try {
      const res = await api.get(`/jobs/${jobId}`);
      const fullJob = res.data?.job || res.data;
      if (fullJob) {
        setAtsJob(fullJob);
        setCurrentView("ats");
      }
    } catch {
      // If fetch fails, use the partial data already in the notification
      setAtsJob({ _id: jobId, jobTitle: notif?.job?.jobTitle || "Job" });
      setCurrentView("ats");
    }
  }, []);

  /* ── User initials for avatar ───────────────────────────────────────────── */
  const initials = (user?.name || "R")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  /* ════════════════════════════════════════════════════════════════════════ */
  /*  RENDER                                                                 */
  /* ════════════════════════════════════════════════════════════════════════ */
  if (currentView === "ats" && atsJob) {
    return (
      <AtsRankingPage
        job={atsJob}
        onBack={() => {
          setAtsJob(null);
          setCurrentView("jobs");
        }}
      />
    );
  }

  if (currentView === "create") {
    return (
      <CreateJob
        initialData={editJob}
        onBack={() => {
          setEditJob(null);
          setCurrentView("jobs");
        }}
        onJobCreated={(createdJob) => {
          fetchJobs();
          setEditJob(null);
          setCurrentView("jobs");
          if (createdJob?.status === "Closed") {
            setActiveTab("Closed");
            showToast("Job registration closed successfully!");
          } else if (createdJob?.status === "Draft") {
            setActiveTab("Draft");
            showToast("Job saved as draft successfully!");
          } else {
            setActiveTab("Open");
            showToast(
              editJob
                ? "Job updated successfully!"
                : "Job published successfully!"
            );
          }
        }}
      />
    );
  }

  if (currentView === "view" && viewJob) {
    return (
      <ViewJobPage
        job={viewJob}
        companyName={user?.companyName}
        onBack={() => {
          setViewJob(null);
          setCurrentView("jobs");
        }}
        onEdit={(jobToEdit) => {
          setViewJob(null);
          setEditJob(jobToEdit);
          setCurrentView("create");
        }}
        onToggleStatus={async (jobToToggle) => {
          await handleToggleJobStatus(jobToToggle);
          setViewJob((prev) =>
            prev
              ? {
                  ...prev,
                  status: prev.status === "Closed" ? "Open" : "Closed",
                }
              : null
          );
        }}
      />
    );
  }

  return (
    <div className="recruiter-page">
      {/* ── Navbar ──────────────────────────────────────────────────────── */}
      <nav className="recruiter-navbar" id="recruiter-navbar">


        <div className="recruiter-navbar__search">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search Talent Bridge"
            variant="navbar"
            id="navbar-search-input"
          />
        </div>

        <div className="recruiter-navbar__nav">
          {STATUS_TABS.map((tab) => {
            // Only show Closed/Draft tabs if matching jobs exist
            if (tab.key === "Closed" && !hasClosedJobs) return null;
            if (tab.key === "Draft" && !hasDraftJobs) return null;

            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                className={`recruiter-navbar__nav-item${activeTab === tab.key
                  ? " recruiter-navbar__nav-item--active"
                  : ""
                  }`}
                onClick={() => setActiveTab(tab.key)}
                id={`nav-tab-${tab.key}`}
              >
                <span className="recruiter-navbar__nav-icon">
                  <Icon size={18} />
                </span>
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="recruiter-navbar__profile">
          <NotificationBell onSelectNotification={handleNotificationSelect} />
          <div
            className="recruiter-navbar__avatar"
            title={user?.name || "Recruiter"}
          >
            {initials}
          </div>
          <button
            className="recruiter-navbar__logout"
            onClick={logout}
            id="recruiter-logout-btn"
          >
            Logout
          </button>
        </div>
      </nav>

      {/* ── Content ────────────────────────────────────────────────────── */}
      <div className="recruiter-content">
        {/* Header */}
        <div className="recruiter-header">
          <div className="recruiter-header__text">
            <h1>
              {activeTab === "all"
                ? "Open Jobs"
                : activeTab === "Closed"
                  ? "Closed Jobs"
                  : "Drafted Jobs"}
            </h1>
            <p>
              {activeTab === "all"
                ? "Jobs that are live in the job board."
                : activeTab === "Closed"
                  ? "Jobs that have been closed."
                  : "Jobs saved as drafts."}
            </p>
          </div>
          <button
            className="recruiter-header__create-btn"
            onClick={openCreateModal}
            id="create-new-job-btn"
          >
            <Plus size={16} />
            Create a New Job
          </button>
        </div>

        {/* Divider line under Open Jobs header */}
        <div className="recruiter-header-line" />

        {/* Toolbar */}
        <div className="recruiter-toolbar">
          {/* Sort */}
          <div className="recruiter-sort-wrapper" ref={sortRef}>
            <button
              className={`recruiter-toolbar__btn${showSortDropdown ? " recruiter-toolbar__btn--active" : ""
                }`}
              onClick={() => setShowSortDropdown((p) => !p)}
              id="sort-toggle-btn"
            >
              <ArrowUpDown size={14} />
              Sort by
              <ChevronDown size={12} />
            </button>
            {showSortDropdown && (
              <div className="recruiter-sort-dropdown">
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    className={`recruiter-sort-dropdown__item${sortKey === opt.key
                      ? " recruiter-sort-dropdown__item--active"
                      : ""
                      }`}
                    onClick={() => {
                      setSortKey(opt.key);
                      setShowSortDropdown(false);
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Search icon (visible on small screens where navbar search is hidden) */}
          <div
            className="recruiter-toolbar__btn"
            style={{ padding: "0.45rem" }}
          >
            <Search size={14} />
          </div>

          <div className="recruiter-toolbar__spacer" />

          {/* View toggle */}
          <div className="recruiter-toolbar__view-toggle">
            <button
              className={`recruiter-toolbar__view-btn${viewMode === "grid"
                ? " recruiter-toolbar__view-btn--active"
                : ""
                }`}
              onClick={() => setViewMode("grid")}
              title="Grid view"
              id="view-toggle-grid"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              className={`recruiter-toolbar__view-btn${viewMode === "list"
                ? " recruiter-toolbar__view-btn--active"
                : ""
                }`}
              onClick={() => setViewMode("list")}
              title="List view"
              id="view-toggle-list"
            >
              <List size={16} />
            </button>
          </div>
        </div>

        {/* ── Jobs content ─────────────────────────────────────────────── */}
        {loading ? (
          <div className="recruiter-loading">
            <div className="recruiter-spinner" />
            <span className="recruiter-loading__text">Loading jobs…</span>
          </div>
        ) : error ? (
          <div className="recruiter-error">
            <div className="recruiter-error__icon">
              <AlertTriangle size={28} />
            </div>
            <h3>Failed to load jobs</h3>
            <p>{error}</p>
            <button
              className="recruiter-error__retry-btn"
              onClick={fetchJobs}
              id="retry-fetch-btn"
            >
              Try Again
            </button>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="recruiter-empty">
            <div className="recruiter-empty__icon">
              {searchQuery.trim() ? (
                <Search size={28} />
              ) : (
                <FolderOpen size={28} />
              )}
            </div>
            <h3>
              {searchQuery.trim() ? "No matching jobs" : "No jobs yet"}
            </h3>
            <p>
              {searchQuery.trim()
                ? `No jobs match "${searchQuery}". Try a different search term.`
                : "You haven\u2019t created any jobs yet. Click \u201CCreate a New Job\u201D to get started."}
            </p>
          </div>
        ) : (
          <div
            className={
              viewMode === "grid"
                ? "recruiter-jobs-grid"
                : "recruiter-jobs-list"
            }
          >
            {filteredJobs.map((job) => (
              <JobCard
                key={job._id}
                job={job}
                companyName={user?.companyName}
                isMenuOpen={openMenuId === job._id}
                onToggleMenu={(e) => {
                  e.stopPropagation();
                  setOpenMenuId(openMenuId === job._id ? null : job._id);
                }}
                onView={() => handleViewJob(job)}
                onEdit={() => openEditModal(job)}
                onDelete={() => {
                  setOpenMenuId(null);
                  setDeleteTarget(job);
                }}
                onToggleStatus={handleToggleJobStatus}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Delete Confirmation ────────────────────────────────────────── */}
      {deleteTarget && (
        <div
          className="recruiter-confirm-overlay"
          onClick={() => !deleting && setDeleteTarget(null)}
        >
          <div
            className="recruiter-confirm-dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="recruiter-confirm-dialog__icon">
              <Trash2 size={24} />
            </div>
            <h3>Delete Job?</h3>
            <p>
              Are you sure you want to delete{" "}
              <strong>{deleteTarget.jobTitle}</strong>? This action cannot be
              undone.
            </p>
            <div className="recruiter-confirm-dialog__actions">
              <button
                className="recruiter-confirm-dialog__btn recruiter-confirm-dialog__btn--cancel"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                className="recruiter-confirm-dialog__btn recruiter-confirm-dialog__btn--delete"
                onClick={handleDeleteConfirm}
                disabled={deleting}
                id="confirm-delete-btn"
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast ──────────────────────────────────────────────────────── */}
      {toast && (
        <div
          className={`recruiter-toast recruiter-toast--${toast.type}`}
          key={toast.message}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  JobCard Sub-Component                                                    */
/* ═══════════════════════════════════════════════════════════════════════════ */
function JobCard({
  job,
  companyName,
  isMenuOpen,
  onToggleMenu,
  onView,
  onEdit,
  onDelete,
  onToggleStatus,
}) {
  const location = formatLocation(job.acceptableLocations);
  const deadline = getDeadlineInfo(job.applicationDeadline);

  return (
    <div className="recruiter-job-card" id={`job-card-${job._id}`}>
      {/* Top: logo + overflow */}
      <div className="recruiter-job-card__top">
        <div className="recruiter-job-card__logo">
          <TalentBridgeLogo variant="paperplane" size="24" />
        </div>
        <button
          className="recruiter-job-card__overflow-btn"
          onClick={onToggleMenu}
          aria-label="More actions"
        >
          <MoreVertical size={18} />
        </button>

        {/* Overflow dropdown */}
        {isMenuOpen && (
          <div className="recruiter-job-card__overflow-menu">
            <button className="recruiter-job-card__overflow-item" onClick={onView}>
              <Eye size={14} /> View Details
            </button>
            <button className="recruiter-job-card__overflow-item" onClick={onEdit}>
              <Pencil size={14} /> Edit Job
            </button>
            <button
              className="recruiter-job-card__overflow-item"
              onClick={() => onToggleStatus(job)}
            >
              {job.status === "Closed" ? (
                <>
                  <CheckCircle2 size={14} /> Reopen Registration
                </>
              ) : (
                <>
                  <XCircle size={14} /> Close Registration
                </>
              )}
            </button>
            <button
              className="recruiter-job-card__overflow-item recruiter-job-card__overflow-item--danger"
              onClick={onDelete}
            >
              <Trash2 size={14} /> Delete Job
            </button>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="recruiter-job-card__body">
        <h3 className="recruiter-job-card__title">{job.jobTitle}</h3>
        {companyName && (
          <p className="recruiter-job-card__company">{companyName}</p>
        )}
        {location && (
          <p className="recruiter-job-card__location">
            {location}
          </p>
        )}

        {/* Meta tags */}
        <div className="recruiter-job-card__meta">
          {job.employmentType && (
            <span className="recruiter-job-card__tag recruiter-job-card__tag--type">
              {job.employmentType}
            </span>
          )}
          {job.jobType && job.jobType !== job.employmentType && (
            <span className="recruiter-job-card__tag recruiter-job-card__tag--type">
              {job.jobType}
            </span>
          )}
          {job.status && (
            <span
              className={`recruiter-job-card__tag ${statusClass(job.status)}`}
            >
              {capitalize(job.status)}
            </span>
          )}
        </div>

        {/* Deadline */}
        {deadline && (
          <div
            className={`recruiter-job-card__deadline recruiter-job-card__deadline--${deadline.variant}`}
          >
            <Clock size={13} />
            {deadline.text}
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div className="recruiter-job-card__actions">
        <button
          className="recruiter-job-card__btn recruiter-job-card__btn--view"
          onClick={onView}
        >
          View Job
        </button>
        <button
          className="recruiter-job-card__btn recruiter-job-card__btn--edit"
          onClick={onEdit}
        >
          Edit Job
        </button>
      </div>
    </div>
  );
}


