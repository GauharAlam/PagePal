'use strict';

/**
 * Common boilerplate phrases scraped from typical web pages.
 * These add noise to the context without helping the AI answer questions.
 * Patterns are case-insensitive.
 */
const BOILERPLATE_PATTERNS = [
  /cookie\s*policy/gi,
  /accept\s*cookies?/gi,
  /we\s*use\s*cookies?/gi,
  /subscribe\s*to\s*(our\s*)?(newsletter|updates)/gi,
  /all\s*rights\s*reserved/gi,
  /privacy\s*policy/gi,
  /terms\s*(of\s*)?(service|use)/gi,
  /sign\s*(up|in)\s*(for\s*free)?/gi,
  /follow\s*us\s*(on)?/gi,
  /share\s*this\s*(article|post|page)?/gi,
  /advertisement/gi,
  /sponsored\s*(content|post)?/gi,
];

/**
 * Cleans raw page text extracted by the Chrome extension content script.
 *
 * Steps:
 *  1. Remove common boilerplate phrases.
 *  2. Collapse multiple consecutive spaces into one.
 *  3. Remove lines that contain only whitespace.
 *  4. Collapse 3+ consecutive newlines down to 2.
 *  5. Trim leading/trailing whitespace.
 *
 * @param {string} rawText - The raw text scraped from the page.
 * @returns {string}
 */
function cleanContent(rawText) {
  if (!rawText || typeof rawText !== 'string') return '';

  let text = rawText;

  // 1. Strip boilerplate phrases
  for (const pattern of BOILERPLATE_PATTERNS) {
    text = text.replace(pattern, '');
  }

  // 2. Collapse multiple spaces into one
  text = text.replace(/ {2,}/g, ' ');

  // 3. Remove lines that are purely whitespace
  text = text
    .split('\n')
    .filter((line) => line.trim().length > 0)
    .join('\n');

  // 4. Collapse 3+ consecutive newlines → 2 (preserves paragraph breaks)
  text = text.replace(/\n{3,}/g, '\n\n');

  // 5. Final trim
  return text.trim();
}

/**
 * Truncates text to at most `maxChars` characters, attempting to break on
 * a sentence boundary (`.`, `!`, `?`) to avoid cutting mid-sentence.
 *
 * @param {string} text      - Pre-cleaned text.
 * @param {number} maxChars  - Maximum allowed character count (default 6000).
 * @returns {string}
 */
function truncateContent(text, maxChars = 6000) {
  if (!text || text.length <= maxChars) return text;

  // Search backwards from maxChars for the last sentence-ending punctuation
  const slice = text.slice(0, maxChars);
  const lastSentenceEnd = Math.max(
    slice.lastIndexOf('.'),
    slice.lastIndexOf('!'),
    slice.lastIndexOf('?')
  );

  if (lastSentenceEnd > maxChars * 0.5) {
    // Found a reasonable cut point — include the punctuation character (+1)
    return slice.slice(0, lastSentenceEnd + 1) + '...';
  }

  // No good sentence boundary found; hard-truncate
  return slice + '...';
}

module.exports = { cleanContent, truncateContent };
