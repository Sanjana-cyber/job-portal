import React, { useState } from "react";
import { Eye, EyeOff, Loader2, ArrowLeft } from "lucide-react";
import { registerUser, loginUser, forgotPassword, googleAuth } from "../../services/api";
import "./Auth.css";

// ─── Constants ────────────────────────────────────────────────────────────────

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

/**
 * Regex: rejects strings that contain HTML tags or JS event handlers.
 * Covers <script>, <img onerror=...>, on* attributes, etc.
 */
const HTML_PATTERN = /<[^>]*>|on\w+\s*=/i;

/**
 * URL pattern for optional company website validation.
 * Allows http:// and https:// only.
 */
const URL_PATTERN = /^https?:\/\/.+\..+/;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Returns a user-facing validation error string, or "" if the field is valid.
 * All checks are performed on the already-trimmed value.
 */
function validateField(name, value, extra = {}) {
  // Block HTML / script injection in every text field
  if (HTML_PATTERN.test(value)) {
    return "HTML and script tags are not allowed.";
  }

  switch (name) {
    case "name":
      if (!value) return "Full name is required.";
      if (value.length < 2) return "Name must be at least 2 characters.";
      if (value.length > 80) return "Name must be under 80 characters.";
      return "";

    case "email":
      if (!value) return "Email is required.";
      // RFC-5321-ish: must contain @ and a dot after it
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
        return "Enter a valid email address.";
      return "";

    case "password":
      if (!value) return "Password is required.";
      if (value.length < 8) return "Password must be at least 8 characters.";
      if (value.length > 128) return "Password is too long (max 128 characters).";
      // For register only — require at least one letter and one digit
      if (extra.isRegister && !/[a-zA-Z]/.test(value))
        return "Password must contain at least one letter.";
      if (extra.isRegister && !/[0-9]/.test(value))
        return "Password must contain at least one number.";
      return "";

    case "companyName":
      if (!value) return "Company name is required.";
      if (value.length > 120) return "Company name is too long.";
      return "";

    case "companyWebsite":
      // Optional field — only validate if the user filled it in
      if (value && !URL_PATTERN.test(value))
        return "Enter a valid URL starting with http:// or https://.";
      return "";

    case "forgotEmail":
      if (!value) return "Email is required.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
        return "Enter a valid email address.";
      return "";

    default:
      return "";
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * AuthForm — handles Login and Register flows for a given role.
 *
 * Props:
 *   role         – "jobseeker" | "recruiter"
 *   mode         – "login" | "signup"
 *   onSwitchMode – (newMode: "login" | "signup") => void
 *   onBack       – () => void  — go back to RoleSelect
 *   onSuccess    – (user: object) => void  — called after successful auth
 */
export default function AuthForm({ role, mode, onSwitchMode, onBack, onSuccess }) {
  const isLogin = mode === "login";

  // ── Form state ─────────────────────────────────────────────────────────────
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    companyName: "",
    companyWebsite: "",
  });

  /** Per-field error messages shown inline */
  const [fieldErrors, setFieldErrors] = useState({});

  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  /** Top-level error (API errors, network failures) */
  const [error, setError] = useState("");
  /** Top-level success message */
  const [successMsg, setSuccessMsg] = useState("");

  // Forgot-password sub-screen
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotFieldError, setForgotFieldError] = useState("");

  const roleName = role === "recruiter" ? "Recruiter" : "Job Seeker";

  // ── Handlers ───────────────────────────────────────────────────────────────

  /** Sync form value and clear the field's inline error on change */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    // Clear the inline error as soon as the user starts correcting the field
    if (fieldErrors[name]) {
      setFieldErrors((p) => ({ ...p, [name]: "" }));
    }
  };

  /**
   * Validate all visible fields before submitting.
   * Returns true when all fields are valid.
   */
  const validateAll = () => {
    const trimmed = {
      name: form.name.trim(),
      email: form.email.trim(),
      password: form.password, // don't trim passwords
      companyName: form.companyName.trim(),
      companyWebsite: form.companyWebsite.trim(),
    };

    const errors = {};
    if (!isLogin) errors.name = validateField("name", trimmed.name);
    errors.email = validateField("email", trimmed.email);
    errors.password = validateField("password", trimmed.password, {
      isRegister: !isLogin,
    });
    if (!isLogin && role === "recruiter") {
      errors.companyName = validateField("companyName", trimmed.companyName);
      errors.companyWebsite = validateField(
        "companyWebsite",
        trimmed.companyWebsite
      );
    }

    // Filter out empty strings
    const filtered = Object.fromEntries(
      Object.entries(errors).filter(([, v]) => v)
    );
    setFieldErrors(filtered);
    return Object.keys(filtered).length === 0;
  };

  /** Main login / register submit */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!validateAll()) return; // stop if client-side validation fails

    setLoading(true);
    try {
      let data;
      if (isLogin) {
        data = await loginUser({
          email: form.email.trim().toLowerCase(),
          password: form.password,
        });
      } else {
        data = await registerUser({
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          password: form.password,
          role,
          companyName: form.companyName.trim(),
          companyWebsite: form.companyWebsite.trim(),
        });
      }
      setSuccessMsg(
        data.message || (isLogin ? "Logged in!" : "Account created!")
      );
      // Brief delay so the user sees the success message before the modal closes
      setTimeout(() => onSuccess(data.user || data), 800);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /** Forgot-password submit */
  const handleForgot = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    const emailErr = validateField("forgotEmail", forgotEmail.trim());
    if (emailErr) {
      setForgotFieldError(emailErr);
      return;
    }
    setForgotFieldError("");
    setLoading(true);
    try {
      const data = await forgotPassword(forgotEmail.trim().toLowerCase());
      setSuccessMsg(
        data.message ||
          "If an account exists with this email, a reset link has been sent."
      );
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /** Google One Tap / popup sign-in */
  const handleGoogleClick = () => {
    if (!GOOGLE_CLIENT_ID) {
      setError("Google login is not configured.");
      return;
    }
    /* global google */
    if (typeof google === "undefined") {
      setError("Google SDK not loaded yet. Please refresh the page.");
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
          setTimeout(() => onSuccess(data.user || data), 800);
        } catch (err) {
          setError(err.message || "Google sign-in failed. Please try again.");
        } finally {
          setLoading(false);
        }
      },
    });
    google.accounts.id.prompt();
  };

  // ─── Forgot-password sub-screen ────────────────────────────────────────────
  if (forgotMode) {
    return (
      <div className="auth-form-wrap">
        <button
          className="auth-back-btn"
          onClick={() => {
            setForgotMode(false);
            setError("");
            setSuccessMsg("");
            setForgotFieldError("");
          }}
          aria-label="Back to login"
        >
          <ArrowLeft size={16} /> Back
        </button>

        <div className="auth-modal__header">
          <h2 className="auth-modal__title">Forgot Password</h2>
          <p className="auth-modal__sub">
            We&apos;ll send a reset link to your email
          </p>
        </div>

        <form onSubmit={handleForgot} className="auth-form" noValidate>
          <div className="auth-field">
            <label htmlFor="forgot-email" className="auth-label">
              Email Address
            </label>
            <input
              id="forgot-email"
              type="email"
              className={`auth-input${forgotFieldError ? " auth-input--error" : ""}`}
              placeholder="you@example.com"
              value={forgotEmail}
              onChange={(e) => {
                setForgotEmail(e.target.value);
                if (forgotFieldError) setForgotFieldError("");
              }}
              required
              autoComplete="email"
            />
            {forgotFieldError && (
              <p className="auth-field-error" role="alert">
                {forgotFieldError}
              </p>
            )}
          </div>

          {error && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}
          {successMsg && (
            <p className="auth-success" role="status">
              {successMsg}
            </p>
          )}

          <button
            type="submit"
            className="auth-submit-btn"
            disabled={loading}
          >
            {loading ? (
              <Loader2 size={18} className="auth-spinner" />
            ) : (
              "Send Reset Link"
            )}
          </button>
        </form>
      </div>
    );
  }

  // ─── Main login / register form ────────────────────────────────────────────
  return (
    <div className="auth-form-wrap">
      <button
        className="auth-back-btn"
        onClick={onBack}
        aria-label="Back to role selection"
      >
        <ArrowLeft size={16} /> Back
      </button>

      <div className="auth-modal__header">
        <span className="auth-role-badge">{roleName}</span>
        <h2 className="auth-modal__title">
          {isLogin ? "Welcome back!" : "Create your account"}
        </h2>
        <p className="auth-modal__sub">
          {isLogin
            ? "Log in to continue to Talent Bridge"
            : "Start your journey on Talent Bridge"}
        </p>
      </div>

      {/* ── Google Sign-In ── */}
      <button
        type="button"
        className="auth-google-btn"
        onClick={handleGoogleClick}
        disabled={loading}
        id="google-signin-btn"
      >
        {/* Official Google colour logo */}
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
          <path
            fill="#4285F4"
            d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
          />
          <path
            fill="#34A853"
            d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"
          />
          <path
            fill="#FBBC05"
            d="M3.964 10.707A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"
          />
          <path
            fill="#EA4335"
            d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.961L3.964 6.293C4.672 4.166 6.656 3.58 9 3.58z"
          />
        </svg>
        Continue with Google
      </button>

      <div className="auth-divider">
        <span>or</span>
      </div>

      {/* ── Email / Password Form ── */}
      <form onSubmit={handleSubmit} className="auth-form" noValidate>
        {/* Full Name — register only */}
        {!isLogin && (
          <div className="auth-field">
            <label htmlFor="auth-name" className="auth-label">
              Full Name
            </label>
            <input
              id="auth-name"
              name="name"
              type="text"
              className={`auth-input${fieldErrors.name ? " auth-input--error" : ""}`}
              placeholder="Jane Doe"
              value={form.name}
              onChange={handleChange}
              required
              autoComplete="name"
              maxLength={80}
            />
            {fieldErrors.name && (
              <p className="auth-field-error" role="alert">
                {fieldErrors.name}
              </p>
            )}
          </div>
        )}

        {/* Email */}
        <div className="auth-field">
          <label htmlFor="auth-email" className="auth-label">
            Email Address
          </label>
          <input
            id="auth-email"
            name="email"
            type="email"
            className={`auth-input${fieldErrors.email ? " auth-input--error" : ""}`}
            placeholder="you@example.com"
            value={form.email}
            onChange={handleChange}
            required
            autoComplete="email"
          />
          {fieldErrors.email && (
            <p className="auth-field-error" role="alert">
              {fieldErrors.email}
            </p>
          )}
        </div>

        {/* Password */}
        <div className="auth-field">
          <label htmlFor="auth-password" className="auth-label">
            Password
          </label>
          <div className="auth-input-wrap">
            <input
              id="auth-password"
              name="password"
              type={showPwd ? "text" : "password"}
              className={`auth-input${fieldErrors.password ? " auth-input--error" : ""}`}
              placeholder={isLogin ? "Your password" : "Min 8 characters"}
              value={form.password}
              onChange={handleChange}
              required
              autoComplete={isLogin ? "current-password" : "new-password"}
              maxLength={128}
            />
            <button
              type="button"
              className="auth-eye-btn"
              onClick={() => setShowPwd((p) => !p)}
              aria-label={showPwd ? "Hide password" : "Show password"}
            >
              {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {fieldErrors.password && (
            <p className="auth-field-error" role="alert">
              {fieldErrors.password}
            </p>
          )}
        </div>

        {/* Recruiter extra fields — register only */}
        {!isLogin && role === "recruiter" && (
          <>
            <div className="auth-field">
              <label htmlFor="auth-company" className="auth-label">
                Company Name <span className="auth-required">*</span>
              </label>
              <input
                id="auth-company"
                name="companyName"
                type="text"
                className={`auth-input${fieldErrors.companyName ? " auth-input--error" : ""}`}
                placeholder="Acme Corp"
                value={form.companyName}
                onChange={handleChange}
                required
                maxLength={120}
              />
              {fieldErrors.companyName && (
                <p className="auth-field-error" role="alert">
                  {fieldErrors.companyName}
                </p>
              )}
            </div>

            <div className="auth-field">
              <label htmlFor="auth-website" className="auth-label">
                Company Website{" "}
                <span className="auth-optional">(optional)</span>
              </label>
              <input
                id="auth-website"
                name="companyWebsite"
                type="url"
                className={`auth-input${fieldErrors.companyWebsite ? " auth-input--error" : ""}`}
                placeholder="https://acme.com"
                value={form.companyWebsite}
                onChange={handleChange}
              />
              {fieldErrors.companyWebsite && (
                <p className="auth-field-error" role="alert">
                  {fieldErrors.companyWebsite}
                </p>
              )}
            </div>
          </>
        )}

        {/* API-level error / success banners */}
        {error && (
          <p className="auth-error" role="alert">
            {error}
          </p>
        )}
        {successMsg && (
          <p className="auth-success" role="status">
            {successMsg}
          </p>
        )}

        <button
          type="submit"
          className="auth-submit-btn"
          disabled={loading}
        >
          {loading ? (
            <Loader2 size={18} className="auth-spinner" />
          ) : isLogin ? (
            "Log In"
          ) : (
            "Create Account"
          )}
        </button>

        {/* Footer links */}
        <div className="auth-footer-links">
          {isLogin ? (
            <>
              <span>
                No account?{" "}
                <button
                  type="button"
                  className="auth-link-btn"
                  onClick={() => onSwitchMode("signup")}
                >
                  Create one
                </button>
              </span>
              <button
                type="button"
                className="auth-link-btn"
                onClick={() => {
                  setError("");
                  setSuccessMsg("");
                  setForgotMode(true);
                }}
              >
                Forgot password?
              </button>
            </>
          ) : (
            <span>
              Already have an account?{" "}
              <button
                type="button"
                className="auth-link-btn"
                onClick={() => onSwitchMode("login")}
              >
                Log in
              </button>
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
