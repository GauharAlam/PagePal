import { env } from './env.js';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

export function hasOpenRouter() {
  return !!env.OPENROUTER_API_KEY && !env.OPENROUTER_API_KEY.includes('your-') && !env.OPENROUTER_API_KEY.includes('placeholder');
}

export async function openRouterChat({ model, messages, max_tokens = 1500, temperature = 0.7 }) {
  if (!hasOpenRouter()) throw new Error('OPENROUTER_API_KEY not configured');
  const useModel = model || env.OPENROUTER_MODEL || 'z-ai/glm-4.5';
  const res = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': env.FRONTEND_URL || 'http://localhost:5173',
      'X-Title': 'PagePal AI',
    },
    body: JSON.stringify({
      model: useModel,
      messages,
      max_tokens,
      temperature,
    }),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenRouter ${res.status}: ${errText.slice(0, 500)}`);
  }
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error('OpenRouter returned no content');
  return { text, raw: data };
}

// Helper to mimic Anthropic messages.create shape for GLM via OpenRouter
export async function openRouterCreate({ system, messages, max_tokens }) {
  const fullMessages = [];
  if (system) fullMessages.push({ role: 'system', content: system });
  for (const m of messages) fullMessages.push({ role: m.role, content: m.content });
  const { text, raw } = await openRouterChat({ messages: fullMessages, max_tokens });
  // Return Anthropic-like shape: { content: [{ text }] }
  return { content: [{ text }], raw };
}
