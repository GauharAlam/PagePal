import { Router } from 'express';
import requireAuth from '../middleware/requireAuth.js';
import { getSupabase, getAnthropic } from '../lib/supabase.js';
import { hasOpenRouter, openRouterCreate } from '../lib/openrouter.js';
import { validate, chatSchema, quizSchema } from '../lib/validate.js';
import { env } from '../lib/env.js';
import { mockChat, mockQuiz } from '../lib/demo.js';
import { sanitizeContent, sanitizeTitle } from '../lib/sanitize.js';
import { logger } from '../lib/logger.js';

const router = Router();
const FREE_CHAT_LIMIT = 10;

// Chat endpoint
router.post('/api/chat', requireAuth, validate(chatSchema), async (req, res) => {
  try {
    const { messages: rawMessages, context: rawContext, pageType, title: rawTitle } = req.body;
    const title = sanitizeTitle(rawTitle);
    const context = sanitizeContent(rawContext);
    const messages = rawMessages.map((m) => ({
      role: m.role,
      content: sanitizeContent(m.content),
    }));

    const useOpenRouter = hasOpenRouter();
    if (!useOpenRouter && env.DEMO_MODE) {
      logger.info('DEMO_MODE chat → mock reply');
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

    const system = `You are PagePal AI, an intelligent sidebar assistant helping users understand and explore the webpage they are viewing.
Current Page Type: ${pageType || 'general'}
Current Page Title: "${title || 'Untitled'}"

Page Content (extracted from current browser tab):
"""
${context?.slice(0, 14000) || 'No specific page text extracted.'}
"""

Instructions:
1. When the user asks about the page or its author/content, extract the exact answer from the Page Content above.
2. For greetings or general questions, respond cordially and concisely.
3. If specific details requested are not found in the extracted text, clearly state what is available on the page and answer as helpfully as possible.
4. Use clean markdown formatting (bullet points, bold text, code blocks) when appropriate.`;

    let replyText = '';
    if (useOpenRouter) {
      logger.info(`OpenRouter GLM chat → ${env.OPENROUTER_MODEL}`);
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
    logger.error('Chat error', { error: err.message });
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
      logger.info('DEMO_MODE quiz → mock');
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

    const prompt = `Generate 5 multiple choice questions based on this content titled "${title}".
Each question should test understanding of key concepts.
Respond ONLY with valid JSON in this exact format:
{"questions":[{"q":"question text","options":["A) option","B) option","C) option","D) option"],"answer":"A) option","explanation":"brief explanation"}]}

Content: ${content.slice(0, 8000)}`;

    let raw = '';
    if (useOpenRouter) {
      logger.info(`OpenRouter GLM quiz → ${env.OPENROUTER_MODEL}`);
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
    logger.error('Quiz error', { error: err.message });
    const isProd = process.env.NODE_ENV === 'production';
    res.status(500).json({ error: isProd ? 'Quiz generation failed' : err.message });
  }
});

export default router;
