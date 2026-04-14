/**
 * MessageBubbleView — Solace
 * Dark-theme message rendering
 */

import React from 'react';

const MOOD_LABELS = {
  happy:'Bright', sad:'Low', anxious:'Anxious', angry:'Tense',
  stressed:'Stressed', hopeful:'Hopeful', confused:'Unclear',
  overwhelmed:'Overwhelmed', calm:'Calm', neutral:'Steady',
};

const getMoodClass = (m) => {
  const map = { calm:'calm',hopeful:'hopeful',neutral:'neutral',anxious:'anxious',sad:'sad',stressed:'stressed',angry:'angry',happy:'hopeful',overwhelmed:'stressed' };
  return map[m] || '';
};

const riskBorder = (level) => {
  const m = { low:'rgba(210,150,60,0.4)', medium:'rgba(200,110,50,0.45)', high:'rgba(190,60,40,0.5)', crisis:'rgba(170,30,20,0.6)' };
  return m[level] || null;
};

const MessageBubbleView = ({ role, content, mood, confidence, timestamp, resources, riskLevel, followUp, safety }) => {
  const isUser = role === 'user';

  const fmtTime = (t) => t ? new Date(t).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' }) : '';
  const getMoodLabel = (m) => MOOD_LABELS[m] || 'Reflective';

  const borderColor = !isUser && riskLevel && riskLevel !== 'none' ? riskBorder(riskLevel) : null;

  return (
    <div
      className="anim-in"
      style={{
        display:'flex', flexDirection:'column',
        alignItems: isUser ? 'flex-end' : 'flex-start',
        marginBottom: 22, gap: 6,
      }}
    >
      {/* Assistant avatar row */}
      {!isUser && (
        <div style={{ display:'flex', alignItems:'center', gap: 8, marginLeft: 2 }}>
          <div
            style={{
              width: 28, height: 28, borderRadius: '50%',
              background: 'var(--accent-bg)',
              border: '1px solid rgba(200,168,130,0.22)',
              display:'flex', alignItems:'center', justifyContent:'center',
              color: 'var(--accent)', flexShrink: 0,
            }}
          >
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </div>
          <span className="t-label" style={{ fontSize:10, marginBottom:0 }}>Solace</span>
          <span style={{ fontSize:11.5, color:'var(--text-faint)' }}>{fmtTime(timestamp)}</span>
        </div>
      )}

      {/* Bubble */}
      <div style={{ maxWidth:'min(84%,700px)' }}>
        <div
          className={isUser ? 'bubble-user' : 'bubble-assistant'}
          style={{
            padding:'14px 18px',
            ...(borderColor ? { borderColor, borderWidth:2 } : {}),
            ...(riskLevel === 'crisis' && !isUser ? { background:'rgba(170,30,20,0.12)' } : {}),
          }}
        >
          <p
            className="f-ui"
            style={{
              fontSize: isUser ? 15 : 15.5,
              lineHeight: isUser ? 1.65 : 1.75,
              color: isUser ? '#0d1017' : 'var(--text-body)',
              whiteSpace:'pre-wrap', wordBreak:'break-word',
            }}
          >
            {content}
          </p>

          {/* User mood inline */}
          {isUser && mood && (
            <div style={{ marginTop:10, paddingTop:10, borderTop:'1px solid rgba(13,16,23,0.15)', display:'flex', alignItems:'center', gap:6 }}>
              <span style={{ fontSize:11.5, color:'rgba(13,16,23,0.55)', fontWeight:500 }}>Mood detected:</span>
              <span style={{ fontSize:11.5, color:'rgba(13,16,23,0.75)', fontWeight:600 }}>
                {getMoodLabel(mood)}{confidence ? ` · ${(confidence*100).toFixed(0)}%` : ''}
              </span>
            </div>
          )}

          {/* Resources */}
          {!isUser && resources?.length > 0 && (
            <div style={{ marginTop:14, paddingTop:12, borderTop:'1px solid var(--border-faint)' }}>
              <p className="t-label" style={{ marginBottom:8 }}>Helpful resources</p>
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {resources.map((r, i) => (
                  <div key={i} className="card-inset" style={{ padding:'9px 13px', fontSize:13.5 }}>
                    <span style={{ fontWeight:600, color:'var(--text-body)' }}>{r.name}</span>
                    {r.contact && <span style={{ color:'var(--text-muted)', marginLeft:6 }}>— {r.contact}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Follow-up & safety */}
          {!isUser && (followUp || (safety?.riskLevel && safety.riskLevel !== 'none')) && (
            <div style={{ marginTop:14, paddingTop:12, borderTop:'1px solid var(--border-faint)', display:'flex', flexDirection:'column', gap:8 }}>
              {safety?.riskLevel && safety.riskLevel !== 'none' && (
                <div style={{ padding:'9px 13px', borderRadius:'var(--r-sm)', background:'var(--status-danger)', border:'1px solid rgba(190,70,60,0.22)', fontSize:13.5, color:'var(--status-danger-text)' }}>
                  <span style={{ fontWeight:600 }}>Safety: </span>
                  <span style={{ textTransform:'capitalize' }}>{safety.riskLevel}</span>
                  {safety.needsAttention ? ' — please reach out for support' : ''}
                </div>
              )}
              {followUp && (
                <div style={{ padding:'9px 13px', borderRadius:'var(--r-sm)', background:'var(--sage-bg)', border:'1px solid rgba(107,143,113,0.20)', fontSize:13.5, color:'var(--sage-bright)' }}>
                  <span style={{ fontWeight:600 }}>A gentle next step: </span>
                  <span style={{ color:'var(--text-muted)' }}>{followUp}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Below-bubble metadata */}
        {!isUser && mood && (
          <div style={{ marginTop:6, marginLeft:4, display:'flex', alignItems:'center', gap:6 }}>
            <span className={`mood-tag ${getMoodClass(mood)}`}>{getMoodLabel(mood)}</span>
          </div>
        )}
        {isUser && (
          <p style={{ marginTop:5, textAlign:'right', marginRight:4, fontSize:11.5, color:'var(--text-faint)' }}>
            {fmtTime(timestamp)}
          </p>
        )}
      </div>
    </div>
  );
};

export default MessageBubbleView;
