/**
 * ChatBoxView — Solace
 * Dark-theme chat surface + professional input composer
 */

import React, { useEffect, useRef, useState } from 'react';
import MessageBubbleView from './MessageBubbleView';
import { sendMessage } from '../services/api';

const SUGGESTIONS = [
  "I'm feeling stretched thin and need help slowing down",
  'Can you help me settle anxious thoughts right now?',
  'I want a simple reset for the rest of today',
];

const ChatBoxView = ({ chatId, messages, onNewMessage, onChatIdChange, onConversationPersisted }) => {
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping]         = useState(false);
  const [error, setError]               = useState(null);
  const messagesEndRef                  = useRef(null);
  const inputRef                        = useRef(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isTyping]);
  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    const handler = (e) => {
      if (typeof e.detail === 'string') { setInputMessage(e.detail); inputRef.current?.focus(); }
    };
    window.addEventListener('chat:set-input', handler);
    return () => window.removeEventListener('chat:set-input', handler);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;
    const text = inputMessage.trim();
    setInputMessage(''); setError(null);
    onNewMessage({ role: 'user', content: text, timestamp: new Date().toISOString() });
    setIsTyping(true);
    try {
      const res = await sendMessage({ message: text, chatId });
      if (res.success) {
        if (res.data.chatId && !chatId) onChatIdChange(res.data.chatId);
        onNewMessage({
          role: 'assistant', content: res.data.response, timestamp: new Date().toISOString(),
          mood: res.data.mood?.mood, confidence: res.data.mood?.confidence,
          resources: res.data.resources, riskLevel: res.data.safety?.riskLevel,
          followUp: res.data.followUp, safety: res.data.safety,
        });
        if (onConversationPersisted) await onConversationPersisted();
      } else {
        setError(res.message || 'Failed to get response');
      }
    } catch (_) {
      setError('Failed to send message. Please try again.');
    } finally {
      setIsTyping(false); inputRef.current?.focus();
    }
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', overflow:'hidden' }}>

      {/* ── Messages ─────────────────────────────────────── */}
      <div style={{ flex:1, overflowY:'auto', padding:'28px 36px 12px' }}>

        {/* Empty state */}
        {messages.length === 0 && (
          <div
            className="anim-0"
            style={{ maxWidth: 580, margin: '20px auto 0', textAlign: 'center' }}
          >
            <div
              style={{
                width: 56, height: 56, borderRadius: 14,
                background: 'var(--accent-bg)',
                border: '1px solid rgba(200,168,130,0.22)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--accent)', margin: '0 auto 22px',
              }}
            >
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </div>
            <h2
              className="f-display"
              style={{ fontSize: 28, color: 'var(--text-primary)', marginBottom: 12, lineHeight: 1.25 }}
            >
              Start with what feels most true right now.
            </h2>
            <p style={{ fontSize: 15.5, color: 'var(--text-muted)', lineHeight: 1.75, marginBottom: 28, maxWidth: 440, margin: '0 auto 28px' }}>
              You don't need the perfect words. Describe the feeling, the pressure, or the thought — a grounded response will follow.
            </p>
            <div style={{ display:'flex', flexDirection:'column', gap: 9, maxWidth: 500, margin: '0 auto' }}>
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => setInputMessage(s)}
                  className="f-ui"
                  style={{
                    padding:'13px 18px', borderRadius:'var(--r-md)',
                    background:'var(--bg-elevated)', border:'1px solid var(--border-subtle)',
                    fontSize:14, color:'var(--text-muted)', textAlign:'left', lineHeight:1.55,
                    cursor:'pointer', transition:'all 0.15s var(--ease)',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background='var(--bg-overlay)'; e.currentTarget.style.borderColor='var(--border-muted)'; e.currentTarget.style.color='var(--text-body)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background='var(--bg-elevated)'; e.currentTarget.style.borderColor='var(--border-subtle)'; e.currentTarget.style.color='var(--text-muted)'; }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        <div style={{ maxWidth: 740, margin: '0 auto' }}>
          {messages.map((msg, i) => <MessageBubbleView key={i} {...msg} />)}
        </div>

        {/* Typing indicator */}
        {isTyping && (
          <div style={{ maxWidth:740, margin:'0 auto', display:'flex', justifyContent:'flex-start', marginTop: 8 }}>
            <div
              className="bubble-assistant"
              style={{ padding:'13px 18px', display:'flex', alignItems:'center', gap: 12 }}
            >
              <div style={{ display:'flex', gap: 5, alignItems:'center' }}>
                {[0,140,280].map(delay => (
                  <div
                    key={delay}
                    style={{
                      width:7, height:7, borderRadius:'50%',
                      background:'var(--accent)', opacity:0.65,
                      animation:`dotBounce 1.1s ${delay}ms ease-in-out infinite`,
                    }}
                  />
                ))}
              </div>
              <span style={{ fontSize:14, color:'var(--text-muted)' }}>Composing a response…</span>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ maxWidth:740, margin:'8px auto', display:'flex', justifyContent:'center' }}>
            <div style={{ padding:'10px 18px', borderRadius:'var(--r-md)', background:'var(--status-danger)', border:'1px solid rgba(190,70,60,0.22)', fontSize:14, color:'var(--status-danger-text)' }}>
              {error}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Composer ─────────────────────────────────────── */}
      <div
        style={{
          borderTop: '1px solid var(--border-faint)',
          background: 'rgba(13,16,23,0.95)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          padding: '16px 36px 20px',
          flexShrink: 0,
        }}
      >
        <form onSubmit={handleSubmit} style={{ maxWidth:740, margin:'0 auto' }}>
          <div
            style={{
              display:'flex', alignItems:'flex-end', gap: 10,
              background:'var(--bg-elevated)',
              border:'1px solid var(--border-subtle)',
              borderRadius:'var(--r-lg)',
              padding:'12px 14px 12px 18px',
              boxShadow:'var(--shadow-xs)',
              transition:'border-color 0.18s var(--ease), box-shadow 0.18s var(--ease)',
            }}
            onFocusCapture={e => { e.currentTarget.style.borderColor='var(--accent)'; e.currentTarget.style.boxShadow='0 0 0 3px rgba(200,168,130,0.10)'; }}
            onBlurCapture={e => { if (!e.currentTarget.contains(e.relatedTarget)) { e.currentTarget.style.borderColor='var(--border-subtle)'; e.currentTarget.style.boxShadow='var(--shadow-xs)'; } }}
          >
            <textarea
              ref={inputRef}
              value={inputMessage}
              onChange={e => { setInputMessage(e.target.value); setError(null); }}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e); } }}
              placeholder="Write freely — a sentence is enough."
              disabled={isTyping}
              rows={1}
              className="f-ui"
              style={{
                flex:1, resize:'none', border:'none', outline:'none',
                background:'transparent', fontSize:15.5, lineHeight:1.65,
                color:'var(--text-primary)', minHeight:46, maxHeight:150,
                padding:'2px 0', fontFamily:'inherit',
              }}
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isTyping}
              className="btn btn-primary f-ui"
              style={{ flexShrink:0, padding:'10px 20px', borderRadius:'var(--r-md)', fontSize:14 }}
            >
              {isTyping ? (
                <><div className="spinner" style={{ width:14, height:14, borderWidth:1.5 }} /> Sending</>
              ) : 'Send'}
            </button>
          </div>
          <p style={{ marginTop:10, textAlign:'center', fontSize:12, color:'var(--text-faint)', lineHeight:1.6 }}>
            Supportive guidance only — not medical advice or emergency care.{' '}
            <span style={{ color:'var(--accent)', fontWeight:600 }}>988</span> for immediate crisis support.
          </p>
        </form>
      </div>
    </div>
  );
};

export default ChatBoxView;
