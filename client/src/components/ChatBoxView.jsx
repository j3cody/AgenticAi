import React, { useEffect, useRef, useState } from 'react';
import MessageBubbleView from './MessageBubbleView';
import { sendMessage } from '../services/api';

const SUGGESTIONS = [
  "I'm feeling stretched thin and need help slowing down",
  'Can you help me settle anxious thoughts right now?',
  'I want a simple reset for the rest of today'
];

const ChatBoxView = ({ chatId, messages, onNewMessage, onChatIdChange }) => {
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleSetInput = (event) => {
      if (typeof event.detail === 'string') {
        setInputMessage(event.detail);
        inputRef.current?.focus();
      }
    };

    window.addEventListener('chat:set-input', handleSetInput);
    return () => window.removeEventListener('chat:set-input', handleSetInput);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) {
      return;
    }

    const messageText = inputMessage.trim();
    setInputMessage('');
    setError(null);
    onNewMessage({
      role: 'user',
      content: messageText,
      timestamp: new Date().toISOString()
    });

    setIsTyping(true);

    try {
      const response = await sendMessage({ message: messageText, chatId });
      if (response.success) {
        if (response.data.chatId && !chatId) {
          onChatIdChange(response.data.chatId);
        }

        onNewMessage({
          role: 'assistant',
          content: response.data.response,
          timestamp: new Date().toISOString(),
          mood: response.data.mood?.mood,
          confidence: response.data.mood?.confidence,
          resources: response.data.resources,
          riskLevel: response.data.safety?.riskLevel,
          followUp: response.data.followUp,
          safety: response.data.safety
        });
      } else {
        setError(response.message || 'Failed to get response');
      }
    } catch (err) {
      console.error('Chat error:', err);
      setError('Failed to send message. Please try again.');
    } finally {
      setIsTyping(false);
      inputRef.current?.focus();
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto px-3 py-4 md:px-5 md:py-5">
        {messages.length === 0 && (
          <div className="mx-auto max-w-3xl py-8 md:py-12">
            <div className="soft-card rounded-[30px] px-6 py-8 text-center md:px-10 md:py-10">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#f3dfd0] text-[#8d5337] shadow-sm">
                <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.8"
                    d="M12 21c4.97-4.35 8-7.41 8-11a4 4 0 0 0-7-2.65A4 4 0 0 0 4 10c0 3.59 3.03 6.65 8 11Z"
                  />
                </svg>
              </div>
              <h2 className="serif-display mt-5 text-3xl text-[#2f241c]">
                Start with what feels most true right now.
              </h2>
              <p className="ui-sans mx-auto mt-4 max-w-2xl text-sm leading-7 text-[#6a5546] md:text-base">
                You do not need the perfect wording. Describe the feeling, the pressure, or the thought loop,
                and the assistant will respond with calm, practical support.
              </p>
              <div className="mt-8 grid gap-3 md:grid-cols-3">
                {SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setInputMessage(suggestion)}
                    className="ui-sans rounded-2xl border border-[#e8d6c5] bg-[#fffaf2] px-4 py-4 text-left text-sm leading-6 text-[#5f4a3b] hover:border-[#d8b49e] hover:bg-white"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="mx-auto flex w-full max-w-4xl flex-col">
          {messages.map((message, index) => (
            <MessageBubbleView key={index} {...message} />
          ))}
        </div>

        {isTyping && (
          <div className="mx-auto flex w-full max-w-4xl justify-start">
            <div className="warm-ring rounded-[24px] border border-[rgba(120,87,48,0.1)] bg-[#fffaf2] px-5 py-4 text-[#5f4a3b]">
              <div className="ui-sans flex items-center space-x-3 text-sm">
                <div className="flex space-x-1">
                  <div className="h-2 w-2 rounded-full bg-[#bb5a34] animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="h-2 w-2 rounded-full bg-[#d59675] animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="h-2 w-2 rounded-full bg-[#c7b08f] animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
                <span>Thinking through a gentle next response...</span>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mx-auto flex w-full max-w-4xl justify-center">
            <div className="ui-sans rounded-2xl bg-[#fff0ea] px-4 py-3 text-sm text-[#9a3e24]">
              {error}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-[rgba(120,87,48,0.12)] bg-[rgba(255,250,244,0.88)] px-3 py-4 backdrop-blur md:px-5">
        <form onSubmit={handleSubmit} className="mx-auto max-w-4xl">
          <div className="warm-ring flex items-end gap-3 rounded-[28px] border border-[rgba(120,87,48,0.12)] bg-[#fffaf2] p-3 md:p-4">
            <div className="flex-1">
              <p className="ui-sans mb-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8f6b55]">
                What feels most important right now?
              </p>
              <textarea
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => {
                  setInputMessage(e.target.value);
                  setError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                placeholder="Write freely. A sentence is enough."
                disabled={isTyping}
                rows={1}
                className="ui-sans w-full resize-none rounded-2xl border border-[#ead9ca] bg-white px-4 py-3 text-[15px] leading-7 text-[#3c3027] focus:border-[#cf8f6e] focus:ring-2 focus:ring-[#f0cfbb] disabled:bg-[#f8f2eb]"
                style={{ minHeight: '52px', maxHeight: '150px' }}
              />
            </div>
            <button
              type="submit"
              disabled={!inputMessage.trim() || isTyping}
              className="ui-sans rounded-2xl bg-[#b65c36] px-5 py-3 text-sm font-semibold text-[#fffaf5] hover:bg-[#a54f2c] focus:outline-none focus:ring-2 focus:ring-[#e3b49b] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isTyping ? '...' : 'Send'}
            </button>
          </div>
          <p className="ui-sans mt-3 text-center text-xs leading-6 text-[#8f6b55]">
            This assistant offers supportive guidance, not medical diagnosis or emergency care.
            If safety feels urgent, contact local emergency support or 988 immediately.
          </p>
        </form>
      </div>
    </div>
  );
};

export default ChatBoxView;
