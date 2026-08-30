import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import { env, getCorsOrigins } from './lib/env.js';
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
  allowedHeaders: ['Content-Type', 'Authorization', 'stripe-signature'],
}));

// Stripe webhook needs raw body — mount BEFORE json parser
app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), handleStripeWebhook);

// JSON parser for rest
app.use(express.json({ limit: '2mb' }));

// Rate limiter: 60 req/min per IP (tune via env)
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: parseInt(process.env.MAX_REQUESTS_PER_MINUTE || '60', 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please slow down' },
});
app.use('/api/', limiter);

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} → ${res.statusCode} (${duration}ms)`);
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

// Routes
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
  console.error('Unhandled error:', err);
  if (err.message && err.message.includes('CORS')) {
    return res.status(403).json({ error: err.message });
  }
  res.status(500).json({
    error: 'Internal server error',
    message: env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

app.listen(PORT, () => {
  console.log(`\n🧠 PagePal AI proxy server running on port ${PORT} [${env.NODE_ENV}]${env.DEMO_MODE ? ' — 📦 DEMO_MODE (mock AI, no keys needed)' : ''}`);
  console.log(`   Health: http://localhost:${PORT}/api/health`);
  console.log(`   Routes: /api/summarize, /api/chat, /api/quiz, /api/translate, /api/billing/*, /api/webhooks/stripe\n`);
  if (env.DEMO_MODE) {
    console.log('   Demo: All AI routes return mock data. Add real ANTHROPIC_API_KEY + SUPABASE_URL to exit demo.');
  }
  if (!env.ANTHROPIC_API_KEY || env.ANTHROPIC_API_KEY.includes('your-')) console.warn('⚠️  ANTHROPIC_API_KEY not set');
  if (!env.SUPABASE_URL || env.SUPABASE_URL.includes('your-')) console.warn('⚠️  SUPABASE_URL not set');
  if (!env.STRIPE_SECRET_KEY) console.warn('⚠️  STRIPE_SECRET_KEY not set — billing disabled');
});
