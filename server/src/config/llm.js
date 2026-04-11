const OpenAI = require('openai');

const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/openai/';

const provider = process.env.GEMINI_API_KEY ? 'gemini' : 'none';
const apiKey = process.env.GEMINI_API_KEY || '';
const baseURL = process.env.GEMINI_BASE_URL || GEMINI_BASE_URL;
const primaryModel = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite';

const configuredFallbackModel = process.env.GEMINI_FALLBACK_MODEL || 'gemini-2.0-flash-lite';
const fallbackModel = configuredFallbackModel === primaryModel ? null : configuredFallbackModel;

const hasLlmKey = Boolean(apiKey);
const fallbackCooldownMs = Number(process.env.GEMINI_FALLBACK_COOLDOWN_MS || 300000);

let primaryModelDisabledUntil = 0;

const llmClient = hasLlmKey
  ? new OpenAI({
      apiKey,
      baseURL
    })
  : null;

const shouldRetryWithFallbackModel = (error) => Boolean(fallbackModel) && error?.status === 429;
const shouldUsePrimaryModel = () => !fallbackModel || Date.now() >= primaryModelDisabledUntil;

const buildPayload = (model, options = {}) => {
  const payload = {
    model,
    messages: options.messages
  };

  if (typeof options.temperature === 'number') {
    payload.temperature = options.temperature;
  }

  if (typeof options.max_tokens === 'number') {
    payload.max_tokens = options.max_tokens;
  }

  return payload;
};

const createChatCompletion = async (options) => {
  if (!llmClient) {
    throw new Error('LLM client is not configured');
  }

  const modelToUse = shouldUsePrimaryModel() ? primaryModel : fallbackModel;

  try {
    return await llmClient.chat.completions.create(buildPayload(modelToUse, options));
  } catch (error) {
    if (modelToUse !== primaryModel || !shouldRetryWithFallbackModel(error)) {
      throw error;
    }

    primaryModelDisabledUntil = Date.now() + fallbackCooldownMs;
    console.warn(`Primary Gemini model "${primaryModel}" hit a quota limit. Retrying with "${fallbackModel}".`);
    return llmClient.chat.completions.create(buildPayload(fallbackModel, options));
  }
};

const extractText = (response) => response?.choices?.[0]?.message?.content || '';

const parseJsonText = (text) => {
  if (!text || typeof text !== 'string') {
    throw new Error('LLM returned an empty response');
  }

  const candidates = [];
  const trimmed = text.trim();

  candidates.push(trimmed);

  const withoutCodeFenceLabels = trimmed
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();
  if (withoutCodeFenceLabels !== trimmed) {
    candidates.push(withoutCodeFenceLabels);
  }

  const linesWithoutFences = trimmed
    .split(/\r?\n/)
    .filter((line) => !line.trim().startsWith('```'))
    .join('\n')
    .trim();
  if (linesWithoutFences && !candidates.includes(linesWithoutFences)) {
    candidates.push(linesWithoutFences);
  }

  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    const objectSlice = trimmed.slice(firstBrace, lastBrace + 1).trim();
    if (!candidates.includes(objectSlice)) {
      candidates.push(objectSlice);
    }
  }

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate);
    } catch (error) {
      // Try progressively cleaner candidates.
    }
  }

  throw new SyntaxError(`Unable to parse JSON from LLM response: ${trimmed.slice(0, 120)}`);
};

const createJsonChatCompletion = async (options) => {
  const response = await createChatCompletion(options);
  const rawText = extractText(response);

  try {
    return parseJsonText(rawText);
  } catch (parseError) {
    const repairResponse = await createChatCompletion({
      messages: [
        {
          role: 'system',
          content: 'Return valid JSON only. No markdown fences, no explanation, no prose.'
        },
        {
          role: 'user',
          content: `Fix this into valid JSON only:\n\n${rawText}`
        }
      ],
      temperature: 0,
      max_tokens: options.repair_max_tokens || options.max_tokens || 500
    });

    return parseJsonText(extractText(repairResponse));
  }
};

module.exports = {
  llmClient,
  LLM_MODEL: primaryModel,
  LLM_FALLBACK_MODEL: fallbackModel,
  hasLlmKey,
  provider,
  baseURL,
  createChatCompletion,
  createJsonChatCompletion,
  extractText,
  parseJsonText
};
