'use strict';

/**
 * Estimates the number of tokens in a piece of text using the widely-cited
 * rule of thumb: ~4 characters per token for English prose.
 *
 * This is intentionally a rough estimate — it avoids the overhead of running
 * a full tokeniser (e.g. tiktoken) on the server for every request.
 * The actual count from the OpenAI API response is stored on each Message doc
 * for precise usage tracking.
 *
 * @param {string} text - Any string.
 * @returns {number}    - Estimated token count (always >= 0).
 */
function estimateTokens(text) {
  if (!text || typeof text !== 'string') return 0;
  return Math.ceil(text.length / 4);
}

module.exports = { estimateTokens };
