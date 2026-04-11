/**
 * Safety Check Service
 * Detects harmful content and potential crisis situations
 * Critical for mental health applications to ensure user safety
 */

const { llmClient, createJsonChatCompletion, hasLlmKey } = require('../../config/llm');

/**
 * Risk levels for safety assessment
 */
const RISK_LEVELS = {
  NONE: 'none',
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRISIS: 'crisis'
};

/**
 * Risk categories that can be detected
 */
const RISK_CATEGORIES = [
  'self_harm',
  'suicide',
  'violence',
  'substance_abuse',
  'eating_disorder',
  'other'
];

/**
 * Emergency helpline resources
 * These are provided to users in crisis situations
 */
const EMERGENCY_RESOURCES = {
  general: [
    {
      name: 'National Suicide Prevention Lifeline',
      contact: '988 (US)',
      description: 'Free, 24/7 support for people in distress'
    },
    {
      name: 'Crisis Text Line',
      contact: 'Text HOME to 741741',
      description: 'Text-based crisis support available 24/7'
    },
    {
      name: 'International Association for Suicide Prevention',
      contact: 'https://www.iasp.info/resources/Crisis_Centres/',
      description: 'Find crisis centers worldwide'
    }
  ],
  self_harm: [
    {
      name: 'Self-Harm Hotline',
      contact: '1-800-366-8288',
      description: 'Support for those struggling with self-harm'
    }
  ],
  suicide: [
    {
      name: 'National Suicide Prevention Lifeline',
      contact: '988',
      description: 'Immediate help available 24/7'
    }
  ]
};

/**
 * Critical keywords that trigger immediate safety protocols
 */
const CRITICAL_KEYWORDS = [
  'suicide', 'kill myself', 'end my life', 'want to die',
  'hurt myself', 'self-harm', 'cut myself', 'overdose',
  'planning to end', 'no reason to live', 'better off dead'
];

/**
 * System prompt for AI-based safety detection
 */
const SAFETY_SYSTEM_PROMPT = `You are a mental health safety specialist. Your role is to assess messages for potential crisis situations or harmful content.

Analyze the message and respond with a JSON object containing:
1. "riskLevel": One of "none", "low", "medium", "high", or "crisis"
2. "riskScore": A number between 0 and 1
3. "riskCategories": Array of detected risk categories (self_harm, suicide, violence, substance_abuse, eating_disorder, other)
4. "triggerPhrases": Array of concerning phrases found
5. "assessment": Brief explanation of your assessment
6. "immediateAction": Boolean indicating if immediate intervention is needed

Important guidelines:
- Err on the side of caution
- Consider context and intent
- Direct statements about self-harm should always be flagged as high or crisis
- Vague expressions of distress should be flagged as low or medium
- When in doubt, assign a higher risk level
- Return JSON only with no markdown fences or extra text`;

/**
 * Check message for safety concerns
 * @param {string} message - User's message
 * @param {Array} conversationHistory - Previous messages for context
 * @returns {Promise<Object>} Safety assessment result
 */
const checkSafety = async (message, conversationHistory = []) => {
  try {
    // First, check for critical keywords (immediate flag)
    const criticalKeywordDetected = CRITICAL_KEYWORDS.some(keyword =>
      message.toLowerCase().includes(keyword.toLowerCase())
    );

    if (criticalKeywordDetected) {
      // Immediate high-risk response
      const quickAssessment = await quickSafetyCheck(message);
      if (quickAssessment.riskLevel === 'crisis' || quickAssessment.riskLevel === 'high') {
        return quickAssessment;
      }
    }

    if (!hasLlmKey || !llmClient) {
      return fallbackSafetyCheck(message);
    }

    // Build context from conversation
    let contextMessage = '';
    if (conversationHistory.length > 0) {
      const recentHistory = conversationHistory.slice(-5);
      contextMessage = `\n\nRecent conversation context:\n${recentHistory.map(m => `${m.role}: ${m.content}`).join('\n')}`;
    }

    // Call the configured LLM for detailed safety analysis
    const result = await createJsonChatCompletion({
      messages: [
        { role: 'system', content: SAFETY_SYSTEM_PROMPT },
        { role: 'user', content: `Assess the safety of this message:${contextMessage}\n\nMessage: "${message}"` }
      ],
      temperature: 0.1, // Very low temperature for consistent safety assessment
      max_tokens: 500
    });

    // Validate and normalize the result
    const validatedLevel = Object.values(RISK_LEVELS).includes(result.riskLevel)
      ? result.riskLevel
      : 'none';

    return {
      success: true,
      riskLevel: validatedLevel,
      riskScore: Math.max(0, Math.min(1, result.riskScore || 0)),
      riskCategories: result.riskCategories || [],
      triggerPhrases: result.triggerPhrases || [],
      assessment: result.assessment || 'No assessment provided',
      immediateAction: result.immediateAction || false,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('Safety check error:', error);

    // Fallback to keyword-based detection
    return fallbackSafetyCheck(message);
  }
};

/**
 * Quick safety check for critical keywords
 * @param {string} message - User's message
 * @returns {Object} Quick safety assessment
 */
const quickSafetyCheck = (message) => {
  const lowerMessage = message.toLowerCase();

  // Check for crisis-level keywords
  const crisisKeywords = ['suicide', 'kill myself', 'end my life', 'want to die', 'planning to'];
  const highRiskKeywords = ['hurt myself', 'self-harm', 'cut myself', 'overdose', 'no reason to live'];

  for (const keyword of crisisKeywords) {
    if (lowerMessage.includes(keyword)) {
      return {
        success: true,
        riskLevel: 'crisis',
        riskScore: 1.0,
        riskCategories: ['suicide'],
        triggerPhrases: [keyword],
        assessment: 'Direct expression of suicidal ideation detected',
        immediateAction: true,
        timestamp: new Date().toISOString()
      };
    }
  }

  for (const keyword of highRiskKeywords) {
    if (lowerMessage.includes(keyword)) {
      return {
        success: true,
        riskLevel: 'high',
        riskScore: 0.8,
        riskCategories: ['self_harm'],
        triggerPhrases: [keyword],
        assessment: 'Self-harm related content detected',
        immediateAction: true,
        timestamp: new Date().toISOString()
      };
    }
  }

  return {
    success: true,
    riskLevel: 'medium',
    riskScore: 0.5,
    riskCategories: ['other'],
    triggerPhrases: [],
    assessment: 'Potentially concerning content detected',
    immediateAction: false,
    timestamp: new Date().toISOString()
  };
};

/**
 * Fallback safety check using keywords
 * @param {string} message - User's message
 * @returns {Object} Basic safety assessment
 */
const fallbackSafetyCheck = (message) => {
  const lowerMessage = message.toLowerCase();

  const keywordRisks = {
    crisis: ['suicide', 'kill myself', 'end my life', 'want to die', 'planning to die'],
    high: ['hurt myself', 'self-harm', 'cut myself', 'overdose', 'better off dead'],
    medium: ['depressed', 'hopeless', 'no point', 'give up', 'can\'t go on'],
    low: ['struggling', 'difficult time', 'hard right now']
  };

  for (const [level, keywords] of Object.entries(keywordRisks)) {
    for (const keyword of keywords) {
      if (lowerMessage.includes(keyword)) {
        return {
          success: true,
          riskLevel: level,
          riskScore: level === 'crisis' ? 1.0 : level === 'high' ? 0.8 : level === 'medium' ? 0.5 : 0.3,
          riskCategories: level === 'crisis' || level === 'high' ? ['suicide', 'self_harm'] : ['other'],
          triggerPhrases: [keyword],
          assessment: `Concerning keyword "${keyword}" detected`,
          immediateAction: level === 'crisis' || level === 'high',
          timestamp: new Date().toISOString(),
          fallback: true
        };
      }
    }
  }

  return {
    success: true,
    riskLevel: 'none',
    riskScore: 0,
    riskCategories: [],
    triggerPhrases: [],
    assessment: 'No safety concerns detected',
    immediateAction: false,
    timestamp: new Date().toISOString(),
    fallback: true
  };
};

/**
 * Generate appropriate response for safety concern
 * @param {Object} safetyResult - Safety assessment result
 * @returns {Object} Response with message and resources
 */
const generateSafetyResponse = (safetyResult) => {
  const { riskLevel, riskCategories } = safetyResult;

  let response = '';
  let resources = [];

  switch (riskLevel) {
    case 'crisis':
      response = `I'm very concerned about what you're sharing with me. Your safety is the most important thing right now.

Please reach out for immediate support:
- Call or text 988 (Suicide & Crisis Lifeline) - available 24/7
- Text HOME to 741741 (Crisis Text Line)
- Go to your nearest emergency room
- Call emergency services (911 in the US)

You don't have to face this alone. There are people who want to help you through this moment.`;
      resources = EMERGENCY_RESOURCES.general.concat(EMERGENCY_RESOURCES.suicide);
      break;

    case 'high':
      response = `I hear that you're going through something really difficult. What you're feeling matters, and I want to make sure you have support.

If you're in crisis or having thoughts of hurting yourself, please reach out:
- National Suicide Prevention Lifeline: 988
- Crisis Text Line: Text HOME to 741741

Would you like to talk more about what you're experiencing? I'm here to listen.`;
      resources = EMERGENCY_RESOURCES.general.concat(EMERGENCY_RESOURCES.self_harm);
      break;

    case 'medium':
      response = `It sounds like you're going through a tough time. Your feelings are valid, and it's okay to reach out for support.

If you need to talk to someone, consider:
- A trusted friend or family member
- A mental health professional
- Support hotlines like 988 or text HOME to 741741

I'm here to listen. Would you like to share more about what's been troubling you?`;
      resources = EMERGENCY_RESOURCES.general;
      break;

    case 'low':
      response = `I notice you might be going through some challenges. Remember, seeking support is a sign of strength, not weakness.

Is there something specific you'd like to talk about? I'm here to listen and help however I can.`;
      resources = [];
      break;

    default:
      response = null; // No safety response needed
  }

  return {
    needsResponse: riskLevel !== 'none' && riskLevel !== 'low',
    response,
    resources,
    riskLevel,
    riskCategories
  };
};

/**
 * Determine if conversation should be blocked
 * @param {Object} safetyResult - Safety assessment
 * @returns {boolean} True if should block further AI responses
 */
const shouldBlockConversation = (safetyResult) => {
  return safetyResult.riskLevel === 'crisis';
};

module.exports = {
  checkSafety,
  quickSafetyCheck,
  fallbackSafetyCheck,
  generateSafetyResponse,
  shouldBlockConversation,
  RISK_LEVELS,
  RISK_CATEGORIES,
  EMERGENCY_RESOURCES
};
