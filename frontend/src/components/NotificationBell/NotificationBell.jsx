import React, { useState, useEffect, useRef, useCallback } from "react";
import { Bell, Check, CheckCheck, Clock, FileText, Sparkles, AlertCircle } from "lucide-react";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "../../services/api";
import "./NotificationBell.css";

function timeAgo(dateStr) {
  if (!dateStr) return "Just now";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "Just now";
  const seconds = Math.floor((new Date() - d) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function NotificationBell({ onSelectNotification }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  const fetchNotifs = useCallback(async () => {
    try {
      const res = await getNotifications();
      const list = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res)
        ? res
        : [];
      setNotifications(list);
      const unread =
        typeof res?.unreadCount === "number"
          ? res.unreadCount
          : list.filter((n) => !n.isRead).length;
      setUnreadCount(unread);
    } catch {
      // silently ignore background notification fetch errors
    }
  }, []);

  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 5000); // 5-second polling for real-time responsiveness
    return () => clearInterval(interval);
  }, [fetchNotifs]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleToggle = () => {
    setIsOpen((prev) => {
      const next = !prev;
      if (next) {
        fetchNotifs();
      }
      return next;
    });
  };

  const handleMarkAsRead = async (e, id) => {
    e.stopPropagation();
    try {
      await markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error("Failed to mark notification as read", err);
    }
  };

  const handleMarkAllRead = async () => {
    setLoading(true);
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all as read", err);
    } finally {
      setLoading(false);
    }
  };

  const handleClickItem = async (notif) => {
    if (!notif.isRead) {
      try {
        await markNotificationRead(notif._id);
        setNotifications((prev) =>
          prev.map((n) => (n._id === notif._id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch {
        // ignore
      }
    }
    setIsOpen(false);
    if (onSelectNotification) {
      onSelectNotification(notif);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case "ats_completed":
        return <Sparkles size={16} className="notif-icon notif-icon--sparkles" />;
      case "ats_failed":
        return <AlertCircle size={16} className="notif-icon notif-icon--failed" />;
      default:
        return <FileText size={16} className="notif-icon notif-icon--file" />;
    }
  };

  return (
    <div className="notification-bell-container" ref={dropdownRef}>
      <button
        className={`notification-bell-btn ${isOpen ? "notification-bell-btn--active" : ""}`}
        onClick={handleToggle}
        title="Notifications"
        aria-label="Recruiter Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-dropdown__header">
            <div>
              <h4 className="notification-dropdown__title">Notifications</h4>
              <span className="notification-dropdown__subtitle">
                {unreadCount > 0
                  ? `${unreadCount} unread update${unreadCount > 1 ? "s" : ""}`
                  : "All caught up"}
              </span>
            </div>
            {unreadCount > 0 && (
              <button
                className="notification-dropdown__mark-all"
                onClick={handleMarkAllRead}
                disabled={loading}
              >
                <CheckCheck size={14} />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          <div className="notification-dropdown__list">
            {notifications.length === 0 ? (
              <div className="notification-empty">
                <Bell size={28} className="notification-empty__icon" />
                <p>No notifications yet</p>
                <span>You'll be notified when applicants submit resumes or ATS screening finishes.</span>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif._id}
                  className={`notification-item ${!notif.isRead ? "notification-item--unread" : ""}`}
                  onClick={() => handleClickItem(notif)}
                >
                  <div className="notification-item__icon-box">
                    {getIcon(notif.type)}
                  </div>
                  <div className="notification-item__content">
                    <div className="notification-item__top">
                      <span className="notification-item__title">{notif.title}</span>
                      <span className="notification-item__time">
                        <Clock size={11} />
                        {timeAgo(notif.createdAt)}
                      </span>
                    </div>
                    <p className="notification-item__message">{notif.message}</p>
                    {notif.job?.jobTitle && (
                      <span className="notification-item__job-pill">
                        {notif.job.jobTitle}
                      </span>
                    )}
                  </div>
                  {!notif.isRead && (
                    <button
                      className="notification-item__read-btn"
                      onClick={(e) => handleMarkAsRead(e, notif._id)}
                      title="Mark as read"
                    >
                      <Check size={13} />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
