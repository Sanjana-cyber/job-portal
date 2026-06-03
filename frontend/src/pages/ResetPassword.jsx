import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { resetPassword } from "../api/authApi";
import { Lock, Eye, EyeOff, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

/**
 * Reset Password Page
 * Handles new password input and submits the reset token to the backend
 */
const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!password || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      setLoading(true);
      await resetPassword({ token, password });
      setSuccess(true);
      toast.success("Password reset successful!");
    } catch (err) {
      const message =
        err.response?.data?.message || "Invalid or expired token. Please request a new link.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="reset-password-page">
        <div className="reset-card glass-strong animate-scale-in">
          <div className="success-icon-wrapper">
            <CheckCircle size={48} className="success-icon" />
          </div>
          <h2>Password Reset</h2>
          <p className="reset-success-msg">
            Your password has been successfully updated. You can now log in using your new credentials.
          </p>
          <button className="btn-primary" onClick={() => navigate("/")}>
            Go to Home / Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="reset-password-page">
      <div className="reset-card glass-strong animate-scale-in">
        <h2>Reset Password</h2>
        <p className="reset-subtitle">Enter your new password below.</p>

        {error && (
          <div className="error-banner">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="reset-form">
          <div className="input-group">
            <Lock size={18} className="input-icon" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="New password (min. 6 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="auth-input"
              required
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <div className="input-group">
            <Lock size={18} className="input-icon" />
            <input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="auth-input"
              required
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? (
              <>
                <Loader2 size={18} className="spin" />
                Updating...
              </>
            ) : (
              "Update Password"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
