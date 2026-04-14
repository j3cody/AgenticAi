import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/'); };

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'rgba(13,16,23,0.88)',
        backdropFilter: 'blur(20px) saturate(1.4)',
        WebkitBackdropFilter: 'blur(20px) saturate(1.4)',
        borderBottom: '1px solid var(--border-faint)',
      }}
    >
      <div
        style={{
          maxWidth: 1600,
          margin: '0 auto',
          padding: '0 28px',
          height: 62,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 24,
        }}
      >
        {/* Brand */}
        <Link to={isAuthenticated ? '/home' : '/'} style={{ textDecoration: 'none', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: 'var(--accent-bg)',
                border: '1px solid rgba(200,168,130,0.22)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent)',
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </div>
            <div>
              <span
                className="f-display"
                style={{ fontSize: 19, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1 }}
              >
                Solace
              </span>
            </div>
          </div>
        </Link>

        {/* Centre nav */}
        {isAuthenticated && (
          <nav style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <NavLink to="/home" className={({ isActive }) => `nav-link f-ui${isActive ? ' active' : ''}`}>
              Overview
            </NavLink>
            <NavLink to="/chat" className={({ isActive }) => `nav-link f-ui${isActive ? ' active' : ''}`}>
              Conversations
            </NavLink>
          </nav>
        )}

        {/* Right */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {isAuthenticated ? (
            <>
              {/* Avatar + name */}
              <div
                className="f-ui"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '4px 10px 4px 4px',
                  borderRadius: 99,
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-raised)',
                }}
              >
                <div
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: '50%',
                    background: 'var(--accent-bg)',
                    border: '1px solid rgba(200,168,130,0.22)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 10,
                    fontWeight: 700,
                    color: 'var(--accent)',
                    flexShrink: 0,
                  }}
                >
                  {initials}
                </div>
                <span style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--text-body)', maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user?.name || 'User'}
                </span>
              </div>

              <button onClick={handleLogout} className="btn btn-ghost f-ui" style={{ fontSize: 13.5 }}>
                Sign out
              </button>
            </>
          ) : (
            <nav style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <NavLink to="/" className={({ isActive }) => `nav-link f-ui${isActive ? ' active' : ''}`}>
                Sign in
              </NavLink>
              <NavLink
                to="/signup"
                className="btn btn-primary f-ui"
                style={{ textDecoration: 'none', borderRadius: 99, padding: '7px 20px', fontSize: 13.5 }}
              >
                Get started
              </NavLink>
            </nav>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
