export function mockSummary({ content, pageType, title }) {
  const snippet = (content || title || 'This page').slice(0, 80).replace(/\s+/g, ' ');
  return {
    summary: `Demo summary of "${title || 'Current Page'}": This is a placeholder summary generated in DEMO_MODE. It shows how PagePal would summarize "${snippet}..." in 2-3 sentences.`,
    keyPoints: [
      'Demo: Key point 1 extracted from page content',
      'Demo: Key point 2 — main argument or insight',
      'Demo: Key point 3 — supporting detail',
      'Demo: Key point 4 — conclusion or takeaway',
      'Demo: Key point 5 — extra insight',
    ],
    timestamps: pageType === 'youtube'
      ? [
          { time: '0:00', label: 'Introduction' },
          { time: '1:30', label: 'Main Topic' },
          { time: '3:45', label: 'Key Insight' },
          { time: '6:10', label: 'Conclusion' },
        ]
      : [],
    sentiment: 'neutral',
    readingTime: '2 min read',
    language: 'English (Demo)',
    followupQuestions: [
      'What are the core arguments in this piece?',
      'What are the practical applications of this?',
      'What are the limitations or counterpoints?'
    ]
  };
}

export const mockSummarize = mockSummary;

export function mockChat({ messages, title }) {
  const last = messages?.[messages.length - 1]?.content || 'your question';
  return `🧠 Demo reply: You asked "${last.slice(0, 120)}" about "${(title || 'this page').slice(0, 60)}". In demo mode I return a canned answer. With a real API key, I'd answer grounded in the page context.`;
}

export function mockQuiz() {
  return {
    questions: [
      { q: 'What is the main topic of this page? (Demo)', options: ['Demo topic A', 'Demo topic B', 'Demo topic C', 'Demo topic D'], answer: 'Demo topic A', explanation: 'Demo explanation: In prod, AI generates this from real content.' },
      { q: 'Which demo key point is most important?', options: ['Point 1', 'Point 2', 'Point 3', 'All of the above'], answer: 'All of the above', explanation: 'Demo: all points matter.' },
      { q: 'What is the demo sentiment?', options: ['Positive', 'Neutral', 'Negative', 'Unknown'], answer: 'Neutral', explanation: 'Demo sentiment is neutral.' },
      { q: 'How long is the demo reading time?', options: ['1 min', '2 min', '5 min', '10 min'], answer: '2 min', explanation: 'Demo says 2 min.' },
      { q: 'Where does demo data come from?', options: ['OpenRouter AI', 'Mock', 'Supabase', 'Stripe'], answer: 'Mock', explanation: 'Demo uses mock without API.' },
    ],
  };
}

export function mockTranslate(text, lang) {
  return `[Demo translated to ${lang}]\n\n${text}\n\n(Real translation with AI in prod)`;
}
