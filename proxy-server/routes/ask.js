import { Router } from 'express';
import requireAuth from '../middleware/requireAuth.js';
import { getSupabase, getAnthropic } from '../lib/supabase.js';
import { hasOpenRouter, openRouterCreate, cleanThinkingTags } from '../lib/openrouter.js';
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
    const { messages: rawMessages, context: rawContext, pageType, title: rawTitle, model } = req.body;
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

    const system = `You are PagePal AI, an intelligent co-pilot assisting the user with the webpage they are viewing.
Current Page Type: ${pageType || 'general'}
Current Page Title: "${title || 'Untitled'}"

Page Content (extracted from current browser tab):
"""
${context?.slice(0, 15000) || 'No specific page text extracted.'}
"""

Instructions:
1. Provide accurate, context-grounded, and helpful answers directly related to the page content above.
2. If the user asks for summaries, explanations, comparisons, or specific facts, format your answer clearly with markdown formatting (bullet points, bold text, code blocks).
3. If the user asks a question not covered by the page content, acknowledge this gently and answer from general knowledge while clarifying the distinction.
4. Keep answers concise, clear, and direct.`;

    let replyText = '';
    if (useOpenRouter) {
      logger.info(`OpenRouter chat → model: ${model || env.OPENROUTER_MODEL}`);
      const msg = await openRouterCreate({
        model,
        system,
        messages: messages.slice(-10),
        max_tokens: 1500,
        timeoutMs: 30000,
      });
      replyText = msg.content[0]?.text || '';
    } else {
      const anthropic = await getAnthropic();
      const msg = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1500,
        system,
        messages: messages.slice(-10),
      });
      replyText = msg.content[0]?.text || '';
    }

    // Clean any remaining reasoning markers
    replyText = cleanThinkingTags(replyText);

    if (supabase) {
      try {
        await supabase.rpc('increment_usage', { p_user_id: req.user.id, p_field: 'daily_chats' });
      } catch {
        try {
          await supabase.from('user_plans').update({ daily_chats: (req.userPlan.daily_chats || 0) + 1 }).eq('user_id', req.user.id);
        } catch {}
      }
    }

    res.json({ reply: replyText });
  } catch (err) {
    logger.error('Chat error', { error: err.message });
    const isProd = process.env.NODE_ENV === 'production';
    res.status(500).json({ error: isProd ? 'Chat failed' : err.message });
  }
});

// Quiz generator
router.post('/api/quiz', requireAuth, validate(quizSchema), async (req, res) => {
  try {
    const { content: rawContent, title: rawTitle, model } = req.body;
    const title = sanitizeTitle(rawTitle);
    const content = sanitizeContent(rawContent);

    const useOpenRouter = hasOpenRouter();
    if (!useOpenRouter && env.DEMO_MODE) {
      logger.info('DEMO_MODE quiz → mock');
      return res.json(mockQuiz());
    }

    let supabase = null;
    try { supabase = getSupabase(); } catch {}
    if (supabase && req.userPlan?.plan === 'free' && req.userPlan.daily_chats >= FREE_CHAT_LIMIT) {
      return res.status(403).json({
        error: 'Daily limit reached',
        message: 'Daily AI generation limit reached on free tier.',
        upgrade: true,
      });
    }

    const prompt = `Generate 5 high-quality multiple choice questions based on this content titled "${title}".
Each question should test comprehension of crucial concepts.
Respond ONLY with valid JSON in this exact structure:
{
  "questions": [
    {
      "q": "Clear question text?",
      "options": ["A) First option", "B) Second option", "C) Third option", "D) Fourth option"],
      "answer": "A) First option",
      "explanation": "Concise explanation of why this answer is correct."
    }
  ]
}

Content:
${content.slice(0, 12000)}`;

    let raw = '';
    if (useOpenRouter) {
      logger.info(`OpenRouter quiz → model: ${model || env.OPENROUTER_MODEL}`);
      const msg = await openRouterCreate({
        model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1800,
        timeoutMs: 30000,
      });
      raw = msg.content[0]?.text || '';
    } else {
      const anthropic = await getAnthropic();
      const msg = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1800,
        messages: [{ role: 'user', content: prompt }],
      });
      raw = msg.content[0]?.text || '';
    }

    let cleaned = cleanThinkingTags(raw);
    cleaned = cleaned.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
    const first = cleaned.indexOf('{');
    const last = cleaned.lastIndexOf('}');
    const clean = first !== -1 && last !== -1 ? cleaned.slice(first, last + 1) : cleaned;

    try {
      const parsed = JSON.parse(clean);
      if (!Array.isArray(parsed.questions)) {
        throw new Error('Invalid questions array in response');
      }
      res.json(parsed);
    } catch (parseErr) {
      logger.error('Quiz JSON parse failed', { snippet: raw.slice(0, 300), error: parseErr.message });
      res.status(502).json({ error: 'Quiz generation format error, please retry' });
    }
  } catch (err) {
    logger.error('Quiz error', { error: err.message });
    const isProd = process.env.NODE_ENV === 'production';
    res.status(500).json({ error: isProd ? 'Quiz generation failed' : err.message });
  }
});

export default router;
