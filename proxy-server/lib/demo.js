export function mockSummary({ content, pageType, title }) {
  const snippet = (content || title || 'This page').slice(0, 80).replace(/\s+/g, ' ');
  return {
    summary: `Demo summary of "${title || 'Current Page'}": This is a placeholder summary generated in DEMO_MODE. It shows how PagePal would summarize "${snippet}..." in 2-3 sentences without calling Claude.`,
    keyPoints: [
      'Demo: Key point 1 extracted from page content',
      'Demo: Key point 2 — main argument or insight',
      'Demo: Key point 3 — supporting detail',
      'Demo: Key point 4 — conclusion or takeaway',
      'Demo: Key point 5 — extra insight (replace with real AI in prod)',
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
  };
}

export function mockChat({ messages, title }) {
  const last = messages?.[messages.length - 1]?.content || 'your question';
  return `🧠 Demo reply (no Claude key): You asked "${last.slice(0, 120)}" about "${(title || 'this page').slice(0, 60)}". In demo mode I return a canned answer. With a real ANTHROPIC_API_KEY, I'd answer grounded in the 12k context with markdown formatting.`;
}

export function mockQuiz() {
  return {
    questions: [
      { q: 'What is the main topic of this page? (Demo)', options: ['A) Demo topic A', 'B) Demo topic B', 'C) Demo topic C', 'D) Demo topic D'], answer: 'A) Demo topic A', explanation: 'Demo explanation: In prod, Claude generates this from real content.' },
      { q: 'Which demo key point is most important?', options: ['A) Point 1', 'B) Point 2', 'C) Point 3', 'D) All of the above'], answer: 'D) All of the above', explanation: 'Demo: all points matter.' },
      { q: 'What is the demo sentiment?', options: ['A) Positive', 'B) Neutral', 'C) Negative', 'D) Unknown'], answer: 'B) Neutral', explanation: 'Demo sentiment is neutral.' },
      { q: 'How long is the demo reading time?', options: ['A) 1 min', 'B) 2 min', 'C) 5 min', 'D) 10 min'], answer: 'B) 2 min', explanation: 'Demo says 2 min.' },
      { q: 'Where does demo data come from?', options: ['A) Claude', 'B) Mock', 'C) Supabase', 'D) Stripe'], answer: 'B) Mock', explanation: 'Demo uses mock without API.' },
    ],
  };
}

export function mockTranslate(text, lang) {
  return `[Demo translated to ${lang}]\n\n${text}\n\n(Real translation with Claude in prod)`;
}
