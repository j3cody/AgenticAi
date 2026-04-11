/**
 * Response Generation Service
 * Generates the final AI response based on the plan
 * Creates empathetic, helpful, and safe responses
 */

const { llmClient, createJsonChatCompletion, hasLlmKey } = require('../../config/llm');

/**
 * System prompt for response generation
 * Ensures responses are empathetic, safe, and helpful
 */
const RESPONSE_SYSTEM_PROMPT = `You are a compassionate mental health assistant. Your role is to provide supportive, empathetic, and helpful responses to users seeking mental health support.

Important guidelines:
1. ALWAYS prioritize user safety
2. Be empathetic and validating in your responses
3. Never diagnose or prescribe
4. Encourage professional help when appropriate
5. Provide practical, actionable suggestions
6. Use a warm, conversational tone
7. Never claim to be a licensed professional
8. When in doubt, refer to crisis resources

Response structure:
- Acknowledge the user's feelings
- Validate their experience
- Offer support and understanding
- Provide relevant suggestions or resources
- Keep the response complete, natural, and not abrupt
- Separate the main response from the follow-up question

Remember: You are a supportive assistant, not a replacement for professional mental health care.`;

/**
 * Generate the final response
 * @param {string} userMessage - Original user message
 * @param {Object} plan - Response plan from planner
 * @param {Object} moodResult - Mood detection result
 * @param {Object} safetyResult - Safety check result
 * @param {Object} ragResult - Knowledge retrieval result
 * @param {Array} conversationHistory - Previous messages
 * @returns {Promise<Object>} Generated response
 */
const generateResponse = async (
  userMessage,
  plan,
  moodResult,
  safetyResult,
  ragResult = null,
  conversationHistory = []
) => {
  try {
    if (!hasLlmKey || !llmClient) {
      return generateFallbackResponse(userMessage, moodResult, safetyResult);
    }

    // Build context for response generation
    const context = {
      userMessage,
      detectedMood: moodResult.mood,
      moodConfidence: moodResult.confidence,
      safetyLevel: safetyResult.riskLevel,
      responsePlan: {
        strategy: plan.strategy,
        primaryFocus: plan.primaryFocus,
        tone: plan.tone,
        keyPoints: plan.keyPoints,
        followUpQuestion: plan.followUpQuestion
      },
      relevantKnowledge: ragResult?.relevantDocs?.map(d => ({
        title: d.title,
        content: d.content.substring(0, 300) // Limit knowledge context
      })) || []
    };

    // Build messages array for API
    const messages = [
      { role: 'system', content: RESPONSE_SYSTEM_PROMPT }
    ];

    // Add conversation history for context
    if (conversationHistory.length > 0) {
      const recentHistory = conversationHistory.slice(-10);
      for (const msg of recentHistory) {
        messages.push({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content
        });
      }
    }

    // Add current context and request
    messages.push({
      role: 'user',
      content: `Please provide a supportive response to this message.

Context:
- Detected mood: ${context.detectedMood} (confidence: ${context.moodConfidence})
- Safety level: ${context.safetyLevel}
- Response strategy: ${context.responsePlan.strategy}
- Focus on: ${context.responsePlan.primaryFocus}
- Tone: ${context.responsePlan.tone}
- Key points to cover: ${context.responsePlan.keyPoints?.join(', ') || 'Support and validation'}

${context.relevantKnowledge.length > 0 ?
  `Relevant knowledge:\n${context.relevantKnowledge.map(k => `- ${k.title}: ${k.content}`).join('\n')}` :
  ''}

User's message: "${userMessage}"

Return valid JSON only in this format:
{
  "response": "2 to 4 short paragraphs of supportive guidance",
  "followUp": "one warm, specific follow-up question"
}

Do not use markdown fences.`
    });

    const generated = await createJsonChatCompletion({
      messages: messages,
      temperature: 0.7, // Balanced temperature for natural responses
      max_tokens: 800,
      repair_max_tokens: 800
    });
    const generatedText = String(generated.response || '').trim();
    const followUp = String(generated.followUp || '').trim();

    // Add resources if planned
    let resources = [];
    if (plan.shouldSuggestResources && plan.resourceTypes) {
      resources = getResourcesForTypes(plan.resourceTypes);
    }

    return {
      success: true,
      response: generatedText,
      strategy: plan.strategy,
      mood: moodResult.mood,
      resources: resources,
      followUp: followUp || plan.followUpQuestion,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('Response generation error:', error);

    // Fallback to template response
    return generateFallbackResponse(userMessage, moodResult, safetyResult);
  }
};

/**
 * Generate fallback response using templates
 * @param {string} userMessage - User's message
 * @param {Object} plan - Response plan
 * @param {Object} moodResult - Mood detection result
 * @param {Object} safetyResult - Safety check result
 * @returns {Object} Template-based response
 */
const generateFallbackResponse = (userMessage, moodResult, safetyResult) => {
  const { mood } = moodResult;
  const { riskLevel } = safetyResult;

  let response = '';
  let resources = [];

  // Crisis response
  if (riskLevel === 'crisis' || riskLevel === 'high') {
    response = `I'm concerned about what you're sharing. Your safety is the most important thing.

Please reach out for immediate support:
- National Suicide Prevention Lifeline: Call or text 988
- Crisis Text Line: Text HOME to 741741
- Emergency services: Call 911 if in immediate danger

You don't have to face this alone. There are trained professionals ready to help you right now.`;
    resources = getResourcesForTypes(['crisis_hotlines']);
    return {
      success: true,
      response,
      strategy: 'crisis_intervention',
      mood,
      resources,
      followUp: 'Would you like me to help you find more resources?',
      timestamp: new Date().toISOString()
    };
  }

  // Mood-based responses
  const moodResponses = {
    happy: {
      response: `It's wonderful to hear that you're feeling happy! 😊 Taking time to acknowledge and appreciate positive moments is so important for mental wellbeing.\n\nWhat's contributing to this good feeling? I'd love to hear more about what's bringing you joy today.`,
      followUp: 'What positive experiences would you like to build on?'
    },
    sad: {
      response: `I hear you, and I want you to know that your feelings are valid. It's okay to feel sad sometimes - these emotions are a natural part of being human.\n\nWould you like to talk more about what's been troubling you? Sometimes sharing can help lighten the burden.`,
      followUp: 'What would feel most supportive for you right now?'
    },
    anxious: {
      response: `I understand that anxiety can feel overwhelming. Those racing thoughts and worried feelings are challenging, but you don't have to face them alone.\n\nHave you tried any grounding techniques? Taking slow, deep breaths or focusing on your senses can sometimes help calm anxious feelings.`,
      followUp: 'Would you like to try a simple breathing exercise together?'
    },
    angry: {
      response: `It sounds like you're dealing with some frustration. Anger is a natural emotion, and it's important to acknowledge it.\n\nWhat might be at the root of these feelings? Sometimes understanding the source can help us find healthy ways to process them.`,
      followUp: 'What usually helps you when you feel this way?'
    },
    stressed: {
      response: `I can hear that you're under a lot of pressure right now. Stress can feel like a heavy weight, and it's important to take care of yourself during these times.\n\nRemember, it's okay to take breaks and prioritize self-care. Even small moments of rest can help recharge your energy.`,
      followUp: "What's one small thing you could do today to take care of yourself?"
    },
    hopeful: {
      response: `It's beautiful to hear that you're feeling hopeful! 🌟 Hope is a powerful force that can help us move forward, even through difficult times.\n\nWhat's giving you this sense of hope? Celebrating these moments can help sustain these positive feelings.`,
      followUp: 'How can you nurture this hopeful feeling?'
    },
    confused: {
      response: `I understand that things might feel unclear right now. Uncertainty can be uncomfortable, but it's also an opportunity for exploration and growth.\n\nLet's work through this together. What specific aspect is feeling confusing? Sometimes breaking things down can help bring clarity.`,
      followUp: 'What would help clarify things for you?'
    },
    overwhelmed: {
      response: `I can sense that you're carrying a lot right now. Feeling overwhelmed is exhausting, and it's important to remember that you don't have to handle everything at once.\n\nWhat if we focused on just one thing at a time? Breaking big challenges into smaller steps can sometimes make them feel more manageable.`,
      followUp: "What's one small step you could take today?"
    },
    calm: {
      response: `It's nice to hear that you're feeling calm. 🧘 These moments of peace are valuable for recharging and finding balance.\n\nHow are you nurturing this sense of calm? Sharing your practices might help others too.`,
      followUp: 'What helps you maintain this sense of calm?'
    },
    neutral: {
      response: `Thank you for sharing. I'm here to listen and support you in any way I can.\n\nWhat's on your mind today? Whether you want to talk about something specific or just need someone to listen, I'm here for you.`,
      followUp: 'How can I best support you right now?'
    }
  };

  const moodResponse = moodResponses[mood] || moodResponses.neutral;

  // Add resources for certain moods
  if (['anxious', 'stressed', 'overwhelmed', 'sad'].includes(mood)) {
    resources = getResourcesForTypes(['coping_techniques', 'self_care']);
  }

  return {
    success: true,
    response: moodResponse.response,
    strategy: mood === 'neutral' ? 'reflective' : 'empathetic_support',
    mood,
    resources,
    followUp: moodResponse.followUp,
    timestamp: new Date().toISOString()
  };
};

/**
 * Get resources based on types
 * @param {Array} resourceTypes - Types of resources needed
 * @returns {Array} List of resources
 */
const getResourcesForTypes = (resourceTypes) => {
  const allResources = {
    crisis_hotlines: [
      { name: 'National Suicide Prevention Lifeline', contact: '988', description: '24/7 support' },
      { name: 'Crisis Text Line', contact: 'Text HOME to 741741', description: 'Text-based support' }
    ],
    coping_techniques: [
      { name: 'Deep Breathing', description: '4-7-8 breathing technique for anxiety' },
      { name: '5-4-3-2-1 Grounding', description: 'Sensory grounding exercise' }
    ],
    self_care: [
      { name: 'Self-Care Tips', description: 'Daily practices for mental wellness' }
    ],
    professional_help: [
      { name: 'Find a Therapist', contact: 'psychologytoday.com', description: 'Directory of mental health professionals' }
    ]
  };

  let resources = [];
  for (const type of resourceTypes) {
    if (allResources[type]) {
      resources = resources.concat(allResources[type]);
    }
  }

  return resources;
};

/**
 * Generate a summary of the conversation
 * @param {Array} messages - Conversation messages
 * @returns {Promise<Object>} Conversation summary
 */
const generateConversationSummary = async (messages) => {
  if (!messages || messages.length === 0) {
    return { summary: 'No conversation yet', themes: [] };
  }

  try {
    if (!hasLlmKey || !llmClient) {
      return {
        summary: 'Conversation about mental wellbeing',
        themes: ['support', 'wellness']
      };
    }

    const conversationText = messages
      .map(m => `${m.role}: ${m.content}`)
      .join('\n');

    const summaryResult = await createJsonChatCompletion({
      messages: [
        {
          role: 'system',
          content: 'Summarize this mental health conversation in 2-3 sentences. Identify the main themes discussed. Respond with JSON only: {"summary": "...", "themes": [...]}'
        },
        { role: 'user', content: conversationText }
      ],
      temperature: 0.3,
      max_tokens: 200
    });

    return summaryResult;
  } catch (error) {
    return {
      summary: 'Conversation about mental wellbeing',
      themes: ['support', 'wellness']
    };
  }
};

module.exports = {
  generateResponse,
  generateFallbackResponse,
  generateConversationSummary,
  getResourcesForTypes
};
