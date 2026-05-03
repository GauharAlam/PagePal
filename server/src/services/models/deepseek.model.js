"use strict";

const { deepseekClient } = require("../../config/ai");

/**
 * Calls the DeepSeek Chat API (deepseek-chat).
 * Uses a lower temperature (0.3) for precise, deterministic code/technical responses.
 *
 * Graceful degradation: if DEEPSEEK_API_KEY is not set, falls back to Gemini
 * transparently so the request still succeeds.
 *
 * @param {string} systemPrompt
 * @param {string} userPrompt
 * @param {Array<{role, content}>} history - Recent conversation history (last 6 entries used)
 * @returns {Promise<{ content: string, tokensUsed: number }>}
 */
async function getDeepSeekResponse(systemPrompt, userPrompt, history = []) {
  if (!process.env.DEEPSEEK_API_KEY) {
    const { getGeminiResponse } = require("./gemini.model");
    console.warn("[PagePal] DEEPSEEK_API_KEY not set — falling back to Gemini");
    return getGeminiResponse(systemPrompt, userPrompt, history);
  }

  const messages = [
    { role: "system", content: systemPrompt },
    ...history.slice(-6),
    { role: "user", content: userPrompt },
  ];

  const completion = await deepseekClient.chat.completions.create({
    model: "deepseek-chat",
    messages,
    max_tokens: 1000,
    temperature: 0.3, // Lower temp for precise technical/code content
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error("DeepSeek returned an empty response.");

  return {
    content: content.trim(),
    tokensUsed: completion.usage?.total_tokens || 0,
  };
}

module.exports = { getDeepSeekResponse };
