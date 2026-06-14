import { Router } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import requireAuth from '../middleware/requireAuth.js';

const router = Router();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const FREE_SUMMARY_LIMIT = 5;

router.post('/api/summarize', requireAuth, async (req, res) => {
  try {
    const { content, pageType, title } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    // Check plan limits
    if (req.userPlan.plan === 'free' && req.userPlan.daily_summaries >= FREE_SUMMARY_LIMIT) {
      return res.status(429).json({
        error: 'Daily summary limit reached',
        message: `Free plan allows ${FREE_SUMMARY_LIMIT} summaries per day. Upgrade to Pro for unlimited access.`,
        upgrade: true
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

    const msg = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      messages: [{ role: 'user', content: `Content to analyze:\n\n${content.slice(0, 15000)}` }],
      system: systemPrompt
    });

    const raw = msg.content[0].text;
    const cleaned = raw.replace(/```json\n?|```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    // Increment usage counter
    await supabase
      .from('user_plans')
      .update({ daily_summaries: (req.userPlan.daily_summaries || 0) + 1 })
      .eq('user_id', req.user.id);

    // Save summary
    await supabase.from('saved_summaries').insert({
      user_id: req.user.id,
      page_url: req.body.url || '',
      page_title: title,
      page_type: pageType,
      summary: parsed.summary,
      key_points: parsed.keyPoints,
      timestamps: parsed.timestamps
    });

    res.json(parsed);
  } catch (err) {
    console.error('Summarize error:', err);
    res.status(500).json({ error: err.message || 'Summarization failed' });
  }
});

export default router;
