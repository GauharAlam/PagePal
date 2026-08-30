import { Router } from 'express';
import requireAuth from '../middleware/requireAuth.js';
import { getSupabase, getAnthropic } from '../lib/supabase.js';
import { hasOpenRouter, openRouterCreate } from '../lib/openrouter.js';
import { validate, summarizeSchema } from '../lib/validate.js';
import { env } from '../lib/env.js';
import { mockSummary } from '../lib/demo.js';
import { sanitizeContent, sanitizeTitle, sanitizeUrl } from '../lib/sanitize.js';
import { logger } from '../lib/logger.js';

const router = Router();
const FREE_SUMMARY_LIMIT = 5;

router.post('/api/summarize', requireAuth, validate(summarizeSchema), async (req, res) => {
  try {
    const { content: rawContent, pageType, title: rawTitle, url: rawUrl } = req.body;
    const content = sanitizeContent(rawContent);
    const title = sanitizeTitle(rawTitle);
    const url = sanitizeUrl(rawUrl);

    // If OpenRouter GLM is configured, use it even in Supabase-demo (DB ops become no-op)
    const useOpenRouter = hasOpenRouter();
    const useMock = !useOpenRouter && env.DEMO_MODE;

    if (useMock) {
      logger.info('DEMO_MODE summarize → mock response');
      return res.json(mockSummary({ content, pageType, title }));
    }

    // Rate limit only if we have DB; in pure AI-demo with no DB, skip limit
    let supabase = null;
    try { supabase = getSupabase(); } catch (e) {
      logger.debug('Supabase client unavailable during summarize check');
    }

    if (supabase && req.userPlan?.plan === 'free' && req.userPlan.daily_summaries >= FREE_SUMMARY_LIMIT) {
      return res.status(429).json({
        error: 'Daily summary limit reached',
        message: `Free plan allows ${FREE_SUMMARY_LIMIT} summaries per day. Upgrade to Pro for unlimited access.`,
        upgrade: true,
      });
    }

    // Server-side cache check: if user summarized this exact URL recently (last 24h), return cached
    if (supabase && url) {
      try {
        const { data: cached } = await supabase
          .from('saved_summaries')
          .select('summary, key_points, timestamps, created_at')
          .eq('user_id', req.user.id)
          .eq('page_url', url)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (cached && req.body.forceRefresh !== true) {
          const ageMs = Date.now() - new Date(cached.created_at).getTime();
          if (ageMs < 24 * 60 * 60 * 1000) {
            logger.info('Returning cached summary', { url, ageHours: (ageMs / 3600000).toFixed(1) });
            return res.json({
              summary: cached.summary,
              keyPoints: cached.key_points || [],
              timestamps: cached.timestamps || [],
              cached: true,
            });
          }
        }
      } catch (cacheErr) {
        logger.debug('Cache check miss or error', { error: cacheErr.message });
      }
    }

    const systemPrompt = `You are PagePal AI. The user is viewing a ${pageType} titled "${title}".
Analyze the provided content and respond with ONLY valid JSON in this exact format:
{
  "summary": "2-3 sentence summary of the main content",
  "keyPoints": ["point 1", "point 2", "point 3", "point 4", "point 5"],
  "timestamps": [{"time": "0:00", "label": "Introduction"}, ...],
  "sentiment": "positive|neutral|negative",
  "readingTime": "X min read",
  "language": "English"
}
For YouTube videos, extract real timestamps from the transcript. For articles, set timestamps to [].
Always return exactly 5 key points. Be concise but insightful.`;

    let raw = '';
    if (useOpenRouter) {
      logger.info(`OpenRouter GLM summarize → ${env.OPENROUTER_MODEL}`);
      const msg = await openRouterCreate({
        system: systemPrompt,
        messages: [{ role: 'user', content: `Content to analyze:\n\n${content.slice(0, 15000)}` }],
        max_tokens: 1500,
        timeoutMs: 25000,
      });
      raw = msg.content[0]?.text || '';
    } else {
      const anthropic = await getAnthropic();
      const msg = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1500,
        messages: [{ role: 'user', content: `Content to analyze:\n\n${content.slice(0, 15000)}` }],
        system: systemPrompt,
      });
      raw = msg.content[0]?.text || '';
    }

    // Robust JSON extraction
    let cleaned = raw.replace(/```json\n?|```/g, '').trim();
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) cleaned = cleaned.slice(firstBrace, lastBrace + 1);

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (e) {
      logger.error('JSON parse failed on AI response', { snippet: raw.slice(0, 300) });
      return res.status(502).json({ error: 'AI returned invalid format, please retry' });
    }

    // DB ops — record usage and saved summary
    if (supabase) {
      try {
        const { error: rpcErr } = await supabase.rpc('increment_usage', {
          p_user_id: req.user.id,
          p_field: 'daily_summaries',
        });
        if (rpcErr) throw rpcErr;
      } catch (err) {
        try {
          await supabase.from('user_plans').update({ daily_summaries: (req.userPlan.daily_summaries || 0) + 1 }).eq('user_id', req.user.id);
        } catch (dbErr) {
          logger.warn('Failed to update daily summaries count', { error: dbErr.message });
        }
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
