import React from 'react';
import { Github, Star, Eye, GitFork } from 'lucide-react';

export default function OpenSourceBanner() {
  return (
    <section id="open-source" className="scroll-mt-14 border-y-2 border-black bg-[#FDE047]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col gap-6 rounded-2xl border-2 border-black bg-white p-6 shadow-hard sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-extrabold">Open-source & MIT</h3>
            <p className="mt-1 max-w-xl text-sm leading-6 text-zinc-600">Inspect code, audit permissions, contribute. Star on GitHub — PRs welcome. Built with Muse-Spark 1.2.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-black bg-white px-2.5 py-1 text-xs font-bold"><Eye size={12} aria-hidden /> Inspect</span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-black bg-white px-2.5 py-1 text-xs font-bold"><GitFork size={12} aria-hidden /> Fork</span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-black bg-[#FDE047] px-2.5 py-1 text-xs font-bold"><Star size={12} aria-hidden /> Star</span>
            </div>
          </div>
          <div className="flex shrink-0 flex-col gap-2">
            <div className="flex gap-3">
              <a href="https://github.com/anomalyco/opencode" target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center justify-center gap-2 rounded-full border-2 border-black bg-white px-5 text-sm font-bold shadow-hard-sm hover:translate-y-px hover:shadow-none transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"><Github size={16} aria-hidden /> Code</a>
              <a href="https://github.com/anomalyco/opencode" target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center justify-center gap-2 rounded-full border-2 border-black bg-black px-5 text-sm font-bold text-white shadow-hard-sm hover:translate-y-px hover:shadow-none transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"><Star size={16} aria-hidden /> Star</a>
            </div>
            <span className="text-center text-xs font-medium text-zinc-600">1.2k stars • 80 contributors</span>
          </div>
        </div>
      </div>
    </section>
  );
}
