/**
 * Combined Analysis Service
 * Merges mood detection, safety assessment, and response planning into one LLM call
 * to reduce quota usage and latency.
 */

const { llmClient, createJsonChatCompletion, hasLlmKey } = require('../../config/llm');
const moodService = require('./mood.service');
const safetyService = require('./safety.service');
const plannerService = require('./planner.service');

const MOOD_CATEGORIES = moodService.MOOD_CATEGORIES;
const RISK_LEVELS = Object.values(safetyService.RISK_LEVELS);
const RESPONSE_STRATEGIES = Object.values(plannerService.RESPONSE_STRATEGIES);
const RISK_PRIORITY = {
  none: 0,
  low: 1,
  medium: 2,
  high: 3,
  crisis: 4
};

const ANALYSIS_SYSTEM_PROMPT = `You are a mental health triage and response-planning assistant.

Analyze the user's message and recent conversation context. Return one JSON object only with no markdown fences.

Required JSON shape:
{
  "mood": {
    "mood": "happy | sad | anxious | angry | neutral | stressed | hopeful | confused | overwhelmed | calm",
    "confidence": 0.0,
    "indicators": ["short phrases"],
    "reasoning": "brief explanation"
  },
  "safety": {
    "riskLevel": "none | low | medium | high | crisis",
    "riskScore": 0.0,
    "riskCategories": ["self_harm | suicide | violence | substance_abuse | eating_disorder | other"],
    "triggerPhrases": ["short phrases"],
    "assessment": "brief explanation",
    "immediateAction": false
  },
  "plan": {
    "strategy": "empathetic_support | informational | coaching | crisis_intervention | skill_building | reflective",
    "primaryFocus": "main topic to address",
    "secondaryTopics": ["optional topics"],
    "tone": "tone to use",
    "approach": "brief response approach",
    "shouldSuggestResources": false,
    "resourceTypes": ["resource types if needed"],
    "keyPoints": ["main points to cover"],
    "followUpQuestion": "one warm follow-up question"
  }
}

Rules:
- Always prioritize user safety.
- If the message suggests immediate self-harm or suicide risk, set safety riskLevel to high or crisis and plan strategy to crisis_intervention.
- Keep indicators and triggerPhrases short.
- Keep the plan practical and suitable for a supportive assistant.
- Return valid JSON only.`;

const normalizeMoodResult = (result, message) => {
  const normalizedMood = String(result?.mood?.mood || result?.mood || '').toLowerCase();
  const validatedMood = MOOD_CATEGORIES.includes(normalizedMood) ? normalizedMood : 'neutral';
  const confidence = Math.max(0, Math.min(1, Number(result?.mood?.confidence ?? result?.confidence ?? 0.5)));

  return {
    success: true,
    mood: validatedMood,
    confidence,
    indicators: Array.isArray(result?.mood?.indicators) ? result.mood.indicators : [],
    reasoning: result?.mood?.reasoning || 'Combined analysis result',
    source: 'combined_analysis',
    timestamp: new Date().toISOString(),
    originalMessage: message
  };
};

const normalizeSafetyResult = (result) => {
  const normalizedLevel = String(result?.safety?.riskLevel || result?.riskLevel || 'none').toLowerCase();
  const riskLevel = RISK_LEVELS.includes(normalizedLevel) ? normalizedLevel : 'none';
  const rawScore = Number(result?.safety?.riskScore ?? result?.riskScore ?? 0);
  const riskScore = Math.max(0, Math.min(1, Number.isFinite(rawScore) ? rawScore : 0));

  return {
    success: true,
    riskLevel,
    riskScore,
    riskCategories: Array.isArray(result?.safety?.riskCategories) ? result.safety.riskCategories : [],
    triggerPhrases: Array.isArray(result?.safety?.triggerPhrases) ? result.safety.triggerPhrases : [],
    assessment: result?.safety?.assessment || 'Combined analysis result',
    immediateAction: Boolean(result?.safety?.immediateAction),
    source: 'combined_analysis',
    timestamp: new Date().toISOString()
  };
};

const mergeSafetySignals = (combinedSafety, heuristicSafety) => {
  const combinedPriority = RISK_PRIORITY[combinedSafety?.riskLevel] ?? 0;
  const heuristicPriority = RISK_PRIORITY[heuristicSafety?.riskLevel] ?? 0;

  if (heuristicPriority > combinedPriority) {
    return {
      ...combinedSafety,
      riskLevel: heuristicSafety.riskLevel,
      riskScore: Math.max(combinedSafety?.riskScore || 0, heuristicSafety?.riskScore || 0),
      riskCategories: heuristicSafety?.riskCategories?.length
        ? heuristicSafety.riskCategories
        : (combinedSafety?.riskCategories || []),
      triggerPhrases: heuristicSafety?.triggerPhrases?.length
        ? heuristicSafety.triggerPhrases
        : (combinedSafety?.triggerPhrases || []),
      assessment: heuristicSafety?.assessment || combinedSafety?.assessment,
      immediateAction: Boolean(combinedSafety?.immediateAction || heuristicSafety?.immediateAction),
      source: 'combined_analysis+heuristic_floor'
    };
  }

  if (combinedPriority > 0 && (!combinedSafety.riskScore || combinedSafety.riskScore === 0)) {
    const floorScore = {
      low: 0.3,
      medium: 0.5,
      high: 0.8,
      crisis: 1
    }[combinedSafety.riskLevel] || 0;

    return {
      ...combinedSafety,
      riskScore: floorScore
    };
  }

  return combinedSafety;
};

const normalizePlanResult = (result, moodResult, safetyResult, message) => {
  const rawStrategy = String(result?.plan?.strategy || result?.strategy || '').toLowerCase();
  const strategy = RESPONSE_STRATEGIES.includes(rawStrategy)
    ? rawStrategy
    : (safetyResult.riskLevel === 'high' || safetyResult.riskLevel === 'crisis'
      ? 'crisis_intervention'
      : 'empathetic_support');

  return {
    success: true,
    strategy,
    primaryFocus: result?.plan?.primaryFocus || result?.primaryFocus || 'user wellbeing',
    secondaryTopics: Array.isArray(result?.plan?.secondaryTopics) ? result.plan.secondaryTopics : [],
    tone: result?.plan?.tone || plannerService.getAppropriateTone(moodResult.mood, safetyResult.riskLevel),
    approach: result?.plan?.approach || 'Listen, validate, and respond with practical support',
    shouldSuggestResources: Boolean(result?.plan?.shouldSuggestResources),
    resourceTypes: Array.isArray(result?.plan?.resourceTypes) ? result.plan.resourceTypes : [],
    keyPoints: Array.isArray(result?.plan?.keyPoints) ? result.plan.keyPoints : [],
    followUpQuestion: result?.plan?.followUpQuestion || `What feels hardest about "${message.slice(0, 30)}${message.length > 30 ? '...' : ''}" right now?`,
    source: 'combined_analysis',
    timestamp: new Date().toISOString()
  };
};

const analyzeMessage = async (message, conversationHistory = []) => {
  try {
    const criticalKeywordDetected = [
      'suicide', 'kill myself', 'end my life', 'want to die',
      'hurt myself', 'self-harm', 'cut myself', 'overdose',
      'planning to end', 'no reason to live', 'better off dead'
    ].some((keyword) => message.toLowerCase().includes(keyword));

    if (!hasLlmKey || !llmClient) {
      const mood = moodService.fallbackMoodDetection(message);
      const safety = safetyService.fallbackSafetyCheck(message);
      const resolvedMood = await mood;
      const resolvedSafety = await safety;
      const plan = plannerService.planResponse(message, resolvedMood, resolvedSafety, null);
      return {
        success: true,
        mood: resolvedMood,
        safety: resolvedSafety,
        plan: await plan
      };
    }

    if (criticalKeywordDetected) {
      const quickSafety = safetyService.quickSafetyCheck(message);
      if (quickSafety && (quickSafety.riskLevel === 'high' || quickSafety.riskLevel === 'crisis')) {
        const fallbackMood = moodService.fallbackMoodDetection ? moodService.fallbackMoodDetection(message) : {
          mood: 'overwhelmed',
          confidence: 0.8,
          indicators: [],
          reasoning: 'Critical language detected'
        };
        return {
          success: true,
          mood: fallbackMood,
          safety: quickSafety,
          plan: plannerService.fallbackPlanner(message, fallbackMood, quickSafety)
        };
      }
    }

    let contextMessage = '';
    if (conversationHistory.length > 0) {
      const recentHistory = conversationHistory.slice(-5);
      contextMessage = `\n\nRecent conversation context:\n${recentHistory.map((m) => `${m.role}: ${m.content}`).join('\n')}`;
    }

    const analysis = await createJsonChatCompletion({
      messages: [
        { role: 'system', content: ANALYSIS_SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Analyze this message for mood, safety, and response planning.${contextMessage}\n\nMessage: "${message}"`
        }
      ],
      temperature: 0.2,
      max_tokens: 800,
      repair_max_tokens: 800
    });

    const moodResult = normalizeMoodResult(analysis, message);
    const combinedSafetyResult = normalizeSafetyResult(analysis);
    const heuristicSafetyResult = safetyService.fallbackSafetyCheck(message);
    const safetyResult = mergeSafetySignals(combinedSafetyResult, heuristicSafetyResult);
    const planResult = normalizePlanResult(analysis, moodResult, safetyResult, message);

    if ((safetyResult.riskLevel === 'high' || safetyResult.riskLevel === 'crisis') && planResult.strategy !== 'crisis_intervention') {
      planResult.strategy = 'crisis_intervention';
      planResult.primaryFocus = 'immediate safety and support';
      planResult.shouldSuggestResources = true;
      planResult.resourceTypes = ['crisis_hotlines', 'emergency_services'];
    }

    return {
      success: true,
      mood: moodResult,
      safety: safetyResult,
      plan: planResult
    };
  } catch (error) {
    console.error('Combined analysis error:', error);

    const moodResult = moodService.fallbackMoodDetection
      ? moodService.fallbackMoodDetection(message)
      : {
          success: true,
          mood: 'neutral',
          confidence: 0.5,
          indicators: [],
          reasoning: 'Fallback mood result',
          timestamp: new Date().toISOString()
        };
    const safetyResult = safetyService.fallbackSafetyCheck
      ? safetyService.fallbackSafetyCheck(message)
      : {
          success: true,
          riskLevel: 'none',
          riskScore: 0,
          riskCategories: [],
          triggerPhrases: [],
          assessment: 'Fallback safety result',
          immediateAction: false,
          timestamp: new Date().toISOString()
        };
    const planResult = plannerService.fallbackPlanner
      ? plannerService.fallbackPlanner(message, moodResult, safetyResult)
      : {
          success: true,
          strategy: 'empathetic_support',
          primaryFocus: 'general support',
          tone: 'supportive',
          approach: 'Listen and help',
          shouldSuggestResources: false,
          resourceTypes: [],
          keyPoints: ['Listen actively', 'Offer support'],
          followUpQuestion: 'What would feel most helpful right now?',
          timestamp: new Date().toISOString()
        };

    return {
      success: true,
      mood: moodResult,
      safety: safetyResult,
      plan: planResult,
      fallback: true
    };
  }
};

module.exports = {
  analyzeMessage
};
