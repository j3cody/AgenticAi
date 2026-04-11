import React from 'react';

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

const MessageBubbleView = ({
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

  const formatTime = (time) => {
    if (!time) {
      return '';
    }

    const date = new Date(time);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getMoodLabel = (currentMood) => MOOD_LABELS[currentMood] || 'Reflective';

  const getRiskLevelStyle = (level) => {
    if (!level || level === 'none') {
      return '';
    }

    const styles = {
      low: 'border-[#e2b454]',
      medium: 'border-[#d88742]',
      high: 'border-[#cc5a3c]',
      crisis: 'border-[#ab2d1b] bg-[#fff1eb]'
    };

    return styles[level] || '';
  };

  return (
    <div className={`mb-5 flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className="max-w-[88%] md:max-w-[76%]">
        {!isUser && (
          <div className="mb-2 ml-2 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#ecd5c4] text-[#8d5337] shadow-sm">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.8"
                  d="M12 5c4.5 0 7 3.2 7 7.2 0 4.5-3.2 6.8-7 6.8s-7-2.3-7-6.8C5 8.2 7.5 5 12 5Z"
                />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9.5 12.5h.01M14.5 12.5h.01M9.5 15.5c.9.7 1.7 1 2.5 1s1.6-.3 2.5-1" />
              </svg>
            </div>
            <div>
              <p className="ui-sans text-xs font-semibold uppercase tracking-[0.2em] text-[#8f6b55]">
                Support companion
              </p>
              <p className="ui-sans text-xs text-[#a08470]">{formatTime(timestamp)}</p>
            </div>
          </div>
        )}

        <div
          className={`rounded-2xl px-4 py-4 ${
            isUser
              ? 'warm-ring rounded-br-md bg-[linear-gradient(135deg,#bc6039,#8f4528)] text-[#fff8f1]'
              : `warm-ring rounded-bl-md border bg-[#fffaf2] text-[#3f3128] ${getRiskLevelStyle(riskLevel)}`
          }`}
        >
          <p className={`whitespace-pre-wrap break-words ${isUser ? 'ui-sans text-[15px] leading-7' : 'text-[17px] leading-8'}`}>
            {content}
          </p>

          {isUser && mood && (
            <div className="ui-sans mt-3 border-t border-[rgba(255,248,241,0.2)] pt-3 text-xs text-[#f8dfcf]">
              <span>
                Mood: {getMoodLabel(mood)}
                {confidence && ` (${(confidence * 100).toFixed(0)}%)`}
              </span>
            </div>
          )}

          {!isUser && resources && resources.length > 0 && (
            <div className="mt-4 border-t border-[rgba(120,87,48,0.12)] pt-4">
              <p className="ui-sans mb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8f6b55]">
                Helpful Resources
              </p>
              {resources.map((resource, index) => (
                <div key={index} className="ui-sans mb-2 rounded-2xl bg-[#f6efe7] px-3 py-2 text-sm text-[#5f4a3b]">
                  <span className="font-medium">{resource.name}</span>
                  {resource.contact ? <span className="ml-1">- {resource.contact}</span> : null}
                </div>
              ))}
            </div>
          )}

          {!isUser && (followUp || safety) && (
            <div className="mt-4 space-y-3 border-t border-[rgba(120,87,48,0.12)] pt-4 text-sm text-[#5f4a3b]">
              {safety?.riskLevel && safety.riskLevel !== 'none' && (
                <div className="ui-sans rounded-2xl bg-[#fff2df] px-3 py-2">
                  <span className="font-medium text-[#7a4d1f]">Safety:</span>{' '}
                  <span className="capitalize">{safety.riskLevel}</span>
                  {safety.needsAttention ? ' attention required' : ''}
                </div>
              )}

              {followUp && (
                <div className="ui-sans rounded-2xl bg-[#eef4eb] px-3 py-3 text-[#355146]">
                  <span className="font-medium">A gentle next step:</span> {followUp}
                </div>
              )}
            </div>
          )}
        </div>

        {isUser ? (
          <div className="ui-sans mr-2 mt-2 text-right text-xs text-[#9e8574]">{formatTime(timestamp)}</div>
        ) : (
          <div className="ui-sans mt-2 ml-2 flex items-center gap-2 text-xs text-[#9e8574]">
            {mood ? (
              <span className="rounded-full bg-[#f4ebdf] px-2 py-1">
                Mood: {getMoodLabel(mood)}
              </span>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubbleView;
