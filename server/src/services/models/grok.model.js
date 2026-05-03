"use strict";

const { grokClient } = require("../../config/ai");

/**
 * Calls the Grok/xAI Chat API (grok-2-latest).
 * Uses a slightly higher temperature (0.8) for the conversational, news-style
 * responses that Grok is optimised for.
 *
 * Graceful degradation: if GROK_API_KEY is not set, falls back to Gemini
 * transparently so the request still succeeds.
 *
 * @param {string} systemPrompt
 * @param {string} userPrompt
 * @param {Array<{role, content}>} history - Recent conversation history (last 6 entries used)
 * @returns {Promise<{ content: string, tokensUsed: number }>}
 */
async function getGrokResponse(systemPrompt, userPrompt, history = []) {
  if (!process.env.GROK_API_KEY) {
    const { getGeminiResponse } = require("./gemini.model");
    console.warn("[PagePal] GROK_API_KEY not set — falling back to Gemini");
    return getGeminiResponse(systemPrompt, userPrompt, history);
  }

  const messages = [
    { role: "system", content: systemPrompt },
    ...history.slice(-6),
    { role: "user", content: userPrompt },
  ];

  const completion = await grokClient.chat.completions.create({
    model: "grok-2-latest",
    messages,
    max_tokens: 1000,
    temperature: 0.8, // Slightly higher for conversational/news style
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error("Grok returned an empty response.");

  return {
    content: content.trim(),
    tokensUsed: completion.usage?.total_tokens || 0,
  };
}

module.exports = { getGrokResponse };
