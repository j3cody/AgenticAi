/**
 * Signup Page — Solace
 * Two-column editorial layout — mirror of login
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Signup = () => {
  const [name, setName]                     = useState('');
  const [email, setEmail]                   = useState('');
  const [password, setPassword]             = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading]               = useState(false);
  const [error, setError]                   = useState('');

  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!name || !email || !password || !confirmPassword) { setError('Please fill in all fields'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }

    setLoading(true);
    try {
      const result = await signup(name, email, password);
      if (result.success) {
        navigate('/', { replace: true, state: { message: result.message || 'Account created. Please sign in.' } });
      } else {
        setError(result.message || 'Registration failed');
      }
    } catch (_) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const Field = ({ id, label, type = 'text', value, onChange, placeholder }) => (
    <div>
      <label
        htmlFor={id}
        style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 7, letterSpacing: 0.02 }}
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        className="input"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={loading}
        required
      />
    </div>
  );

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
      {/* ── Left — form ──────────────────────────────────────── */}
      <div
        className="anim-0"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px 48px',
          borderRight: '1px solid var(--border-faint)',
        }}
      >
        <div style={{ width: '100%', maxWidth: 440 }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 44 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                background: 'var(--accent-bg)',
                border: '1px solid rgba(200,168,130,0.22)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent)',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </div>
            <span className="f-display" style={{ fontSize: 20, color: 'var(--text-primary)' }}>Solace</span>
          </div>

          <div style={{ marginBottom: 32 }}>
            <h2
              className="f-display"
              style={{ fontSize: 36, color: 'var(--text-primary)', marginBottom: 8, lineHeight: 1.1 }}
            >
              Create your account.
            </h2>
            <p style={{ fontSize: 16, color: 'var(--text-muted)' }}>
              It takes less than a minute.
            </p>
          </div>

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

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Field id="name" label="Full name" value={name} onChange={setName} placeholder="Your name" />
            <Field id="email" label="Email address" type="email" value={email} onChange={setEmail} placeholder="you@example.com" />
            <Field id="password" label="Password" type="password" value={password} onChange={setPassword} placeholder="Minimum 6 characters" />
            <Field id="confirmPassword" label="Confirm password" type="password" value={confirmPassword} onChange={setConfirmPassword} placeholder="Repeat your password" />

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary f-ui"
              style={{ width: '100%', padding: '13px 24px', fontSize: 15, borderRadius: 'var(--r-md)', marginTop: 6 }}
            >
              {loading ? (
                <>
                  <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                  Creating account…
                </>
              ) : 'Create account'}
            </button>
          </form>

          <p style={{ marginTop: 26, fontSize: 14.5, color: 'var(--text-muted)', textAlign: 'center' }}>
            Already have an account?{' '}
            <Link to="/" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>
              Sign in
            </Link>
          </p>

          <p style={{ marginTop: 28, fontSize: 12.5, color: 'var(--text-faint)', lineHeight: 1.65, textAlign: 'center' }}>
            By creating an account you agree to use Solace responsibly.<br />
            This is not a substitute for professional mental health care.
          </p>
        </div>
      </div>

      {/* ── Right — editorial ─────────────────────────────────── */}
      <div
        className="anim-1"
        style={{
          padding: '60px 64px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative circles */}
        <div style={{ position: 'absolute', top: -100, left: -100, width: 340, height: 340, borderRadius: '50%', background: 'radial-gradient(circle, rgba(200,168,130,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -80, right: -80, width: 260, height: 260, borderRadius: '50%', background: 'radial-gradient(circle, rgba(107,143,113,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', maxWidth: 480 }}>
          <p className="t-label" style={{ marginBottom: 20, color: 'var(--sage-bright)' }}>Why Solace</p>
          <h2
            className="f-display t-h1"
            style={{ marginBottom: 28, color: 'var(--text-primary)' }}
          >
            Designed around your emotional reality.
          </h2>
          <p style={{ fontSize: 17, lineHeight: 1.75, color: 'var(--text-muted)', marginBottom: 48 }}>
            Most tools are built for productivity. Solace is built for the moments when productivity is the last thing on your mind  when you need clarity, not another to-do list.
          </p>

          {/* Quote-style feature blocks */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {[
              {
                title: 'Your data stays yours',
                body: 'Conversations are stored securely and never used to train models or shared with third parties.',
                icon: (
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                ),
              },
              {
                title: 'Honest, grounded responses',
                body: 'No toxic positivity. Warm, practical support that meets you where you actually are.',
                icon: (
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                ),
              },
              {
                title: 'Patterns over time',
                body: 'Mood tracking surfaces emotional themes across sessions so you can see yourself more clearly.',
                icon: (
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                  </svg>
                ),
              },
            ].map(({ title, body, icon }) => (
              <div key={title} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 9,
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--accent)',
                    flexShrink: 0,
                  }}
                >
                  {icon}
                </div>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 5 }}>{title}</p>
                  <p style={{ fontSize: 14, lineHeight: 1.65, color: 'var(--text-muted)' }}>{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 820px) {
          .signup-grid { grid-template-columns: 1fr !important; }
          .signup-right { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default Signup;
