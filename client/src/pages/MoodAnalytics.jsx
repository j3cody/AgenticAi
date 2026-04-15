/**
 * MoodAnalytics — Solace
 * "Emotional Weather Report" — structured emotional intelligence dashboard
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMoodHistory, getChatHistory } from '../services/api';

/* ─── Mood Config ──────────────────────────────────────────────── */
const MOOD_CONFIG = {
  calm:       { color: '#7ecfa0', label: 'Calm',       score: 9, tone: 'positive' },
  hopeful:    { color: '#8aaddb', label: 'Hopeful',    score: 8, tone: 'positive' },
  happy:      { color: '#91c8e8', label: 'Happy',      score: 8, tone: 'positive' },
  neutral:    { color: '#c8bc98', label: 'Neutral',    score: 5, tone: 'neutral' },
  confused:   { color: '#a7a1cf', label: 'Confused',   score: 4, tone: 'neutral' },
  anxious:    { color: '#d4ac60', label: 'Anxious',     score: 3, tone: 'negative' },
  sad:        { color: '#8898cc', label: 'Sad',         score: 2, tone: 'negative' },
  overwhelmed:{ color: '#d88e8e', label: 'Overwhelmed', score: 2, tone: 'negative' },
  stressed:   { color: '#db8888', label: 'Stressed',    score: 1, tone: 'negative' },
  angry:      { color: '#e08070', label: 'Angry',       score: 1, tone: 'negative' },
};

const PERIODS = [7, 14, 30];

const getMoodMeta = (mood) => MOOD_CONFIG[mood] || {
  color: '#c8bc98', label: mood || 'Unknown', score: 5, tone: 'neutral',
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const formatDay = (v) => new Date(v).toLocaleDateString([], { month: 'short', day: 'numeric' });
const formatPercent = (v) => `${Math.round(v)}%`;

/* ─── Metric helpers ──────────────────────────────────────────── */
const getAverageConfidence = (distribution, totalEntries) => {
  if (!totalEntries) return 0;
  const weighted = distribution.reduce((sum, item) => sum + (item.avgConfidence || 0) * item.count, 0);
  return Math.round((weighted / totalEntries) * 100);
};

const getToneShare = (distribution, tone, totalEntries) => {
  if (!totalEntries) return 0;
  const count = distribution.reduce((sum, item) => sum + (getMoodMeta(item._id).tone === tone ? item.count : 0), 0);
  return (count / totalEntries) * 100;
};

const getTrendDirection = (trend) => {
  if (trend.length < 2) return { label: 'Building a baseline', delta: 0, direction: 'stable' };
  const first = getMoodMeta(trend[0].primaryMood).score;
  const last  = getMoodMeta(trend[trend.length - 1].primaryMood).score;
  const delta = last - first;
  if (delta >= 2) return { label: 'Moving toward calmer states', delta, direction: 'up' };
  if (delta <= -2) return { label: 'Pressure has been building', delta, direction: 'down' };
  return { label: 'Relatively steady trajectory', delta, direction: 'stable' };
};

const getVolatilityScore = (trend) => {
  if (trend.length < 2) return 74;
  let movement = 0;
  for (let i = 1; i < trend.length; i += 1) {
    movement += Math.abs(getMoodMeta(trend[i].primaryMood).score - getMoodMeta(trend[i - 1].primaryMood).score);
  }
  return clamp(Math.round(100 - (movement / (trend.length - 1)) * 14), 22, 96);
};

const getCoverageScore = (trend, period) => {
  if (!period) return 0;
  return clamp(Math.round((trend.length / period) * 100), 0, 100);
};

/* ─── Insight builder ──────────────────────────────────────────── */
const buildInsights = ({ dominantMood, negativeShare, positiveShare, avgConfidence, trendDirection, coverageScore, chatHistory }) => {
  const sessions = chatHistory.length || 0;
  const insights = [];

  if (dominantMood) {
    insights.push({
      eyebrow: 'Primary pattern',
      title: `${getMoodMeta(dominantMood._id).label} has been the clearest signal`,
      body: `${dominantMood.count} entries classified as ${getMoodMeta(dominantMood._id).label.toLowerCase()} make this the most consistent emotional state across the selected window.`,
    });
  } else {
    insights.push({
      eyebrow: 'Primary pattern',
      title: 'A few more sessions will reveal your dominant pattern',
      body: 'Patterns emerge from consistent use. Check back after a handful of conversations.',
    });
  }

  if (negativeShare >= 45) {
    insights.push({
      eyebrow: 'Strain signal',
      title: 'Heavier emotional states are concentrated',
      body: `${formatPercent(negativeShare)} of your readings landed in anxious, sad, stressed, or overwhelmed territory. Positive states accounted for ${formatPercent(positiveShare)}. This distribution is worth acknowledging.`,
    });
  } else if (negativeShare >= 25) {
    insights.push({
      eyebrow: 'Strain signal',
      title: 'Strain signals are present but not dominant',
      body: `${formatPercent(negativeShare)} of readings showed heavier states. This is a normal range and not a cause for concern.`,
    });
  } else {
    insights.push({
      eyebrow: 'Emotional balance',
      title: 'Your recent readings skew positive',
      body: `Just ${formatPercent(negativeShare)} of sessions showed elevated strain signals. ${formatPercent(positiveShare)} leaned toward calm, hopeful, or happy states.`,
    });
  }

  if (sessions >= 3) {
    insights.push({
      eyebrow: 'Session depth',
      title: sessions >= 10 ? 'A solid engagement picture is forming' : 'Tracking is building a clearer picture',
      body: `${sessions} sessions are on record. The confidence score sits at ${formatPercent(avgConfidence)}, with ${formatPercent(coverageScore)} daily coverage — ${trendDirection.label.toLowerCase()}.`,
    });
  } else {
    insights.push({
      eyebrow: 'Session depth',
      title: 'Keep tracking for stronger clarity',
      body: `${sessions} session${sessions === 1 ? ' is' : 's are'} on record so far. A few more will sharpen these readings considerably.`,
    });
  }

  return insights;
};

/* ─── Build recommended actions ────────────────────────────────── */
const buildActions = ({ coverageScore, negativeShare, dominantMood, sessions }) => {
  const actions = [];
  if (coverageScore < 70) {
    actions.push({ label: 'Keep tracking', detail: `${Math.ceil((70 - coverageScore) / 10) || 1} more session${Math.ceil((70 - coverageScore) / 10) <= 1 ? ' is' : 's are'} needed to strengthen this view` });
  }
  if (negativeShare >= 40) {
    actions.push({ label: 'Protect your mid-week windows', detail: 'Higher strain readings tend to cluster mid-week — mornings in particular may be worth simplifying' });
  }
  if (dominantMood && ['stressed','anxious','overwhelmed'].includes(dominantMood._id)) {
    actions.push({ label: 'After-stress sessions land calmer', detail: 'Longer, unhurried sessions tend to precede better emotional readings — consider giving yourself more space' });
  }
  if (sessions > 0) {
    actions.push({ label: 'Compare this window to the last', detail: `Look at how ${sessions} sessions compared to the period before — patterns often reveal themselves across longer spans` });
  }
  if (actions.length === 0) {
    actions.push({ label: 'Keep the rhythm going', detail: 'Consistent check-ins — even short ones — sharpen every reading on this page' });
  }
  return actions.slice(0, 4);
};

/* ─── Sub-components ───────────────────────────────────────────── */

const RangeSelector = ({ period, setPeriod }) => (
  <div style={{ display: 'inline-flex', gap: 6, padding: 5, background: 'var(--bg-elevated)', borderRadius: 999, border: '1px solid var(--border-subtle)' }}>
    {PERIODS.map((v) => (
      <button
        key={v}
        onClick={() => setPeriod(v)}
        style={{
          border: 'none', cursor: 'pointer', borderRadius: 999,
          padding: '9px 16px', minWidth: 58, fontSize: 13, fontWeight: 600,
          fontFamily: 'Outfit, sans-serif',
          transition: 'all 0.16s var(--ease)',
          background: period === v ? 'var(--accent)' : 'transparent',
          color: period === v ? '#0d1017' : 'var(--text-muted)',
        }}
      >
        {v}d
      </button>
    ))}
  </div>
);

const StatCard = ({ label, value, sub, accent }) => (
  <div className="card" style={{ padding: 22, minHeight: 136, position: 'relative', overflow: 'hidden' }}>
    <div style={{ position: 'absolute', inset: 'auto -20px -38px auto', width: 110, height: 110, borderRadius: '50%', background: accent || 'rgba(200,168,130,0.08)', filter: 'blur(8px)', opacity: 0.7 }} />
    <p className="t-label" style={{ marginBottom: 16 }}>{label}</p>
    <p className="f-display" style={{ fontSize: 40, lineHeight: 1, marginBottom: 10 }}>{value}</p>
    <p style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 220 }}>{sub}</p>
  </div>
);

const SectionCard = ({ eyebrow, title, children, right }) => (
  <section className="card" style={{ padding: 26 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', marginBottom: 22, flexWrap: 'wrap' }}>
      <div>
        <p className="t-label" style={{ marginBottom: 6 }}>{eyebrow}</p>
        <h2 className="f-display" style={{ fontSize: 28, lineHeight: 1.05 }}>{title}</h2>
      </div>
      {right}
    </div>
    {children}
  </section>
);

/* ─── TrendChart with baseline zone bands ─────────────────────── */
const TrendChart = ({ data }) => {
  if (!data || data.length === 0) return null;

  const W = 880, H = 260, pad = { top: 28, right: 28, bottom: 52, left: 50 };
  const iW = W - pad.left - pad.right;
  const iH = H - pad.top - pad.bottom;
  const range = Math.max(data.length - 1, 1);

  const pts = data.map((item, i) => {
    const mood = getMoodMeta(item.primaryMood);
    return { ...item, mood, score: mood.score, color: mood.color,
      x: pad.left + (i / range) * iW,
      y: pad.top + iH - ((mood.score - 1) / 8) * iH,
    };
  });

  // Baseline zone bands
  const zones = [
    { scoreMin: 1, scoreMax: 3, label: 'Strained', fill: 'rgba(216, 142, 142, 0.07)' },
    { scoreMin: 3, scoreMax: 5, label: 'Mixed', fill: 'rgba(200, 168, 130, 0.05)' },
    { scoreMin: 5, scoreMax: 7, label: 'Steady', fill: 'rgba(126, 207, 160, 0.04)' },
    { scoreMin: 7, scoreMax: 9, label: 'Calm', fill: 'rgba(126, 207, 160, 0.07)' },
  ];

  const linePath = pts.reduce((acc, pt, i) => {
    if (i === 0) return `M ${pt.x} ${pt.y}`;
    const prev = pts[i - 1];
    const cpX = (prev.x + pt.x) / 2;
    return `${acc} C ${cpX} ${prev.y}, ${cpX} ${pt.y}, ${pt.x} ${pt.y}`;
  }, '');
  const areaPath = `${linePath} L ${pts[pts.length - 1].x} ${pad.top + iH} L ${pts[0].x} ${pad.top + iH} Z`;

  const yLabels = [
    { score: 1, text: 'Strained' }, { score: 3, text: 'Anxious' },
    { score: 5, text: 'Neutral' },  { score: 7, text: 'Hopeful' }, { score: 9, text: 'Calm' },
  ];

  // Annotation: find the most extreme point
  const extreme = pts.reduce((best, pt) =>
    (pt.mood.tone === 'negative' && pt.score < best.score) ? pt : best, pts[0]);

  return (
    <div style={{ position: 'relative' }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
        <defs>
          <linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(200,168,130,0.28)" />
            <stop offset="100%" stopColor="rgba(200,168,130,0.01)" />
          </linearGradient>
        </defs>

        {/* Zone bands */}
        {zones.map((zone) => {
          const yTop = pad.top + iH - ((zone.scoreMax - 1) / 8) * iH;
          const yBot = pad.top + iH - ((zone.scoreMin - 1) / 8) * iH;
          return (
            <rect key={zone.label} x={pad.left} y={yTop}
              width={iW} height={Math.max(yBot - yTop, 2)}
              fill={zone.fill} />
          );
        })}

        {/* Y axis grid + labels */}
        {yLabels.map((lbl) => {
          const y = pad.top + iH - ((lbl.score - 1) / 8) * iH;
          return (
            <g key={lbl.score}>
              <line x1={pad.left} y1={y} x2={pad.left + iW} y2={y} stroke="rgba(255,255,255,0.05)" />
              <text x={pad.left - 10} y={y} dominantBaseline="central" textAnchor="end" fontSize="11.5" fill="#6d675f" fontFamily="Outfit">{lbl.text}</text>
            </g>
          );
        })}

        {/* X axis */}
        <line x1={pad.left} y1={pad.top + iH} x2={pad.left + iW} y2={pad.top + iH} stroke="rgba(255,255,255,0.08)" />
        {pts.map((pt, i) => (
          <text key={i} x={pt.x} y={pad.top + iH + 16} dominantBaseline="hanging" textAnchor="middle" fontSize="10.5" fill="#6d675f" fontFamily="Outfit">{formatDay(pt._id)}</text>
        ))}

        <path d={areaPath} fill="url(#trend-fill)" />
        <path d={linePath} fill="none" stroke="#c8a882" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* Dots */}
        {pts.map((pt, i) => (
          <circle key={i} cx={pt.x} cy={pt.y} r="4.5" fill="#10141d" stroke={pt.color} strokeWidth="2" />
        ))}
      </svg>

      {/* Annotation callout */}
      {extreme && extreme.mood.tone === 'negative' && (
        <div style={{
          position: 'absolute', top: 6, left: `${((extreme.x / W) * 100)}%`,
          transform: 'translateX(-50%)',
          background: 'var(--bg-overlay)',
          border: '1px solid rgba(216,142,142,0.3)',
          borderRadius: 99, padding: '4px 12px',
          fontSize: 11.5, color: '#d88e8e', fontFamily: 'Outfit', fontWeight: 600,
          whiteSpace: 'nowrap', pointerEvents: 'none',
        }}>
          ← Peak strain day
        </div>
      )}
    </div>
  );
};

/* ─── Distribution bars ────────────────────────────────────────── */
const DistributionBars = ({ data, totalEntries }) => (
  <div style={{ display: 'grid', gap: 14 }}>
    {data.map((item) => {
      const mood = getMoodMeta(item._id);
      const share = totalEntries ? (item.count / totalEntries) * 100 : 0;
      return (
        <div key={item._id} style={{ display: 'grid', gap: 7 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'baseline' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: mood.color, boxShadow: `0 0 0 4px ${mood.color}18` }} />
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{mood.label}</span>
            </div>
            <div style={{ display: 'flex', gap: 12, fontSize: 12.5, color: 'var(--text-muted)' }}>
              <span>{item.count}</span>
              <span>{formatPercent(share)}</span>
            </div>
          </div>
          <div style={{ height: 12, borderRadius: 999, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
            <div style={{ width: `${share}%`, height: '100%', borderRadius: 999, background: `linear-gradient(90deg, ${mood.color}CC, ${mood.color})` }} />
          </div>
        </div>
      );
    })}
  </div>
);

/* ─── Daily mini-strip ──────────────────────────────────────────── */
const DailyStrip = ({ trend }) => (
  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${trend.length}, minmax(0, 1fr))`, gap: 10 }}>
    {trend.map((item) => {
      const mood = getMoodMeta(item.primaryMood);
      return (
        <div key={item._id} className="card-inset" style={{ padding: '14px 10px', textAlign: 'center' }}>
          <p className="t-label" style={{ marginBottom: 10 }}>{formatDay(item._id)}</p>
          <div style={{ width: 16, height: 52, margin: '0 auto 10px', borderRadius: 999, background: 'rgba(255,255,255,0.05)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: `${((mood.score - 1) / 8) * 100}%`, minHeight: 10, borderRadius: 999, background: mood.color }} />
          </div>
          <p style={{ fontSize: 12.5, fontWeight: 600, color: mood.color, marginBottom: 4 }}>{mood.label}</p>
          <p style={{ fontSize: 11.5, color: 'var(--text-faint)' }}>{item.count} logs</p>
        </div>
      );
    })}
  </div>
);

/* ─── Mini calendar heatmap ────────────────────────────────────── */
const MiniCalHeatmap = ({ chatHistory }) => {
  const weeks = 6;
  const cells = weeks * 7;
  const today = new Date();
  const cellsData = Array.from({ length: cells }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (cells - 1 - i));
    const dateStr = d.toDateString();
    const count = chatHistory.filter(c => new Date(c.lastMessage || c.createdAt).toDateString() === dateStr).length;
    return { date: d, count, day: d.getDay() };
  });

  const maxCount = Math.max(...cellsData.map(c => c.count), 1);

  return (
    <div>
      <div style={{ display: 'flex', gap: 2, marginBottom: 6 }}>
        {['S','M','T','W','T','F','S'].map((d, i) => (
          <span key={i} style={{ flex: 1, textAlign: 'center', fontSize: 10, color: 'var(--text-faint)', fontFamily: 'Outfit' }}>{d}</span>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(7, 1fr)`, gap: 3 }}>
        {cellsData.map((cell, i) => {
          const intensity = cell.count / maxCount;
          const bg = intensity > 0.75 ? 'rgba(200,168,130,0.55)' : intensity > 0.4 ? 'rgba(200,168,130,0.30)' : intensity > 0 ? 'rgba(200,168,130,0.12)' : 'rgba(255,255,255,0.04)';
          return (
            <div key={i} title={`${cell.date.toLocaleDateString([], { month: 'short', day: 'numeric' })}: ${cell.count} session${cell.count !== 1 ? 's' : ''}`}
              style={{ aspectRatio: '1', borderRadius: 3, background: bg, cursor: 'default' }} />
          );
        })}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10 }}>
        <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>Less</span>
        {[0, 0.12, 0.30, 0.55].map((v, i) => (
          <div key={i} style={{ width: 12, height: 12, borderRadius: 2, background: `rgba(200,168,130,${v})` }} />
        ))}
        <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>More</span>
      </div>
    </div>
  );
};

/* ─── Session depth bars ───────────────────────────────────────── */
const SessionDepthBars = ({ chatHistory }) => {
  const recent = chatHistory.slice(0, 6).reverse();
  const maxMsg = Math.max(...recent.map(c => c.messageCount || 0), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {recent.map((chat, i) => {
        const pct = ((chat.messageCount || 0) / maxMsg) * 100;
        return (
          <div key={chat.id || i} style={{ display: 'grid', gridTemplateColumns: '90px 1fr', gap: 12, alignItems: 'center' }}>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {chat.title || 'Session'}
            </p>
            <div style={{ height: 20, borderRadius: 6, background: 'rgba(255,255,255,0.05)', overflow: 'hidden', position: 'relative' }}>
              <div style={{ width: `${pct}%`, height: '100%', borderRadius: 6, background: 'linear-gradient(90deg, rgba(200,168,130,0.5), rgba(200,168,130,0.85))', minWidth: 8 }} />
              <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 11, fontWeight: 700, color: 'var(--text-primary)' }}>
                {chat.messageCount || 0}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

/* ─── Stability strip ──────────────────────────────────────────── */
const StabilityStrip = ({ trend, volatilityScore, trendDirection }) => {
  const volColor = volatilityScore >= 70 ? 'var(--sage-bright)' : volatilityScore >= 45 ? 'var(--accent)' : '#db8888';
  const volLabel = volatilityScore >= 70 ? 'Stable' : volatilityScore >= 45 ? 'Oscillating' : 'Volatile';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <div>
          <p className="t-label" style={{ marginBottom: 6 }}>Stability score</p>
          <p className="f-display" style={{ fontSize: 38, lineHeight: 1, color: volColor }}>{formatPercent(volatilityScore)}</p>
          <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 6 }}>{volLabel} day-to-day</p>
        </div>
        <div style={{ width: 80, height: 80, borderRadius: '50%', position: 'relative' }}>
          <svg viewBox="0 0 80 80" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
            <circle cx="40" cy="40" r="34" fill="none" stroke={volColor} strokeWidth="6"
              strokeDasharray={`${(volatilityScore / 100) * 213.6} 213.6`} strokeLinecap="round" />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>{formatPercent(volatilityScore)}</span>
          </div>
        </div>
      </div>
      <div style={{ padding: '14px 16px', borderRadius: 'var(--r-md)', background: 'var(--bg-elevated)', border: '1px solid var(--border-faint)' }}>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7, fontStyle: 'italic' }}>
          {trendDirection.direction === 'up' ? 'The trend is improving — recent readings land in calmer territory.' :
           trendDirection.direction === 'down' ? 'Recent readings have moved toward higher-stress states. Worth noting.' :
           'Readings have been relatively consistent across the selected window.'}
        </p>
      </div>
    </div>
  );
};

/* ─── Insight card ────────────────────────────────────────────── */
const InsightCard = ({ eyebrow, title, body, accent }) => (
  <div className="card-inset" style={{ padding: 18, borderLeft: accent ? '3px solid var(--accent)' : '3px solid transparent', minHeight: 158 }}>
    <p className="t-label" style={{ marginBottom: 10 }}>{eyebrow}</p>
    <p style={{ fontSize: 17, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.35, marginBottom: 10 }}>{title}</p>
    <p style={{ fontSize: 13.5, color: 'var(--text-muted)', lineHeight: 1.7 }}>{body}</p>
  </div>
);

/* ─── Recommended actions ──────────────────────────────────────── */
const RecommendedActions = ({ actions }) => (
  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
    {actions.map((action, i) => (
      <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '14px 18px', borderRadius: 'var(--r-md)', background: 'var(--bg-raised)', border: '1px solid var(--border-subtle)', flex: '1 1 220px' }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{action.label}</p>
        <p style={{ fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.6 }}>{action.detail}</p>
      </div>
    ))}
  </div>
);

/* ─── Main component ───────────────────────────────────────────── */
const MoodAnalytics = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [distribution, setDistribution] = useState([]);
  const [trend, setTrend] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState(14);

  useEffect(() => { if (!isAuthenticated) navigate('/'); }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    Promise.all([getMoodHistory(period), getChatHistory(30)])
      .then(([moodRes, chatRes]) => {
        if (moodRes.success) {
          setDistribution(moodRes.data?.distribution || []);
          setTrend(moodRes.data?.trend || []);
        }
        if (chatRes.success) setChatHistory(chatRes.data?.chats || []);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [isAuthenticated, period]);

  if (!isAuthenticated) return null;

  const sortedDist  = [...distribution].sort((a, b) => b.count - a.count);
  const totalEntries = sortedDist.reduce((s, d) => s + d.count, 0);
  const totalSessions = chatHistory.length;
  const avgConfidence = getAverageConfidence(sortedDist, totalEntries);
  const dominantMood  = sortedDist[0] || null;
  const positiveShare = getToneShare(sortedDist, 'positive', totalEntries);
  const negativeShare = getToneShare(sortedDist, 'negative', totalEntries);
  const volatilityScore = getVolatilityScore(trend);
  const coverageScore   = getCoverageScore(trend, period);
  const trendDirection  = getTrendDirection(trend);
  const topMoodLabel    = dominantMood ? getMoodMeta(dominantMood._id).label : '—';
  const topMoodColor   = dominantMood ? getMoodMeta(dominantMood._id).color : 'var(--accent)';
  const insights = buildInsights({ dominantMood, negativeShare, positiveShare, avgConfidence, trendDirection, coverageScore, chatHistory });
  const actions = buildActions({ coverageScore, negativeShare, dominantMood, sessions: totalSessions });

  return (
    <div style={{ minHeight: 'calc(100vh - 62px)', background: 'var(--bg-base)' }}>
      {/* ── Hero header ─────────────────────────────────────── */}
      <div style={{
        borderBottom: '1px solid var(--border-faint)',
        background: `radial-gradient(circle at top left, rgba(107,143,113,0.10), transparent 30%), radial-gradient(circle at top right, rgba(200,168,130,0.10), transparent 32%), var(--bg-raised)`,
      }}>
        <div style={{ maxWidth: 1380, margin: '0 auto', padding: '40px 32px 34px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(300px, 420px)', gap: 24, alignItems: 'stretch' }}>
            {/* Left — editorial */}
            <div>
              <p className="t-label" style={{ marginBottom: 12, color: 'var(--sage-bright)' }}>Emotional intelligence</p>
              <h1 className="f-display" style={{ fontSize: 'clamp(36px, 5vw, 62px)', lineHeight: 0.95, marginBottom: 18 }}>
                Your emotional landscape, {user?.name ? user.name.split(' ')[0] : 'friend'}.
              </h1>
              <p style={{ maxWidth: 700, fontSize: 16.5, lineHeight: 1.8, color: 'var(--text-muted)', marginBottom: 26 }}>
                A structured view of your emotional patterns — built from your conversations. The goal is understanding, not judgment.
              </p>
              <RangeSelector period={period} setPeriod={setPeriod} />
            </div>

            {/* Right — interpretation panel */}
            <div className="card" style={{ padding: 24 }}>
              <p className="t-label" style={{ marginBottom: 10 }}>Overall read</p>
              <p className="f-display" style={{ fontSize: 28, lineHeight: 1.06, marginBottom: 14, color: trendDirection.direction === 'up' ? 'var(--sage-bright)' : trendDirection.direction === 'down' ? '#db8888' : 'var(--text-primary)' }}>
                {trendDirection.label}
              </p>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 18 }}>
                Anchored by {totalEntries || 0} mood logs across {trend.length || 0} active days.
              </p>
              <div style={{ display: 'grid', gap: 10 }}>
                {[
                  { label: 'Dominant state', value: topMoodLabel, color: `${topMoodColor}22`, textColor: topMoodColor },
                  { label: 'Strain share', value: formatPercent(negativeShare), color: 'rgba(224,128,112,0.18)', textColor: '#e08070' },
                  { label: 'Stability', value: formatPercent(volatilityScore), color: 'rgba(126,207,160,0.16)', textColor: 'var(--sage-bright)' },
                ].map((item) => (
                  <div key={item.label} className="card-inset" style={{ padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{item.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: item.textColor, padding: '6px 10px', borderRadius: 999, background: item.color }}>
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────── */}
      <div style={{ maxWidth: 1380, margin: '0 auto', padding: '28px 32px 56px' }}>

        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
            <div className="spinner" />
          </div>
        ) : !distribution.length ? (
          <div className="card" style={{ padding: '80px 28px', textAlign: 'center' }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: 'var(--accent-bg)', border: '1px solid rgba(200,168,130,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', margin: '0 auto 22px' }}>
              <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </div>
            <p className="f-display" style={{ fontSize: 30, marginBottom: 12, color: 'var(--text-primary)' }}>Your emotional story is still loading</p>
            <p style={{ fontSize: 15, color: 'var(--text-muted)', maxWidth: 520, margin: '0 auto', lineHeight: 1.8 }}>
              Come back after a few more conversations. This page will have more to say the more you engage.
            </p>
          </div>
        ) : (
          <>
            {/* ── Executive summary ──────────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 16, marginBottom: 22 }} className="analytics-stats">
              <StatCard label="Dominant mood" value={topMoodLabel} sub={dominantMood ? `${dominantMood.count} entries this window` : 'Pattern still forming'} accent={`${topMoodColor}22`} />
              <StatCard label="Strain share" value={formatPercent(negativeShare)} sub="Anxious, sad, stressed, overwhelmed" accent="rgba(224,128,112,0.16)" />
              <StatCard label="Stability" value={formatPercent(volatilityScore)} sub="Higher = steadier emotional baseline" accent="rgba(126,207,160,0.16)" />
              <StatCard label="Confidence" value={formatPercent(avgConfidence)} sub={`${totalSessions} sessions, ${formatPercent(coverageScore)} coverage`} accent="rgba(138,173,219,0.16)" />
            </div>

            {/* ── Primary trend + signals (60/40) ─────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.55fr) minmax(320px, 0.9fr)', gap: 18, marginBottom: 18 }} className="analytics-main">
              <SectionCard eyebrow="Trajectory" title="Emotional movement over the selected window" right={<span style={{ fontSize: 12.5, color: 'var(--text-faint)' }}>{trend.length} active days mapped</span>}>
                <TrendChart data={trend} />
              </SectionCard>

              <SectionCard eyebrow="Signal priority" title="What deserves attention first">
                <div style={{ display: 'grid', gap: 12 }}>
                  {[
                    { label: 'Positive states', value: formatPercent(positiveShare), tone: 'var(--sage-bright)', bg: 'rgba(107,143,113,0.14)', detail: 'Calm, hopeful, happy' },
                    { label: 'Neutral states', value: formatPercent(Math.max(0, 100 - positiveShare - negativeShare)), tone: 'var(--accent-bright)', bg: 'rgba(200,168,130,0.14)', detail: 'Neutral and confused' },
                    { label: 'Higher strain states', value: formatPercent(negativeShare), tone: '#e08070', bg: 'rgba(224,96,96,0.12)', detail: 'Anxious, sad, stressed, overwhelmed, angry' },
                  ].map((item) => (
                    <div key={item.label} className="card-inset" style={{ padding: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{item.label}</span>
                        <span style={{ fontSize: 22, fontWeight: 700, color: item.tone }}>{item.value}</span>
                      </div>
                      <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 10 }}>{item.detail}</p>
                      <div style={{ height: 8, borderRadius: 999, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                        <div style={{ width: item.value, height: '100%', background: item.bg, borderRadius: 999 }} />
                      </div>
                    </div>
                  ))}
                </div>
              </SectionCard>
            </div>

            {/* ── Mood composition + daily strip (50/50) ──────── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 18, marginBottom: 18 }} className="analytics-secondary">
              <SectionCard eyebrow="Distribution" title="Which emotions appear most often">
                <DistributionBars data={sortedDist} totalEntries={totalEntries} />
              </SectionCard>

              <SectionCard eyebrow="Daily read" title="How each active day landed">
                <DailyStrip trend={trend} />
              </SectionCard>
            </div>

            {/* ── Behavioral patterns (3-col) ────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr)', gap: 18, marginBottom: 18 }} className="analytics-tertiary">
              <SectionCard eyebrow="Behavioral" title="Active days">
                <MiniCalHeatmap chatHistory={chatHistory} />
              </SectionCard>
              <SectionCard eyebrow="Session depth" title="Messages per conversation">
                <SessionDepthBars chatHistory={chatHistory} />
              </SectionCard>
              <SectionCard eyebrow="Stability" title="Emotional consistency">
                <StabilityStrip trend={trend} volatilityScore={volatilityScore} trendDirection={trendDirection} />
              </SectionCard>
            </div>

            {/* ── Insights (3-col) ────────────────────────────── */}
            <SectionCard eyebrow="Interpretation" title="What the patterns suggest">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 14 }} className="analytics-insights">
                {insights.map((card, i) => (
                  <InsightCard key={card.eyebrow} {...card} accent={i === 1} />
                ))}
              </div>
            </SectionCard>

            {/* ── Recommended actions ────────────────────────── */}
            <div style={{ marginTop: 18, padding: '24px 28px', borderRadius: 'var(--r-lg)', background: 'var(--bg-raised)', border: '1px solid var(--border-faint)' }}>
              <p className="t-label" style={{ marginBottom: 14 }}>What to do with this</p>
              <RecommendedActions actions={actions} />
            </div>
          </>
        )}
      </div>

      {/* ── Responsive ──────────────────────────────────────── */}
      <style>{`
        @media (max-width: 1120px) {
          .analytics-main { grid-template-columns: 1fr !important; }
          .analytics-tertiary { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 900px) {
          .analytics-secondary { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 720px) {
          .analytics-stats { grid-template-columns: repeat(2, 1fr) !important; }
          .analytics-tertiary { grid-template-columns: 1fr !important; }
          .analytics-insights { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 480px) {
          .analytics-stats { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};

export default MoodAnalytics;