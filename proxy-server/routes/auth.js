import { Router } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import requireAuth from '../middleware/requireAuth.js';

const router = Router();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Translate endpoint
router.post('/api/translate', requireAuth, async (req, res) => {
  try {
    const { text, targetLanguage } = req.body;

    if (!text || !targetLanguage) {
      return res.status(400).json({ error: 'Text and target language are required' });
    }

    // Translation is Pro-only
    if (req.userPlan.plan === 'free') {
      return res.status(429).json({
        error: 'Translation is a Pro feature',
        message: 'Upgrade to Pro to translate summaries to 50+ languages.',
        upgrade: true
      });
    }

    const msg = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: `Translate the following text to ${targetLanguage}. Return ONLY the translated text, preserving the original formatting (bullet points, line breaks, etc). Do not add any explanations or notes.\n\n${text.slice(0, 10000)}`
      }]
    });

    res.json({ translation: msg.content[0].text });
  } catch (err) {
    console.error('Translate error:', err);
    res.status(500).json({ error: err.message || 'Translation failed' });
  }
});

export default router;
