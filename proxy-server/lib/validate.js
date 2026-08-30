import { z } from 'zod';

export const summarizeSchema = z.object({
  content: z.string().min(1, 'Content is required').max(20000),
  pageType: z.enum(['article', 'youtube', 'pdf', 'general', 'selection']).default('general'),
  title: z.string().max(500).default(''),
  url: z.string().url().optional().or(z.literal('')),
});

export const chatSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string().min(1).max(8000),
  })).min(1).max(20),
  context: z.string().max(15000).optional().default(''),
  pageType: z.string().max(50).optional().default('general'),
  title: z.string().max(500).optional().default(''),
});

export const quizSchema = z.object({
  content: z.string().min(1).max(12000),
  title: z.string().max(500).optional().default(''),
});

export const translateSchema = z.object({
  text: z.string().min(1).max(12000),
  targetLanguage: z.string().min(2).max(30),
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
