"use strict";

const { GoogleGenerativeAI } = require("@google/generative-ai");

/**
 * Lazily-initialized Gemini client.
 *
 * Gemini is the PRIMARY and REQUIRED model for PagePal.
 * It is the default for all requests and the universal fallback when
 * other models (OpenAI, DeepSeek, Grok) are unavailable.
 *
 * MODEL NAME NOTE:
 *   Google deprecates model names frequently. To avoid touching code,
 *   the model name is read from the GEMINI_MODEL env variable.
 *   If not set, it falls through a priority list of known-stable models.
 *
 *   Current stable options (May 2025):
 *     gemini-2.0-flash-lite        ← default (available to all users, fast)
 *     gemini-1.5-flash-latest      ← fallback #1
 *     gemini-1.5-flash-8b          ← fallback #2 (smallest / cheapest)
 *
 *   To override: add  GEMINI_MODEL=gemini-2.5-flash-preview-04-17  to .env
 *
 * Get your free API key at: https://aistudio.google.com/app/apikey
 */

// Priority list — tried in order until one succeeds
const MODEL_FALLBACK_LIST = [
  process.env.GEMINI_MODEL, // user override (from .env)
  "gemini-2.0-flash-lite", // stable, available to all new users
  "gemini-1.5-flash-latest", // older but widely available
  "gemini-1.5-flash-8b", // smallest / most permissive tier
].filter(Boolean); // remove undefined if GEMINI_MODEL not set

let geminiClient = null;

function getGeminiClient() {
  if (!geminiClient) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error(
        "[PagePal] GEMINI_API_KEY is not set. " +
          "Gemini is the required default model. " +
          "Get a free key at https://aistudio.google.com/app/apikey " +
          "and add GEMINI_API_KEY=your_key_here to your .env file.",
      );
    }
    geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return geminiClient;
}

/**
 * Calls the Google Gemini API.
 * Tries each model in MODEL_FALLBACK_LIST until one succeeds.
 * PRIMARY model — handles all content types: articles, code, YouTube, news, Q&A.
 * Also serves as the universal fallback when other API keys are not set.
 *
 * @param {string} systemPrompt
 * @param {string} userPrompt
 * @param {Array<{role, content}>} history - Recent conversation history (last 6 used)
 * @returns {Promise<{ content: string, tokensUsed: number }>}
 */
async function getGeminiResponse(systemPrompt, userPrompt, history = []) {
  const genAI = getGeminiClient();

  // Convert OpenAI-style history → Gemini {role, parts} format once
  // (Gemini uses 'model' instead of 'assistant')
  const geminiHistory = history.slice(-6).map((msg) => ({
    role: msg.role === "assistant" ? "model" : "user",
    parts: [{ text: msg.content }],
  }));

  let lastError = null;

  // Try each model name in order — stops at first success
  for (const modelName of MODEL_FALLBACK_LIST) {
    try {
      console.log(`[PagePal Gemini] Trying model: ${modelName}`);

      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: systemPrompt,
      });

      const chat = model.startChat({ history: geminiHistory });
      const result = await chat.sendMessage(userPrompt);
      const response = result.response;
      const text = response.text();

      if (!text) throw new Error("Empty response from Gemini.");

      const tokensUsed =
        response.usageMetadata?.totalTokenCount || Math.ceil(text.length / 4);

      console.log(`[PagePal Gemini] ✅ Success with model: ${modelName}`);
      return { content: text.trim(), tokensUsed };
    } catch (err) {
      // Only retry on 404 (model not found / deprecated)
      // For auth errors (401/403) or quota (429), fail immediately
      const is404 =
        err.message?.includes("404") ||
        err.message?.includes("not found") ||
        err.message?.includes("no longer available");

      if (is404) {
        console.warn(
          `[PagePal Gemini] ⚠️  ${modelName} not available, trying next...`,
        );
        lastError = err;
        continue;
      }

      // Non-404 error — do not retry, surface immediately
      throw err;
    }
  }

  // All models exhausted
  throw new Error(
    `[PagePal Gemini] All model names failed. Last error: ${lastError?.message}\n` +
      `Set GEMINI_MODEL=<valid-model-name> in your .env to override.\n` +
      `Check available models at: https://aistudio.google.com/app/apikey`,
  );
}

module.exports = { getGeminiResponse };
