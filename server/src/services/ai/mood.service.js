/**
 * Mood Detection Service
 * Analyzes user messages to detect emotional state
 * Uses the configured LLM provider for intelligent mood detection
 */

const { llmClient, createJsonChatCompletion, hasLlmKey } = require('../../config/llm');

/**
 * Valid mood categories
 * These are the emotional states we can detect
 */
const MOOD_CATEGORIES = [
  'happy',
  'sad',
  'anxious',
  'angry',
  'neutral',
  'stressed',
  'hopeful',
  'confused',
  'overwhelmed',
  'calm'
];

/**
 * System prompt for mood detection
 * Guides the AI to analyze emotional content
 */
const MOOD_SYSTEM_PROMPT = `You are an expert emotional intelligence analyzer. Your task is to detect the primary emotional state from user messages.

Analyze the message and respond with a JSON object containing:
1. "mood": The primary emotion (one of: happy, sad, anxious, angry, neutral, stressed, hopeful, confused, overwhelmed, calm)
2. "confidence": A confidence score between 0 and 1
3. "indicators": Array of key phrases that indicate this mood
4. "reasoning": Brief explanation for your analysis

Important guidelines:
- Focus on the primary emotion, not secondary ones
- Consider context and nuance in language
- If the message is ambiguous, provide a lower confidence score
- Look for emotional keywords, tone, and context clues
- Return JSON only with no markdown fences or extra text`;

/**
 * Detect mood from user message
 * @param {string} message - User's message
 * @param {Array} conversationHistory - Previous messages for context (optional)
 * @returns {Promise<Object>} Mood detection result
 */
const detectMood = async (message, conversationHistory = []) => {
  try {
    if (!hasLlmKey || !llmClient) {
      return fallbackMoodDetection(message);
    }

    // Build context from conversation history
    let contextMessage = '';
    if (conversationHistory.length > 0) {
      const recentHistory = conversationHistory.slice(-5);
      contextMessage = `\n\nRecent conversation context:\n${recentHistory.map(m => `${m.role}: ${m.content}`).join('\n')}`;
    }

    // Call the configured LLM API for mood detection
    const result = await createJsonChatCompletion({
      messages: [
        { role: 'system', content: MOOD_SYSTEM_PROMPT },
        { role: 'user', content: `Analyze the emotional state in this message:${contextMessage}\n\nMessage: "${message}"` }
      ],
      temperature: 0.3, // Lower temperature for more consistent analysis
      max_tokens: 500
    });

    // Validate mood is in allowed categories
    const normalizedMood = String(result.mood || '').toLowerCase();
    const validatedMood = MOOD_CATEGORIES.includes(normalizedMood)
      ? normalizedMood
      : 'neutral';

    // Ensure confidence is within bounds
    const confidence = Math.max(0, Math.min(1, result.confidence || 0.5));

    return {
      success: true,
      mood: validatedMood,
      confidence: confidence,
      indicators: result.indicators || [],
      reasoning: result.reasoning || 'Unable to provide reasoning',
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('Mood detection error:', error);

    // Fallback to simple keyword-based detection
    return fallbackMoodDetection(message);
  }
};

/**
 * Fallback mood detection using keywords
 * Used when the LLM API is unavailable
 * @param {string} message - User's message
 * @returns {Object} Basic mood detection result
 */
const fallbackMoodDetection = (message) => {
  const lowerMessage = message.toLowerCase();

  // Keyword mappings for each mood
  const moodKeywords = {
    happy: ['happy', 'joy', 'excited', 'great', 'wonderful', 'amazing', 'fantastic', 'glad', 'pleased', 'delighted'],
    sad: ['sad', 'unhappy', 'depressed', 'down', 'miserable', 'heartbroken', 'disappointed', 'lonely', 'grief'],
    anxious: ['anxious', 'worried', 'nervous', 'panic', 'fear', 'scared', 'uneasy', 'restless', 'tense'],
    angry: ['angry', 'frustrated', 'irritated', 'annoyed', 'furious', 'outraged', 'mad', 'upset'],
    stressed: ['stressed', 'overwhelmed', 'pressure', 'burden', 'exhausted', 'tired', 'drained', 'strained'],
    hopeful: ['hopeful', 'optimistic', 'looking forward', 'excited about', 'positive', 'encouraged'],
    confused: ['confused', 'unsure', 'uncertain', 'lost', 'don\'t understand', 'don\'t know', 'unclear'],
    overwhelmed: ['overwhelmed', 'too much', 'can\'t handle', 'drowning', 'swamped', 'buried'],
    calm: ['calm', 'peaceful', 'relaxed', 'serene', 'tranquil', 'content', 'at ease'],
    neutral: []
  };

  // Find matching mood
  for (const [mood, keywords] of Object.entries(moodKeywords)) {
    for (const keyword of keywords) {
      if (lowerMessage.includes(keyword)) {
        return {
          success: true,
          mood: mood,
          confidence: 0.7,
          indicators: [keyword],
          reasoning: `Detected keyword "${keyword}" suggesting ${mood} mood`,
          timestamp: new Date().toISOString(),
          fallback: true
        };
      }
    }
  }

  // Default to neutral
  return {
    success: true,
    mood: 'neutral',
    confidence: 0.5,
    indicators: [],
    reasoning: 'No specific mood indicators found, defaulting to neutral',
    timestamp: new Date().toISOString(),
    fallback: true
  };
};

/**
 * Get mood distribution from messages
 * @param {Array} messages - Array of messages
 * @returns {Promise<Object>} Mood distribution statistics
 */
const getMoodDistribution = async (messages) => {
  const distribution = {};

  for (const category of MOOD_CATEGORIES) {
    distribution[category] = 0;
  }

  for (const message of messages) {
    if (message.role === 'user' && message.detectedMood) {
      distribution[message.detectedMood]++;
    }
  }

  return {
    distribution,
    primaryMood: Object.entries(distribution)
      .sort((a, b) => b[1] - a[1])[0][0],
    totalMessages: messages.filter(m => m.role === 'user').length
  };
};

/**
 * Analyze mood trend over time
 * @param {Array} moodLogs - Array of mood logs from database
 * @returns {Object} Trend analysis
 */
const analyzeMoodTrend = (moodLogs) => {
  if (!moodLogs || moodLogs.length < 2) {
    return { trend: 'insufficient_data', direction: 'unknown' };
  }

  // Map moods to numerical values for trend analysis
  const moodValues = {
    'happy': 5, 'hopeful': 4, 'calm': 3, 'neutral': 2,
    'confused': 1, 'stressed': 0, 'anxious': -1,
    'overwhelmed': -2, 'sad': -3, 'angry': -4
  };

  const values = moodLogs.map(log => moodValues[log.mood] || 0);
  const avgFirst = values.slice(0, Math.floor(values.length / 2)).reduce((a, b) => a + b, 0) / (values.length / 2);
  const avgSecond = values.slice(Math.floor(values.length / 2)).reduce((a, b) => a + b, 0) / (values.length / 2);

  const direction = avgSecond > avgFirst ? 'improving' : avgSecond < avgFirst ? 'declining' : 'stable';

  return {
    trend: direction,
    direction: direction,
    averageChange: avgSecond - avgFirst,
    confidence: Math.abs(avgSecond - avgFirst) / 5
  };
};

module.exports = {
  detectMood,
  fallbackMoodDetection,
  getMoodDistribution,
  analyzeMoodTrend,
  MOOD_CATEGORIES
};
