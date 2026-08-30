import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import { env, getCorsOrigins } from './lib/env.js';
import { logger } from './lib/logger.js';
import summarizeRouter from './routes/summarize.js';
import askRouter from './routes/ask.js';
import translateRouter from './routes/translate.js';
import billingRouter, { handleStripeWebhook } from './routes/billing.js';
import byokRouter from './routes/byok.js';

const app = express();
const PORT = env.PORT;

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: false,
}));

// CORS — strict in prod
app.use(cors({
  origin: getCorsOrigins(),
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'stripe-signature', 'x-demo-plan'],
}));

// Stripe webhook needs raw body — mount BEFORE json parser
app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), handleStripeWebhook);

// JSON parser for rest
app.use(express.json({ limit: '2mb' }));

// Global IP-based rate limiter (60 req/min)
const ipLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: env.MAX_REQUESTS_PER_MINUTE,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please slow down' },
});
app.use('/api/', ipLimiter);

// Per-User / Per-Token rate limiter on AI generation endpoints
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  keyGenerator: (req) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.slice(7, 30);
    }
    return req.ip || '127.0.0.1';
  },
  validate: { keyGeneratorIpFallback: false },
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'AI request rate limit exceeded. Please wait a moment before trying again.' },
});

// Request logging with logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.path}`, {
      status: res.statusCode,
      durationMs: duration,
      ip: req.ip,
    });
  });
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'PagePal AI Proxy',
    version: '1.0.0',
    env: env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// Apply AI rate limiter to AI generation endpoints
app.use(['/api/summarize', '/api/chat', '/api/quiz', '/api/translate'], aiLimiter);

// Mount routers
app.use(summarizeRouter);
app.use(askRouter);
app.use(translateRouter);
app.use(billingRouter);
app.use(byokRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler — never leak internals in prod
app.use((err, req, res, next) => {
  logger.error('Unhandled server error', { error: err.message, stack: err.stack, path: req.path });
  if (err.message && err.message.includes('CORS')) {
    return res.status(403).json({ error: err.message });
  }
  res.status(500).json({
    error: 'Internal server error',
    message: env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

const server = app.listen(PORT, () => {
  logger.info(`PagePal AI proxy server running on port ${PORT} [${env.NODE_ENV}]${env.DEMO_MODE ? ' (DEMO_MODE)' : ''}`);
  logger.info(`Health: http://localhost:${PORT}/api/health`);
  if (env.DEMO_MODE) {
    logger.warn('Demo: All AI routes return mock data unless OpenRouter or Anthropic keys are configured.');
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
  });
});

export default app;
