import { Router } from 'express';
import requireAuth from '../middleware/requireAuth.js';
import { getSupabase, getAnthropic } from '../lib/supabase.js';
import { hasOpenRouter, openRouterCreate } from '../lib/openrouter.js';
import { validate, chatSchema, quizSchema } from '../lib/validate.js';
import { env } from '../lib/env.js';
import { mockChat, mockQuiz } from '../lib/demo.js';
import { sanitizeContent, sanitizeTitle } from '../lib/sanitize.js';

const router = Router();
const FREE_CHAT_LIMIT = 10;

// Chat endpoint
router.post('/api/chat', requireAuth, validate(chatSchema), async (req, res) => {
  try {
    const { messages: rawMessages, context: rawContext, pageType, title: rawTitle } = req.body;
    const title = sanitizeTitle(rawTitle);
    const context = sanitizeContent(rawContext);
    const messages = rawMessages.map(m => ({
      role: m.role,
      content: sanitizeContent(m.content)
    }));

    const useOpenRouter = hasOpenRouter();
    if (!useOpenRouter && env.DEMO_MODE) {
      console.log('📦 DEMO_MODE chat → mock');
      return res.json({ reply: mockChat({ messages, title }) });
    }

    let supabase = null;
    try { supabase = getSupabase(); } catch {}
    if (supabase && req.userPlan?.plan === 'free' && req.userPlan.daily_chats >= FREE_CHAT_LIMIT) {
      return res.status(429).json({
        error: 'Daily chat limit reached',
        message: `Free plan allows ${FREE_CHAT_LIMIT} chat messages per day. Upgrade to Pro for unlimited access.`,
        upgrade: true,
      });
    }

    const system = `You are PagePal AI, an intelligent assistant helping users understand content they are viewing.
Page type: ${pageType}
Page title: "${title}"
Page content (for reference):
${context?.slice(0, 12000) || 'No content provided'}

Rules:
- Answer ONLY based on the page content above when the question is about it
- Be concise and helpful
- If asked about timestamps, reference the format [MM:SS]
- If the user asks something unrelated to the page, you can still answer helpfully
- Never make up information that isn't in the content
- Use markdown formatting when appropriate for readability`;

    let replyText = '';
    if (useOpenRouter) {
      console.log(`🤖 OpenRouter GLM chat → ${env.OPENROUTER_MODEL}`);
      const msg = await openRouterCreate({ system, messages: messages.slice(-10), max_tokens: 1000 });
      replyText = msg.content[0].text;
    } else {
      const anthropic = await getAnthropic();
      const msg = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        system,
        messages: messages.slice(-10),
      });
      replyText = msg.content[0].text;
    }

    if (supabase) {
      try {
        const { error: rpcErr } = await supabase.rpc('increment_usage', { p_user_id: req.user.id, p_field: 'daily_chats' });
        if (rpcErr) throw rpcErr;
      } catch {
        try { await supabase.from('user_plans').update({ daily_chats: (req.userPlan.daily_chats || 0) + 1 }).eq('user_id', req.user.id); } catch {}
      }
    }

    res.json({ reply: replyText });
  } catch (err) {
    console.error('Chat error:', err);
    const isProd = process.env.NODE_ENV === 'production';
    res.status(500).json({ error: isProd ? 'Chat failed' : err.message });
  }
});

// Quiz generator — Pro only
router.post('/api/quiz', requireAuth, validate(quizSchema), async (req, res) => {
  try {
    const { content: rawContent, title: rawTitle } = req.body;
    const title = sanitizeTitle(rawTitle);
    const content = sanitizeContent(rawContent);

    const useOpenRouter = hasOpenRouter();
    if (!useOpenRouter && env.DEMO_MODE) {
      console.log('📦 DEMO_MODE quiz → mock');
      return res.json(mockQuiz());
    }

    let supabase = null;
    try { supabase = getSupabase(); } catch {}
    if (supabase && req.userPlan?.plan === 'free') {
      return res.status(403).json({
        error: 'Quiz is a Pro feature',
        message: 'Upgrade to Pro to generate quizzes from any content.',
        upgrade: true,
      });
    }

    // Allow demo free to try quiz with OpenRouter
    const prompt = `Generate 5 multiple choice questions based on this content titled "${title}".
Each question should test understanding of key concepts.
Respond ONLY with valid JSON in this exact format:
{"questions":[{"q":"question text","options":["A) option","B) option","C) option","D) option"],"answer":"A) option","explanation":"brief explanation"}]}

Content: ${content.slice(0, 8000)}`;

    let raw = '';
    if (useOpenRouter) {
      console.log(`🤖 OpenRouter GLM quiz → ${env.OPENROUTER_MODEL}`);
      const msg = await openRouterCreate({ messages: [{ role: 'user', content: prompt }], max_tokens: 1500 });
      raw = msg.content[0].text;
    } else {
      const anthropic = await getAnthropic();
      const msg = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }],
      });
      raw = msg.content[0].text;
    }

    const cleaned = raw.replace(/```json\n?|```/g, '').trim();
    const first = cleaned.indexOf('{');
    const last = cleaned.lastIndexOf('}');
    const clean = first !== -1 ? cleaned.slice(first, last + 1) : cleaned;
    try {
      res.json(JSON.parse(clean));
    } catch {
      return res.status(502).json({ error: 'Quiz generation returned invalid format' });
    }
  } catch (err) {
    console.error('Quiz error:', err);
    const isProd = process.env.NODE_ENV === 'production';
    res.status(500).json({ error: isProd ? 'Quiz generation failed' : err.message });
  }
});

export default router;
