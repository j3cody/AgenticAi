/**
 * MoodAnalytics — Solace
 * Professional analytics dashboard with mood pattern visualization
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMoodHistory, getChatHistory } from '../services/api';

/* ── Chart Helpers ──────────────────────────────────────────── */

const MOOD_CONFIG = {
  calm:      { color: '#7ecfa0', label: 'Calm',      icon: '●' },
  hopeful:   { color: '#8aaddb', label: 'Hopeful',   icon: '◉' },
  neutral:   { color: '#c8bc98', label: 'Neutral',    icon: '○' },
  anxious:   { color: '#d4ac60', label: 'Anxious',   icon: '▲' },
  sad:       { color: '#8898cc', label: 'Sad',        icon: '▼' },
  stressed:  { color: '#db8888', label: 'Stressed',   icon: '◆' },
  angry:     { color: '#e08070', label: 'Angry',      icon: '■' },
  happy:     { color: '#8aaddb', label: 'Happy',     icon: '✦' },
  overwhelmed:{ color: '#db8888', label: 'Overwhelmed', icon: '★' },
};

const POLAR_COLORS = ['#c8a882','#7ecfa0','#8aaddb','#c8bc98','#d4ac60','#8898cc','#db8888'];

// ── Line/Area Chart ────────────────────────────────────────────
const TrendChart = ({ data }) => {
  if (!data || data.length === 0) return null;

  const W = 800, H = 220, PAD = { top: 20, right: 30, bottom: 40, left: 50 };
  const cW = W - PAD.left - PAD.right;
  const cH = H - PAD.top - PAD.bottom;

  const moodOrder = ['stressed','anxious','angry','sad','neutral','overwhelmed','hopeful','calm'];
  const moodScore = { calm: 9, hopeful: 7, neutral: 5, anxious: 3, sad: 2, stressed: 1, angry: 1, overwhelmed: 2, happy: 7 };

  const validData = data.map(d => ({
    date: new Date(d.date || d._id),
    score: moodScore[d._id] || 5,
    count: d.count,
    confidence: d.avgConfidence || 0.5,
  })).filter(d => !isNaN(d.date));

  if (validData.length === 0) return null;

  const sorted = [...validData].sort((a, b) => a.date - b.date);
  const minDate = sorted[0].date;
  const maxDate = sorted[sorted.length - 1].date;
  const range = maxDate - minDate || 1;

  const pts = sorted.map(d => ({
    x: PAD.left + ((d.date - minDate) / range) * cW,
    y: PAD.top + cH - ((d.score - 1) / 8) * cH,
    ...d,
  }));

  // Smooth curve path
  const linePath = pts.reduce((acc, pt, i) => {
    if (i === 0) return `M ${pt.x},${pt.y}`;
    const prev = pts[i - 1];
    const cpX = (prev.x + pt.x) / 2;
    return `${acc} C ${cpX},${prev.y} ${cpX},${pt.y} ${pt.x},${pt.y}`;
  }, '');

  const areaPath = `${linePath} L ${pts[pts.length - 1].x},${PAD.top + cH} L ${pts[0].x},${PAD.top + cH} Z`;

  // Y axis labels
  const yLabels = [1, 3, 5, 7, 9];
  const yLabelsText = ['Stressed', 'Anxious', 'Neutral', 'Hopeful', 'Calm'];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c8a882" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#c8a882" stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {/* Grid lines */}
      {yLabels.map((v, i) => {
        const y = PAD.top + cH - ((v - 1) / 8) * cH;
        return (
          <g key={v}>
            <line x1={PAD.left} y1={y} x2={PAD.left + cW} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
            <text x={PAD.left - 10} y={y + 4} textAnchor="end" fontSize="10" fill="#5a5652" fontFamily="Outfit">{yLabelsText[i]}</text>
          </g>
        );
      })}

      {/* X axis */}
      <line x1={PAD.left} y1={PAD.top + cH} x2={PAD.left + cW} y2={PAD.top + cH} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
      {pts.length <= 7 && pts.map((pt, i) => (
        <text key={i} x={pt.x} y={PAD.top + cH + 18} textAnchor="middle" fontSize="10" fill="#5a5652" fontFamily="Outfit">
          {pt.date.toLocaleDateString([], { month: 'short', day: 'numeric' })}
        </text>
      ))}

      {/* Area fill */}
      <path d={areaPath} fill="url(#areaGrad)" />

      {/* Line */}
      <path d={linePath} fill="none" stroke="#c8a882" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

      {/* Dots */}
      {pts.map((pt, i) => (
        <circle key={i} cx={pt.x} cy={pt.y} r="4" fill="#0d1017" stroke="#c8a882" strokeWidth="2" />
      ))}
    </svg>
  );
};

// ── Horizontal Bar Chart ────────────────────────────────────────
const DistributionChart = ({ data }) => {
  if (!data || data.length === 0) return null;

  const maxCount = Math.max(...data.map(d => d.count), 1);
  const BAR_H = 36, GAP = 10;
  const totalH = data.length * (BAR_H + GAP) + 20;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: GAP }}>
      {data.map((item, i) => {
        const cfg = MOOD_CONFIG[item._id] || { color: '#c8bc98', label: item._id };
        const pct = (item.count / maxCount) * 100;
        return (
          <div key={i}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-body)' }}>{cfg.label}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>{item.count} entries</span>
                <span style={{ fontSize: 11, color: cfg.color, fontWeight: 700 }}>{((item.avgConfidence || 0.5) * 100).toFixed(0)}%</span>
              </div>
            </div>
            <div style={{ height: BAR_H, background: 'var(--bg-elevated)', borderRadius: 8, overflow: 'hidden', position: 'relative' }}>
              <div
                style={{
                  height: '100%',
                  width: `${pct}%`,
                  background: cfg.color,
                  opacity: 0.85,
                  borderRadius: 8,
                  transition: 'width 0.6s var(--ease)',
                }}
              />
              <div
                style={{
                  position: 'absolute', top: 0, right: 0, height: '100%',
                  width: `${100 - pct}%`,
                  background: 'rgba(255,255,255,0.03)',
                  borderLeft: '1px solid rgba(255,255,255,0.05)',
                  borderRadius: '0 8px 8px 0',
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ── Polar / Radar Chart ─────────────────────────────────────────
const PolarChart = ({ data }) => {
  if (!data || data.length === 0) return null;

  const CX = 160, CY = 160, R = 130;
  const slices = Math.min(data.length, 8);
  const angleStep = (Math.PI * 2) / slices;
  const maxCount = Math.max(...data.map(d => d.count), 1);

  const points = data.slice(0, slices).map((item, i) => {
    const angle = i * angleStep - Math.PI / 2;
    const radius = (item.count / maxCount) * R;
    return {
      x: CX + radius * Math.cos(angle),
      y: CY + radius * Math.sin(angle),
      item,
      angle,
    };
  });

  const closedPts = points.map(p => `${p.x},${p.y}`).join(' ');
  const gridR = [0.25, 0.5, 0.75, 1].map(f => f * R);

  return (
    <svg viewBox="0 0 320 320" style={{ width: '100%', maxWidth: 320, height: 'auto' }}>
      {/* Grid rings */}
      {gridR.map((r, i) => (
        <polygon
          key={i}
          points={Array.from({ length: slices }, (_, j) => {
            const a = j * angleStep - Math.PI / 2;
            return `${CX + r * Math.cos(a)},${CY + r * Math.sin(a)}`;
          }).join(' ')}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="1"
        />
      ))}

      {/* Axes */}
      {points.map((p, i) => (
        <line
          key={i}
          x1={CX} y1={CY}
          x2={p.x} y2={p.y}
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="1"
        />
      ))}

      {/* Data polygon */}
      <polygon
        points={closedPts}
        fill="rgba(200,168,130,0.12)"
        stroke="#c8a882"
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {/* Fill nodes */}
      {points.map((p, i) => {
        const cfg = MOOD_CONFIG[p.item._id] || { color: '#c8bc98', label: p.item._id };
        return (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="6" fill="#0d1017" stroke={cfg.color} strokeWidth="2.5" />
            <text
              x={CX + (R + 22) * Math.cos(p.angle)}
              y={CY + (R + 22) * Math.sin(p.angle)}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="11"
              fill={cfg.color}
              fontFamily="Outfit"
              fontWeight="600"
            >
              {cfg.label}
            </text>
          </g>
        );
      })}

      {/* Center dot */}
      <circle cx={CX} cy={CY} r="3" fill="#c8a882" opacity="0.6" />
    </svg>
  );
};

// ── Sparkline Row ────────────────────────────────────────────────
const SparklineRow = ({ label, value, sub, color, pct }) => (
  <div style={{
    flex: 1,
    padding: '16px 18px',
    borderRadius: 'var(--r-md)',
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border-subtle)',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    minWidth: 0,
  }}>
    <p className="t-label">{label}</p>
    <p className="f-display" style={{ fontSize: 28, color: color || 'var(--text-primary)', lineHeight: 1 }}>{value}</p>
    {sub && <p style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 2 }}>{sub}</p>}
  </div>
);

/* ── Main Component ───────────────────────────────────────────── */
const MoodAnalytics = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [moodHistory, setMoodHistory] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState(7);

  useEffect(() => { if (!isAuthenticated) navigate('/'); }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    Promise.all([
      getMoodHistory(period),
      getChatHistory(30),
    ]).then(([moodRes, chatRes]) => {
      if (moodRes.success) setMoodHistory(moodRes.data.distribution || []);
      if (chatRes.success) setChatHistory(chatRes.data.chats || []);
    }).catch(() => {}).finally(() => setIsLoading(false));
  }, [isAuthenticated, period]);

  if (!isAuthenticated) return null;

  // Derive metrics
  const totalSessions = chatHistory.length;
  const totalEntries = moodHistory.reduce((s, d) => s + d.count, 0);
  const avgConfidence = moodHistory.length > 0
    ? (moodHistory.reduce((s, d) => s + (d.avgConfidence || 0.5) * d.count, 0) / totalEntries * 100).toFixed(0)
    : 0;
  const dominantMood = moodHistory.length > 0
    ? moodHistory.sort((a, b) => b.count - a.count)[0]
    : null;
  const dominantCfg = dominantMood ? (MOOD_CONFIG[dominantMood._id] || { label: dominantMood._id, color: '#c8bc98' }) : null;

  // Time-series data for last N days
  const trendData = moodHistory; // distribution doubles as time-series proxy

  return (
    <div style={{
      height: 'calc(100vh - 62px)',
      background: 'var(--bg-base)',
      overflowY: 'auto',
    }}>
      {/* ── Page header ─────────────────────────── */}
      <div style={{
        background: 'var(--bg-raised)',
        borderBottom: '1px solid var(--border-faint)',
        padding: '24px 36px',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16,
      }}>
        <div>
          <p className="t-label" style={{ marginBottom: 6 }}>Emotional insights</p>
          <h1 className="f-display" style={{ fontSize: 'clamp(22px, 3vw, 34px)', color: 'var(--text-primary)', lineHeight: 1.1 }}>
            Your mood patterns
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 8, lineHeight: 1.6, maxWidth: 520 }}>
            A thoughtful overview of your emotional patterns over time — built from your conversations.
          </p>
        </div>

        {/* Period selector */}
        <div style={{ display: 'flex', gap: 6, padding: '4px', background: 'var(--bg-elevated)', borderRadius: 99, border: '1px solid var(--border-subtle)' }}>
          {[7, 14, 30].map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              style={{
                padding: '7px 18px',
                borderRadius: 99,
                border: 'none',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: period === p ? 600 : 400,
                fontFamily: 'Outfit, sans-serif',
                background: period === p ? 'var(--accent)' : 'transparent',
                color: period === p ? '#0d1017' : 'var(--text-muted)',
                transition: 'all 0.15s var(--ease)',
              }}
            >
              {p}d
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ────────────────────────────── */}
      <div style={{ padding: '28px 36px', maxWidth: 1200, margin: '0 auto' }}>

        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
            <div className="spinner" />
          </div>
        ) : moodHistory.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <p className="f-display" style={{ fontSize: 24, color: 'var(--text-muted)', marginBottom: 12 }}>
              No data yet
            </p>
            <p style={{ fontSize: 14, color: 'var(--text-faint)', lineHeight: 1.7 }}>
              Mood patterns emerge after a few conversations. Start chatting to build your emotional picture.
            </p>
          </div>
        ) : (
          <>
            {/* ── KPI Cards ───────────────────────── */}
            <div style={{ display: 'flex', gap: 14, marginBottom: 28, flexWrap: 'wrap' }}>
              <SparklineRow label="Sessions" value={totalSessions} sub={`last ${period} days`} color="var(--text-primary)" />
              <SparklineRow label="Mood entries" value={totalEntries} sub="logged interactions" color="var(--text-primary)" />
              <SparklineRow label="Dominant mood" value={dominantCfg?.label || '—'} sub={dominantMood ? `${dominantMood.count} entries` : ''} color={dominantCfg?.color || 'var(--text-primary)'} />
              <SparklineRow label="Avg confidence" value={`${avgConfidence}%`} sub="emotion detection" color="var(--accent)" />
            </div>

            {/* ── Charts Grid ─────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}
                 className="analytics-grid">

              {/* Trend chart — full width on analytics-grid */}
              <div style={{
                gridColumn: '1 / -1',
                background: 'var(--bg-raised)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--r-lg)',
                padding: '24px 28px',
              }}>
                <p className="t-label" style={{ marginBottom: 4 }}>Emotional wellbeing trend</p>
                <h2 className="f-display" style={{ fontSize: 20, color: 'var(--text-primary)', marginBottom: 20 }}>
                  How your mood has shifted
                </h2>
                <TrendChart data={trendData} />
              </div>

              {/* Distribution */}
              <div style={{
                background: 'var(--bg-raised)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--r-lg)',
                padding: '24px 28px',
              }}>
                <p className="t-label" style={{ marginBottom: 4 }}>Mood distribution</p>
                <h2 className="f-display" style={{ fontSize: 20, color: 'var(--text-primary)', marginBottom: 20 }}>
                  What you've been feeling
                </h2>
                <DistributionChart data={[...moodHistory].sort((a, b) => b.count - a.count)} />
              </div>

              {/* Radar / Polar */}
              <div style={{
                background: 'var(--bg-raised)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--r-lg)',
                padding: '24px 28px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}>
                <p className="t-label" style={{ marginBottom: 4, alignSelf: 'flex-start' }}>Emotional balance</p>
                <h2 className="f-display" style={{ fontSize: 20, color: 'var(--text-primary)', marginBottom: 8, alignSelf: 'flex-start' }}>
                  Your emotional compass
                </h2>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                  <PolarChart data={moodHistory} />
                </div>
              </div>
            </div>

            {/* ── Mood Legend ──────────────────────── */}
            <div style={{
              background: 'var(--bg-raised)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--r-lg)',
              padding: '20px 24px',
            }}>
              <p className="t-label" style={{ marginBottom: 14 }}>Mood palette</p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {Object.entries(MOOD_CONFIG).map(([key, cfg]) => (
                  <div key={key} style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '5px 12px',
                    borderRadius: 99,
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-faint)',
                  }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.color }} />
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'Outfit' }}>{cfg.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      <style>{`
        @media (max-width: 900px) {
          .analytics-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};

export default MoodAnalytics;