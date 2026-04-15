/**
 * Chat Page — Solace
 * Full-viewport conversation workspace
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ChatBoxView from '../components/ChatBoxView';
import { getChat, getChatHistory, getMoodHistory } from '../services/api';

const QUICK_PROMPTS = [
  'I\'m carrying too much at once and need help slowing down',
  'Can you help me calm racing thoughts before bed?',
  'I want a gentle plan for getting through today',
];

const MOOD_LABELS = {
  happy:'Bright', sad:'Low', anxious:'Anxious', angry:'Tense',
  stressed:'Stressed', hopeful:'Hopeful', confused:'Unclear',
  overwhelmed:'Overwhelmed', calm:'Calm', neutral:'Steady',
};

const getMoodClass = (m) => {
  const map = { calm:'calm',hopeful:'hopeful',neutral:'neutral',anxious:'anxious',sad:'sad',stressed:'stressed',angry:'angry',happy:'hopeful',overwhelmed:'stressed' };
  return map[m] || '';
};

const mapMsg = (m) => ({
  role: m.role, content: m.content, timestamp: m.timestamp,
  mood: m.detectedMood || null, confidence: m.moodConfidence || null,
  riskLevel: m.safetyFlag ? 'flagged' : 'none',
});

const fmtDate = (v) => {
  if (!v) return '';
  const d = new Date(v), now = new Date();
  if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });
  const diff = Math.floor((now - d) / 86400000);
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return `${diff}d ago`;
  return d.toLocaleDateString([], { day:'2-digit', month:'short' });
};

const SideLabel = ({ children, action }) => (
  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 12 }}>
    <p className="t-label">{children}</p>
    {action}
  </div>
);

const Chat = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const [messages, setMessages]           = useState([]);
  const [chatId, setChatId]               = useState(null);
  const [activeTab, setActiveTab]         = useState('chat');
  const [moodHistory, setMoodHistory]     = useState([]);
  const [chatHistory, setChatHistory]     = useState([]);
  const [isLoadingChat, setIsLoadingChat] = useState(true);
  const [isLoadingHist, setIsLoadingHist] = useState(false);

  const storageKey = useMemo(() => user?.id ? `activeChatId:${user.id}` : null, [user?.id]);

  useEffect(() => { if (!isAuthenticated) navigate('/'); }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (!isAuthenticated) return;
    getMoodHistory(7).then(r => { if (r.success) setMoodHistory(r.data.distribution || []); }).catch(() => {});
  }, [isAuthenticated]);

  const fetchHistory = useCallback(async (limit = 20) => {
    if (!isAuthenticated) return [];
    setIsLoadingHist(true);
    try {
      const r = await getChatHistory(limit);
      const chats = r?.data?.chats || [];
      setChatHistory(chats); return chats;
    } catch (_) { setChatHistory([]); return []; }
    finally { setIsLoadingHist(false); }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || !user?.id) { setIsLoadingChat(false); return; }
    setIsLoadingChat(true);
    (async () => {
      try {
        const chats = await fetchHistory(20);
        const storedId = storageKey ? localStorage.getItem(storageKey) : null;
        const targetId = storedId || chats[0]?.id || null;
        if (!targetId) { setMessages([]); setChatId(null); return; }
        const r = await getChat(targetId);
        setChatId(targetId);
        setMessages((r?.data?.messages || []).map(mapMsg));
        if (storageKey) localStorage.setItem(storageKey, targetId);
      } catch (_) {
        if (storageKey) localStorage.removeItem(storageKey);
        setMessages([]); setChatId(null);
      } finally { setIsLoadingChat(false); }
    })();
  }, [storageKey, fetchHistory, isAuthenticated, user?.id]);

  const handleNewMessage    = (m) => setMessages(p => [...p, m]);
  const handleChatIdChange  = (id) => { setChatId(id); if (storageKey && id) localStorage.setItem(storageKey, id); };
  const handlePersisted     = async () => { await fetchHistory(20); };

  const handleSelectChat = async (id) => {
    if (!id || id === chatId) { setActiveTab('chat'); return; }
    setIsLoadingChat(true);
    try {
      const r = await getChat(id);
      setChatId(id);
      setMessages((r?.data?.messages || []).map(mapMsg));
      setActiveTab('chat');
      if (storageKey) localStorage.setItem(storageKey, id);
    } catch (_) {}
    finally { setIsLoadingChat(false); }
  };

  const startNewChat = () => {
    setMessages([]); setChatId(null); setActiveTab('chat');
    if (storageKey) localStorage.removeItem(storageKey);
  };

  const loadPrompt = (p) => {
    setActiveTab('chat'); setMessages([]); setChatId(null);
    window.dispatchEvent(new CustomEvent('chat:set-input', { detail: p }));
  };

  if (!isAuthenticated) return null;

  if (isLoadingChat) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'calc(100vh - 62px)', background:'var(--bg-base)' }}>
        <div style={{ textAlign:'center' }}>
          <div className="spinner" style={{ margin:'0 auto 16px' }} />
          <p style={{ fontSize:15, color:'var(--text-muted)' }}>Restoring your conversation…</p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        height: 'calc(100vh - 62px)',
        background: 'var(--bg-base)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* ── Workspace header ──────────────────────────────── */}
      <div
        style={{
          background: 'var(--bg-raised)',
          borderBottom: '1px solid var(--border-faint)',
          padding: '16px 28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
          gap: 20,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <p className="t-label" style={{ marginBottom: 5 }}>Conversation workspace</p>
          <h1
            className="f-display"
            style={{ fontSize: 'clamp(20px, 2.5vw, 28px)', color: 'var(--text-primary)', lineHeight: 1.2 }}
          >
            {chatId ? 'Active session' : 'Start a new conversation'}
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {/* Quick stats */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 20,
              padding: '9px 20px',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--r-md)',
            }}
          >
            {[
              { label: 'Patterns', value: moodHistory.length || '—' },
              { label: 'Sessions', value: chatHistory.length || '—' },
              { label: 'Crisis line', value: '988', accent: true },
            ].map(({ label, value, accent }, i) => (
              <React.Fragment key={label}>
                {i > 0 && <div style={{ width: 1, height: 28, background: 'var(--border-faint)' }} />}
                <div style={{ textAlign: 'center' }}>
                  <p className="t-label" style={{ marginBottom: 3 }}>{label}</p>
                  <p className="f-display" style={{ fontSize: 20, lineHeight: 1, color: accent ? 'var(--accent)' : 'var(--text-primary)' }}>
                    {value}
                  </p>
                </div>
              </React.Fragment>
            ))}
          </div>

          {/* Mobile tabs */}
          <div className="mobile-tabs" style={{ display:'none', gap: 6 }}>
            {['chat','mood'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="btn f-ui"
                style={{
                  padding: '7px 16px',
                  fontSize: 13,
                  fontWeight: activeTab === tab ? 600 : 400,
                  background: activeTab === tab ? 'var(--accent)' : 'var(--bg-elevated)',
                  color: activeTab === tab ? '#0d1017' : 'var(--text-muted)',
                  borderRadius: 99,
                  border: '1px solid var(--border-subtle)',
                }}
              >
                {tab === 'chat' ? 'Chat' : 'Mood'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Three-column body ─────────────────────────────── */}
      <div
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: '268px minmax(0,1fr) 288px',
          gap: 0,
          minHeight: 0,
          overflow: 'hidden',
        }}
        className="chat-layout"
      >
        {/* ── Left sidebar ─────────────────────────────── */}
        <aside
          className="chat-sidebar"
          style={{
            borderRight: '1px solid var(--border-faint)',
            background: 'var(--bg-raised)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* New chat */}
          <div style={{ padding: '18px 18px 14px', borderBottom: '1px solid var(--border-faint)', flexShrink: 0 }}>
            <button
              onClick={startNewChat}
              className="btn btn-primary f-ui"
              style={{ width: '100%', padding: '11px 16px', fontSize: 14, borderRadius: 'var(--r-md)' }}
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" viewBox="0 0 24 24">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              New conversation
            </button>
          </div>

          {/* Conversation list */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 14px' }}>
            <SideLabel action={
              <button
                onClick={() => fetchHistory(20)}
                className="f-ui"
                style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-faint)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px', letterSpacing: '0.04em', textTransform: 'uppercase' }}
              >
                Refresh
              </button>
            }>
              History
            </SideLabel>

            {isLoadingHist ? (
              <div style={{ display:'flex', justifyContent:'center', padding:'20px 0' }}>
                <div className="spinner" />
              </div>
            ) : chatHistory.length > 0 ? (
              <div style={{ display:'flex', flexDirection:'column', gap: 2 }}>
                {chatHistory.map(chat => (
                  <button
                    key={chat.id}
                    onClick={() => handleSelectChat(chat.id)}
                    className={`convo-item${chat.id === chatId ? ' active' : ''}`}
                  >
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap: 8 }}>
                      <div style={{ flex:1, minWidth:0 }}>
                        <p style={{
                          fontSize: 13.5,
                          fontWeight: chat.id === chatId ? 600 : 500,
                          color: chat.id === chatId ? 'var(--text-primary)' : 'var(--text-body)',
                          whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
                          marginBottom: 3,
                        }}>
                          {chat.title || 'Untitled conversation'}
                        </p>
                        <p style={{ fontSize: 12, color: 'var(--text-faint)' }}>{chat.messageCount} messages</p>
                      </div>
                      <span style={{ fontSize: 11.5, color: 'var(--text-faint)', flexShrink: 0 }}>
                        {fmtDate(chat.lastMessage || chat.createdAt)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: 13.5, color: 'var(--text-faint)', lineHeight: 1.7 }}>
                Saved conversations will appear here once you begin chatting.
              </p>
            )}
          </div>

          {/* Conversation cues */}
          <div style={{ padding: '14px 14px 18px', borderTop: '1px solid var(--border-faint)', flexShrink: 0 }}>
            <SideLabel>Cues</SideLabel>
            <div style={{ display:'flex', flexDirection:'column', gap: 6 }}>
              {QUICK_PROMPTS.map(p => (
                <button
                  key={p}
                  onClick={() => loadPrompt(p)}
                  className="f-ui"
                  style={{
                    padding: '9px 12px',
                    borderRadius: 'var(--r-md)',
                    fontSize: 13,
                    color: 'var(--text-muted)',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-faint)',
                    textAlign: 'left',
                    lineHeight: 1.55,
                    cursor: 'pointer',
                    transition: 'all 0.15s var(--ease)',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-overlay)'; e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.color = 'var(--text-body)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-elevated)'; e.currentTarget.style.borderColor = 'var(--border-faint)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* ── Chat surface ──────────────────────────────── */}
        <main
          style={{
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
            overflow: 'hidden',
            background: 'var(--bg-base)',
          }}
        >
          {/* Chat sub-header */}
          <div
            style={{
              padding: '14px 28px',
              borderBottom: '1px solid var(--border-faint)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0,
              background: 'var(--bg-base)',
            }}
          >
            <div>
              <p className="t-label" style={{ marginBottom: 4 }}>Private chat</p>
              <p className="f-display" style={{ fontSize: 18, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                {chatId ? 'Continuing your session' : 'New thread'}
              </p>
            </div>
            {chatId && (
              <button onClick={startNewChat} className="btn btn-ghost f-ui" style={{ fontSize: 13.5 }}>
                + New thread
              </button>
            )}
          </div>

          {/* Chat body */}
          {activeTab === 'mood' ? (
            <div style={{ flex:1, overflowY:'auto', padding:'28px 36px' }}>
              <p className="t-label" style={{ marginBottom: 12 }}>Mood history · 7 days</p>
              <h2 className="f-display t-h2" style={{ marginBottom: 28, color: 'var(--text-primary)' }}>
                A softer view of recent emotional patterns.
              </h2>
              {moodHistory.length > 0 ? (
                <div style={{ display:'flex', flexDirection:'column', gap: 12, maxWidth: 640 }}>
                  {moodHistory.map((item, i) => (
                    <div
                      key={i}
                      style={{
                        display:'flex', alignItems:'center', justifyContent:'space-between',
                        padding:'14px 20px', borderRadius:'var(--r-lg)',
                        background:'var(--bg-raised)', border:'1px solid var(--border-subtle)',
                      }}
                    >
                      <div style={{ display:'flex', alignItems:'center', gap: 12 }}>
                        <span className={`mood-tag ${getMoodClass(item._id)}`}>{MOOD_LABELS[item._id] || item._id}</span>
                        <p style={{ fontSize:15, fontWeight:500, color:'var(--text-primary)', textTransform:'capitalize' }}>{item._id}</p>
                      </div>
                      <div style={{ textAlign:'right' }}>
                        <p style={{ fontSize:15, fontWeight:600, color:'var(--text-body)' }}>{item.count} entries</p>
                        <p style={{ fontSize:12.5, color:'var(--text-faint)', marginTop:3 }}>
                          {((item.avgConfidence || 0.5) * 100).toFixed(0)}% confidence
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize:15, color:'var(--text-faint)', lineHeight:1.75 }}>
                  No mood history yet. Once you start chatting, emotional patterns will surface here.
                </p>
              )}
            </div>
          ) : (
            <ChatBoxView
              chatId={chatId}
              messages={messages}
              onNewMessage={handleNewMessage}
              onChatIdChange={handleChatIdChange}
              onConversationPersisted={handlePersisted}
            />
          )}
        </main>

        {/* ── Right panel ───────────────────────────────── */}
        <aside
          className="right-panel"
          style={{
            borderLeft: '1px solid var(--border-faint)',
            background: 'var(--bg-raised)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <div style={{ flex:1, overflowY:'auto', padding: '20px 18px', display:'flex', flexDirection:'column', gap: 18 }}>

            {/* Anchors */}
            <div>
              <SideLabel>Gentle anchors</SideLabel>
              <p className="f-display" style={{ fontSize: 20, color:'var(--text-primary)', marginBottom: 14, lineHeight: 1.3 }}>
                Small holds for a difficult moment.
              </p>
              <div style={{ display:'flex', flexDirection:'column', gap: 8 }}>
                {[
                  'Pause for one slower breath than feels natural.',
                  'Name the hardest part of today in one sentence.',
                  'Choose one tiny action that lowers pressure by 5%.',
                ].map((tip, i) => (
                  <div
                    key={i}
                    style={{
                      padding:'11px 14px',
                      borderRadius:'var(--r-md)',
                      background:'var(--bg-elevated)',
                      border:'1px solid var(--border-faint)',
                      fontSize: 13.5,
                      color:'var(--text-muted)',
                      lineHeight: 1.6,
                    }}
                  >
                    {tip}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ borderTop:'1px solid var(--border-faint)' }} />

            {/* Mood summary */}
            <div>
              <SideLabel>Recent mood</SideLabel>
              {moodHistory.length > 0 ? (
                <div style={{ display:'flex', flexDirection:'column', gap: 7 }}>
                  {moodHistory.slice(0,5).map((item, i) => (
                    <div
                      key={i}
                      style={{
                        display:'flex', alignItems:'center', justifyContent:'space-between',
                        padding:'8px 10px', borderRadius:'var(--r-md)',
                        background:'var(--bg-elevated)',
                      }}
                    >
                      <div style={{ display:'flex', alignItems:'center', gap: 8 }}>
                        <span className={`mood-tag ${getMoodClass(item._id)}`} style={{ fontSize: 10.5 }}>{MOOD_LABELS[item._id] || item._id}</span>
                        <span style={{ fontSize:13, color:'var(--text-muted)', textTransform:'capitalize' }}>{item._id}</span>
                      </div>
                      <span style={{ fontSize:13, fontWeight:600, color:'var(--text-body)' }}>×{item.count}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize:13, color:'var(--text-faint)', lineHeight:1.65 }}>
                  Mood patterns appear after a few conversations.
                </p>
              )}
            </div>

            <div style={{ borderTop:'1px solid var(--border-faint)' }} />

            {/* Crisis */}
            <div>
              <SideLabel>Support now</SideLabel>
              <div style={{ display:'flex', flexDirection:'column', gap: 9 }}>
                <div style={{ padding:'12px 16px', borderRadius:'var(--r-md)', background:'rgba(200,168,130,0.08)', border:'1px solid rgba(200,168,130,0.18)' }}>
                  <p className="t-label" style={{ color:'var(--accent)', marginBottom: 6, fontSize: 9.5 }}>Call or text</p>
                  <p className="f-display" style={{ fontSize:30, color:'var(--text-primary)', lineHeight:1 }}>988</p>
                  <p style={{ fontSize:12.5, color:'var(--text-muted)', marginTop:4 }}>Suicide & Crisis Lifeline</p>
                </div>
                <div style={{ padding:'10px 14px', borderRadius:'var(--r-md)', background:'var(--sage-bg)', border:'1px solid rgba(107,143,113,0.20)' }}>
                  <p style={{ fontSize:13, fontWeight:600, color:'var(--sage-bright)', marginBottom:4 }}>Crisis Text Line</p>
                  <p style={{ fontSize:13, color:'var(--text-muted)' }}>
                    Text <strong style={{ color:'var(--text-body)' }}>HOME</strong> to <strong style={{ color:'var(--text-body)' }}>741741</strong>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>

      <style>{`
        @media (max-width: 1120px) {
          .chat-layout { grid-template-columns: 240px minmax(0,1fr) !important; }
          .right-panel { display: none !important; }
        }
        @media (max-width: 720px) {
          .chat-layout { grid-template-columns: 1fr !important; }
          .chat-sidebar { display: none !important; }
          .mobile-tabs { display: flex !important; }
        }
        @media (min-width: 721px) {
          .mobile-tabs { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default Chat;
