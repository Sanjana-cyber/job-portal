import React, { useState, useEffect, useRef } from 'react';
import { FaWhatsapp, FaInstagram, FaPhoneAlt, FaLinkedinIn } from 'react-icons/fa';
import './landing.css';
import {
  loginUser, registerUser, forgotPassword, resetPassword,
  googleAuth, getMe, logoutUser,
} from './services/api';

const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  '724790481866-ak5dpfuhr7as23bteo6kc3qabto1uatc.apps.googleusercontent.com';

// ── EDIT YOUR REAL CONTACT INFO HERE ──
const CONTACTS = {
  whatsapp: { label: 'WhatsApp', icon: FaWhatsapp, value: '+91 00000 00000', href: 'https://wa.me/910000000000' },
  instagram: { label: 'Instagram', icon: FaInstagram, value: '@talentbridge', href: 'https://instagram.com/yourhandle' },
  phone: { label: 'Phone', icon: FaPhoneAlt, value: '+91 00000 00000', href: 'tel:+910000000000' },
  linkedin: { label: 'LinkedIn', icon: FaLinkedinIn, value: 'linkedin.com/in/yourname', href: 'https://linkedin.com/in/yourname' },
};

const Crown = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 10H5L3 8zm2.4 12h13.2v2H5.4v-2z" />
  </svg>
);

const Field = ({ label, ...props }) => (
  <div className="form-group">
    <label className="form-label">{label}</label>
    <input className="form-input" {...props} />
  </div>
);

export default function LandingPage() {
  const [role, setRole] = useState(null); // null until chosen on Create Account
  const [mode, setMode] = useState('login');
  const [authOpen, setAuthOpen] = useState(false);
  const [contact, setContact] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', companyName: '', companyWebsite: '', resetToken: '', newPassword: '',
  });
  const googleBtnRef = useRef(null);

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('token');
    if (token) {
      setFormData((p) => ({ ...p, resetToken: token }));
      setMode('reset');
      setAuthOpen(true);
    }
    getMe().then((res) => res.user && setCurrentUser(res.user)).catch(() => { });
  }, []);

  const needsRole = mode === 'register' && !role;
  const showGoogle = authOpen && !currentUser && (mode === 'login' || (mode === 'register' && role));

  useEffect(() => {
    if (!showGoogle) return;
    const interval = setInterval(() => {
      if (window.google?.accounts?.id && googleBtnRef.current) {
        clearInterval(interval);
        window.google.accounts.id.initialize({ client_id: GOOGLE_CLIENT_ID, callback: handleGoogleCallback });
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          theme: 'outline', size: 'large', width: 360,
          text: mode === 'register' ? 'signup_with' : 'signin_with', shape: 'rectangular',
        });
      }
    }, 200);
    return () => clearInterval(interval);
  }, [showGoogle, mode, role]);

  const handleGoogleCallback = async (response) => {
    setError(''); setLoading(true);
    try {
      const data = await googleAuth({ credential: response.credential, role: role || 'jobseeker' });
      setCurrentUser(data.user);
      setAuthOpen(false);
    } catch (err) {
      setError(err.message || 'Google authentication failed');
    } finally { setLoading(false); }
  };

  const handleInputChange = (e) => setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));

  const openAuth = (m) => {
    setMode(m); setRole(null); setError(''); setSuccess(''); setAuthOpen(true);
  };
  const switchMode = (m) => { setMode(m); setError(''); setSuccess(''); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess(''); setLoading(true);
    try {
      let res;
      if (mode === 'login') {
        res = await loginUser({ email: formData.email, password: formData.password });
      } else if (mode === 'register') {
        res = await registerUser({
          name: formData.name, email: formData.email, password: formData.password, role,
          companyName: formData.companyName, companyWebsite: formData.companyWebsite,
        });
      } else if (mode === 'forgot') {
        res = await forgotPassword(formData.email);
        setSuccess(res.message || 'Password reset link sent to your email.');
        return;
      } else {
        res = await resetPassword({ token: formData.resetToken, password: formData.newPassword });
      }
      setCurrentUser(res.user);
      setAuthOpen(false);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally { setLoading(false); }
  };

  const handleLogout = async () => {
    try { await logoutUser(); setCurrentUser(null); } catch (err) { setError(err.message); }
  };

  const roleLabel = role === 'recruiter' ? 'Recruiter' : 'Job Seeker';

  return (
    <div className="tb-page">
      {/* ── Navbar ── */}
      <nav className="tb-nav">
        <a href="#top" className="tb-logo"><Crown /> <span>TALENTBRIDGE</span></a>
        <div className="tb-nav-links">
          <a href="#top">Home</a>
          <a href="#resume">Create Resume</a>
          <a href="#about">About</a>
          <a href="#contact">Contact</a>
        </div>
        <div className="tb-nav-actions">
          {currentUser ? (
            <>
              <span className="tb-hello">Hi, {currentUser.name?.split(' ')[0]}</span>
              <button className="btn-outline" onClick={handleLogout}>Sign Out</button>
            </>
          ) : (
            <>
              <button className="btn-text" onClick={() => openAuth('login')}>Login</button>
              <button className="btn-solid" onClick={() => openAuth('register')}>Create Account</button>
            </>
          )}
        </div>
      </nav>

      {/* ── Hero ── */}
      <header id="top" className="bg-scene hero">
        <Plant />
        <div className="hero-head">
          <h1 className="hero-title">TALENTBRIDGE</h1>
          <p className="hero-sub">Find Jobs. Build Career. Shape Your Future.</p>
        </div>

        <div className="laptop">
          <div className="laptop-lid">
            <div className="laptop-cam" />
            <div className="laptop-screen">
              <div className="screen-nav"><b><Crown size={14} /> TALENTBRIDGE</b><span>Jobs · Companies · About</span></div>
              <div className="screen-hero">
                <div className="screen-copy">
                  <h2>Find The Right Job For You</h2>
                  <p>Create your profile, build a resume and connect with employers.</p>
                  <div className="screen-search"><span>Job title or keyword</span><i>Search Jobs</i></div>
                </div>
                {/* Put a real photo at /public/images/hero-people.png */}
                <img className="screen-photo" src="/images/hero-people.png" alt="" onError={(e) => (e.currentTarget.style.display = 'none')} />
              </div>
            </div>
          </div>
          <div className="laptop-base"><div className="laptop-notch" /></div>
        </div>

        <div className="hero-cta">
          <button className="btn-solid big" onClick={() => openAuth('register')}>Create Account</button>
          <button className="btn-outline big" onClick={() => openAuth('login')}>Login</button>
        </div>
      </header>

      {/* ── Create Resume (same background as hero) ── */}
      <section id="resume" className="bg-scene section">
        <div className="section-inner split">
          <div>
            <h2 className="section-title">Create your resume</h2>
            <p className="section-text">
              Fill in your details once and TalentBridge turns them into a clean, ready-to-send resume.
              Update it any time and apply to jobs with a single click.
            </p>
            <button className="btn-solid big" onClick={() => openAuth('register')}>Start my resume</button>
          </div>
          <div className="resume-paper" aria-hidden="true">
            <div className="rp-avatar" /><div className="rp-line w60" /><div className="rp-line w40" />
            <div className="rp-gap" /><div className="rp-line w80" /><div className="rp-line w70" /><div className="rp-line w75" />
            <div className="rp-gap" /><div className="rp-line w50" /><div className="rp-line w65" />
          </div>
        </div>
      </section>

      {/* ── About ── */}
      <section id="about" className="section about">
        <div className="section-inner">
          <h2 className="section-title">About TalentBridge</h2>
          <p className="section-text wide">
            TalentBridge connects job seekers with recruiters. Job seekers build a profile and resume,
            recruiters post roles and find people who fit. We keep it simple, secure and direct.
          </p>
          <div className="about-grid">
            <div className="about-card"><h3>For job seekers</h3><p>Build a resume, search roles and apply in one click.</p></div>
            <div className="about-card"><h3>For recruiters</h3><p>Register your company and reach candidates directly.</p></div>
            <div className="about-card"><h3>Safe by design</h3><p>Secure cookies and verified accounts protect your data.</p></div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer id="contact" className="tb-footer">
        <div className="footer-brand"><Crown size={22} /> TALENTBRIDGE</div>
        <div className="footer-icons">
          {Object.entries(CONTACTS).map(([key, c]) => (
            <button key={key} className="icon-btn" aria-label={c.label} onClick={() => setContact(c)}>
              <c.icon />
            </button>
          ))}
        </div>
        <p className="footer-copy">&copy; {new Date().getFullYear()} TalentBridge</p>
      </footer>

      {/* ── Contact popup ── */}
      {contact && (
        <div className="modal-backdrop" onClick={() => setContact(null)}>
          <div className="modal small" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setContact(null)} aria-label="Close">&times;</button>
            <div className="contact-icon"><contact.icon /></div>
            <h3>{contact.label}</h3>
            <p className="contact-value">{contact.value}</p>
            <a className="btn-solid big" href={contact.href} target="_blank" rel="noreferrer">Open {contact.label}</a>
          </div>
        </div>
      )}

      {/* ── Auth modal ── */}
      {authOpen && (
        <div className="modal-backdrop" onClick={() => setAuthOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setAuthOpen(false)} aria-label="Close">&times;</button>
            <div className="modal-brand"><Crown size={22} /> TALENTBRIDGE</div>

            {(mode === 'login' || mode === 'register') && (
              <div className="auth-nav-tabs">
                <button className={`auth-nav-tab ${mode === 'login' ? 'active' : ''}`} onClick={() => switchMode('login')}>Sign In</button>
                <button className={`auth-nav-tab ${mode === 'register' ? 'active' : ''}`} onClick={() => switchMode('register')}>Create Account</button>
              </div>
            )}

            {error && <div className="auth-alert error">{error}</div>}
            {success && <div className="auth-alert success">{success}</div>}

            {/* Step 1 of Create Account: two toggle buttons */}
            {needsRole ? (
              <div className="role-choose">
                <p className="modal-hint">How will you use TalentBridge?</p>
                <button className="role-card" onClick={() => setRole('jobseeker')}>
                  <span className="role-emoji">👤</span><b>I'm a Job Seeker</b><small>Build a resume and apply to jobs</small>
                </button>
                <button className="role-card" onClick={() => setRole('recruiter')}>
                  <span className="role-emoji">🏢</span><b>I'm a Recruiter</b><small>Post roles and find candidates</small>
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="form-stack">
                {mode === 'register' && (
                  <div className="role-toggle">
                    <button type="button" className={`role-btn ${role === 'jobseeker' ? 'active' : ''}`} onClick={() => setRole('jobseeker')}>👤 Job Seeker</button>
                    <button type="button" className={`role-btn ${role === 'recruiter' ? 'active' : ''}`} onClick={() => setRole('recruiter')}>🏢 Recruiter</button>
                  </div>
                )}

                {mode === 'register' && (
                  <Field label="Full Name" type="text" name="name" required placeholder="John Doe" value={formData.name} onChange={handleInputChange} />
                )}
                {(mode === 'login' || mode === 'register' || mode === 'forgot') && (
                  <Field label="Email Address" type="email" name="email" required placeholder="you@example.com" value={formData.email} onChange={handleInputChange} />
                )}
                {(mode === 'login' || mode === 'register') && (
                  <Field label={mode === 'register' ? 'Password (min 6 characters)' : 'Password'} type="password" name="password" required minLength={mode === 'register' ? 6 : undefined} placeholder="••••••••" value={formData.password} onChange={handleInputChange} />
                )}
                {mode === 'register' && role === 'recruiter' && (
                  <>
                    <Field label="Company Name *" type="text" name="companyName" required placeholder="Acme Technologies" value={formData.companyName} onChange={handleInputChange} />
                    <Field label="Company Website (optional)" type="url" name="companyWebsite" placeholder="https://acme.com" value={formData.companyWebsite} onChange={handleInputChange} />
                  </>
                )}
                {mode === 'reset' && (
                  <>
                    <Field label="Reset Token" type="text" name="resetToken" required value={formData.resetToken} onChange={handleInputChange} />
                    <Field label="New Password (min 6 characters)" type="password" name="newPassword" required minLength={6} placeholder="••••••••" value={formData.newPassword} onChange={handleInputChange} />
                  </>
                )}

                {mode === 'login' && (
                  <div className="form-extra">
                    <button type="button" className="link-btn" onClick={() => switchMode('forgot')}>Forgot Password?</button>
                  </div>
                )}

                <button type="submit" className="btn-submit" disabled={loading}>
                  {loading ? 'Please wait...' : {
                    login: 'Sign In', register: `Register as ${roleLabel}`,
                    forgot: 'Send Password Reset Link', reset: 'Update Password & Sign In',
                  }[mode]}
                </button>

                {(mode === 'forgot' || mode === 'reset') && (
                  <button type="button" className="link-btn center" onClick={() => switchMode('login')}>&larr; Back to Sign In</button>
                )}

                {showGoogle && (
                  <>
                    <div className="auth-divider"><span>Or continue with</span></div>
                    <div className="google-btn-wrapper" ref={googleBtnRef}></div>
                  </>
                )}
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* Blurry background plant (soft out-of-focus leaves) */
function Plant() {
  return (
    <svg className="plant" viewBox="0 0 300 520" aria-hidden="true">
      <defs><filter id="blur"><feGaussianBlur stdDeviation="7" /></filter></defs>
      <g filter="url(#blur)" fill="#3f6b4f">
        <path d="M20 520 C30 380 60 260 150 150 C140 260 110 400 90 520Z" opacity=".75" />
        <path d="M60 520 C90 400 170 300 280 250 C220 330 160 420 130 520Z" opacity=".6" fill="#5a8a64" />
        <path d="M0 400 C20 300 70 220 130 190 C110 270 70 340 40 420Z" opacity=".55" fill="#2f5a40" />
        <path d="M100 520 C130 430 200 380 260 370 C220 430 180 480 160 520Z" opacity=".5" fill="#6f9c78" />
      </g>
    </svg>
  );
}
