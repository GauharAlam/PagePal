import { Router } from 'express';
import requireAuth from '../middleware/requireAuth.js';
import { getAnthropic } from '../lib/supabase.js';
import { hasOpenRouter, openRouterCreate, cleanThinkingTags } from '../lib/openrouter.js';
import { validate, translateSchema } from '../lib/validate.js';
import { env } from '../lib/env.js';
import { mockTranslate } from '../lib/demo.js';
import { sanitizeContent } from '../lib/sanitize.js';
import { logger } from '../lib/logger.js';

const router = Router();

router.post('/api/translate', requireAuth, validate(translateSchema), async (req, res) => {
  try {
    const { text: rawText, targetLanguage, model } = req.body;
    const text = sanitizeContent(rawText);

    const useOpenRouter = hasOpenRouter();
    if (!useOpenRouter && env.DEMO_MODE) {
      logger.info('DEMO_MODE translate → mock');
      return res.json({ translation: mockTranslate(text, targetLanguage) });
    }

    const prompt = `Translate the following text accurately into ${targetLanguage}.
Maintain all markdown formatting (headings, bullet points, numbered lists, bold text) exactly as in the original.
Do not add any preambles, intros, or commentary. Output only the translated content.

Text to translate:
${text.slice(0, 12000)}`;

    let translation = '';
    if (useOpenRouter) {
      logger.info(`OpenRouter translate → target: ${targetLanguage}, model: ${model || env.OPENROUTER_MODEL}`);
      const msg = await openRouterCreate({
        model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 2500,
        timeoutMs: 30000,
      });
      translation = msg.content[0]?.text || '';
    } else {
      const anthropic = await getAnthropic();
      const msg = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 2500,
        messages: [{ role: 'user', content: prompt }],
      });
      translation = msg.content[0]?.text || '';
    }

    translation = cleanThinkingTags(translation);

    res.json({ translation });
  } catch (err) {
    logger.error('Translate error:', { error: err.message });
    const isProd = process.env.NODE_ENV === 'production';
    res.status(500).json({ error: isProd ? 'Translation failed' : err.message });
  }
});

export default router;
