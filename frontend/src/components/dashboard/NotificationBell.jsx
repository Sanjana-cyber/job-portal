import { useState, useEffect, useRef } from "react";
import { Bell, Briefcase } from "lucide-react";
import { Link } from "react-router-dom";
import { getRecentJobs } from "../../api/verificationApi";

const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  useEffect(() => {
    fetchRecentJobs();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchRecentJobs = async () => {
    try {
      const res = await getRecentJobs();
      const recentJobs = res.data.data;
      setJobs(recentJobs);
      
      // Simple logic: if they haven't opened the bell since fetching, all are unread.
      // In a real app, you'd track the last read timestamp in localStorage or DB.
      const lastRead = localStorage.getItem("lastJobNotificationRead");
      let count = 0;
      if (lastRead) {
        const lastReadDate = new Date(lastRead);
        count = recentJobs.filter(j => new Date(j.createdAt) > lastReadDate).length;
      } else {
        count = recentJobs.length;
      }
      setUnreadCount(count);
    } catch (err) {
      console.error("Failed to fetch recent jobs notifications", err);
    }
  };

  const handleOpen = () => {
    setIsOpen(!isOpen);
    if (!isOpen && unreadCount > 0) {
      setUnreadCount(0);
      localStorage.setItem("lastJobNotificationRead", new Date().toISOString());
    }
  };

  return (
    <div className="notification-bell-container" ref={dropdownRef} style={{ position: "relative" }}>
      <button 
        onClick={handleOpen}
        style={{
          background: "transparent",
          border: "none",
          cursor: "pointer",
          padding: "8px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--navy-600)",
          position: "relative",
          borderRadius: "50%",
          transition: "background 0.2s"
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = "var(--navy-100)"}
        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span style={{
            position: "absolute",
            top: "4px",
            right: "4px",
            background: "var(--error-500)",
            color: "white",
            fontSize: "10px",
            fontWeight: "bold",
            width: "16px",
            height: "16px",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown animate-scale-in" style={{
          position: "absolute",
          top: "100%",
          right: "0",
          marginTop: "8px",
          width: "320px",
          background: "white",
          borderRadius: "12px",
          boxShadow: "var(--shadow-lg)",
          border: "1px solid var(--border-subtle)",
          zIndex: 1000,
          overflow: "hidden"
        }}>
          <div style={{
            padding: "16px",
            borderBottom: "1px solid var(--border-subtle)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "var(--bg-surface)"
          }}>
            <h3 style={{ margin: 0, fontSize: "16px", color: "var(--navy-900)" }}>Notifications</h3>
            <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
              Recent Jobs
            </span>
          </div>

          <div style={{ maxHeight: "360px", overflowY: "auto" }}>
            {jobs.length === 0 ? (
              <div style={{ padding: "30px", textAlign: "center", color: "var(--text-tertiary)" }}>
                <Bell size={24} style={{ margin: "0 auto 8px", opacity: 0.5 }} />
                <p style={{ margin: 0, fontSize: "14px" }}>No new notifications</p>
              </div>
            ) : (
              jobs.map(job => (
                <Link 
                  key={job._id} 
                  to="/dashboard/jobs" 
                  onClick={() => setIsOpen(false)}
                  style={{
                    display: "block",
                    padding: "16px",
                    borderBottom: "1px solid var(--border-subtle)",
                    textDecoration: "none",
                    color: "inherit",
                    transition: "background 0.2s"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-surface)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "white"}
                >
                  <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                    <div style={{
                      background: "var(--navy-100)",
                      color: "var(--navy-700)",
                      padding: "8px",
                      borderRadius: "8px"
                    }}>
                      <Briefcase size={16} />
                    </div>
                    <div>
                      <h4 style={{ margin: "0 0 4px", fontSize: "14px", color: "var(--text-primary)" }}>
                        New Job: {job.title}
                      </h4>
                      <p style={{ margin: "0 0 6px", fontSize: "13px", color: "var(--text-secondary)" }}>
                        {job.company} {job.location ? `• ${job.location}` : ""}
                      </p>
                      <span style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>
                        {new Date(job.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
          
          {jobs.length > 0 && (
            <div style={{ padding: "12px", textAlign: "center", borderTop: "1px solid var(--border-subtle)", background: "var(--bg-surface)" }}>
               <Link to="/dashboard/jobs" onClick={() => setIsOpen(false)} style={{ color: "var(--navy-600)", textDecoration: "none", fontSize: "13px", fontWeight: "600" }}>
                 View All Jobs
               </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
