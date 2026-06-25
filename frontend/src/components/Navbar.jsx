import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LogOut, User, ChevronDown, Briefcase, Shield } from "lucide-react";
import toast from "react-hot-toast";

/**
 * Navigation Bar Component
 * Shows logo, navigation links, and user menu when authenticated
 * Glass morphism styling with smooth animations
 */
const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showDropdown, setShowDropdown] = useState(false);

  // Hide Navbar on dashboard routes
  if (location.pathname.startsWith("/dashboard") || location.pathname.startsWith("/recruiter/dashboard") || location.pathname.startsWith("/admin/dashboard")) {
    return null;
  }

  const handleLogout = async () => {
    await logout();
    toast.success("Logged out successfully");
    navigate("/");
    setShowDropdown(false);
  };

  const handleDashboard = () => {
    if (!user) return;
    const dashboardRoutes = {
      jobseeker: "/dashboard",
      recruiter: "/recruiter/dashboard",
      admin: "/admin",
    };
    navigate(dashboardRoutes[user.role] || "/");
    setShowDropdown(false);
  };

  return (
    <nav className="navbar glass" id="main-navbar">
      <div className="navbar-container">
        {/* Left Side: Logo & Main Navigation Links */}
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-8)" }}>
          {/* Logo */}
          <div className="navbar-logo" onClick={() => navigate("/")} id="navbar-logo">
            <div className="logo-icon">
              <Briefcase size={22} />
            </div>
            <span className="logo-text">JobPortal</span>
          </div>

          {/* Navigation Links */}
          <div className="navbar-links">
            <a href="/jobs" className="nav-link">Find Jobs</a>
            <a href="/#features" className="nav-link">Features</a>
            <a href="/#about" className="nav-link">About</a>
          </div>
        </div>

        {/* Right Side Actions */}
        <div className="navbar-right">
          {/* Shield Icon Link for admin login page */}
          <button
            className="btn-shield-admin"
            onClick={() => navigate("/admin/login")}
            title="Authorized Personnel Only"
            id="admin-portal-link"
          >
            <Shield size={20} />
          </button>

          {isAuthenticated && user ? (
            <div className="user-menu">
              <button
                className="user-menu-trigger"
                onClick={() => setShowDropdown(!showDropdown)}
                id="user-menu-trigger"
              >
                <div className="user-avatar">
                  {user.name?.charAt(0).toUpperCase()}
                </div>
                <span className="user-name">{user.name}</span>
                <ChevronDown
                  size={16}
                  className={`chevron ${showDropdown ? "rotated" : ""}`}
                />
              </button>

              {showDropdown && (
                <div className="dropdown-menu glass-strong animate-scale-in" id="user-dropdown">
                  <div className="dropdown-header">
                    <p className="dropdown-user-name">{user.name}</p>
                    <p className="dropdown-user-email">{user.email}</p>
                    <span className="dropdown-role-badge">{user.role}</span>
                  </div>
                  <div className="dropdown-divider" />
                  <button
                    className="dropdown-item"
                    onClick={handleDashboard}
                    id="dropdown-dashboard"
                  >
                    <User size={16} />
                    Dashboard
                  </button>
                  <button
                    className="dropdown-item dropdown-item-danger"
                    onClick={handleLogout}
                    id="dropdown-logout"
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              className="btn-get-started"
              onClick={() => navigate("/login")}
              id="btn-get-started"
            >
              Login
            </button>
          )}
        </div>
      </div>

      {/* Click outside to close dropdown */}
      {showDropdown && (
        <div
          className="dropdown-overlay"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </nav>
  );
};

export default Navbar;
