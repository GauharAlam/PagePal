'use strict';

/**
 * System prompts keyed by interaction mode.
 * Each prompt shapes the persona and output format of the AI response.
 */
const SYSTEM_PROMPTS = {
  explain:
    'You are PagePal, a friendly AI assistant embedded in a Chrome extension. ' +
    'Your job is to explain web content in clear, simple language. ' +
    'Be concise, use plain English, and structure your responses with short paragraphs ' +
    'or bullet points when helpful. Always be helpful and encouraging.',

  summarize:
    'You are PagePal, a smart summarizer. ' +
    'Extract the most important information and present it as 3-7 bullet points. ' +
    'Be concise and accurate. Focus on the main ideas, not details.',

  keypoints:
    'You are PagePal. Extract and list the key takeaways from the content. ' +
    'Use numbered list format. Be specific and actionable.',

  beginner:
    'You are PagePal, a patient teacher. ' +
    'Explain everything as if the user has zero prior knowledge. ' +
    'Use simple words, relatable analogies, and avoid jargon. ' +
    'Break things down into small steps.',

  code:
    'You are PagePal, an expert code explainer. ' +
    'When given code, explain: (1) what it does overall, ' +
    '(2) how it works step by step, ' +
    '(3) any important patterns or techniques used. ' +
    'Use clear language that both beginners and intermediate developers can follow.',

  selection:
    'You are PagePal. The user has selected a specific piece of text from a webpage. ' +
    'Explain this selected text clearly and concisely in simple language.',
};

/**
 * Builds a { systemPrompt, userPrompt } pair ready to be forwarded to the
 * OpenAI Chat Completions API.
 *
 * @param {string} message   - The user's question or instruction.
 * @param {string} context   - Cleaned, truncated page content.
 * @param {string} mode      - One of the SYSTEM_PROMPTS keys.
 * @param {string} pageTitle - Title of the active browser tab.
 * @param {string} pageUrl   - URL of the active browser tab.
 * @returns {{ systemPrompt: string, userPrompt: string }}
 */
function buildPrompt(message, context, mode, pageTitle, pageUrl) {
  // Fall back to 'explain' for unknown or missing modes
  const systemPrompt = SYSTEM_PROMPTS[mode] || SYSTEM_PROMPTS.explain;

  // Determine whether we have meaningful page context to include
  const hasContext = context && context.trim().length >= 50;
  const contextSection = hasContext
    ? context.trim()
    : context && context.trim().length > 0
    ? context.trim()
    : '(No page content was captured.)';

  // Compose the user-facing prompt that includes all available context
  let userPrompt =
    `Page: ${pageTitle || 'Unknown page'} (${pageUrl || 'unknown URL'})\n\n` +
    `Content:\n${contextSection}\n\n` +
    `User question: ${message}`;

  // Warn the model when context is sparse so it doesn't hallucinate details
  if (!hasContext) {
    userPrompt += '\n\nNote: Limited page content was available.';
  }

  return { systemPrompt, userPrompt };
}

module.exports = { buildPrompt };
