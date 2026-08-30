import React from 'react';
import { CHROME_STORE_URL } from '../utils/constants';
import { Button } from './ui/button';

export default function CTA() {
  return (
    <section className="bg-[#FDE047] py-12 sm:py-16">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border-2 border-black bg-white p-8 text-center shadow-hard sm:p-10">
          <h2 className="font-heading text-2xl font-extrabold tracking-tight sm:text-3xl">Start reading smarter today</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-zinc-600">
            Free 5 summaries/day. Pro $9/mo (keys included) or bring your own API key. Works on any page in 60 seconds.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a href={CHROME_STORE_URL} target="_blank" rel="noopener noreferrer">
              <Button variant="default" size="lg" className="rounded-full border-2 border-black bg-[#FDE047] text-black hover:bg-[#FDE047]/90 shadow-hard-sm">Add to Chrome — Free</Button>
            </a>
            <span className="text-xs font-medium text-zinc-500">No card for BYOK • Cancel anytime • MIT</span>
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 border-t-2 border-black/10 pt-6 text-xs font-medium text-zinc-600">
            <span>✓ Free tier</span>
            <span className="h-3 w-px bg-black/20" />
            <span>✓ BYOK supported</span>
            <span className="h-3 w-px bg-black/20" />
            <span>✓ 5 models • Smart Router</span>
          </div>
        </div>
      </div>
    </section>
  );
}
