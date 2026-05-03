"use strict";

/**
 * Intelligent AI Model Router
 * Analyzes content type, size, and user intent to select the optimal AI model.
 *
 * Models:
 *  - gemini    → best for large content, YouTube transcripts, long articles
 *  - deepseek  → best for code, technical content, fast/cheap summaries
 *  - openai    → optional: standard articles, blogs, general Q&A (falls back to Gemini)
 *  - grok      → best for trending/news/social/real-time content
 */

/**
 * Detects whether the given text contains code or technical programming content.
 * Returns true if the mode is 'code' OR if 3+ code-pattern signals are present.
 *
 * @param {string} text
 * @param {string} mode
 * @returns {boolean}
 */
function detectCode(text, mode) {
  if (mode === "code") return true;

  const str = text || "";
  let signals = 0;

  // Declaration / keyword patterns
  if (/^(function |const |let |var |class |import |export )/m.test(str))
    signals++;

  // Operator / syntax patterns
  if (/=>/.test(str)) signals++;
  if (/\{/.test(str)) signals++;
  if (/\(/.test(str)) signals++;
  if (/\[\];/.test(str)) signals++;

  // Common code keywords
  const codeKeywords = [
    "return",
    "if (",
    "for (",
    "while (",
    "async",
    "await",
    "def ",
    "#include",
    "public class",
    "<html",
    "SELECT ",
    "FROM ",
  ];
  for (const kw of codeKeywords) {
    if (str.includes(kw)) signals++;
  }

  // Code fences (Markdown)
  if (str.includes("```")) signals++;

  return signals >= 3;
}

/**
 * Detects whether the text appears to be trending/news/social content.
 *
 * @param {string} text
 * @returns {boolean}
 */
function detectTrending(text) {
  const str = (text || "").toLowerCase();

  // News indicators
  const newsPatterns = [
    "breaking",
    "just in",
    "update:",
    "report:",
    "sources say",
    "according to",
    "as of today",
    "this week",
    "trending",
  ];
  for (const p of newsPatterns) {
    if (str.includes(p)) return true;
  }

  // Social media indicators
  const socialPatterns = [
    "retweet",
    "viral",
    "thread",
    "tweet",
    "posted",
    "shared",
    "likes",
    "followers",
  ];
  for (const p of socialPatterns) {
    if (str.includes(p)) return true;
  }

  // Recency / time indicators
  const timePatterns = [
    "today",
    "yesterday",
    "this morning",
    "hours ago",
    "minutes ago",
  ];
  for (const p of timePatterns) {
    if (str.includes(p)) return true;
  }

  return false;
}

/**
 * Rough token estimator: ~4 characters per token (industry rule of thumb).
 *
 * @param {string} text
 * @returns {number}
 */
function estimateTokens(text) {
  return Math.ceil((text || "").length / 4);
}

/**
 * Selects the best AI model for the given content and context.
 * Rules are applied in strict priority order — first match wins.
 *
 * @param {string}  content         - Raw page content for analysis
 * @param {string}  mode            - explain | summarize | keypoints | beginner | code | selection
 * @param {boolean} isYouTube       - Whether the source is a YouTube page
 * @param {string|null} userPreference - 'best_quality' | 'fast' | 'cheap' | null
 * @returns {{ model: string, reason: string, confidence: string }}
 */
function selectModel(
  content = "",
  mode = "explain",
  isYouTube = false,
  userPreference = null,
) {
  // ── Rule 1: Explicit quality preference ──────────────────────────────────
  if (userPreference === "best_quality") {
    return {
      model: "gemini",
      reason: "User requested best quality output",
      confidence: "high",
    };
  }

  // ── Rule 2: Explicit speed / cost preference ──────────────────────────────
  if (userPreference === "fast" || userPreference === "cheap") {
    return {
      model: "deepseek",
      reason: "User requested fast and cost-efficient processing",
      confidence: "high",
    };
  }

  // ── Rule 3: YouTube content ───────────────────────────────────────────────
  if (isYouTube === true) {
    return {
      model: "gemini",
      reason:
        "YouTube content benefits from Gemini's long-context understanding",
      confidence: "high",
    };
  }

  // ── Rule 4: Large content (>1500 estimated tokens ≈ 6000 chars) ──────────
  if (estimateTokens(content) > 1500) {
    return {
      model: "gemini",
      reason: "Large content detected — Gemini handles long context best",
      confidence: "high",
    };
  }

  // ── Rule 5: Code / technical content ─────────────────────────────────────
  if (detectCode(content, mode)) {
    return {
      model: "deepseek",
      reason:
        "Code/technical content detected — DeepSeek excels at code explanation",
      confidence: "high",
    };
  }

  // ── Rule 6: Trending / news / social content ──────────────────────────────
  if (detectTrending(content)) {
    return {
      model: "grok",
      reason:
        "Trending/news-style content detected — Grok is optimized for real-time information",
      confidence: "medium",
    };
  }

  // ── Rule 7: Default ───────────────────────────────────────────────────────
  // Gemini is the default for everything — it handles all content types well
  // and is the only required API key. All other models are optional enhancements.
  return {
    model: "gemini",
    reason:
      "Gemini is the default model — fast, capable, and handles all content types",
    confidence: "high",
  };
}

module.exports = { selectModel, detectCode, detectTrending, estimateTokens };
