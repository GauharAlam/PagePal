export const CHROME_STORE_URL = 'https://chrome.google.com/webstore/detail/pagepal-ai/placeholder';

export const FEATURES = [
  {
    icon: '📄',
    title: 'Webpage Summary',
    description: 'Instantly summarize any article, blog post, or documentation into clear, concise insights.',
    color: 'from-brand-500/20 to-purple-600/20',
    border: 'border-brand-500/20',
  },
  {
    icon: '🎥',
    title: 'YouTube Summary',
    description: 'Extract key ideas from any YouTube video using transcript analysis — no more scrubbing through hours of content.',
    color: 'from-red-500/20 to-orange-500/20',
    border: 'border-red-500/20',
  },
  {
    icon: '⚡',
    title: 'Multi-AI Models',
    description: 'Dynamically routes to the best AI model — Gemini, OpenAI, DeepSeek, or Grok — based on your content.',
    color: 'from-yellow-500/20 to-amber-500/20',
    border: 'border-yellow-500/20',
  },
  {
    icon: '💸',
    title: 'Cost Efficient',
    description: 'Smart routing picks the cheapest model that still delivers great results. No wasted tokens.',
    color: 'from-green-500/20 to-emerald-500/20',
    border: 'border-green-500/20',
  },
  {
    icon: '🧠',
    title: 'Smart AI Switching',
    description: 'Code? DeepSeek. Long article? Gemini. News? Grok. The right brain for the right task, automatically.',
    color: 'from-cyan-500/20 to-blue-500/20',
    border: 'border-cyan-500/20',
  },
  {
    icon: '✂️',
    title: 'Selection Mode',
    description: 'Highlight any text on the page and get an instant explanation, translation, or simplification.',
    color: 'from-pink-500/20 to-rose-500/20',
    border: 'border-pink-500/20',
  },
];

export const MODELS = [
  {
    name: 'Gemini',
    provider: 'Google',
    icon: '✦',
    color: 'from-blue-500 to-cyan-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    textColor: 'text-blue-400',
    badge: 'Long Content',
    badgeColor: 'bg-blue-500/20 text-blue-300',
    usedFor: 'Long articles, YouTube transcripts, large documents',
    tag: 'Best for scale',
  },
  {
    name: 'DeepSeek',
    provider: 'DeepSeek AI',
    icon: '🔍',
    color: 'from-brand-500 to-violet-500',
    bg: 'bg-brand-500/10',
    border: 'border-brand-500/20',
    textColor: 'text-brand-400',
    badge: 'Code & Fast',
    badgeColor: 'bg-brand-500/20 text-brand-300',
    usedFor: 'Code explanation, technical content, fast summaries',
    tag: 'Best for code',
  },
  {
    name: 'OpenAI',
    provider: 'OpenAI',
    icon: '⚡',
    color: 'from-emerald-500 to-teal-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    textColor: 'text-emerald-400',
    badge: 'Balanced',
    badgeColor: 'bg-emerald-500/20 text-emerald-300',
    usedFor: 'Blogs, articles, general Q&A, standard pages',
    tag: 'Best overall',
  },
  {
    name: 'Grok',
    provider: 'xAI',
    icon: '𝕏',
    color: 'from-zinc-400 to-zinc-300',
    bg: 'bg-zinc-500/10',
    border: 'border-zinc-500/20',
    textColor: 'text-zinc-400',
    badge: 'Trending',
    badgeColor: 'bg-zinc-500/20 text-zinc-300',
    usedFor: 'News, social media, trending topics, real-time content',
    tag: 'Best for news',
  },
];

export const STEPS = [
  {
    number: '01',
    title: 'Install Extension',
    description: 'Add PagePal to Chrome in one click. Free. No signup required to start.',
    icon: '🔌',
  },
  {
    number: '02',
    title: 'Open Any Page',
    description: 'Navigate to any webpage, article, YouTube video, or documentation you want to understand.',
    icon: '🌐',
  },
  {
    number: '03',
    title: 'Click Summarize',
    description: 'Open the sidebar panel. Hit a quick action or ask your own question.',
    icon: '🧠',
  },
  {
    number: '04',
    title: 'Get Instant Results',
    description: 'PagePal selects the best AI model and delivers your summary in seconds.',
    icon: '✅',
  },
];

export const STATS = [
  { value: '10K+', label: 'Active Users' },
  { value: '1M+',  label: 'Summaries Generated' },
  { value: '4',    label: 'AI Models' },
  { value: '< 3s', label: 'Avg Response Time' },
];
