import React from 'react';
import { GITHUB_REPO_URL } from '../utils/constants';

export default function Footer() {
  return (
    <footer className="border-t-2 border-black bg-white">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 py-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm font-semibold">
            <a
              href="#features"
              onClick={(e) => { e.preventDefault(); document.querySelector('#features')?.scrollIntoView({ behavior: 'smooth' }); }}
              className="hover:underline hover:text-black text-zinc-700"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              onClick={(e) => { e.preventDefault(); document.querySelector('#how-it-works')?.scrollIntoView({ behavior: 'smooth' }); }}
              className="hover:underline hover:text-black text-zinc-700"
            >
              How it Works
            </a>
            <a
              href="#pricing"
              onClick={(e) => { e.preventDefault(); document.querySelector('#pricing')?.scrollIntoView({ behavior: 'smooth' }); }}
              className="hover:underline hover:text-black text-zinc-700"
            >
              Pricing
            </a>
            <a
              href="#privacy"
              onClick={(e) => { e.preventDefault(); document.querySelector('#privacy')?.scrollIntoView({ behavior: 'smooth' }); }}
              className="hover:underline hover:text-black text-zinc-700"
            >
              Privacy Policy
            </a>
            <a
              href={GITHUB_REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline hover:text-black text-zinc-700"
            >
              GitHub (MIT)
            </a>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-600">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>All systems operational</span>
            <span>•</span>
            <span>© {new Date().getFullYear()} PagePal AI</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
