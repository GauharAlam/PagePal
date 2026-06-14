import { Router } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import requireAuth from '../middleware/requireAuth.js';

const router = Router();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const FREE_CHAT_LIMIT = 10;

// Chat endpoint
router.post('/api/chat', requireAuth, async (req, res) => {
  try {
    const { messages, context, pageType, title } = req.body;

    if (!messages?.length) {
      return res.status(400).json({ error: 'Messages are required' });
    }

    // Check plan limits
    if (req.userPlan.plan === 'free' && req.userPlan.daily_chats >= FREE_CHAT_LIMIT) {
      return res.status(429).json({
        error: 'Daily chat limit reached',
        message: `Free plan allows ${FREE_CHAT_LIMIT} chat messages per day. Upgrade to Pro for unlimited access.`,
        upgrade: true
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

    const msg = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      system,
      messages: messages.slice(-10) // Keep last 10 messages for context window
    });

    // Increment chat counter
    await supabase
      .from('user_plans')
      .update({ daily_chats: (req.userPlan.daily_chats || 0) + 1 })
      .eq('user_id', req.user.id);

    res.json({ reply: msg.content[0].text });
  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ error: err.message || 'Chat failed' });
  }
});

// Quiz generator endpoint
router.post('/api/quiz', requireAuth, async (req, res) => {
  try {
    const { content, title } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    // Quiz is Pro-only
    if (req.userPlan.plan === 'free') {
      return res.status(429).json({
        error: 'Quiz is a Pro feature',
        message: 'Upgrade to Pro to generate quizzes from any content.',
        upgrade: true
      });
    }

    const msg = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      messages: [{
        role: 'user',
        content: `Generate 5 multiple choice questions based on this content titled "${title}". 
Each question should test understanding of key concepts.
Respond ONLY with valid JSON in this exact format:
{"questions":[{"q":"question text","options":["A) option","B) option","C) option","D) option"],"answer":"A) option","explanation":"brief explanation"}]}

Content: ${content.slice(0, 8000)}`
      }]
    });

    const raw = msg.content[0].text.replace(/```json\n?|```/g, '').trim();
    res.json(JSON.parse(raw));
  } catch (err) {
    console.error('Quiz error:', err);
    res.status(500).json({ error: err.message || 'Quiz generation failed' });
  }
});

export default router;
