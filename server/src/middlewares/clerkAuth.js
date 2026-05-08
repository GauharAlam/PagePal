"use strict";

const { verifyToken } = require("@clerk/backend");

/**
 * Clerk Authentication Middleware
 * Verifies the Bearer token from the Authorization header using Clerk's backend SDK.
 * Attaches the decoded token claims to req.auth for use in route handlers.
 *
 * Usage:
 *   app.use(clerkAuth);  // for all routes
 *   router.post('/protected', clerkAuth, handler);  // for specific routes
 */
async function clerkAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    // If no auth header, allow to proceed (routes can decide if it's required)
    if (!authHeader) {
      req.auth = null;
      return next();
    }

    // Extract Bearer token
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : authHeader;

    // Verify token with Clerk
    const decoded = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
    });

    // Attach decoded claims to request
    req.auth = decoded;
    next();
  } catch (error) {
    // Token verification failed
    console.error("[Clerk Auth Error]", error.message);
    req.auth = null;
    next(); // Allow non-authenticated requests (routes can enforce if needed)
  }
}

/**
 * Require Clerk Authentication
 * Use this to enforce authentication on specific routes.
 * Will return 401 if user is not authenticated.
 */
function requireAuth(req, res, next) {
  if (!req.auth || !req.auth.sub) {
    return res.status(401).json({
      success: false,
      error: "Unauthorized: Please sign in.",
    });
  }
  next();
}

module.exports = { clerkAuth, requireAuth };
