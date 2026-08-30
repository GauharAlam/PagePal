import React, { useState } from 'react';
import { Search, Chrome, Sparkles, FileText, Youtube, MessageCircle, Languages, ClipboardCheck, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { CHROME_STORE_URL } from '../utils/constants';

const FILTERS = ['All', 'Summarize', 'YouTube', 'Chat', 'Translate', 'Quiz'];

const DEMOS = [
  { id: 'sum', title: 'Article & Web Summary', desc: 'Transform long articles into structured takeaways + sentiment in <2s.', tag: 'Summarize', icon: FileText, accent: 'bg-[#FDE047]', meta: '12s → 3 bullets' },
  { id: 'yt', title: 'YouTube Chapters', desc: 'Auto timestamps + key ideas extracted from video transcripts.', tag: 'YouTube', icon: Youtube, accent: 'bg-white', meta: '2h video → 8 chapters' },
  { id: 'chat', title: 'Grounded Page Chat', desc: 'Ask questions — Claude answers strictly with citations from page content.', tag: 'Chat', icon: MessageCircle, accent: 'bg-[#FFF8D6]', meta: 'Cited answers' },
  { id: 'trans', title: 'Instant Translation', desc: 'Translate takeaways into 50+ languages in one click without leaving the page.', tag: 'Translate', icon: Languages, accent: 'bg-white', meta: '50+ languages' },
  { id: 'quiz', title: 'Knowledge Quiz', desc: 'Generate 5 auto-graded multiple choice questions to test comprehension.', tag: 'Quiz', icon: ClipboardCheck, accent: 'bg-[#FDE047]', meta: '5 Qs • instant' },
  { id: 'keys', title: 'BYOK & Managed Pro', desc: 'Use included Claude keys or plug in your own Anthropic/OpenAI keys for $0.', tag: 'Summarize', icon: Sparkles, accent: 'bg-zinc-100', meta: 'Pro $9 • BYOK $0' },
];

export default function Hero() {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState('All');

  const filtered = DEMOS.filter(d => {
    const matchesSearch = !query || d.title.toLowerCase().includes(query.toLowerCase()) || d.desc.toLowerCase().includes(query.toLowerCase());
    const matchesFilter = active === 'All' || d.tag === active;
    return matchesSearch && matchesFilter;
  });

  return (
    <section id="hero" className="bg-grid bg-[#FFFDf5] py-12 sm:py-20 scroll-mt-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          {/* Badge */}
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border-2 border-black bg-white px-3.5 py-1 text-xs font-bold shadow-hard-sm">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" aria-hidden />
            PagePal AI 1.0 • Chrome Native Side Panel • MIT
          </div>

          <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-6xl leading-[1.08]">
            Understand Any Webpage. <br className="hidden sm:inline" />
            <span className="inline-block rounded-xl bg-[#FDE047] px-3 py-1 border-2 border-black shadow-hard my-1">
              Side by Side.
            </span>
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-zinc-700 sm:text-base font-medium">
            A native Chrome side panel co-pilot. Summarize articles, extract YouTube chapters, and ask deep questions with <span className="font-bold text-black">Claude 4</span> without shrinking or obscuring your tabs.
          </p>

          {/* CTA Buttons */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a
              href={CHROME_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 items-center justify-center gap-2.5 rounded-full border-2 border-black bg-[#FDE047] px-7 text-sm font-extrabold shadow-hard hover:translate-y-px hover:shadow-hard-sm transition-all"
            >
              <Chrome size={18} aria-hidden /> Add to Chrome — It's Free
            </a>
            <a
              href="#how-it-works"
              onClick={(e) => {
                e.preventDefault();
                document.querySelector('#how-it-works')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full border-2 border-black bg-white px-6 text-sm font-bold shadow-hard-sm hover:bg-zinc-50 hover:translate-y-px transition-all"
            >
              See How It Works <ArrowRight size={15} />
            </a>
          </div>

          <div className="mt-4 flex items-center justify-center gap-4 text-xs font-semibold text-zinc-600">
            <span className="flex items-center gap-1"><Zap size={13} className="text-amber-500" /> 5 Free Daily</span>
            <span>•</span>
            <span className="flex items-center gap-1"><ShieldCheck size={13} className="text-emerald-600" /> No Tab Injection</span>
            <span>•</span>
            <span>BYOK Supported</span>
          </div>
        </div>

        {/* Browser Mockup showcasing Side Panel layout */}
        <div className="mx-auto mt-12 max-w-5xl">
          <div className="relative overflow-hidden rounded-2xl border-2 border-black bg-white shadow-hard">
            {/* Browser top chrome */}
            <div className="flex items-center gap-2 border-b-2 border-black bg-zinc-100 px-4 py-2.5">
              <span className="h-3 w-3 rounded-full border border-black bg-red-400" />
              <span className="h-3 w-3 rounded-full border border-black bg-yellow-400" />
              <span className="h-3 w-3 rounded-full border border-black bg-green-400" />
              <div className="ml-3 flex-1 truncate rounded-full border border-black bg-white px-3 py-1 text-xs text-zinc-600 font-mono sm:block hidden">
                https://technology-insider.com/ai-breakthrough-2026
              </div>
              <div className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-black bg-[#FDE047] px-2.5 py-0.5 text-xs font-bold">
                <Sparkles size={13} /> Side Panel Active
              </div>
            </div>

            {/* Split Screen Layout: Left Webpage + Right PagePal Side Panel */}
            <div className="grid gap-0 md:grid-cols-[1fr_360px]">
              {/* Web Page View */}
              <div className="p-6 bg-zinc-50">
                <div className="inline-block rounded bg-zinc-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-600">
                  Article Preview
                </div>
                <h3 className="mt-3 text-lg font-black text-zinc-900 leading-snug">
                  The Next Generation of AI Agents: How Multimodal Reasoning is Transforming Work
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-zinc-600">
                  Artificial intelligence is moving beyond static text generation into active context-aware reasoning engines. In this deep dive, we explore how native browser integration is reshaping productivity...
                </p>
                <div className="mt-4 space-y-2">
                  <div className="h-2 w-full rounded bg-zinc-200" />
                  <div className="h-2 w-11/12 rounded bg-zinc-200" />
                  <div className="h-2 w-4/5 rounded bg-zinc-200" />
                </div>
              </div>

              {/* PagePal Native Side Panel */}
              <div className="border-t-2 border-black md:border-t-0 md:border-l-2 border-black bg-[#FFFDf5] p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b-2 border-black pb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="flex h-6 w-6 items-center justify-center rounded-lg border border-black bg-[#FDE047] text-xs font-black">◈</span>
                      <span className="text-xs font-black">PagePal AI</span>
                    </div>
                    <span className="rounded-full bg-black px-2 py-0.5 text-[10px] font-bold text-white">Side Panel</span>
                  </div>

                  <div className="mt-3 flex gap-1 rounded-lg border border-black bg-white p-1">
                    <span className="flex-1 rounded bg-[#FDE047] py-1 text-center text-[10px] font-bold border border-black">Summary</span>
                    <span className="flex-1 py-1 text-center text-[10px] font-bold text-zinc-600">Chat</span>
                    <span className="flex-1 py-1 text-center text-[10px] font-bold text-zinc-600">Tools</span>
                  </div>

                  <div className="mt-3 rounded-xl border border-black bg-white p-3 shadow-hard-sm">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Summary Takeaways</div>
                    <ul className="mt-1.5 space-y-1.5 text-[11px] leading-tight text-zinc-800">
                      <li className="flex gap-1.5">
                        <span className="font-bold text-amber-600">•</span> Multimodal AI shifts from passive text to active context reasoning.
                      </li>
                      <li className="flex gap-1.5">
                        <span className="font-bold text-amber-600">•</span> Zero-copy sidebar integration preserves user reading workflows.
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-black/20 flex items-center justify-between text-[10px] text-zinc-500 font-semibold">
                  <span>⚡ Read time: 3 min</span>
                  <span className="text-emerald-600 font-bold">Positive Sentiment</span>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Capabilities Grid */}
          <div className="mt-10">
            <div className="relative flex items-center">
              <Search size={16} className="pointer-events-none absolute left-4 text-zinc-400" aria-hidden />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search capabilities (e.g. YouTube chapters, translate, quiz, BYOK)..."
                aria-label="Search capabilities"
                className="h-12 w-full rounded-xl border-2 border-black bg-white pl-11 pr-20 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#FDE047] shadow-hard-sm font-medium"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="absolute right-2 rounded-full border-2 border-black bg-[#FDE047] px-3 py-1 text-xs font-bold shadow-hard-sm"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="mt-4 flex flex-wrap gap-2" role="tablist" aria-label="Filter demos">
              {FILTERS.map((f) => (
                <button
                  key={f}
                  role="tab"
                  aria-selected={active === f}
                  onClick={() => setActive(f)}
                  className={`rounded-full border-2 border-black px-4 py-1.5 text-xs font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FDE047] ${
                    active === f ? 'bg-black text-white shadow-hard-sm' : 'bg-white text-black hover:bg-zinc-50'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((card) => (
                <div
                  key={card.id}
                  className="group rounded-2xl border-2 border-black bg-white p-5 shadow-hard transition-transform hover:translate-y-px hover:shadow-hard-sm"
                >
                  <div className="flex items-start gap-3.5">
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-black ${card.accent} text-black shadow-xs`} aria-hidden>
                      <card.icon size={18} strokeWidth={2.2} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <div className="truncate text-sm font-bold">{card.title}</div>
                      </div>
                      <div className="mt-1 text-xs leading-5 text-zinc-600">{card.desc}</div>
                      <span className="mt-2.5 inline-flex rounded-full border border-black bg-zinc-50 px-2 py-0.5 text-[10px] font-bold text-zinc-700">
                        {card.meta}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
