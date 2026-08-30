export const CHROME_STORE_URL = 'https://chrome.google.com/webstore/detail/pagepal-ai/placeholder';
export const GITHUB_REPO_URL = 'https://github.com/GauharAlam/PagePal';

export const FEATURES = [
  {
    icon: '📄',
    title: 'Webpage & Article Summary',
    description: 'Instantly summarize any article, blog post, or documentation into structured takeaways in seconds.',
    color: 'from-amber-500/20 to-yellow-500/20',
    border: 'border-amber-500/20',
  },
  {
    icon: '🎥',
    title: 'YouTube Video Chapters',
    description: 'Extract timestamps, chapter outlines, and key insights from any video without watching hours of footage.',
    color: 'from-red-500/20 to-orange-500/20',
    border: 'border-red-500/20',
  },
  {
    icon: '💬',
    title: 'Grounded Page Chat',
    description: 'Ask deep follow-up questions — PagePal answers strictly using page context with citations, zero hallucination.',
    color: 'from-blue-500/20 to-cyan-500/20',
    border: 'border-blue-500/20',
  },
  {
    icon: '🔑',
    title: 'BYOK & Managed Pro',
    description: 'Use PagePal Pro ($9/mo, all AI keys included) or bring your own API keys for complete privacy and cost control.',
    color: 'from-emerald-500/20 to-teal-500/20',
    border: 'border-emerald-500/20',
  },
  {
    icon: '🧩',
    title: 'Instant Quiz & Translate',
    description: 'Generate 5 auto-graded multiple-choice questions or translate any summary into 50+ languages.',
    color: 'from-purple-500/20 to-pink-500/20',
    border: 'border-purple-500/20',
  },
  {
    icon: '⚡',
    title: 'Native Side Panel Docking',
    description: 'Dock PagePal seamlessly alongside your browser on the left or right without covering page content.',
    color: 'from-yellow-500/20 to-amber-500/20',
    border: 'border-yellow-500/20',
  },
];

export const MODELS = [
  {
    name: 'Claude Sonnet 4',
    provider: 'Anthropic',
    icon: '🧠',
    color: 'from-violet-500 to-purple-500',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/20',
    textColor: 'text-violet-400',
    badge: 'Default • Pro Included',
    badgeColor: 'bg-violet-500/20 text-violet-300',
    usedFor: 'Best overall comprehension — articles, PDFs, YouTube with high accuracy & timestamps',
    tag: 'Recommended',
  },
  {
    name: 'GPT-4o',
    provider: 'OpenAI',
    icon: '⚡',
    color: 'from-emerald-500 to-teal-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    textColor: 'text-emerald-400',
    badge: 'BYOK • Balanced',
    badgeColor: 'bg-emerald-500/20 text-emerald-300',
    usedFor: 'General Q&A, blogs, and code walkthroughs',
    tag: 'BYOK',
  },
  {
    name: 'Gemini Flash',
    provider: 'Google',
    icon: '✦',
    color: 'from-blue-500 to-cyan-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    textColor: 'text-blue-400',
    badge: 'BYOK • 1M Context',
    badgeColor: 'bg-blue-500/20 text-blue-300',
    usedFor: 'Massive PDF books, long research papers, and lengthy transcripts',
    tag: '1M Context',
  },
  {
    name: 'DeepSeek',
    provider: 'DeepSeek AI',
    icon: '🔍',
    color: 'from-orange-500 to-amber-500',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/20',
    textColor: 'text-orange-400',
    badge: 'BYOK • Coding',
    badgeColor: 'bg-orange-500/20 text-orange-300',
    usedFor: 'Technical documentation, APIs, and code repositories',
    tag: 'Best for Code',
  },
];

export const STEPS = [
  {
    number: '01',
    title: 'Install Extension',
    description: 'Add PagePal to Chrome in one click. Open in side panel with zero setup required.',
    icon: '🔌',
  },
  {
    number: '02',
    title: 'Browse Any Website',
    description: 'Navigate to any article, YouTube video, PDF, or documentation page.',
    icon: '🌐',
  },
  {
    number: '03',
    title: 'Click Summarize',
    description: 'Hit the Summarize button in your sidebar to generate instant takeaways.',
    icon: '🧠',
  },
  {
    number: '04',
    title: 'Chat & Test Your Knowledge',
    description: 'Ask cited follow-up questions, translate takeaways, or generate a 5-question quiz.',
    icon: '✨',
  },
];

export const STATS = [
  { value: 'Claude 4', label: 'AI Intelligence' },
  { value: '5/day', label: 'Free Summaries Forever' },
  { value: '$9/mo', label: 'Pro for Unlimited AI' },
  { value: '< 2s', label: 'Fast Response Speed' },
];
