import React from 'react';

const STEPS = [
  { n: '01', title: 'Install from Store', desc: 'Add PagePal in one click. No account.' },
  { n: '02', title: 'Pin & press shortcut', desc: 'Pin and press Ctrl+Shift+P on any page.' },
  { n: '03', title: 'Run AI co-pilot', desc: 'Summarize, chat, prompt without leaving the tab.' },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-14 bg-[#FFFDf5] py-12 sm:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">How it works</h2>
          <p className="mt-2 text-sm text-zinc-600">Three steps, under 60 seconds. No account needed to start.</p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n} className="group rounded-2xl border-2 border-black bg-white p-6 shadow-hard transition-transform hover:translate-y-px hover:shadow-hard-sm">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border-2 border-black bg-[#FDE047] text-xs font-extrabold shadow-hard-sm">{s.n}</span>
              <h3 className="mt-4 text-sm font-bold">{s.title}</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-600">{s.desc}</p>
            </div>
          ))}
        </div>
        <p className="mt-8 text-center text-xs font-medium text-zinc-600">Works on Chrome 114+ • Minimal permissions • MIT • 5 models via Smart Router</p>
        <div className="mt-6 flex justify-center">
          <a href="https://chrome.google.com/webstore/detail/pagepal-ai/placeholder" target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center justify-center rounded-full border-2 border-black bg-[#FDE047] px-6 text-sm font-bold shadow-hard hover:translate-y-px hover:shadow-hard-sm transition-all">
            Add to Chrome — Free
          </a>
        </div>
      </div>
    </section>
  );
}
