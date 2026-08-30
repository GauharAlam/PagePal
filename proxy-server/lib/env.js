import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

export const isDemo = (v) => !v || v.includes('your-') || v.includes('placeholder') || v.includes('sk-ant-your') || v.includes('your_');

const envSchema = z.object({
  PORT: z.coerce.number().default(3001),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  ANTHROPIC_API_KEY: z.string().default(''),
  OPENROUTER_API_KEY: z.string().default(''),
  OPENROUTER_MODEL: z.string().default('z-ai/glm-4.5'),
  SUPABASE_URL: z.string().default(''),
  SUPABASE_SERVICE_KEY: z.string().default(''),
  ENCRYPTION_SECRET: z.string().default(''),
  STRIPE_SECRET_KEY: z.string().default(''),
  STRIPE_WEBHOOK_SECRET: z.string().default(''),
  STRIPE_PRO_PRICE_ID: z.string().default(''),
  FRONTEND_URL: z.string().default('http://localhost:5173'),
  ALLOWED_ORIGINS: z.string().default(''),
  MAX_REQUESTS_PER_MINUTE: z.coerce.number().default(60),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error('❌ Environment validation failed:', parsed.error.format());
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
}

const rawEnv = parsed.success ? parsed.data : {};

export const env = {
  ...rawEnv,
  DEMO_MODE: (isDemo(rawEnv.ANTHROPIC_API_KEY) && isDemo(rawEnv.OPENROUTER_API_KEY)) || isDemo(rawEnv.SUPABASE_URL),
  ALLOWED_ORIGINS: (rawEnv.ALLOWED_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
};

export function getCorsOrigins() {
  if (env.NODE_ENV !== 'production') return true;
  return (origin, cb) => {
    if (!origin) return cb(null, true);
    if (origin.startsWith('chrome-extension://')) return cb(null, true);
    if (env.ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    if (origin === env.FRONTEND_URL) return cb(null, true);
    cb(new Error(`CORS blocked for origin: ${origin}`));
  };
}
