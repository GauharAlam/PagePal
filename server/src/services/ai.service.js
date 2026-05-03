"use strict";

const { selectModel } = require("./router.service");
const { getOpenAIResponse } = require("./models/openai.model");
const { getGeminiResponse } = require("./models/gemini.model");
const { getDeepSeekResponse } = require("./models/deepseek.model");
const { getGrokResponse } = require("./models/grok.model");
const { getNvidiaResponse } = require("./models/nvidia.model");

/**
 * MODEL DISPATCH MAP
 * Maps model name → handler function.
 * Adding a new model only requires registering it here.
 */
const MODEL_HANDLERS = {
  openai: getOpenAIResponse,
  gemini: getGeminiResponse,
  deepseek: getDeepSeekResponse,
  grok: getGrokResponse,
  nvidia: getNvidiaResponse,
};

/**
 * Main AI service — routes the request to the best model, calls it,
 * and returns a structured result including routing metadata.
 *
 * Fallback chain:
 *  selected model → NVIDIA (if selected model fails and isn't already NVIDIA)
 *  NVIDIA is the universal fallback.
 *
 * @param {string}  systemPrompt
 * @param {string}  userPrompt
 * @param {Array}   conversationHistory  - [{role, content}]
 * @param {string}  rawContent           - Original page context (used for routing analysis only)
 * @param {string}  mode                 - explain | summarize | keypoints | beginner | code | selection
 * @param {boolean} isYouTube            - Whether the source page is YouTube
 * @param {string|null} userPreference   - 'best_quality' | 'fast' | 'cheap' | null
 * @returns {Promise<{ content: string, tokensUsed: number, model: string, reason: string, confidence: string }>}
 */
async function getAIResponse(
  systemPrompt,
  userPrompt,
  conversationHistory = [],
  rawContent = "",
  mode = "explain",
  isYouTube = false,
  userPreference = null,
) {
  // ── 1. Determine the optimal model ────────────────────────────────────────
  const { model, reason, confidence } = selectModel(
    rawContent,
    mode,
    isYouTube,
    userPreference,
  );

  console.log(
    `[PagePal Router] → ${model.toUpperCase()} | ${reason} | confidence: ${confidence}`,
  );

  // ── 2. Resolve the handler (default to NVIDIA if model is unknown) ────────
  const handler = MODEL_HANDLERS[model] || getNvidiaResponse;

  try {
    // ── 3. Call the selected model ──────────────────────────────────────────
    const { content, tokensUsed } = await handler(
      systemPrompt,
      userPrompt,
      conversationHistory,
    );

    return { content, tokensUsed, model, reason, confidence };
  } catch (error) {
    console.error(
      `[PagePal Router] ${model} failed: ${error.message}. Falling back to NVIDIA.`,
    );

    // ── 4. Fallback to NVIDIA if the selected model fails ──────────────────
    // NVIDIA is the universal fallback.
    if (model !== "nvidia") {
      const { content, tokensUsed } = await getNvidiaResponse(
        systemPrompt,
        userPrompt,
        conversationHistory,
      );
      return {
        content,
        tokensUsed,
        model: "nvidia",
        reason: `Fallback from ${model} — ${error.message}`,
        confidence: "low",
      };
    }

    // Re-throw if NVIDIA itself fails — let the global error handler deal with it
    throw error;
  }
}

module.exports = { getAIResponse };
