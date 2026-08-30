import React from 'react';
import { Zap, Shield, Code2, Keyboard } from 'lucide-react';

const FEATURES = [
  { icon: Zap, title: 'Muse-Spark 1.2 in-browser', desc: 'Fast AI without leaving the page. Summarize, explain, and chat streamed in your popup.' },
  { icon: Shield, title: 'Lightweight & private', desc: 'Minimal permissions. No tab injection. Content sent only when you prompt.' },
  { icon: Code2, title: 'Fully open-source', desc: 'MIT. Inspect, fork, contribute. Reproducible builds, no trackers.' },
  { icon: Keyboard, title: 'Instant shortcut', desc: 'Pin once, press Ctrl+Shift+P, run any prompt anywhere.' },
];

export default function Features() {
  return (
    <section id="features" className="scroll-mt-14 bg-[#FFFDf5] py-12 sm:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Built for speed, privacy, openness</h2>
          <p className="mt-3 text-sm leading-6 text-zinc-600">Four essentials, zero bloat. Works on any page in 60 seconds.</p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {FEATURES.map((f) => (
            <div key={f.title} className="group rounded-2xl border-2 border-black bg-white p-6 shadow-hard transition-all hover:translate-y-px hover:shadow-hard-sm">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-black bg-[#FDE047] text-black shadow-hard-sm group-hover:translate-y-px transition-transform">
                <f.icon size={18} strokeWidth={2} aria-hidden />
              </span>
              <h3 className="mt-4 text-base font-bold">{f.title}</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-600">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
