"use strict";

const { selectModel } = require("./router.service");
const { getOpenAIResponse } = require("./models/openai.model");
const { getGeminiResponse } = require("./models/gemini.model");
const { getDeepSeekResponse } = require("./models/deepseek.model");
const { getGrokResponse } = require("./models/grok.model");

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
};

/**
 * Main AI service — routes the request to the best model, calls it,
 * and returns a structured result including routing metadata.
 *
 * Fallback chain:
 *  selected model → Gemini (if selected model fails and isn't already Gemini)
 *  Gemini is the universal fallback because it is the only required API key.
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

  // ── 2. Resolve the handler (default to Gemini if model is unknown) ────────
  const handler = MODEL_HANDLERS[model] || getGeminiResponse;

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
      `[PagePal Router] ${model} failed: ${error.message}. Falling back to Gemini.`,
    );

    // ── 4. Fallback to Gemini if the selected model fails ──────────────────
    // Gemini is the universal fallback — it is the only required API key.
    if (model !== "gemini") {
      const { content, tokensUsed } = await getGeminiResponse(
        systemPrompt,
        userPrompt,
        conversationHistory,
      );
      return {
        content,
        tokensUsed,
        model: "gemini",
        reason: `Fallback from ${model} — ${error.message}`,
        confidence: "low",
      };
    }

    // Re-throw if Gemini itself fails — let the global error handler deal with it
    throw error;
  }
}

module.exports = { getAIResponse };
