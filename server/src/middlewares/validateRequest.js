'use strict';

const MAX_MESSAGE_LENGTH = 2000;

/**
 * Validates the request body for the POST /api/chat endpoint.
 *
 * Rules:
 *  - `message`  — required, must be a non-empty string, max 2000 chars.
 *  - `context`  — optional, but if present must be a string.
 *  - `mode`     — optional, but if present must be one of the known modes.
 *
 * Returns 400 with a descriptive error on failure; calls next() on success.
 */
function validateRequest(req, res, next) {
  const { message, context, mode } = req.body;

  // ── message (required) ───────────────────────────────────────────────────
  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Invalid request: "message" must be a non-empty string.',
    });
  }

  if (message.length > MAX_MESSAGE_LENGTH) {
    return res.status(400).json({
      success: false,
      error: `Invalid request: "message" must not exceed ${MAX_MESSAGE_LENGTH} characters.`,
    });
  }

  // ── context (optional) ───────────────────────────────────────────────────
  if (context !== undefined && typeof context !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Invalid request: "context" must be a string when provided.',
    });
  }

  // ── mode (optional) ──────────────────────────────────────────────────────
  const validModes = ['explain', 'summarize', 'keypoints', 'beginner', 'code', 'selection'];
  if (mode !== undefined && mode !== null && !validModes.includes(mode)) {
    return res.status(400).json({
      success: false,
      error: `Invalid request: "mode" must be one of: ${validModes.join(', ')}.`,
    });
  }

  next();
}

module.exports = validateRequest;
