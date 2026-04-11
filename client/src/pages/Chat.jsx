/**
 * Chat Page Component
 * Main chat interface with message history and mood tracking
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ChatBoxView from '../components/ChatBoxView';
import { getMoodHistory } from '../services/api';

const QUICK_PROMPTS = [
  'I am carrying too much at once and need help slowing down',
  'Can you help me calm racing thoughts before bed?',
  'I want a gentle plan for getting through today'
];

const MOOD_LABELS = {
  happy: 'Bright',
  sad: 'Low',
  anxious: 'Anxious',
  angry: 'Tense',
  stressed: 'Stressed',
  hopeful: 'Hopeful',
  confused: 'Unclear',
  overwhelmed: 'Overwhelmed',
  calm: 'Calm',
  neutral: 'Steady'
};

const Chat = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [chatId, setChatId] = useState(null);
  const [activeTab, setActiveTab] = useState('chat');
  const [moodHistory, setMoodHistory] = useState([]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const fetchMoodHistory = async () => {
      try {
        const response = await getMoodHistory(7);
        if (response.success) {
          setMoodHistory(response.data.distribution || []);
        }
      } catch (err) {
        console.error('Failed to fetch mood history:', err);
      }
    };

    if (isAuthenticated) {
      fetchMoodHistory();
    }
  }, [isAuthenticated]);

  const handleNewMessage = (message) => {
    setMessages((prev) => [...prev, message]);
  };

  const handleChatIdChange = (id) => {
    setChatId(id);
  };

  const startNewChat = () => {
    setMessages([]);
    setChatId(null);
    setActiveTab('chat');
  };

  const loadPrompt = (prompt) => {
    setActiveTab('chat');
    setMessages([]);
    setChatId(null);
    window.dispatchEvent(new CustomEvent('chat:set-input', { detail: prompt }));
  };

  const getMoodLabel = (mood) => MOOD_LABELS[mood] || 'Reflective';

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen px-3 pb-4 pt-3 md:px-5 md:pb-6 md:pt-4">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-[1500px] flex-col gap-4">
        <section className="soft-panel overflow-hidden rounded-[28px] px-5 py-5 md:px-8 md:py-7">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="ui-sans text-xs font-semibold uppercase tracking-[0.3em] text-[#8f6b55]">
                Guided Support Space
              </p>
              <h1 className="serif-display mt-3 text-4xl leading-tight text-[#2f241c] md:text-5xl">
                A calmer place to sort through what feels heavy.
              </h1>
              <p className="ui-sans mt-4 max-w-2xl text-sm leading-7 text-[#6a5546] md:text-base">
                This conversation space is designed to feel gentle, readable, and private.
                Gemini powers the reflective parts of the orchestrator behind the scenes,
                while the interface stays focused on what actually helps in the moment.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[420px]">
              <div className="soft-card rounded-2xl px-4 py-4">
                <p className="ui-sans text-[11px] uppercase tracking-[0.24em] text-[#8f6b55]">Recent moods</p>
                <p className="serif-display mt-2 text-3xl text-[#2f241c]">
                  {Array.isArray(moodHistory) ? moodHistory.length : 0}
                </p>
                <p className="ui-sans mt-1 text-xs text-[#6a5546]">Patterns from the last 7 days</p>
              </div>

              <div className="soft-card rounded-2xl px-4 py-4">
                <p className="ui-sans text-[11px] uppercase tracking-[0.24em] text-[#8f6b55]">Support style</p>
                <p className="serif-display mt-2 text-2xl text-[#2f241c]">Warm, practical</p>
                <p className="ui-sans mt-1 text-xs text-[#6a5546]">Built for steady, reflective replies</p>
              </div>

              <div className="soft-card rounded-2xl px-4 py-4">
                <p className="ui-sans text-[11px] uppercase tracking-[0.24em] text-[#8f6b55]">Immediate help</p>
                <p className="serif-display mt-2 text-2xl text-[#2f241c]">988</p>
                <p className="ui-sans mt-1 text-xs text-[#6a5546]">Use crisis support if safety is urgent</p>
              </div>
            </div>
          </div>
        </section>

        <div className="grid flex-1 gap-4 xl:grid-cols-[280px_minmax(0,1fr)_300px]">
          <aside className="soft-panel hidden rounded-[26px] p-4 xl:block">
            <button
              onClick={startNewChat}
              className="ui-sans warm-ring flex w-full items-center justify-center gap-2 rounded-2xl bg-[#b65c36] px-4 py-3 text-sm font-semibold text-[#fffaf5] hover:bg-[#a54f2c]"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              <span>Start a fresh conversation</span>
            </button>

            <div className="mt-5 rounded-3xl bg-[#f9f2ea] p-4">
              <p className="ui-sans text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8f6b55]">
                Conversation cues
              </p>
              <div className="mt-3 space-y-2">
                {QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => loadPrompt(prompt)}
                    className="ui-sans block w-full rounded-2xl border border-[#ead8c9] bg-white px-3 py-3 text-left text-sm leading-6 text-[#5f4a3b] hover:border-[#d8b49e] hover:bg-[#fffdf9]"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5 soft-card rounded-3xl p-4">
              <p className="ui-sans text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8f6b55]">
                Recent mood rhythm
              </p>
              {moodHistory.length > 0 ? (
                <div className="mt-4 space-y-3">
                  {moodHistory.slice(0, 6).map((item, index) => (
                    <div key={index} className="flex items-center justify-between rounded-2xl bg-[#fffaf2] px-3 py-2">
                      <span className="ui-sans flex items-center gap-2 text-sm text-[#4f3f32]">
                        <span className="rounded-full bg-[#f0e4d8] px-2 py-1 text-xs font-semibold text-[#7e624f]">
                          {getMoodLabel(item._id)}
                        </span>
                        <span className="capitalize">{item._id}</span>
                      </span>
                      <span className="ui-sans text-xs font-semibold text-[#8f6b55]">{item.count}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="ui-sans mt-3 text-sm leading-6 text-[#6a5546]">
                  Mood patterns will appear here once you have a few conversations.
                </p>
              )}
            </div>
          </aside>

          <main className="soft-panel flex min-h-[72vh] flex-col overflow-hidden rounded-[30px]">
            <div className="border-b border-[rgba(120,87,48,0.12)] px-4 py-4 md:px-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="ui-sans text-xs font-semibold uppercase tracking-[0.24em] text-[#8f6b55]">
                    Private Chat
                  </p>
                  <h2 className="serif-display mt-1 text-2xl text-[#2f241c]">
                    Let the conversation unfold at your pace.
                  </h2>
                </div>

                <div className="flex gap-2 md:hidden">
                  <button
                    onClick={() => setActiveTab('chat')}
                    className={`ui-sans rounded-full px-4 py-2 text-sm ${
                      activeTab === 'chat' ? 'bg-[#b65c36] text-white' : 'bg-[#efe4d8] text-[#6a5546]'
                    }`}
                  >
                    Chat
                  </button>
                  <button
                    onClick={() => setActiveTab('mood')}
                    className={`ui-sans rounded-full px-4 py-2 text-sm ${
                      activeTab === 'mood' ? 'bg-[#b65c36] text-white' : 'bg-[#efe4d8] text-[#6a5546]'
                    }`}
                  >
                    Mood
                  </button>
                </div>
              </div>
            </div>

            {activeTab === 'chat' ? (
              <ChatBoxView
                chatId={chatId}
                messages={messages}
                onNewMessage={handleNewMessage}
                onChatIdChange={handleChatIdChange}
              />
            ) : (
              <div className="flex-1 overflow-y-auto p-4 md:p-6">
                <div className="soft-card rounded-[28px] p-5 md:p-6">
                  <p className="ui-sans text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8f6b55]">
                    Mood history
                  </p>
                  <h3 className="serif-display mt-2 text-3xl text-[#2f241c]">
                    A softer view of your recent emotional patterns.
                  </h3>
                  {moodHistory.length > 0 ? (
                    <div className="mt-6 grid gap-3">
                      {moodHistory.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between rounded-3xl border border-[rgba(120,87,48,0.1)] bg-[#fffaf2] px-4 py-4"
                        >
                          <span className="flex items-center gap-3">
                            <span className="rounded-full bg-[#f0e4d8] px-2 py-1 text-xs font-semibold text-[#7e624f]">
                              {getMoodLabel(item._id)}
                            </span>
                            <span>
                              <span className="ui-sans block text-sm font-semibold capitalize text-[#4f3f32]">
                                {item._id}
                              </span>
                              <span className="ui-sans text-xs text-[#8f6b55]">Seen across recent chats</span>
                            </span>
                          </span>
                          <div className="text-right">
                            <p className="ui-sans text-sm font-semibold text-[#4f3f32]">{item.count} entries</p>
                            <p className="ui-sans text-xs text-[#8f6b55]">
                              Avg confidence {((item.avgConfidence || 0.5) * 100).toFixed(0)}%
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="ui-sans mt-5 text-sm leading-7 text-[#6a5546]">
                      No mood history yet. Once you start chatting, this space will quietly track broad emotional patterns.
                    </p>
                  )}
                </div>
              </div>
            )}
          </main>

          <aside className="soft-panel hidden rounded-[26px] p-4 lg:block">
            <div className="soft-card rounded-[28px] p-5">
              <p className="ui-sans text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8f6b55]">
                Gentle guide
              </p>
              <h3 className="serif-display mt-2 text-2xl text-[#2f241c]">Small anchors for a difficult day.</h3>
              <ul className="ui-sans mt-5 space-y-3 text-sm leading-6 text-[#5f4a3b]">
                <li className="rounded-2xl bg-[#fffaf2] px-3 py-3">Pause for one slower breath than feels natural.</li>
                <li className="rounded-2xl bg-[#fffaf2] px-3 py-3">Name the hardest part of today in one sentence.</li>
                <li className="rounded-2xl bg-[#fffaf2] px-3 py-3">Choose one tiny action that lowers pressure by 5%.</li>
              </ul>
            </div>

            <div className="mt-4 rounded-[28px] bg-[linear-gradient(145deg,#dce6dc,#f3e2d6)] p-[1px]">
              <div className="rounded-[27px] bg-[#fffaf4] p-5">
                <p className="ui-sans text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8f6b55]">
                  Support now
                </p>
                <div className="mt-4 space-y-3">
                  <div className="rounded-2xl bg-[#fff1eb] px-4 py-3">
                    <p className="ui-sans text-xs font-semibold uppercase tracking-[0.2em] text-[#a64d2a]">Call or text</p>
                    <p className="serif-display mt-1 text-3xl text-[#7d3419]">988</p>
                    <p className="ui-sans mt-1 text-xs text-[#7a5b4c]">Suicide & Crisis Lifeline</p>
                  </div>
                  <div className="rounded-2xl bg-[#edf4ec] px-4 py-3">
                    <p className="ui-sans text-sm font-semibold text-[#355146]">Crisis Text Line</p>
                    <p className="ui-sans mt-1 text-sm text-[#5f4a3b]">
                      Text <span className="font-semibold">HOME</span> to <span className="font-semibold">741741</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default Chat;
