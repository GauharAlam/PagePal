import { Router } from 'express';
import requireAuth from '../middleware/requireAuth.js';
import { getSupabase, getAnthropic } from '../lib/supabase.js';
import { hasOpenRouter, openRouterCreate, cleanThinkingTags } from '../lib/openrouter.js';
import { validate, summarizeSchema } from '../lib/validate.js';
import { env } from '../lib/env.js';
import { mockSummarize } from '../lib/demo.js';
import { sanitizeContent, sanitizeTitle } from '../lib/sanitize.js';
import { logger } from '../lib/logger.js';

const router = Router();
const FREE_SUMMARY_LIMIT = 5;

router.post('/api/summarize', requireAuth, validate(summarizeSchema), async (req, res) => {
  try {
    const { content: rawContent, pageType, title: rawTitle, url, model, forceRefresh } = req.body;
    const title = sanitizeTitle(rawTitle);
    const content = sanitizeContent(rawContent);

    const useOpenRouter = hasOpenRouter();
    if (!useOpenRouter && env.DEMO_MODE) {
      logger.info('DEMO_MODE summarize → mock');
      return res.json(mockSummarize({ title, pageType }));
    }

    let supabase = null;
    try { supabase = getSupabase(); } catch {}

    if (supabase && req.userPlan?.plan === 'free' && req.userPlan.daily_summaries >= FREE_SUMMARY_LIMIT) {
      return res.status(429).json({
        error: 'Daily summary limit reached',
        message: `Free plan allows ${FREE_SUMMARY_LIMIT} summaries per day. Upgrade to Pro for unlimited access or BYOK.`,
        upgrade: true,
      });
    }

    // Cache check
    if (supabase && url && !forceRefresh) {
      try {
        const { data: cached } = await supabase
          .from('saved_summaries')
          .select('summary, key_points, timestamps, followup_questions, created_at')
          .eq('page_url', url)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (cached) {
          const ageMs = Date.now() - new Date(cached.created_at).getTime();
          if (ageMs < 24 * 60 * 60 * 1000) {
            logger.info('Returning cached summary', { url, ageHours: (ageMs / 3600000).toFixed(1) });
            return res.json({
              summary: cached.summary,
              keyPoints: cached.key_points || [],
              timestamps: cached.timestamps || [],
              followupQuestions: cached.followup_questions || [],
              cached: true,
            });
          }
        }
      } catch (cacheErr) {
        logger.debug('Cache check miss or error', { error: cacheErr.message });
      }
    }

    const systemPrompt = `You are PagePal AI, an expert research assistant. The user is analyzing a ${pageType} titled "${title}".
Analyze the provided content and respond ONLY with valid JSON matching this schema:
{
  "summary": "2-4 sentence clear, insightful summary of the core thesis and conclusions",
  "keyPoints": [
    "Key takeaway or crucial argument 1",
    "Key takeaway or crucial argument 2",
    "Key takeaway or crucial argument 3",
    "Key takeaway or crucial argument 4",
    "Key takeaway or crucial argument 5"
  ],
  "timestamps": [
    {"time": "0:00", "label": "Introduction & Overview"}
  ],
  "sentiment": "positive",
  "readingTime": "3 min read",
  "language": "English",
  "followupQuestions": [
    "Short question under 7 words?",
    "Short question under 7 words?",
    "Short question under 7 words?"
  ]
}
Rules:
- sentiment must be one of: "positive", "neutral", "negative".
- For YouTube videos, include chronological timestamps if transcript details are present, otherwise provide [].
- keyPoints must contain exactly 5 high-value takeaways.
- followupQuestions must contain 3-4 ultra-short, punchy questions (STRICTLY 4 to 7 words each, never long sentences) directly about key concepts from this content.
- Output pure JSON only. Do not include markdown code block tags, preambles, or conversational commentary.`;

    let raw = '';
    if (useOpenRouter) {
      logger.info(`OpenRouter summarize → model: ${model || env.OPENROUTER_MODEL}`);
      const msg = await openRouterCreate({
        model,
        system: systemPrompt,
        messages: [{ role: 'user', content: `Content to analyze:\n\n${content.slice(0, 16000)}` }],
        max_tokens: 1800,
        timeoutMs: 45000,
      });
      raw = msg.content[0]?.text || '';
    } else {
      const anthropic = await getAnthropic();
      const msg = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1800,
        messages: [{ role: 'user', content: `Content to analyze:\n\n${content.slice(0, 16000)}` }],
        system: systemPrompt,
      });
      raw = msg.content[0]?.text || '';
    }

    // Robust JSON extraction and cleaning
    let cleaned = cleanThinkingTags(raw);
    cleaned = cleaned.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
    
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      cleaned = cleaned.slice(firstBrace, lastBrace + 1);
    }

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
      if (!parsed.summary) throw new Error('Missing summary property');
      if (!Array.isArray(parsed.keyPoints)) parsed.keyPoints = [];
      if (!Array.isArray(parsed.followupQuestions)) parsed.followupQuestions = [];
    } catch (e) {
      logger.error('JSON parse failed on AI response', { snippet: raw.slice(0, 400), error: e.message });
      // Fallback rescue
      parsed = {
        summary: cleanThinkingTags(raw).slice(0, 500) || 'Summary generated.',
        keyPoints: ['Comprehensive analysis completed from page content'],
        timestamps: [],
        sentiment: 'neutral',
        readingTime: '2 min read',
        language: 'English',
        followupQuestions: [
          'What are the core arguments in this piece?',
          'What are the practical applications of this?',
          'What are the limitations or counterpoints?'
        ],
      };
    }

    // DB ops
    if (supabase) {
      try {
        await supabase.rpc('increment_usage', { p_user_id: req.user.id, p_field: 'daily_summaries' });
      } catch {
        try {
          await supabase.from('user_plans').update({ daily_summaries: (req.userPlan.daily_summaries || 0) + 1 }).eq('user_id', req.user.id);
        } catch {}
      }

      try {
        await supabase.from('saved_summaries').insert({
          user_id: req.user.id,
          page_url: url || '',
          page_title: title,
          page_type: pageType,
          summary: parsed.summary,
          key_points: parsed.keyPoints,
          timestamps: parsed.timestamps,
        });
      } catch (saveErr) {
        logger.warn('Failed to save summary to database', { error: saveErr.message });
      }
    }

    res.json(parsed);
  } catch (err) {
    logger.error('Summarize error', { error: err.message });
    const isProd = process.env.NODE_ENV === 'production';
    res.status(500).json({ error: isProd ? 'Summarization failed' : err.message });
  }
});

export default router;
