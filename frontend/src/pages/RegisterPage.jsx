import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import GoogleLoginBtn from "../components/GoogleLoginBtn";
import { User, Mail, Lock, Eye, EyeOff, Loader2, AlertCircle, Briefcase } from "lucide-react";
import toast from "react-hot-toast";

/**
 * Dedicated Standalone Register Page
 */
const RegisterPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("jobseeker");

  const { register, googleLogin } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrors({});

    const newErrors = {};
    if (!name.trim())   newErrors.name = "Name is required";
    if (!email.trim())  newErrors.email = "Email is required";
    if (!password)      newErrors.password = "Password is required";
    if (password.length < 6)
      newErrors.password = "Password must be at least 6 characters";
    if (password !== confirmPassword)
      newErrors.confirmPassword = "Passwords do not match";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setLoading(true);
      const data = await register({
        name: name.trim(),
        email: email.trim(),
        password,
        role,
      });
      toast.success(data.message || "Registration successful!");

      const routes = {
        jobseeker: "/dashboard",
        recruiter: "/recruiter/dashboard",
        admin: "/admin",
      };
      navigate(routes[data.user.role] || "/");
    } catch (error) {
      const message =
        error.response?.data?.message || "Registration failed. Please try again.";
      setErrors({ general: message });
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credential) => {
    try {
      setLoading(true);
      const data = await googleLogin(credential, role);
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

  const roleSelectStyle = {
    width: "100%",
    padding: "0.6875rem 1rem 0.6875rem 2.625rem",
    background: "var(--bg-input)",
    border: "1px solid var(--border-subtle)",
    borderRadius: "var(--radius-md)",
    color: "var(--text-primary)",
    fontFamily: "var(--font-body)",
    fontSize: "var(--text-sm)",
    appearance: "none",
    cursor: "pointer",
    transition: "all var(--ease-fast)",
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
        background: "var(--bg-page)",
      }}
    >
      <div
        className="modal-container animate-scale-in"
        style={{ position: "relative" }}
      >
        <div className="modal-header">
          <h2 className="modal-title">Create account</h2>
          <p className="modal-subtitle">Join TalentBridge to find your next opportunity</p>
        </div>

        {errors.general && (
          <div className="error-banner">
            <AlertCircle size={16} />
            <span>{errors.general}</span>
          </div>
        )}

        <form onSubmit={handleRegister} className="auth-form" id="register-form">
          <div className="input-group">
            <User size={16} className="input-icon" />
            <input
              type="text"
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="auth-input"
              required
              id="register-name"
            />
          </div>
          {errors.name && <span className="field-error">{errors.name}</span>}

          <div className="input-group">
            <Mail size={16} className="input-icon" />
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="auth-input"
              required
              id="register-email"
            />
          </div>
          {errors.email && <span className="field-error">{errors.email}</span>}

          {/* Role selector */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label
              style={{
                fontSize: "var(--text-xs)",
                color: "var(--text-tertiary)",
                fontWeight: "500",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                paddingLeft: "2px",
              }}
            >
              I am a
            </label>
            <div className="input-group">
              <Briefcase size={16} className="input-icon" />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                style={roleSelectStyle}
                id="register-role"
              >
                <option value="jobseeker">Job Seeker</option>
                <option value="recruiter">Recruiter / Employer</option>
              </select>
            </div>
          </div>

          <div className="input-group">
            <Lock size={16} className="input-icon" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password (min. 6 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="auth-input"
              required
              id="register-password"
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              id="register-toggle-password"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && <span className="field-error">{errors.password}</span>}

          <div className="input-group">
            <Lock size={16} className="input-icon" />
            <input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="auth-input"
              required
              id="register-confirm-password"
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              id="register-toggle-confirm"
            >
              {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
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
            style={{ width: "100%", justifyContent: "center", marginTop: "var(--sp-2)" }}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="spin" />
                Creating account…
              </>
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        <div className="divider">
          <span>or continue with</span>
        </div>

        <GoogleLoginBtn onSuccess={handleGoogleSuccess} text="signup_with" />

        <div
          style={{
            marginTop: "var(--sp-5)",
            textAlign: "center",
            fontSize: "var(--text-sm)",
            color: "var(--text-secondary)",
          }}
        >
          Already have an account?{" "}
          <Link
            to="/login"
            style={{
              color: "var(--navy-600)",
              fontWeight: "600",
              textDecoration: "none",
            }}
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
