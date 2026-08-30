import dotenv from 'dotenv';
dotenv.config();

function requireEnv(name, fallback = undefined) {
  const v = process.env[name] ?? fallback;
  if (!v || v.includes('your-') || v.includes('placeholder')) {
    if (process.env.NODE_ENV === 'production') {
      console.error(`❌ Missing required env var: ${name}`);
      process.exit(1);
    } else {
      console.warn(`⚠️  Env ${name} is placeholder/missing (dev mode allows).`);
    }
  }
  return v;
}

export const isDemo = (v) => !v || v.includes('your-') || v.includes('placeholder');

export const env = {
  PORT: parseInt(process.env.PORT || '3001', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || '',
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || '',
  OPENROUTER_MODEL: process.env.OPENROUTER_MODEL || 'z-ai/glm-4.5',
  SUPABASE_URL: requireEnv('SUPABASE_URL'),
  SUPABASE_SERVICE_KEY: requireEnv('SUPABASE_SERVICE_KEY'),
  DEMO_MODE: (isDemo(process.env.ANTHROPIC_API_KEY) && isDemo(process.env.OPENROUTER_API_KEY)) || isDemo(process.env.SUPABASE_URL),
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || '',
  STRIPE_PRO_PRICE_ID: process.env.STRIPE_PRO_PRICE_ID || '',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  ALLOWED_ORIGINS: (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean),
};

export function getCorsOrigins() {
  // In dev, allow all extension origins + localhost
  if (env.NODE_ENV !== 'production') return true; // reflect request origin
  // In prod, strict allowlist + chrome-extension scheme
  return (origin, cb) => {
    if (!origin) return cb(null, true); // curl/health
    if (origin.startsWith('chrome-extension://')) return cb(null, true);
    if (env.ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    if (origin === env.FRONTEND_URL) return cb(null, true);
    cb(new Error(`CORS blocked for origin: ${origin}`));
  };
}
