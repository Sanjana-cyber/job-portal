import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/authApi";
import { CheckCircle, XCircle, Loader2, Mail } from "lucide-react";
import toast from "react-hot-toast";

/**
 * Email Verification Page
 * Handles checking the email verification token sent in URL
 */
const EmailVerification = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("verifying"); // verifying, success, error
  const [errorMsg, setErrorMsg] = useState("");
  const effectRan = useRef(false);

  useEffect(() => {
    // Prevent double verification call in React StrictMode
    if (effectRan.current) return;
    effectRan.current = true;

    const verifyEmailToken = async () => {
      try {
        const response = await api.get(`/auth/verify-email/${token}`);
        if (response.data.success) {
          setStatus("success");
          toast.success("Email verified successfully!");
        } else {
          setStatus("error");
          setErrorMsg(response.data.message || "Failed to verify email");
        }
      } catch (err) {
        setStatus("error");
        setErrorMsg(
          err.response?.data?.message || "Invalid or expired verification token."
        );
      }
    };

    verifyEmailToken();
  }, [token]);

  return (
    <div className="verification-page">
      <div className="verification-glow" />

      <div className="verification-card glass-strong animate-scale-in">
        {status === "verifying" && (
          <div className="verifying-state">
            <Loader2 size={48} className="spin verifying-icon" />
            <h2>Verifying Email</h2>
            <p>Please wait while we verify your email address...</p>
          </div>
        )}

        {status === "success" && (
          <div className="success-state">
            <CheckCircle size={48} className="success-icon" />
            <h2>Verification Successful!</h2>
            <p>
              Your email address has been successfully verified. You can now access all portal features.
            </p>
            <button className="btn-primary" onClick={() => navigate("/")}>
              Go to Dashboard
            </button>
          </div>
        )}

        {status === "error" && (
          <div className="error-state">
            <XCircle size={48} className="error-icon" />
            <h2>Verification Failed</h2>
            <p className="error-text">{errorMsg}</p>
            <p>The verification link may be invalid or has expired.</p>
            <button className="btn-primary" onClick={() => navigate("/")}>
              Go to Home / Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailVerification;
