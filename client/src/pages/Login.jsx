/**
 * Login Page — Solace
 * Split-screen editorial layout
 */

import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const successMessage = location.state?.message || '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!identifier || !password) { setError('Please fill in all fields'); return; }
    setLoading(true);
    try {
      const result = await login(identifier, password);
      if (result.success) { navigate('/home'); }
      else { setError(result.message || 'Sign in failed'); }
    } catch (_) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="f-ui"
      style={{
        minHeight: '100vh',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        background: 'var(--bg-base)',
      }}
    >
      {/* ── Left panel — brand / editorial ─────────────────── */}
      <div
        className="anim-0"
        style={{
          padding: '60px 64px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: 'var(--bg-raised)',
          borderRight: '1px solid var(--border-faint)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative circle */}
        <div
          style={{
            position: 'absolute',
            top: -120,
            right: -120,
            width: 380,
            height: 380,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(107,143,113,0.09) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -80,
            left: -80,
            width: 280,
            height: 280,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(200,168,130,0.07) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative' }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 9,
              background: 'var(--accent-bg)',
              border: '1px solid rgba(200,168,130,0.22)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent)',
            }}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </div>
          <span className="f-display" style={{ fontSize: 22, color: 'var(--text-primary)' }}>Solace</span>
        </div>

        {/* Main editorial text */}
        <div style={{ position: 'relative', maxWidth: 440 }}>
          <p className="t-label" style={{ marginBottom: 20, color: 'var(--sage-bright)' }}>Mental Wellness Support</p>
          <h1
            className="f-display t-hero"
            style={{ marginBottom: 28 }}
          >
            A space to be honest with yourself.
          </h1>
          <p
            style={{
              fontSize: 17,
              lineHeight: 1.75,
              color: 'var(--text-muted)',
              marginBottom: 40,
            }}
          >
            Solace is a private, reflective space where you can share what's weighing on you, explore patterns in how you feel, and move forward with calm, practical support.
          </p>

          {/* Three pillars */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { label: 'Private & persistent', desc: 'Conversations are saved and always yours' },
              { label: 'Emotionally aware', desc: 'The assistant reads your state, not just your words' },
              { label: 'Crisis-aware', desc: 'Safety resources surface when it matters most' },
            ].map(({ label, desc }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: 'var(--accent)',
                    flexShrink: 0,
                    marginTop: 7,
                  }}
                />
                <div>
                  <span style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--text-primary)' }}>{label}</span>
                  <span style={{ fontSize: 14, color: 'var(--text-muted)', marginLeft: 8 }}>{desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer note */}
        <p style={{ fontSize: 12.5, color: 'var(--text-faint)', lineHeight: 1.65, position: 'relative' }}>
          Solace is not a substitute for professional mental health care.<br />
          If you're in crisis, call or text <strong style={{ color: 'var(--accent)' }}>988</strong> immediately.
        </p>
      </div>

      {/* ── Right panel — form ──────────────────────────────── */}
      <div
        className="anim-1"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px 48px',
        }}
      >
        <div style={{ width: '100%', maxWidth: 420 }}>
          <div style={{ marginBottom: 40 }}>
            <h2
              className="f-display"
              style={{ fontSize: 36, color: 'var(--text-primary)', marginBottom: 8 }}
            >
              Welcome back.
            </h2>
            <p style={{ fontSize: 16, color: 'var(--text-muted)' }}>
              Sign in to continue where you left off.
            </p>
          </div>

          {/* Success message */}
          {successMessage && (
            <div
              className="anim-in"
              style={{
                padding: '12px 16px',
                borderRadius: 'var(--r-md)',
                background: 'var(--status-ok)',
                border: '1px solid rgba(80,160,100,0.20)',
                color: 'var(--status-ok-text)',
                fontSize: 14,
                marginBottom: 20,
              }}
            >
              {successMessage}
            </div>
          )}

          {/* Error */}
          {error && (
            <div
              className="anim-in"
              style={{
                padding: '12px 16px',
                borderRadius: 'var(--r-md)',
                background: 'var(--status-danger)',
                border: '1px solid rgba(190,70,60,0.22)',
                color: 'var(--status-danger-text)',
                fontSize: 14,
                marginBottom: 20,
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label
                htmlFor="identifier"
                style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 7, letterSpacing: 0.02 }}
              >
                Email or username
              </label>
              <input
                id="identifier"
                type="text"
                className="input"
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                placeholder="you@example.com"
                disabled={loading}
                required
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
                <label
                  htmlFor="password"
                  style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: 0.02 }}
                >
                  Password
                </label>
              </div>
              <input
                id="password"
                type="password"
                className="input"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password"
                disabled={loading}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary f-ui"
              style={{ width: '100%', padding: '13px 24px', fontSize: 15, borderRadius: 'var(--r-md)', marginTop: 4 }}
            >
              {loading ? (
                <>
                  <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                  Signing in…
                </>
              ) : 'Sign in'}
            </button>
          </form>

          <p style={{ marginTop: 28, fontSize: 14.5, color: 'var(--text-muted)', textAlign: 'center' }}>
            New to Solace?{' '}
            <Link to="/signup" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>
              Create an account
            </Link>
          </p>

          {/* Divider */}
          <div
            style={{
              marginTop: 36,
              padding: '16px 20px',
              borderRadius: 'var(--r-md)',
              background: 'var(--bg-raised)',
              border: '1px solid var(--border-faint)',
            }}
          >
            <p style={{ fontSize: 12.5, color: 'var(--text-faint)', lineHeight: 1.6 }}>
              Your conversations are stored securely and never shared. Solace is built for reflection, not surveillance.
            </p>
          </div>
        </div>
      </div>

      {/* Responsive */}
      <style>{`
        @media (max-width: 820px) {
          .login-grid { grid-template-columns: 1fr !important; }
          .login-left  { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default Login;
