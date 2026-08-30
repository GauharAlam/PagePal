import React, { useState } from 'react';
import { Search, Chrome, Sparkles, FileText, Youtube, MessageCircle, Languages, ClipboardCheck } from 'lucide-react';
import { CHROME_STORE_URL } from '../utils/constants';

const FILTERS = ['All', 'Summarize', 'YouTube', 'Chat', 'Translate', 'Quiz'];

const DEMOS = [
  { id: 'sum', title: 'Article Summary', desc: 'Turn any long article into 3 bullets + key insights in <2s.', tag: 'Summarize', icon: FileText, accent: 'bg-[#FDE047]', meta: '12s → 3 bullets' },
  { id: 'yt', title: 'YouTube Chapters', desc: 'Auto timestamps + key ideas from any video. No scrubbing.', tag: 'YouTube', icon: Youtube, accent: 'bg-white', meta: '2h video → 8 chapters' },
  { id: 'chat', title: 'Chat with Page', desc: 'Ask anything — Claude answers with citations from the content.', tag: 'Chat', icon: MessageCircle, accent: 'bg-[#FFF8D6]', meta: 'Cited answers' },
  { id: 'trans', title: 'Translate', desc: 'Summaries to 50+ languages in one click. Pro feature.', tag: 'Translate', icon: Languages, accent: 'bg-white', meta: '50+ languages' },
  { id: 'quiz', title: 'Quiz Generator', desc: '5 MCQs per page to test understanding. Auto-graded.', tag: 'Quiz', icon: ClipboardCheck, accent: 'bg-[#FDE047]', meta: '5 Qs • instant' },
  { id: 'keys', title: 'BYOK or Pro', desc: 'Use Pro keys included or bring your own. Your quota.', tag: 'Summarize', icon: Sparkles, accent: 'bg-zinc-100', meta: 'Pro $9 • BYOK $0' },
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
    <section id="hero" className="bg-grid bg-[#FFFDf5] py-12 sm:py-16 scroll-mt-14">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border-2 border-black bg-white px-3 py-1 text-xs font-bold shadow-hard-sm">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" aria-hidden />
            Muse-Spark 1.2 • Chrome Extension • MIT
          </div>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl leading-[1.1]">
            Summarize Anything. <span className="inline-block rounded-lg bg-[#FDE047] px-3 py-1 shadow-hard-sm">Instantly.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-zinc-600 sm:text-base">
            AI co-pilot for any webpage — articles, YouTube, PDFs. Summarize, chat, quiz & translate with <span className="font-semibold text-black">Claude Sonnet 4</span> without leaving the tab.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <a href={CHROME_STORE_URL} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center justify-center gap-2 rounded-full border-2 border-black bg-[#FDE047] px-6 text-sm font-bold shadow-hard hover:translate-y-px hover:shadow-hard-sm transition-all">
              <Chrome size={16} aria-hidden /> Add to Chrome — Free
            </a>
            <a href="#how-it-works" onClick={(e) => { e.preventDefault(); document.querySelector('#how-it-works')?.scrollIntoView({ behavior: 'smooth' }); }} className="inline-flex h-11 items-center justify-center gap-2 rounded-full border-2 border-black bg-white px-6 text-sm font-bold shadow-hard-sm hover:bg-zinc-50 hover:translate-y-px transition-all">
              See how it works
            </a>
          </div>
          <p className="mt-3 text-xs font-medium text-zinc-500">Free 5/day • Pro $9/mo unlimited • BYOK supported • No tracking</p>
        </div>

        {/* Browser mock */}
        <div className="mx-auto mt-10 max-w-5xl">
          <div className="relative overflow-hidden rounded-2xl border-2 border-black bg-white shadow-hard">
            <div className="flex items-center gap-1.5 border-b-2 border-black bg-zinc-50 px-4 py-2">
              <span className="h-3 w-3 rounded-full border border-black bg-red-400" />
              <span className="h-3 w-3 rounded-full border border-black bg-yellow-400" />
              <span className="h-3 w-3 rounded-full border border-black bg-green-400" />
              <span className="ml-3 hidden flex-1 truncate rounded-full border border-black bg-white px-3 py-1 text-xs text-zinc-500 sm:block">https://example.com/article — PagePal summarizing…</span>
              <span className="ml-auto inline-flex items-center gap-1 rounded-full border border-black bg-[#FDE047] px-2 py-1 text-xs font-bold"><Sparkles size={12} /> PagePal</span>
            </div>
            <div className="grid gap-0 sm:grid-cols-[1.2fr_0.8fr]">
              <div className="p-4 sm:p-6">
                <div className="text-xs font-bold uppercase tracking-widest text-zinc-500">Summary • 12s</div>
                <p className="mt-2 text-sm leading-6 text-zinc-700">PagePal extracts the page, sends it to Claude Sonnet 4, and returns a concise summary with key points, sentiment, and reading time — all inside the 380×600 popup.</p>
                <div className="mt-4 flex flex-col gap-2">
                  <div className="flex gap-2 rounded-xl border-2 border-black bg-[#FFFDf5] p-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-black bg-white text-xs font-bold">1</span>
                    <span className="text-xs leading-5">Grounded in page content — citations, not hallucinations.</span>
                  </div>
                  <div className="flex gap-2 rounded-xl border-2 border-black bg-white p-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-black bg-[#FDE047] text-xs font-bold">2</span>
                    <span className="text-xs leading-5">YouTube → chapters + timestamps; Articles → key points + sentiment.</span>
                  </div>
                </div>
              </div>
              <div className="border-t-2 border-black bg-[#FFFDf5] p-4 sm:border-l-2 sm:border-t-0 sm:p-6">
                <div className="rounded-xl border-2 border-black bg-white p-3 shadow-hard-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold">PagePal Popup</span>
                    <span className="rounded-full bg-black px-2 py-0.5 text-xs font-bold text-white">380×600</span>
                  </div>
                  <div className="mt-3 space-y-2">
                    <div className="h-2 w-full rounded bg-zinc-100" />
                    <div className="h-2 w-5/6 rounded bg-zinc-100" />
                    <div className="h-2 w-4/6 rounded bg-zinc-100" />
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <span className="rounded-lg border border-black bg-[#FDE047] px-2 py-1 text-center text-xs font-bold">Summary</span>
                    <span className="rounded-lg border border-black bg-white px-2 py-1 text-center text-xs font-bold">Chat</span>
                    <span className="rounded-lg border border-black bg-white px-2 py-1 text-center text-xs font-bold">Tools</span>
                  </div>
                </div>
                <p className="mt-3 text-center text-xs text-zinc-500">Live popup • No new tab needed</p>
              </div>
            </div>
          </div>

          {/* Filter + demos */}
          <div className="mt-8">
            <div className="relative flex items-center">
              <Search size={16} className="pointer-events-none absolute left-4 text-zinc-400" aria-hidden />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search capabilities, e.g. YouTube, translate, quiz..."
                aria-label="Search capabilities"
                className="h-12 w-full rounded-xl border-2 border-black bg-white pl-10 pr-20 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#FDE047] shadow-hard-sm"
              />
              {query ? (
                <button onClick={() => setQuery('')} className="absolute right-2 rounded-full border-2 border-black bg-[#FDE047] px-3 py-1 text-xs font-bold shadow-hard-sm hover:translate-y-px transition-transform">Clear</button>
              ) : (
                <span className="pointer-events-none absolute right-3 hidden text-xs text-zinc-400 sm:block">/ to focus</span>
              )}
            </div>

            <div className="mt-4 flex flex-wrap gap-2" role="tablist" aria-label="Filter demos">
              {FILTERS.map(f => (
                <button
                  key={f}
                  role="tab"
                  aria-selected={active === f}
                  onClick={() => setActive(f)}
                  className={`rounded-full border-2 border-black px-4 py-1.5 text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FDE047] ${active === f ? 'bg-black text-white shadow-hard-sm' : 'bg-white text-black hover:bg-zinc-50'}`}
                >
                  {f}
                </button>
              ))}
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map(card => (
                <div key={card.id} className="group rounded-2xl border-2 border-black bg-white p-4 shadow-hard transition-transform hover:translate-y-px hover:shadow-hard-sm">
                  <div className="flex items-start gap-3">
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-black ${card.accent} text-black`} aria-hidden>
                      <card.icon size={18} strokeWidth={2} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <div className="truncate text-sm font-bold">{card.title}</div>
                        <span className="hidden rounded-full border border-black bg-[#FFF8D6] px-2 py-0.5 text-[10px] font-bold tracking-widest sm:inline-flex">{card.tag}</span>
                      </div>
                      <div className="mt-1 text-xs leading-5 text-zinc-600">{card.desc}</div>
                      <span className="mt-2 inline-flex rounded-full border border-black bg-zinc-50 px-2 py-0.5 text-xs font-medium">{card.meta}</span>
                    </div>
                  </div>
                </div>
              ))}
              {filtered.length === 0 && (
                <div className="col-span-full rounded-2xl border-2 border-black bg-white p-8 text-center shadow-hard">
                  <p className="text-sm font-semibold">No results for “{query}” in {active}</p>
                  <p className="mt-1 text-xs text-zinc-500">Try a different search or filter. Example: “YouTube” or “translate”.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
