import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LogOut, User, ChevronDown, Briefcase } from "lucide-react";
import toast from "react-hot-toast";
import "./Navbar.css";

/**
 * Navigation Bar Component
 * Shows logo, navigation links, and user menu when authenticated
 * Glass morphism styling with smooth animations
 */
const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = async () => {
    await logout();
    toast.success("Logged out successfully");
    navigate("/");
    setShowDropdown(false);
  };

  const handleDashboard = () => {
    if (!user) return;
    const dashboardRoutes = {
      jobseeker: "/jobseeker/dashboard",
      recruiter: "/recruiter/dashboard",
      admin: "/admin/dashboard",
    };
    navigate(dashboardRoutes[user.role] || "/");
    setShowDropdown(false);
  };

  return (
    <nav className="navbar glass" id="main-navbar">
      <div className="navbar-container">
        {/* Logo */}
        <div className="navbar-logo" onClick={() => navigate("/")} id="navbar-logo">
          <div className="logo-icon">
            <Briefcase size={22} />
          </div>
          <span className="logo-text">JobPortal</span>
        </div>

        {/* Right side */}
        <div className="navbar-right">
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
              onClick={() => navigate("/")}
              id="btn-get-started"
            >
              Get Started
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
