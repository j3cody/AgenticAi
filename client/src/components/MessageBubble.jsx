/**
 * MessageBubble Component
 * Displays a single chat message with styling
 */

import React from 'react';

/**
 * MessageBubble renders a chat message with appropriate styling
 * based on whether it's from the user or AI
 *
 * @param {Object} props
 * @param {string} props.role - 'user' or 'assistant'
 * @param {string} props.content - Message content
 * @param {string} props.mood - Detected mood (optional, for user messages)
 * @param {number} props.confidence - Mood confidence (optional)
 * @param {string} props.timestamp - Message timestamp
 * @param {Array} props.resources - Helpful resources (for AI messages)
 * @param {string} props.riskLevel - Safety risk level (optional)
 * @param {string} props.followUp - Suggested follow-up question
 * @param {Object} props.safety - Safety metadata
 */
const MessageBubble = ({
  role,
  content,
  mood,
  confidence,
  timestamp,
  resources,
  riskLevel,
  followUp,
  safety
}) => {
  const isUser = role === 'user';

  // Format timestamp
  const formatTime = (time) => {
    if (!time) return '';
    const date = new Date(time);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Get mood emoji
  const getMoodEmoji = (mood) => {
    const moodEmojis = {
      happy: '😊',
      sad: '😢',
      anxious: '😰',
      angry: '😠',
      stressed: '😫',
      hopeful: '🌟',
      confused: '😕',
      overwhelmed: '😩',
      calm: '😌',
      neutral: '😐'
    };
    return moodEmojis[mood] || '💭';
  };

  // Get risk level styling
  const getRiskLevelStyle = (level) => {
    if (!level || level === 'none') return '';
    const styles = {
      low: 'border-yellow-400',
      medium: 'border-orange-400',
      high: 'border-red-400',
      crisis: 'border-red-600 bg-red-50'
    };
    return styles[level] || '';
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-[80%] md:max-w-[70%]`}>
        {/* Message bubble */}
        <div
          className={`rounded-2xl px-4 py-3 ${
            isUser
              ? 'bg-blue-500 text-white rounded-br-none'
              : `bg-white text-gray-800 rounded-bl-none shadow-md border ${getRiskLevelStyle(riskLevel)}`
          }`}
        >
          {/* Message content */}
          <p className="whitespace-pre-wrap break-words">{content}</p>

          {/* Mood indicator for user messages */}
          {isUser && mood && (
            <div className="mt-2 pt-2 border-t border-blue-400 text-xs text-blue-100">
              <span>
                {getMoodEmoji(mood)} {mood}
                {confidence && ` (${(confidence * 100).toFixed(0)}%)`}
              </span>
            </div>
          )}

          {/* Resources for AI messages */}
          {!isUser && resources && resources.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-xs font-semibold text-gray-500 mb-2">
                Helpful Resources:
              </p>
              {resources.map((resource, index) => (
                <div key={index} className="text-sm text-gray-600 mb-1">
                  <span className="font-medium">{resource.name}</span>
                  {resource.contact && (
                    <span className="ml-1">- {resource.contact}</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {!isUser && (followUp || safety) && (
            <div className="mt-3 pt-3 border-t border-gray-200 space-y-2 text-sm text-gray-600">
              {safety?.riskLevel && safety.riskLevel !== 'none' && (
                <div>
                  <span className="font-medium text-gray-700">Safety:</span>{' '}
                  <span className="capitalize">{safety.riskLevel}</span>
                  {safety.needsAttention ? ' attention required' : ''}
                </div>
              )}

              {followUp && (
                <div className="rounded-xl bg-blue-50 px-3 py-2 text-blue-900">
                  <span className="font-medium">A gentle next step:</span> {followUp}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Timestamp and mood badge for AI messages */}
        {!isUser && (
          <div className="flex items-center mt-1 ml-2 text-xs text-gray-400">
            <span>{formatTime(timestamp)}</span>
            {mood && (
              <span className="ml-2 px-2 py-0.5 bg-gray-100 rounded-full">
                {getMoodEmoji(mood)} {mood}
              </span>
            )}
          </div>
        )}

        {/* Timestamp for user messages */}
        {isUser && (
          <div className="text-xs text-gray-400 text-right mr-2 mt-1">
            {formatTime(timestamp)}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
