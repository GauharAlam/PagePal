"use strict";

const { openaiClient } = require("../../config/ai");

/**
 * Calls the OpenAI Chat Completions API (gpt-4o-mini).
 * OpenAI is now OPTIONAL — if OPENAI_API_KEY is not set, this function
 * transparently falls back to Gemini, which is the required default model.
 *
 * @param {string} systemPrompt
 * @param {string} userPrompt
 * @param {Array<{role, content}>} history - Recent conversation history (last 6 entries used)
 * @returns {Promise<{ content: string, tokensUsed: number }>}
 */
async function getOpenAIResponse(systemPrompt, userPrompt, history = []) {
  // Graceful degradation: fall back to Gemini when OpenAI key is absent
  if (!process.env.OPENAI_API_KEY) {
    const { getGeminiResponse } = require("./gemini.model");
    console.warn("[PagePal] OPENAI_API_KEY not set — falling back to Gemini");
    return getGeminiResponse(systemPrompt, userPrompt, history);
  }

  const messages = [
    { role: "system", content: systemPrompt },
    ...history.slice(-6),
    { role: "user", content: userPrompt },
  ];

  const completion = await openaiClient.chat.completions.create({
    model: "gpt-4o-mini",
    messages,
    max_tokens: 1000,
    temperature: 0.7,
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error("OpenAI returned an empty response.");

  return {
    content: content.trim(),
    tokensUsed: completion.usage?.total_tokens || 0,
  };
}

module.exports = { getOpenAIResponse };
