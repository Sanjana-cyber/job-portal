import React, { useState } from "react";
import { Eye, EyeOff, Loader2, ArrowLeft } from "lucide-react";
import { registerUser, loginUser, forgotPassword, googleAuth } from "../../services/api";
import "./Auth.css";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

export default function AuthForm({ role, mode, onSwitchMode, onBack, onSuccess }) {
  const isLogin = mode === "login";

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    companyName: "",
    companyWebsite: "",
  });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");

  const roleName = role === "recruiter" ? "Recruiter" : "Job Seeker";

  const handleChange = (e) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setLoading(true);
    try {
      let data;
      if (isLogin) {
        data = await loginUser({ email: form.email, password: form.password });
      } else {
        data = await registerUser({
          name: form.name,
          email: form.email,
          password: form.password,
          role,
          companyName: form.companyName,
          companyWebsite: form.companyWebsite,
        });
      }
      setSuccessMsg(data.message || (isLogin ? "Logged in!" : "Account created!"));
      setTimeout(() => onSuccess(data.user || data), 900);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setLoading(true);
    try {
      const data = await forgotPassword(forgotEmail);
      setSuccessMsg(data.message || "Reset link sent! Check your inbox.");
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  /* --- Google Sign-In button via GSI library --- */
  const handleGoogleClick = () => {
    if (!GOOGLE_CLIENT_ID) {
      setError("Google login is not configured.");
      return;
    }
    /* global google */
    if (typeof google === "undefined") {
      setError("Google SDK not loaded yet. Please refresh.");
      return;
    }
    google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: async ({ credential }) => {
        setLoading(true);
        setError("");
        try {
          const data = await googleAuth({ credential, role });
          setSuccessMsg("Google sign-in successful!");
          setTimeout(() => onSuccess(data.user || data), 900);
        } catch (err) {
          setError(err.message || "Google sign-in failed");
        } finally {
          setLoading(false);
        }
      },
    });
    google.accounts.id.prompt();
  };

  /* --- Forgot password screen --- */
  if (forgotMode) {
    return (
      <div className="auth-form-wrap">
        <button className="auth-back-btn" onClick={() => setForgotMode(false)} aria-label="Back">
          <ArrowLeft size={16} /> Back
        </button>
        <div className="auth-modal__header">
          <h2 className="auth-modal__title">Forgot Password</h2>
          <p className="auth-modal__sub">We will send a reset link to your email</p>
        </div>
        <form onSubmit={handleForgot} className="auth-form" noValidate>
          <div className="auth-field">
            <label htmlFor="forgot-email" className="auth-label">Email</label>
            <input
              id="forgot-email"
              type="email"
              className="auth-input"
              placeholder="you@example.com"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              required
            />
          </div>
          {error && <p className="auth-error">{error}</p>}
          {successMsg && <p className="auth-success">{successMsg}</p>}
          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? <Loader2 size={18} className="auth-spinner" /> : "Send Reset Link"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="auth-form-wrap">
      <button className="auth-back-btn" onClick={onBack} aria-label="Back to role selection">
        <ArrowLeft size={16} /> Back
      </button>

      <div className="auth-modal__header">
        <span className="auth-role-badge">{roleName}</span>
        <h2 className="auth-modal__title">
          {isLogin ? "Welcome back!" : "Create your account"}
        </h2>
        <p className="auth-modal__sub">
          {isLogin
            ? "Log in to continue to TalentBridge"
            : "Start your journey on TalentBridge"}
        </p>
      </div>

      {/* Google Button */}
      <button
        type="button"
        className="auth-google-btn"
        onClick={handleGoogleClick}
        disabled={loading}
        id="google-signin-btn"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
          <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
          <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"/>
          <path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"/>
          <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.961L3.964 6.293C4.672 4.166 6.656 3.58 9 3.58z"/>
        </svg>
        Continue with Google
      </button>

      <div className="auth-divider"><span>or</span></div>

      <form onSubmit={handleSubmit} className="auth-form" noValidate>
        {!isLogin && (
          <div className="auth-field">
            <label htmlFor="auth-name" className="auth-label">Full Name</label>
            <input
              id="auth-name"
              name="name"
              type="text"
              className="auth-input"
              placeholder="Jane Doe"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>
        )}

        <div className="auth-field">
          <label htmlFor="auth-email" className="auth-label">Email</label>
          <input
            id="auth-email"
            name="email"
            type="email"
            className="auth-input"
            placeholder="you@example.com"
            value={form.email}
            onChange={handleChange}
            required
          />
        </div>

        <div className="auth-field">
          <label htmlFor="auth-password" className="auth-label">Password</label>
          <div className="auth-input-wrap">
            <input
              id="auth-password"
              name="password"
              type={showPwd ? "text" : "password"}
              className="auth-input"
              placeholder={isLogin ? "Your password" : "Min 8 characters"}
              value={form.password}
              onChange={handleChange}
              required
            />
            <button
              type="button"
              className="auth-eye-btn"
              onClick={() => setShowPwd((p) => !p)}
              aria-label="Toggle password visibility"
            >
              {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Extra recruiter fields */}
        {!isLogin && role === "recruiter" && (
          <>
            <div className="auth-field">
              <label htmlFor="auth-company" className="auth-label">Company Name <span className="auth-required">*</span></label>
              <input
                id="auth-company"
                name="companyName"
                type="text"
                className="auth-input"
                placeholder="Acme Corp"
                value={form.companyName}
                onChange={handleChange}
                required
              />
            </div>
            <div className="auth-field">
              <label htmlFor="auth-website" className="auth-label">Company Website <span className="auth-optional">(optional)</span></label>
              <input
                id="auth-website"
                name="companyWebsite"
                type="url"
                className="auth-input"
                placeholder="https://acme.com"
                value={form.companyWebsite}
                onChange={handleChange}
              />
            </div>
          </>
        )}

        {error && <p className="auth-error">{error}</p>}
        {successMsg && <p className="auth-success">{successMsg}</p>}

        <button type="submit" className="auth-submit-btn" disabled={loading}>
          {loading
            ? <Loader2 size={18} className="auth-spinner" />
            : isLogin ? "Log In" : "Create Account"}
        </button>

        <div className="auth-footer-links">
          {isLogin ? (
            <>
              <span>No account?{" "}
                <button type="button" className="auth-link-btn" onClick={() => onSwitchMode("signup")}>
                  Create one
                </button>
              </span>
              <button type="button" className="auth-link-btn" onClick={() => setForgotMode(true)}>
                Forgot password?
              </button>
            </>
          ) : (
            <span>Already have an account?{" "}
              <button type="button" className="auth-link-btn" onClick={() => onSwitchMode("login")}>
                Log in
              </button>
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
