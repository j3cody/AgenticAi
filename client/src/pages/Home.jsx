/**
 * Home Dashboard — Solace
 * Full-viewport authenticated workspace
 */

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getChatHistory, getMoodHistory } from '../services/api';

const MOOD_LABELS = {
  happy: 'Bright', sad: 'Low', anxious: 'Anxious', angry: 'Tense',
  stressed: 'Stressed', hopeful: 'Hopeful', confused: 'Unclear',
  overwhelmed: 'Overwhelmed', calm: 'Calm', neutral: 'Steady',
};

const getMoodClass = (m) => {
  const map = { calm:'calm',hopeful:'hopeful',neutral:'neutral',anxious:'anxious',sad:'sad',stressed:'stressed',angry:'angry',happy:'hopeful',overwhelmed:'stressed' };
  return map[m] || '';
};

const formatDate = (v) => {
  if (!v) return '';
  const d = new Date(v), now = new Date();
  if (d.toDateString() === now.toDateString()) return 'Today, ' + d.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });
  const diff = Math.floor((now - d) / 86400000);
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return `${diff} days ago`;
  return d.toLocaleDateString([], { day:'2-digit', month:'short', year:'numeric' });
};

const getGreeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
};

/* ─── Stat ───────────────────────────────────────────────────── */
const Stat = ({ value, label, sub, delay = 0 }) => (
  <div className={`card anim-${delay}`} style={{ padding: '24px 28px' }}>
    <p className="t-label" style={{ marginBottom: 12 }}>{label}</p>
    <p className="f-display" style={{ fontSize: 44, lineHeight: 1, color: 'var(--text-primary)' }}>{value}</p>
    {sub && <p style={{ fontSize: 13, color: 'var(--text-faint)', marginTop: 8 }}>{sub}</p>}
  </div>
);

/* ─── Section heading ────────────────────────────────────────── */
const SH = ({ label, action }) => (
  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 18 }}>
    <p className="t-label">{label}</p>
    {action}
  </div>
);

const Home = () => {
  const { user } = useAuth();
  const [chatHistory, setChatHistory] = useState([]);
  const [moodHistory, setMoodHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [c, m] = await Promise.all([getChatHistory(6), getMoodHistory(7)]);
        setChatHistory(c?.data?.chats || []);
        setMoodHistory(m?.data?.distribution || []);
      } catch (_) {}
      finally { setLoading(false); }
    })();
  }, []);

  const totalMessages = chatHistory.reduce((a, c) => a + (c.messageCount || 0), 0);
  const topMood = moodHistory[0];

  return (
    <div style={{ minHeight: 'calc(100vh - 62px)', background: 'var(--bg-base)' }}>

      {/* ── Hero strip ────────────────────────────────────────── */}
      <div
        className="anim-0"
        style={{
          background: 'var(--bg-raised)',
          borderBottom: '1px solid var(--border-faint)',
          padding: '52px 48px 48px',
        }}
      >
        <div style={{ maxWidth: 1600, margin: '0 auto', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24 }}>
          <div>
            <p className="t-label" style={{ marginBottom: 14, color: 'var(--sage-bright)' }}>{getGreeting()}</p>
            <h1
              className="f-display t-hero"
              style={{ color: 'var(--text-primary)', marginBottom: 16, maxWidth: 700 }}
            >
              {user?.name ? `Welcome back, ${user.name.split(' ')[0]}.` : 'Welcome back.'}
            </h1>
            <p style={{ fontSize: 18, color: 'var(--text-muted)', lineHeight: 1.7, maxWidth: 560 }}>
              Your private space for reflection, support, and steady progress.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link to="/chat" style={{ textDecoration: 'none' }}>
              <button className="btn btn-primary f-ui" style={{ fontSize: 15, padding: '13px 28px' }}>
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
                New conversation
              </button>
            </Link>
            <Link to="/chat" style={{ textDecoration: 'none' }}>
              <button className="btn btn-secondary f-ui" style={{ fontSize: 15, padding: '13px 28px' }}>
                Continue last session
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* ── Main content ──────────────────────────────────────── */}
      <div style={{ maxWidth: 1600, margin: '0 auto', padding: '40px 48px 60px' }}>

        {/* Stats row */}
        {!loading && (
          <div
            className="anim-1"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 16,
              marginBottom: 40,
            }}
          >
            <Stat value={chatHistory.length} label="Total sessions" sub="Saved conversations" delay={1} />
            <Stat value={totalMessages} label="Messages exchanged" sub="Across all sessions" delay={2} />
            <Stat value={moodHistory.length > 0 ? moodHistory.length : '—'} label="Mood patterns" sub="Past 7 days" delay={3} />
            <Stat
              value={topMood ? (MOOD_LABELS[topMood._id] || topMood._id) : '—'}
              label="Leading mood"
              sub={topMood ? `${topMood.count}× this week` : 'Start chatting to see'}
              delay={4}
            />
          </div>
        )}

        {/* Two-column layout */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) 380px',
            gap: 24,
            alignItems: 'start',
          }}
          className="home-grid"
        >
          {/* Left */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* Quick actions */}
            <div className="card anim-2" style={{ padding: '30px 32px' }}>
              <SH label="Quick actions" />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                {[
                  {
                    to: '/chat',
                    title: 'Start fresh',
                    desc: 'Open a new conversation thread and share what\'s on your mind.',
                    accent: true,
                    icon: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>,
                  },
                  {
                    to: '/chat',
                    title: 'Continue session',
                    desc: 'Pick up your most recent conversation right where you left off.',
                    icon: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
                  },
                  {
                    to: '/mood-analytics',
                    title: 'View mood patterns',
                    desc: 'See the emotional themes that have surfaced across your sessions.',
                    icon: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>,
                  },
                ].map(({ to, title, desc, accent, icon }) => (
                  <Link key={title} to={to} style={{ textDecoration: 'none' }}>
                    <div
                      style={{
                        padding: '22px 24px',
                        borderRadius: 'var(--r-lg)',
                        background: accent ? 'var(--accent-bg)' : 'var(--bg-elevated)',
                        border: `1px solid ${accent ? 'rgba(200,168,130,0.22)' : 'var(--border-faint)'}`,
                        height: '100%',
                        cursor: 'pointer',
                        transition: 'all 0.18s var(--ease)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 14,
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = accent ? 'rgba(200,168,130,0.4)' : 'var(--border-muted)';
                        e.currentTarget.style.background = accent ? 'var(--accent-bg-hov)' : 'var(--bg-overlay)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = accent ? 'rgba(200,168,130,0.22)' : 'var(--border-faint)';
                        e.currentTarget.style.background = accent ? 'var(--accent-bg)' : 'var(--bg-elevated)';
                      }}
                    >
                      <div style={{ color: accent ? 'var(--accent)' : 'var(--text-muted)' }}>{icon}</div>
                      <div>
                        <p style={{ fontSize: 15.5, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>{title}</p>
                        <p style={{ fontSize: 13.5, color: 'var(--text-muted)', lineHeight: 1.6 }}>{desc}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Recent sessions */}
            <div className="card anim-3" style={{ padding: '30px 32px' }}>
              <SH
                label="Recent sessions"
                action={
                  chatHistory.length > 0 && (
                    <Link to="/chat" style={{ textDecoration: 'none' }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)', cursor: 'pointer' }}>
                        Open all →
                      </span>
                    </Link>
                  )
                }
              />

              {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '32px 0' }}>
                  <div className="spinner" />
                </div>
              ) : chatHistory.length > 0 ? (
                <div>
                  {/* Table header */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 100px 120px',
                      padding: '0 12px 10px',
                      borderBottom: '1px solid var(--border-faint)',
                      marginBottom: 6,
                    }}
                  >
                    {['Title', 'Messages', 'Last active'].map(h => (
                      <p key={h} style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-faint)' }}>{h}</p>
                    ))}
                  </div>
                  {chatHistory.map((chat, i) => (
                    <Link key={chat.id} to="/chat" style={{ textDecoration: 'none', display: 'block' }}>
                      <div
                        className="convo-item"
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 100px 120px',
                          alignItems: 'center',
                          padding: '11px 12px',
                          animationDelay: `${i * 0.05}s`,
                        }}
                      >
                        <p style={{ fontSize: 14.5, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 16 }}>
                          {chat.title || 'Untitled conversation'}
                        </p>
                        <p style={{ fontSize: 13.5, color: 'var(--text-muted)' }}>{chat.messageCount}</p>
                        <p style={{ fontSize: 13, color: 'var(--text-faint)' }}>
                          {formatDate(chat.lastMessage || chat.createdAt)}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '40px 24px', textAlign: 'center' }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-faint)', margin: '0 auto 16px' }}>
                    <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                  </div>
                  <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-body)', marginBottom: 8 }}>No sessions yet</p>
                  <p style={{ fontSize: 14, color: 'var(--text-faint)', marginBottom: 20 }}>Your conversations will appear here once you begin.</p>
                  <Link to="/chat" style={{ textDecoration: 'none' }}>
                    <button className="btn btn-secondary f-ui" style={{ fontSize: 14 }}>Start your first session</button>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Right column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Wellbeing snapshot */}
            <div className="card anim-2" style={{ padding: '28px 30px' }}>
              <SH label="Wellbeing snapshot · 7 days" />
              {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0' }}><div className="spinner" /></div>
              ) : moodHistory.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {moodHistory.slice(0, 6).map((item, i) => {
                    const pct = Math.min(100, Math.round((item.count / (moodHistory[0]?.count || 1)) * 100));
                    return (
                      <div key={i}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span className={`mood-tag ${getMoodClass(item._id)}`}>{MOOD_LABELS[item._id] || item._id}</span>
                            <span style={{ fontSize: 13.5, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{item._id}</span>
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-body)' }}>{item.count}×</span>
                        </div>
                        <div style={{ height: 3, borderRadius: 2, background: 'var(--bg-elevated)', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: 'var(--accent)', borderRadius: 2, transition: 'width 0.7s var(--ease)', opacity: 0.55 + (pct / 200) }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ padding: '24px 0', textAlign: 'center' }}>
                  <p style={{ fontSize: 14, color: 'var(--text-faint)', lineHeight: 1.7 }}>
                    Mood patterns will appear here after your first few conversations.
                  </p>
                </div>
              )}
            </div>

            {/* Crisis resources */}
            <div
              className="anim-3"
              style={{
                borderRadius: 'var(--r-lg)',
                border: '1px solid var(--border-subtle)',
                overflow: 'hidden',
              }}
            >
              <div style={{ padding: '14px 20px', background: 'var(--bg-raised)', borderBottom: '1px solid var(--border-faint)' }}>
                <p className="t-label">If you need immediate support</p>
              </div>
              <div style={{ padding: '18px 20px', background: 'var(--bg-elevated)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ padding: '14px 18px', borderRadius: 'var(--r-md)', background: 'rgba(200,168,130,0.08)', border: '1px solid rgba(200,168,130,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p className="t-label" style={{ color: 'var(--accent)', marginBottom: 6 }}>Call or text</p>
                    <p className="f-display" style={{ fontSize: 32, color: 'var(--text-primary)', lineHeight: 1 }}>988</p>
                    <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 4 }}>Suicide & Crisis Lifeline</p>
                  </div>
                  <svg width="22" height="22" fill="none" stroke="var(--accent)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" style={{ opacity: 0.5 }}>
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.58 1h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.96a16 16 0 0 0 6.13 6.13l1.27-.63a2 2 0 0 1 2.11.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                  </svg>
                </div>
                <div style={{ padding: '12px 16px', borderRadius: 'var(--r-md)', background: 'var(--sage-bg)', border: '1px solid rgba(107,143,113,0.20)' }}>
                  <p style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--sage-bright)', marginBottom: 5 }}>Crisis Text Line</p>
                  <p style={{ fontSize: 13.5, color: 'var(--text-muted)' }}>
                    Text <strong style={{ color: 'var(--text-body)' }}>HOME</strong> to <strong style={{ color: 'var(--text-body)' }}>741741</strong>
                  </p>
                </div>
                <p style={{ fontSize: 12.5, color: 'var(--text-faint)', lineHeight: 1.65 }}>
                  Solace is not a substitute for professional mental health care. These resources are available 24/7.
                </p>
              </div>
            </div>

            {/* About card */}
            <div
              className="anim-4"
              style={{
                padding: '20px 22px',
                borderRadius: 'var(--r-lg)',
                background: 'var(--bg-raised)',
                border: '1px solid var(--border-faint)',
              }}
            >
              <p className="t-label" style={{ marginBottom: 10 }}>About Solace</p>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.75 }}>
                Solace provides warm, reflective AI-powered support. Your conversations are private, persistent, and designed to help you understand yourself more clearly — not to diagnose or treat.
              </p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 1000px) {
          .home-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 780px) {
          .home-stats { grid-template-columns: repeat(2,1fr) !important; }
        }
      `}</style>
    </div>
  );
};

export default Home;
