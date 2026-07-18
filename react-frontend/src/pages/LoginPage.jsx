import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import GoogleLoginBtn from "../components/GoogleLoginBtn";
import ForgotPassword from "../components/ForgotPassword";
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

/**
 * Dedicated Standalone Login Page
 */
const LoginPage = () => {
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrors({});

    if (!email || !password) {
      setErrors({ general: "Please fill in all fields" });
      return;
    }

    try {
      setLoading(true);
      const data = await login(email, password);
      toast.success(data.message || "Login successful!");

      const routes = {
        jobseeker: "/dashboard",
        recruiter: "/recruiter/dashboard",
        admin: "/admin",
      };
      navigate(routes[data.user.role] || "/");
    } catch (error) {
      const message =
        error.response?.data?.message || "Login failed. Please try again.";
      setErrors({ general: message });
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credential) => {
    try {
      setLoading(true);
      const data = await googleLogin(credential, "jobseeker");
      toast.success(data.message || "Login successful!");

      const routes = {
        jobseeker: "/dashboard",
        recruiter: "/recruiter/dashboard",
        admin: "/admin",
      };
      navigate(routes[data.user.role] || "/");
    } catch (error) {
      const message =
        error.response?.data?.message || "Google authentication failed.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="login-standalone-page"
      style={{
        paddingTop: "100px",
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#c0c0c0",
      }}
    >
      <div
        className="modal-container animate-scale-in"
        style={{ position: "relative" }}
      >
        <div className="modal-header">
          <h2 className="modal-title">
            {showForgotPassword ? "Reset Password" : "Welcome back"}
          </h2>
          <p className="modal-subtitle">
            {showForgotPassword
              ? "We'll help you get back in"
              : "Sign in to your TalentBridge account"}
          </p>
        </div>

        {showForgotPassword ? (
          <ForgotPassword onBack={() => setShowForgotPassword(false)} />
        ) : (
          <>
            {errors.general && (
              <div className="error-banner">
                <AlertCircle size={16} />
                <span>{errors.general}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="auth-form" id="login-form">
              <div className="input-group">
                <Mail size={16} className="input-icon" />
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="auth-input"
                  required
                  id="login-email"
                />
              </div>

              <div className="input-group">
                <Lock size={16} className="input-icon" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              <button
                type="button"
                className="forgot-link"
                onClick={() => setShowForgotPassword(true)}
                id="forgot-password-link"
              >
                Forgot password?
              </button>

              <button
                type="submit"
                className="btn-primary"
                disabled={loading}
                id="login-submit-btn"
                style={{ width: "100%", justifyContent: "center", marginTop: "var(--sp-2)" }}
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="spin" />
                    Signing in…
                  </>
                ) : (
                  "Sign In"
                )}
              </button>
            </form>

            <div className="divider">
              <span>or continue with</span>
            </div>

            <GoogleLoginBtn onSuccess={handleGoogleSuccess} text="signin_with" />

            <div
              style={{
                marginTop: "var(--sp-5)",
                textAlign: "center",
                fontSize: "var(--text-sm)",
                color: "var(--text-secondary)",
              }}
            >
              Don't have an account?{" "}
              <Link
                to="/register"
                style={{
                  color: "var(--navy-600)",
                  fontWeight: "600",
                  textDecoration: "none",
                }}
              >
                Register here
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
