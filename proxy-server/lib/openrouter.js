import { env } from './env.js';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_TIMEOUT_MS = 50000;
export const DEFAULT_FREE_MODEL = 'openrouter/free';

export function hasOpenRouter(customKey = null) {
  const key = customKey || env.OPENROUTER_API_KEY;
  return !!key && !key.includes('your-') && !key.includes('placeholder');
}

/**
 * Remove reasoning / thinking tags returned by deep-thinking models
 */
export function cleanThinkingTags(text = '') {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/<thought>[\s\S]*?<\/thought>/gi, '')
    .trim();
}

export async function openRouterChat({
  model,
  messages,
  max_tokens = 2000,
  temperature = 0.7,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  apiKey = null,
}) {
  const key = apiKey || env.OPENROUTER_API_KEY;
  if (!key || key.includes('placeholder')) {
    throw new Error('OPENROUTER_API_KEY is not configured on the proxy server.');
  }

  let useModel = model || env.OPENROUTER_MODEL || DEFAULT_FREE_MODEL;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  async function executeCall(targetModel) {
    return fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': env.FRONTEND_URL || 'http://localhost:5173',
        'X-Title': 'PagePal AI Extension',
      },
      body: JSON.stringify({
        model: targetModel,
        messages,
        max_tokens,
        temperature,
      }),
      signal: controller.signal,
    });
  }

  try {
    let res = await executeCall(useModel);

    // If the model was deprecated / not found on OpenRouter, auto-fallback to openrouter/free
    if (!res.ok) {
      const errText = await res.text();
      const isMissingModel = (res.status === 400 || res.status === 404) &&
        (errText.toLowerCase().includes('not a valid model id') ||
         errText.toLowerCase().includes('no endpoints found') ||
         errText.toLowerCase().includes('not found') ||
         errText.toLowerCase().includes('no endpoints'));

      if (isMissingModel && useModel !== DEFAULT_FREE_MODEL) {
        console.warn(`[OpenRouter] Model "${useModel}" failed (${res.status}). Auto-falling back to "${DEFAULT_FREE_MODEL}"`);
        useModel = DEFAULT_FREE_MODEL;
        res = await executeCall(useModel);
      }

      if (!res.ok) {
        const finalErrText = await res.text().catch(() => errText);
        throw new Error(`OpenRouter Error [${res.status}]: ${finalErrText.slice(0, 400)}`);
      }
    }

    const data = await res.json();
    const rawContent = data.choices?.[0]?.message?.content;
    if (!rawContent && rawContent !== '') {
      throw new Error('OpenRouter returned an empty response.');
    }

    return {
      text: cleanThinkingTags(rawContent),
      rawContent,
      raw: data,
      modelUsed: useModel,
    };
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error(`OpenRouter request timed out after ${timeoutMs / 1000}s`);
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * OpenRouter create wrapper compatible with system prompts & model specification
 */
export async function openRouterCreate({
  system,
  messages,
  max_tokens = 2000,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  model = null,
  apiKey = null,
  temperature = 0.7,
}) {
  const fullMessages = [];
  if (system) {
    fullMessages.push({ role: 'system', content: system });
  }
  for (const m of messages) {
    fullMessages.push({ role: m.role, content: m.content });
  }

  const { text, rawContent, raw, modelUsed } = await openRouterChat({
    model,
    messages: fullMessages,
    max_tokens,
    timeoutMs,
    apiKey,
    temperature,
  });

  return {
    content: [{ text }],
    rawContent,
    raw,
    modelUsed,
  };
}
