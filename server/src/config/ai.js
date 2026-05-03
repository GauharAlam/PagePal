"use strict";

const OpenAI = require("openai");

/**
 * AI Client Configuration
 *
 * All three clients below use the OpenAI-compatible SDK.
 * They are created at module load time but their API keys are validated
 * lazily — each model file checks process.env.XYZ_API_KEY before making
 * any real API call and falls back to Gemini if the key is absent.
 *
 * WHY 'not-configured' instead of undefined?
 *   The OpenAI SDK constructor throws synchronously when apiKey is
 *   undefined or an empty string. Using a non-empty placeholder prevents
 *   the crash at startup. The actual key check happens in each model file.
 *
 * KEY PRIORITY (most → least required):
 *   1. GEMINI_API_KEY     ← required, default + universal fallback
 *   2. OPENAI_API_KEY     ← optional, unlocks GPT-4o-mini routing
 *   3. DEEPSEEK_API_KEY   ← optional, unlocks DeepSeek code routing
 *   4. GROK_API_KEY       ← optional, unlocks Grok news routing
 */

// ── OpenAI (GPT-4o-mini) ───────────────────────────────────────────────────
const openaiClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "not-configured",
});

// ── DeepSeek (deepseek-chat) — OpenAI-compatible endpoint ─────────────────
const deepseekClient = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY || "not-configured",
  baseURL: "https://api.deepseek.com",
});

// ── Grok / xAI (grok-2-latest) — OpenAI-compatible endpoint ───────────────
const grokClient = new OpenAI({
  apiKey: process.env.GROK_API_KEY || "not-configured",
  baseURL: "https://api.x.ai/v1",
});

// ── NVIDIA NIM (OpenAI-compatible endpoint) ───────────────────────────────
const nvidiaClient = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY || "not-configured",
  baseURL: "https://integrate.api.nvidia.com/v1",
});

// Note: Gemini uses its own SDK (@google/generative-ai) and is initialised
// lazily inside gemini.model.js — no client object lives here.

module.exports = { openaiClient, deepseekClient, grokClient, nvidiaClient };
