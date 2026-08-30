import { Router } from 'express';
import requireAuth from '../middleware/requireAuth.js';
import { getAnthropic } from '../lib/supabase.js';
import { hasOpenRouter, openRouterCreate } from '../lib/openrouter.js';
import { validate, translateSchema } from '../lib/validate.js';
import { env } from '../lib/env.js';
import { mockTranslate } from '../lib/demo.js';
import { sanitizeContent } from '../lib/sanitize.js';

const router = Router();

router.post('/api/translate', requireAuth, validate(translateSchema), async (req, res) => {
  try {
    const { text: rawText, targetLanguage } = req.body;
    const text = sanitizeContent(rawText);

    const useOpenRouter = hasOpenRouter();
    if (!useOpenRouter && env.DEMO_MODE) {
      console.log('📦 DEMO_MODE translate → mock');
      return res.json({ translation: mockTranslate(text, targetLanguage) });
    }

    let supabase = null;
    try { supabase = (await import('../lib/supabase.js')).getSupabase(); } catch {}
    if (supabase && req.userPlan?.plan === 'free') {
      return res.status(403).json({
        error: 'Translation is a Pro feature',
        message: 'Upgrade to Pro to translate summaries to 50+ languages.',
        upgrade: true,
      });
    }

    const prompt = `Translate the following text to ${targetLanguage}. Return ONLY the translated text, preserving the original formatting (bullet points, line breaks, etc). Do not add any explanations or notes.\n\n${text.slice(0, 10000)}`;

    let translation = '';
    if (useOpenRouter) {
      console.log(`🤖 OpenRouter GLM translate → ${env.OPENROUTER_MODEL}`);
      const msg = await openRouterCreate({ messages: [{ role: 'user', content: prompt }], max_tokens: 2000 });
      translation = msg.content[0].text;
    } else {
      const anthropic = await getAnthropic();
      const msg = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }],
      });
      translation = msg.content[0].text;
    }

    res.json({ translation });
  } catch (err) {
    console.error('Translate error:', err);
    const isProd = process.env.NODE_ENV === 'production';
    res.status(500).json({ error: isProd ? 'Translation failed' : err.message });
  }
});

export default router;
