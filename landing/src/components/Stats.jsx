import React from 'react';

const STATS = [
  { value: '5,000+', label: 'Installs' },
  { value: '4.9/5', label: 'Rating' },
  { value: 'MIT', label: 'Open Source' },
  { value: '< 2s', label: 'Avg response' },
];

export default function Stats() {
  return (
    <section className="border-y-2 border-black bg-white" aria-label="Stats">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 border-2 border-black sm:grid-cols-4 overflow-hidden rounded-none">
          {STATS.map((s) => (
            <div key={s.label} className="flex flex-col items-center gap-1 border-black bg-white py-6 text-center not-last:border-r-2 max-sm:[&:nth-child(2n)]:border-r-0 max-sm:[&:nth-child(n+3)]:border-t-2 sm:[&:nth-child(2n)]:border-r-2 sm:last:border-r-0">
              <span className="text-lg font-extrabold tracking-tight">{s.value}</span>
              <span className="text-xs font-bold uppercase tracking-widest text-zinc-600">{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
