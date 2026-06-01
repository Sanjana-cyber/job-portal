import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Mail, Lock, Eye, EyeOff, Loader2, Shield, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import "./AdminLogin.css";

/**
 * Admin Login Page
 * Accessible only at /admin/login
 * - No registration option
 * - No Google OAuth
 * - Minimal, secure design
 */
const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    try {
      setLoading(true);
      const data = await login(email, password);

      // Verify the user is actually an admin
      if (data.user.role !== "admin") {
        setError("Access denied. Admin credentials required.");
        toast.error("Access denied. Admin credentials required.");
        return;
      }

      toast.success("Welcome back, Admin!");
      navigate("/admin/dashboard");
    } catch (err) {
      const message =
        err.response?.data?.message || "Login failed. Please try again.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-ambient-glow" />

      <div className="admin-login-card glass-strong animate-scale-in" id="admin-login-card">
        {/* Shield Icon */}
        <div className="admin-icon-wrapper">
          <Shield size={32} />
        </div>

        <h1 className="admin-title">Admin Access</h1>
        <p className="admin-subtitle">
          Restricted area. Authorized personnel only.
        </p>

        {/* Error Display */}
        {error && (
          <div className="error-banner">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="admin-form" id="admin-login-form">
          <div className="input-group">
            <Mail size={18} className="input-icon" />
            <input
              type="email"
              placeholder="Admin email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="auth-input"
              required
              id="admin-email"
            />
          </div>

          <div className="input-group">
            <Lock size={18} className="input-icon" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="auth-input"
              required
              id="admin-password"
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              id="admin-toggle-password"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <button
            type="submit"
            className="btn-admin-login"
            disabled={loading}
            id="admin-submit-btn"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="spin" />
                Authenticating...
              </>
            ) : (
              <>
                <Shield size={18} />
                Sign In as Admin
              </>
            )}
          </button>
        </form>

        <p className="admin-notice">
          This portal is for authorized administrators only.
          <br />
          Contact the system administrator for access.
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;
