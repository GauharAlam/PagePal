import React, { useState } from 'react';
import { CHROME_STORE_URL } from '../utils/constants';

const LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'How it Works', href: '#how-it-works' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Open Source', href: '#open-source' },
  { label: 'GitHub', href: 'https://github.com/anomalyco/opencode' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const go = (e, href) => {
    if (href.startsWith('http')) return;
    e.preventDefault();
    setOpen(false);
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <header className="sticky top-0 z-50 border-b-2 border-black bg-white">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <a href="#" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-black bg-[#FDE047] text-sm font-bold shadow-hard-sm">◈</span>
          <span className="hidden text-sm font-bold tracking-tight sm:block">PagePal</span>
        </a>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} onClick={(e) => go(e, l.href)} {...(l.href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})} className="rounded-full px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50 hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FDE047]">
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <a href={CHROME_STORE_URL} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center justify-center rounded-full border-2 border-black bg-[#FDE047] px-5 text-sm font-bold shadow-hard-sm hover:translate-y-px hover:shadow-none transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black">
            Add to Chrome — Free
          </a>
        </div>

        <button onClick={() => setOpen((v) => !v)} className="inline-flex h-9 w-9 items-center justify-center border-2 border-black bg-white lg:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FDE047]" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} aria-controls="mobile-menu">
          <span className="text-sm" aria-hidden>{open ? '✕' : '☰'}</span>
        </button>
      </div>

      {open && (
        <div id="mobile-menu" className="border-t-2 border-black bg-white px-4 py-4 lg:hidden">
          <div className="flex flex-col gap-1">
            {LINKS.map((l) => (
              <a key={l.href} href={l.href} onClick={(e) => go(e, l.href)} {...(l.href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})} className="rounded-xl px-3 py-3 text-sm font-medium text-zinc-600 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FDE047]">
                {l.label}
              </a>
            ))}
            <a href={CHROME_STORE_URL} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex h-10 items-center justify-center rounded-full border-2 border-black bg-[#FDE047] px-5 text-sm font-bold shadow-hard-sm">Add to Chrome — Free</a>
          </div>
        </div>
      )}
    </header>
  );
}
