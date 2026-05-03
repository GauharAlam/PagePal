'use strict';

/**
 * Centralised Express error-handling middleware.
 * Must be registered LAST in server.js (after all routes).
 *
 * Signature must have exactly 4 parameters so Express recognises it as an
 * error handler — do not remove `next` even though it's unused here.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // Always log the full error on the server for debugging
  console.error(`[ErrorHandler] ${req.method} ${req.path} —`, err);

  const isDev = process.env.NODE_ENV !== 'production';

  // ── Mongoose Validation Error ────────────────────────────────────────────
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      success: false,
      error: `Validation failed: ${messages.join(', ')}`,
      ...(isDev && { stack: err.stack }),
    });
  }

  // ── Mongoose Duplicate Key Error ─────────────────────────────────────────
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    return res.status(400).json({
      success: false,
      error: `Duplicate value for ${field}.`,
      ...(isDev && { stack: err.stack }),
    });
  }

  // ── Mongoose CastError (e.g. bad ObjectId) ───────────────────────────────
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: `Invalid value for field: ${err.path}`,
      ...(isDev && { stack: err.stack }),
    });
  }

  // ── OpenAI / upstream API errors (carry a numeric .status) ──────────────
  if (err.status && typeof err.status === 'number') {
    return res.status(err.status).json({
      success: false,
      error: err.message || 'Upstream API error.',
      ...(isDev && { stack: err.stack }),
    });
  }

  // ── JSON body parse error (SyntaxError from express.json) ────────────────
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      error: 'Malformed JSON in request body.',
    });
  }

  // ── Default: Internal Server Error ──────────────────────────────────────
  return res.status(500).json({
    success: false,
    error: isDev ? err.message : 'An internal server error occurred.',
    ...(isDev && { stack: err.stack }),
  });
}

module.exports = errorHandler;
