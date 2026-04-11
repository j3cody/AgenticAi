/**
 * Planner Service
 * Determines the best response strategy based on context
 * Acts as the "brain" that decides how to respond
 */

const { llmClient, createJsonChatCompletion, hasLlmKey } = require('../../config/llm');

/**
 * Response strategies available
 */
const RESPONSE_STRATEGIES = {
  EMPATHETIC_SUPPORT: 'empathetic_support',      // Emotional validation and support
  INFORMATIONAL: 'informational',                 // Provide information and resources
  COACHING: 'coaching',                           // Goal-oriented guidance
  CRISIS_INTERVENTION: 'crisis_intervention',     // Immediate safety focus
  SKILL_BUILDING: 'skill_building',               // Teach coping techniques
  REFLECTIVE: 'reflective'                        // Help user reflect on feelings
};

/**
 * System prompt for the planner
 */
const PLANNER_SYSTEM_PROMPT = `You are a mental health response planner. Your role is to determine the best approach to respond to a user's message in a mental health context.

Based on the user's message, mood, and safety status, determine:
1. The primary response strategy
2. Key points to address
3. Tone and approach
4. Any resources to suggest

Respond with a JSON object containing:
{
  "strategy": "one of: empathetic_support, informational, coaching, crisis_intervention, skill_building, reflective",
  "primaryFocus": "main topic to address",
  "secondaryTopics": ["additional topics if relevant"],
  "tone": "emotional tone to use",
  "approach": "brief description of approach",
  "shouldSuggestResources": boolean,
  "resourceTypes": ["types of resources to suggest if any"],
  "keyPoints": ["main points to cover in response"],
  "followUpQuestion": "suggested follow-up to engage user"
}

Guidelines:
- For sad/anxious moods: prefer empathetic_support or reflective
- For crisis situations: always use crisis_intervention
- For goal-oriented requests: use coaching
- For educational questions: use informational
- For building coping skills: use skill_building
- Always prioritize user safety
- Return JSON only with no markdown fences or extra text`;

/**
 * Plan the response strategy
 * @param {string} message - User's message
 * @param {Object} moodResult - Result from mood detection
 * @param {Object} safetyResult - Result from safety check
 * @param {Object} ragResult - Result from knowledge retrieval (optional)
 * @returns {Promise<Object>} Planning result
 */
const planResponse = async (message, moodResult, safetyResult, ragResult = null) => {
  try {
    // If safety is critical, immediately return crisis intervention plan
    if (safetyResult.riskLevel === 'crisis' || safetyResult.riskLevel === 'high') {
      return createCrisisPlan(safetyResult);
    }

    if (!hasLlmKey || !llmClient) {
      return fallbackPlanner(message, moodResult, safetyResult);
    }

    // Build context for the planner
    const context = {
      userMessage: message,
      detectedMood: moodResult.mood,
      moodConfidence: moodResult.confidence,
      safetyLevel: safetyResult.riskLevel,
      relevantKnowledge: ragResult?.relevantDocs?.map(d => d.content) || []
    };

    // Call the configured LLM for planning
    const plan = await createJsonChatCompletion({
      messages: [
        { role: 'system', content: PLANNER_SYSTEM_PROMPT },
        { role: 'user', content: `Plan the response for this situation:\n${JSON.stringify(context, null, 2)}` }
      ],
      temperature: 0.3,
      max_tokens: 500
    });

    // Validate strategy
    const validStrategies = Object.values(RESPONSE_STRATEGIES);
    if (!validStrategies.includes(plan.strategy)) {
      plan.strategy = RESPONSE_STRATEGIES.EMPATHETIC_SUPPORT;
    }

    return {
      success: true,
      strategy: plan.strategy,
      primaryFocus: plan.primaryFocus || 'user wellbeing',
      secondaryTopics: plan.secondaryTopics || [],
      tone: plan.tone || 'supportive',
      approach: plan.approach || 'Listen and provide support',
      shouldSuggestResources: plan.shouldSuggestResources || false,
      resourceTypes: plan.resourceTypes || [],
      keyPoints: plan.keyPoints || [],
      followUpQuestion: plan.followUpQuestion || 'How are you feeling about this?',
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('Planner error:', error);

    // Fallback to rule-based planning
    return fallbackPlanner(message, moodResult, safetyResult);
  }
};

/**
 * Create crisis intervention plan
 * @param {Object} safetyResult - Safety assessment
 * @returns {Object} Crisis plan
 */
const createCrisisPlan = (safetyResult) => {
  return {
    success: true,
    strategy: RESPONSE_STRATEGIES.CRISIS_INTERVENTION,
    primaryFocus: 'immediate safety and support',
    secondaryTopics: ['crisis resources', 'professional help'],
    tone: 'calm and supportive',
    approach: 'Prioritize safety, provide immediate resources, encourage professional help',
    shouldSuggestResources: true,
    resourceTypes: ['crisis_hotlines', 'emergency_services'],
    keyPoints: [
      'Express genuine concern',
      'Provide immediate crisis resources',
      'Encourage professional help',
      'Offer to continue conversation when safe'
    ],
    followUpQuestion: 'Would you like me to help you find more resources?',
    timestamp: new Date().toISOString()
  };
};

/**
 * Fallback planner using rules
 * @param {string} message - User's message
 * @param {Object} moodResult - Mood detection result
 * @param {Object} safetyResult - Safety check result
 * @returns {Object} Planning result
 */
const fallbackPlanner = (message, moodResult, safetyResult) => {
  const { mood, confidence } = moodResult;
  const { riskLevel } = safetyResult;

  // Default plan
  let plan = {
    success: true,
    strategy: RESPONSE_STRATEGIES.EMPATHETIC_SUPPORT,
    primaryFocus: 'emotional support',
    tone: 'supportive and understanding',
    shouldSuggestResources: false,
    timestamp: new Date().toISOString()
  };

  // Adjust based on mood
  switch (mood) {
    case 'sad':
    case 'anxious':
    case 'overwhelmed':
      plan.strategy = RESPONSE_STRATEGIES.EMPATHETIC_SUPPORT;
      plan.primaryFocus = 'emotional validation and support';
      plan.keyPoints = ['Acknowledge feelings', 'Offer support', 'Explore coping strategies'];
      break;

    case 'angry':
      plan.strategy = RESPONSE_STRATEGIES.REFLECTIVE;
      plan.primaryFocus = 'understanding the source of frustration';
      plan.keyPoints = ['Validate frustration', 'Explore triggers', 'Identify healthy outlets'];
      break;

    case 'stressed':
      plan.strategy = RESPONSE_STRATEGIES.SKILL_BUILDING;
      plan.primaryFocus = 'stress management techniques';
      plan.keyPoints = ['Acknowledge stress', 'Teach coping techniques', 'Explore stressors'];
      break;

    case 'hopeful':
    case 'happy':
      plan.strategy = RESPONSE_STRATEGIES.COACHING;
      plan.primaryFocus = 'building on positive momentum';
      plan.keyPoints = ['Celebrate positives', 'Maintain progress', 'Set goals'];
      break;

    case 'confused':
      plan.strategy = RESPONSE_STRATEGIES.INFORMATIONAL;
      plan.primaryFocus = 'providing clarity and information';
      plan.keyPoints = ['Clarify concerns', 'Provide information', 'Answer questions'];
      break;

    default:
      plan.strategy = RESPONSE_STRATEGIES.EMPATHETIC_SUPPORT;
      plan.primaryFocus = 'general support and understanding';
      plan.keyPoints = ['Listen actively', 'Show empathy', 'Offer support'];
  }

  // Adjust based on safety level
  if (riskLevel === 'medium' || riskLevel === 'high') {
    plan.shouldSuggestResources = true;
    plan.resourceTypes = ['crisis_hotlines', 'professional_help'];
  }

  return plan;
};

/**
 * Get appropriate tone based on context
 * @param {string} mood - Detected mood
 * @param {string} riskLevel - Safety risk level
 * @returns {string} Appropriate tone
 */
const getAppropriateTone = (mood, riskLevel) => {
  if (riskLevel === 'crisis' || riskLevel === 'high') {
    return 'calm, supportive, and safety-focused';
  }

  const toneMap = {
    'sad': 'gentle and compassionate',
    'anxious': 'calm and reassuring',
    'angry': 'patient and understanding',
    'stressed': 'calm and practical',
    'hopeful': 'encouraging and supportive',
    'confused': 'clear and patient',
    'happy': 'celebratory and supportive',
    'neutral': 'friendly and open',
    'overwhelmed': 'calm and supportive'
  };

  return toneMap[mood] || 'supportive and understanding';
};

/**
 * Determine if professional referral is needed
 * @param {Object} safetyResult - Safety assessment
 * @param {Object} moodResult - Mood detection result
 * @returns {Object} Referral recommendation
 */
const shouldReferToProfessional = (safetyResult, moodResult) => {
  const { riskLevel } = safetyResult;
  const { mood } = moodResult;

  if (riskLevel === 'crisis' || riskLevel === 'high') {
    return {
      needed: true,
      urgency: 'immediate',
      reason: 'Safety concerns detected that require professional support'
    };
  }

  if (riskLevel === 'medium') {
    return {
      needed: true,
      urgency: 'soon',
      reason: 'Concerning indicators that would benefit from professional support'
    };
  }

  if (mood === 'sad' || mood === 'anxious' || mood === 'overwhelmed') {
    return {
      needed: false,
      urgency: 'optional',
      reason: 'Professional support could be beneficial for ongoing challenges'
    };
  }

  return {
    needed: false,
    urgency: 'not_needed',
    reason: 'No immediate professional referral needed'
  };
};

module.exports = {
  planResponse,
  fallbackPlanner,
  shouldReferToProfessional,
  getAppropriateTone,
  RESPONSE_STRATEGIES
};
