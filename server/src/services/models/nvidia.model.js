"use strict";

const { nvidiaClient } = require("../../config/ai");

/**
 * Calls the NVIDIA NIM API (e.g., meta/llama3-70b-instruct).
 * Uses a lower temperature (0.3) for precise technical/code responses.
 *
 * NVIDIA is now the primary required model.
 * Throws an error if NVIDIA_API_KEY is not set.
 *
 * @param {string} systemPrompt
 * @param {string} userPrompt
 * @param {Array<{role, content}>} history - Recent conversation history (last 6 entries used)
 * @returns {Promise<{ content: string, tokensUsed: number }>}
 */
async function getNvidiaResponse(systemPrompt, userPrompt, history = []) {
  if (!process.env.NVIDIA_API_KEY) {
    throw new Error(
      "[PagePal] NVIDIA_API_KEY is not set. " +
        "NVIDIA NIM is the required default model. " +
        "Please add NVIDIA_API_KEY to your .env file.",
    );
  }

  const messages = [
    { role: "system", content: systemPrompt },
    ...history.slice(-6),
    { role: "user", content: userPrompt },
  ];

  const completion = await nvidiaClient.chat.completions.create({
    model: "meta/llama-3.1-70b-instruct", // Updated to Llama 3.1 (Llama 3 was deprecated)
    messages,
    max_tokens: 1000,
    temperature: 0.3, // Lower temp for precise technical/code content
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error("NVIDIA returned an empty response.");

  return {
    content: content.trim(),
    tokensUsed: completion.usage?.total_tokens || 0,
  };
}

module.exports = { getNvidiaResponse };
