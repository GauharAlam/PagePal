import { Router } from 'express';
import { z } from 'zod';
import requireAuth from '../middleware/requireAuth.js';
import { getSupabase } from '../lib/supabase.js';
import { env } from '../lib/env.js';
import { encrypt, decrypt } from '../lib/crypto.js';

const router = Router();

const upsertSchema = z.object({
  provider: z.enum(['anthropic','openai','gemini','deepseek','grok']),
  api_key: z.string().min(8).max(300),
});

// In demo mode, store in memory (no Supabase)
const demoStore = new Map(); // userId -> Map(provider->key)

function isDemo() { return env.DEMO_MODE; }

// GET /api/keys — list providers with masked keys
router.get('/api/keys', requireAuth, async (req, res) => {
  try {
    if (isDemo()) {
      const m = demoStore.get(req.user.id) || new Map();
      const list = [...m.entries()].map(([provider, key]) => ({
        provider,
        masked: key.slice(0,4) + '…' + key.slice(-4),
        created_at: new Date().toISOString(),
      }));
      return res.json({ keys: list, demo: true });
    }
    const supabase = getSupabase();
    const { data, error } = await supabase.from('user_api_keys').select('provider, api_key, created_at').eq('user_id', req.user.id);
    if (error) throw error;
    const keys = (data||[]).map(r => {
      // Decrypt key, then mask for display
      let rawKey;
      try {
        rawKey = decrypt(r.api_key);
      } catch {
        rawKey = r.api_key; // Legacy unencrypted key
      }
      return {
        provider: r.provider,
        masked: rawKey.slice(0,4) + '…' + rawKey.slice(-4),
        created_at: r.created_at,
      };
    });
    res.json({ keys });
  } catch (err) {
    console.error('GET keys error', err);
    res.status(500).json({ error: 'Failed to retrieve keys' });
  }
});

// POST /api/keys — upsert (encrypt before storing)
router.post('/api/keys', requireAuth, async (req, res) => {
  const parsed = upsertSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
  const { provider, api_key } = parsed.data;
  try {
    if (isDemo()) {
      let m = demoStore.get(req.user.id);
      if (!m) { m = new Map(); demoStore.set(req.user.id, m); }
      m.set(provider, api_key);
      return res.json({ success: true, provider, demo: true });
    }
    // Encrypt the API key before storing
    const encryptedKey = encrypt(api_key);
    const supabase = getSupabase();
    const { error } = await supabase.from('user_api_keys').upsert({
      user_id: req.user.id,
      provider,
      api_key: encryptedKey,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,provider' });
    if (error) throw error;
    res.json({ success: true, provider });
  } catch (err) {
    console.error('POST keys error', err);
    res.status(500).json({ error: 'Failed to save key' });
  }
});

// DELETE /api/keys/:provider
router.delete('/api/keys/:provider', requireAuth, async (req, res) => {
  const provider = req.params.provider;
  if (!['anthropic','openai','gemini','deepseek','grok'].includes(provider)) return res.status(400).json({ error: 'Invalid provider' });
  try {
    if (isDemo()) {
      demoStore.get(req.user.id)?.delete(provider);
      return res.json({ success: true, demo: true });
    }
    const supabase = getSupabase();
    const { error } = await supabase.from('user_api_keys').delete().eq('user_id', req.user.id).eq('provider', provider);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error('DELETE keys error', err);
    res.status(500).json({ error: 'Failed to delete key' });
  }
});

export default router;
