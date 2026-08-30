import React, { useState, useEffect } from 'react';
import { CHROME_STORE_URL, GITHUB_REPO_URL } from '../utils/constants';
import { Chrome, Github, Sparkles } from 'lucide-react';

const LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'How it Works', href: '#how-it-works' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Privacy', href: '#privacy' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const go = (e, href) => {
    if (href.startsWith('http')) return;
    e.preventDefault();
    setOpen(false);
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <header className={`sticky top-3 z-50 mx-3 sm:mx-6 lg:mx-auto max-w-6xl transition-all duration-300 rounded-2xl border-2 border-black ${scrolled ? 'bg-white/80 backdrop-blur-xl shadow-hard' : 'bg-white/90 backdrop-blur-md shadow-hard-sm'}`}>
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <a href="#" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="flex items-center gap-2.5 group">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-black bg-[#FDE047] text-base font-black shadow-hard-sm transition-transform group-hover:rotate-6">
            ◈
          </span>
          <div className="flex flex-col">
            <span className="text-base font-black tracking-tight flex items-center gap-1.5">
              PagePal <span className="text-[10px] font-bold uppercase tracking-wider bg-black text-[#FDE047] px-1.5 py-0.5 rounded">AI</span>
            </span>
            <span className="text-[10px] text-zinc-500 font-medium -mt-0.5">Sidebar AI Copilot</span>
          </div>
        </a>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={(e) => go(e, l.href)}
              {...(l.href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              className="rounded-full px-3.5 py-1.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-100 hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FDE047] transition-colors"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <a
            href={GITHUB_REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border-2 border-black bg-white shadow-hard-sm hover:translate-y-px transition-transform"
            aria-label="GitHub Repository"
          >
            <Github size={16} />
          </a>
          <a
            href={CHROME_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-full border-2 border-black bg-[#FDE047] px-5 text-sm font-bold shadow-hard-sm hover:translate-y-px hover:shadow-none transition-all"
          >
            <Chrome size={15} /> Add to Chrome — Free
          </a>
        </div>

        <button
          onClick={() => setOpen((v) => !v)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border-2 border-black bg-white lg:hidden shadow-hard-sm"
          aria-label={open ? 'Close menu' : 'Open menu'}
        >
          <span className="text-base font-bold">{open ? '✕' : '☰'}</span>
        </button>
      </div>

      {open && (
        <div id="mobile-menu" className="border-t-2 border-black bg-white px-4 py-4 lg:hidden animate-fade-in">
          <div className="flex flex-col gap-1.5">
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={(e) => go(e, l.href)}
                {...(l.href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                className="rounded-xl px-3 py-2.5 text-sm font-bold text-zinc-700 hover:bg-zinc-100"
              >
                {l.label}
              </a>
            ))}
            <a
              href={CHROME_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex h-11 items-center justify-center gap-2 rounded-full border-2 border-black bg-[#FDE047] px-5 text-sm font-bold shadow-hard-sm"
            >
              <Chrome size={16} /> Add to Chrome — Free
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
