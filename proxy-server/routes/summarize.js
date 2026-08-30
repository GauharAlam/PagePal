import { Router } from 'express';
import requireAuth from '../middleware/requireAuth.js';
import { getSupabase, getAnthropic } from '../lib/supabase.js';
import { hasOpenRouter, openRouterCreate } from '../lib/openrouter.js';
import { validate, summarizeSchema } from '../lib/validate.js';
import { env, isDemo } from '../lib/env.js';
import { mockSummary } from '../lib/demo.js';

const router = Router();
const FREE_SUMMARY_LIMIT = 5;

router.post('/api/summarize', requireAuth, validate(summarizeSchema), async (req, res) => {
  try {
    const { content, pageType, title, url } = req.body;

    // If OpenRouter GLM is configured, use it even in Supabase-demo (DB ops become no-op)
    const useOpenRouter = hasOpenRouter();
    const useMock = !useOpenRouter && env.DEMO_MODE;

    if (useMock) {
      console.log('📦 DEMO_MODE summarize → mock');
      return res.json(mockSummary({ content, pageType, title }));
    }

    // Rate limit only if we have DB; in pure AI-demo with no DB, skip limit
    let supabase = null;
    try { supabase = getSupabase(); } catch {}

    if (supabase && req.userPlan?.plan === 'free' && req.userPlan.daily_summaries >= FREE_SUMMARY_LIMIT) {
      return res.status(429).json({
        error: 'Daily summary limit reached',
        message: `Free plan allows ${FREE_SUMMARY_LIMIT} summaries per day. Upgrade to Pro for unlimited access.`,
        upgrade: true,
      });
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
      console.log(`🤖 OpenRouter GLM summarize → ${env.OPENROUTER_MODEL}`);
      const msg = await openRouterCreate({
        system: systemPrompt,
        messages: [{ role: 'user', content: `Content to analyze:\n\n${content.slice(0, 15000)}` }],
        max_tokens: 1500,
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
      console.error('JSON parse failed:', raw.slice(0, 500));
      return res.status(502).json({ error: 'AI returned invalid format, please retry' });
    }

    // DB ops — skip if Supabase not configured (demo)
    if (supabase) {
      try {
        const { error: rpcErr } = await supabase.rpc('increment_usage', {
          p_user_id: req.user.id,
          p_field: 'daily_summaries',
        });
        if (rpcErr) throw rpcErr;
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
      } catch {}
    }

    res.json(parsed);
  } catch (err) {
    console.error('Summarize error:', err);
    const isProd = process.env.NODE_ENV === 'production';
    res.status(500).json({ error: isProd ? 'Summarization failed' : err.message });
  }
});

export default router;
