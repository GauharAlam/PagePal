'use strict';

const rateLimit = require('express-rate-limit');

/**
 * Global rate limiter applied to every API route.
 *
 * The window and max can be tuned via environment variables without
 * redeploying code. Defaults are conservative — enough for normal usage
 * while blocking runaway loops or abuse.
 *
 * When the limit is exceeded, a JSON error is returned (not the default
 * HTML response) so the Chrome extension can parse it cleanly.
 */
const rateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1-minute rolling window

  max: parseInt(process.env.MAX_REQUESTS_PER_MINUTE, 10) || 30,

  // Use the standard draft-7 RateLimit headers (X-RateLimit-*)
  standardHeaders: true,

  // Disable the legacy X-RateLimit-* headers to avoid duplication
  legacyHeaders: false,

  // Always respond with JSON so the extension can handle errors gracefully
  handler: (_req, res) => {
    res.status(429).json({
      success: false,
      error: 'Too many requests. Please wait a moment.',
    });
  },
});

module.exports = rateLimiter;
