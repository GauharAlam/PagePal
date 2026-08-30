import { z } from 'zod';

export const summarizeSchema = z.object({
  content: z.string().min(1, 'Content is required').max(25000),
  pageType: z.enum(['article', 'youtube', 'pdf', 'general', 'selection']).default('general'),
  title: z.string().max(500).default(''),
  url: z.string().url().optional().or(z.literal('')),
  model: z.string().max(120).optional(),
  forceRefresh: z.boolean().optional(),
});

export const chatSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string().min(1).max(10000),
  })).min(1).max(30),
  context: z.string().max(20000).optional().default(''),
  pageType: z.string().max(50).optional().default('general'),
  title: z.string().max(500).optional().default(''),
  model: z.string().max(120).optional(),
});

export const quizSchema = z.object({
  content: z.string().min(1).max(15000),
  title: z.string().max(500).optional().default(''),
  model: z.string().max(120).optional(),
});

export const translateSchema = z.object({
  text: z.string().min(1).max(15000),
  targetLanguage: z.string().min(2).max(50),
  model: z.string().max(120).optional(),
});

export function validate(schema) {
  return (req, res, next) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.flatten(),
      });
    }
    req.body = parsed.data;
    next();
  };
}
