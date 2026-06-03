import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import GoogleLoginBtn from "./GoogleLoginBtn";
import ForgotPassword from "./ForgotPassword";
import {
  X,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";

/**
 * Authentication Modal Component
 * Supports Login, Register, and Forgot Password views
 * Receives the selected role from the HomePage role card click
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the modal is visible
 * @param {Function} props.onClose - Callback to close the modal
 * @param {string} props.role - Pre-selected role ("jobseeker" or "recruiter")
 */
const AuthModal = ({ isOpen, onClose, role }) => {
  const [activeTab, setActiveTab] = useState("login");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Form state
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [registerData, setRegisterData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const { login, register, googleLogin } = useAuth();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const roleLabel = role === "recruiter" ? "Recruiter" : "Job Seeker";

  /**
   * Redirect user to their role-specific dashboard after auth
   */
  const redirectToDashboard = (userRole) => {
    const routes = {
      jobseeker: "/dashboard",
      recruiter: "/recruiter/dashboard",
      admin: "/admin",
    };
    navigate(routes[userRole] || "/");
    onClose();
  };

  /**
   * Handle Login form submission
   */
  const handleLogin = async (e) => {
    e.preventDefault();
    setErrors({});

    if (!loginData.email || !loginData.password) {
      setErrors({ general: "Please fill in all fields" });
      return;
    }

    try {
      setLoading(true);
      const data = await login(loginData.email, loginData.password);
      toast.success(data.message || "Login successful!");
      redirectToDashboard(data.user.role);
    } catch (error) {
      const message =
        error.response?.data?.message || "Login failed. Please try again.";
      setErrors({ general: message });
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle Register form submission
   */
  const handleRegister = async (e) => {
    e.preventDefault();
    setErrors({});

    // Client-side validation
    const newErrors = {};
    if (!registerData.name.trim()) newErrors.name = "Name is required";
    if (!registerData.email.trim()) newErrors.email = "Email is required";
    if (!registerData.password) newErrors.password = "Password is required";
    if (registerData.password.length < 6)
      newErrors.password = "Password must be at least 6 characters";
    if (registerData.password !== registerData.confirmPassword)
      newErrors.confirmPassword = "Passwords do not match";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setLoading(true);
      const data = await register({
        name: registerData.name.trim(),
        email: registerData.email.trim(),
        password: registerData.password,
        role: role || "jobseeker",
      });
      toast.success(data.message || "Registration successful!");
      redirectToDashboard(data.user.role);
    } catch (error) {
      const message =
        error.response?.data?.message || "Registration failed. Please try again.";
      setErrors({ general: message });
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle Google OAuth success
   */
  const handleGoogleSuccess = async (credential) => {
    try {
      setLoading(true);
      const data = await googleLogin(credential, role);
      toast.success(data.message || "Login successful!");
      redirectToDashboard(data.user.role);
    } catch (error) {
      const message =
        error.response?.data?.message || "Google authentication failed.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Reset form state when switching tabs
   */
  const switchTab = (tab) => {
    setActiveTab(tab);
    setErrors({});
    setShowPassword(false);
    setShowConfirmPassword(false);
    setShowForgotPassword(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose} id="auth-modal-overlay">
      <div
        className="modal-container glass-strong animate-scale-in"
        onClick={(e) => e.stopPropagation()}
        id="auth-modal"
      >
        {/* Close button */}
        <button className="modal-close" onClick={onClose} id="modal-close-btn">
          <X size={20} />
        </button>

        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-role-badge">
            <span>{roleLabel}</span>
          </div>
          <h2 className="modal-title">
            {showForgotPassword
              ? "Reset Password"
              : activeTab === "login"
                ? "Welcome Back"
                : "Create Account"}
          </h2>
          <p className="modal-subtitle">
            {showForgotPassword
              ? "We'll help you get back in"
              : activeTab === "login"
                ? `Sign in to your ${roleLabel} account`
                : `Join as a ${roleLabel}`}
          </p>
        </div>

        {/* Forgot Password View */}
        {showForgotPassword ? (
          <ForgotPassword onBack={() => setShowForgotPassword(false)} />
        ) : (
          <>
            {/* Tab Switcher */}
            <div className="tab-switcher" id="auth-tabs">
              <button
                className={`tab-btn ${activeTab === "login" ? "active" : ""}`}
                onClick={() => switchTab("login")}
                id="tab-login"
              >
                Login
              </button>
              <button
                className={`tab-btn ${activeTab === "register" ? "active" : ""}`}
                onClick={() => switchTab("register")}
                id="tab-register"
              >
                Register
              </button>
              <div
                className="tab-indicator"
                style={{
                  transform: `translateX(${activeTab === "login" ? "0" : "100%"})`,
                }}
              />
            </div>

            {/* Error Display */}
            {errors.general && (
              <div className="error-banner" id="auth-error-banner">
                <AlertCircle size={16} />
                <span>{errors.general}</span>
              </div>
            )}

            {/* Login Form */}
            {activeTab === "login" && (
              <form onSubmit={handleLogin} className="auth-form" id="login-form">
                <div className="input-group">
                  <Mail size={18} className="input-icon" />
                  <input
                    type="email"
                    placeholder="Email address"
                    value={loginData.email}
                    onChange={(e) =>
                      setLoginData({ ...loginData, email: e.target.value })
                    }
                    className="auth-input"
                    required
                    id="login-email"
                  />
                </div>

                <div className="input-group">
                  <Lock size={18} className="input-icon" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={loginData.password}
                    onChange={(e) =>
                      setLoginData({ ...loginData, password: e.target.value })
                    }
                    className="auth-input"
                    required
                    id="login-password"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    id="login-toggle-password"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                <button
                  type="button"
                  className="forgot-link"
                  onClick={() => setShowForgotPassword(true)}
                  id="forgot-password-link"
                >
                  Forgot Password?
                </button>

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={loading}
                  id="login-submit-btn"
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </button>
              </form>
            )}

            {/* Register Form */}
            {activeTab === "register" && (
              <form onSubmit={handleRegister} className="auth-form" id="register-form">
                <div className="input-group">
                  <User size={18} className="input-icon" />
                  <input
                    type="text"
                    placeholder="Full name"
                    value={registerData.name}
                    onChange={(e) =>
                      setRegisterData({ ...registerData, name: e.target.value })
                    }
                    className={`auth-input ${errors.name ? "input-error" : ""}`}
                    required
                    id="register-name"
                  />
                </div>
                {errors.name && (
                  <span className="field-error">{errors.name}</span>
                )}

                <div className="input-group">
                  <Mail size={18} className="input-icon" />
                  <input
                    type="email"
                    placeholder="Email address"
                    value={registerData.email}
                    onChange={(e) =>
                      setRegisterData({ ...registerData, email: e.target.value })
                    }
                    className={`auth-input ${errors.email ? "input-error" : ""}`}
                    required
                    id="register-email"
                  />
                </div>
                {errors.email && (
                  <span className="field-error">{errors.email}</span>
                )}

                <div className="input-group">
                  <Lock size={18} className="input-icon" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password (min. 6 characters)"
                    value={registerData.password}
                    onChange={(e) =>
                      setRegisterData({
                        ...registerData,
                        password: e.target.value,
                      })
                    }
                    className={`auth-input ${errors.password ? "input-error" : ""}`}
                    required
                    id="register-password"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    id="register-toggle-password"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && (
                  <span className="field-error">{errors.password}</span>
                )}

                <div className="input-group">
                  <Lock size={18} className="input-icon" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm password"
                    value={registerData.confirmPassword}
                    onChange={(e) =>
                      setRegisterData({
                        ...registerData,
                        confirmPassword: e.target.value,
                      })
                    }
                    className={`auth-input ${errors.confirmPassword ? "input-error" : ""
                      }`}
                    required
                    id="register-confirm-password"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    id="register-toggle-confirm"
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <span className="field-error">{errors.confirmPassword}</span>
                )}

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={loading}
                  id="register-submit-btn"
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="spin" />
                      Creating Account...
                    </>
                  ) : (
                    "Create Account"
                  )}
                </button>
              </form>
            )}

            {/* Divider */}
            <div className="divider">
              <span>or continue with</span>
            </div>

            {/* Google OAuth */}
            <GoogleLoginBtn
              onSuccess={handleGoogleSuccess}
              text={activeTab === "login" ? "signin_with" : "signup_with"}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default AuthModal;
