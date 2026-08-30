import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';

let _client = null;
export function getSupabase() {
  if (_client) return _client;
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) {
    throw new Error('Supabase not configured');
  }
  _client = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return _client;
}

let _anthropic = null;
export async function getAnthropic() {
  if (_anthropic) return _anthropic;
  const { default: Anthropic } = await import('@anthropic-ai/sdk');
  if (!env.ANTHROPIC_API_KEY || env.ANTHROPIC_API_KEY.includes('your-')) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }
  _anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  return _anthropic;
}
