import React from 'react';

export default function Footer() {
  return (
    <footer className="border-t-2 border-black bg-white">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-4 text-sm font-medium">
            <a href="#features" onClick={(e) => { e.preventDefault(); document.querySelector('#features')?.scrollIntoView({ behavior: 'smooth' }); }} className="hover:underline">Features</a>
            <a href="#how-it-works" onClick={(e) => { e.preventDefault(); document.querySelector('#how-it-works')?.scrollIntoView({ behavior: 'smooth' }); }} className="hover:underline">How it Works</a>
            <a href="https://github.com/anomalyco/opencode" target="_blank" rel="noopener noreferrer" className="hover:underline">GitHub</a>
            <span className="text-zinc-500">MIT License</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span>All systems operational</span>
            <span className="hidden sm:inline">• © {new Date().getFullYear()} PagePal</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
