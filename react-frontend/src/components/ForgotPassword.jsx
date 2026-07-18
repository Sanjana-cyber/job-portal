import { useState } from "react";
import { forgotPassword } from "../api/authApi";
import { ArrowLeft, Mail, Loader2, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";

/**
 * Forgot Password Component
 * Displayed inside the AuthModal when user clicks "Forgot Password?"
 *
 * @param {Object} props
 * @param {Function} props.onBack - Callback to return to login view
 */
const ForgotPassword = ({ onBack }) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("Please enter your email address");
      return;
    }

    try {
      setLoading(true);
      await forgotPassword({ email: email.trim() });
      setSent(true);
      toast.success("Reset link sent! Check your email.");
    } catch (error) {
      const message =
        error.response?.data?.message || "Something went wrong. Please try again.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="forgot-password-success">
        <div className="success-icon-wrapper">
          <CheckCircle size={48} className="success-icon" />
        </div>
        <h3>Check Your Email</h3>
        <p>
          We've sent a password reset link to <strong>{email}</strong>. 
          Please check your inbox and spam folder.
        </p>
        <button className="btn-back" onClick={onBack}>
          <ArrowLeft size={16} />
          Back to Login
        </button>
      </div>
    );
  }

  return (
    <div className="forgot-password">
      <button className="btn-back" onClick={onBack} id="forgot-back-btn">
        <ArrowLeft size={16} />
        Back to Login
      </button>

      <h3 className="forgot-title">Forgot Password?</h3>
      <p className="forgot-subtitle">
        Enter your email address and we'll send you a link to reset your password.
      </p>

      <form onSubmit={handleSubmit} className="forgot-form">
        <div className="input-group">
          <Mail size={18} className="input-icon" />
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="auth-input"
            required
            id="forgot-email-input"
          />
        </div>

        <button
          type="submit"
          className="btn-primary"
          disabled={loading}
          id="forgot-submit-btn"
        >
          {loading ? (
            <>
              <Loader2 size={18} className="spin" />
              Sending...
            </>
          ) : (
            "Send Reset Link"
          )}
        </button>
      </form>
    </div>
  );
};

export default ForgotPassword;
