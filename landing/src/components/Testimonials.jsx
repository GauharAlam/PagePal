import React from 'react';
import { Card } from './ui/card';

const TESTIMONIALS = [
  { quote: 'PagePal cut my research time in half. Summaries are grounded in the page, not hallucinations.', name: 'Sarah Chen', role: 'Product Manager, Linear', initials: 'SC' },
  { quote: 'BYOK is perfect — I use my own OpenAI key for heavy docs and Pro for everything else.', name: 'Marcus Kim', role: 'Engineering Lead, Vercel', initials: 'MK' },
  { quote: 'YouTube chapters alone saved hours. Accurate timestamps, no fluff.', name: 'Ana Rivera', role: 'Creator, 120k subs', initials: 'AR' },
];

export default function Testimonials() {
  return (
    <section className="border-b border-border bg-background py-12 sm:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-2xl font-semibold tracking-tight">Trusted by readers who ship</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">Minimal, fast, and predictable — built for moderately experienced teams.</p>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <Card key={t.name} className="flex flex-col gap-4 p-6">
              <p className="text-sm leading-6 text-foreground">“{t.quote}”</p>
              <div className="flex items-center gap-3 border-t border-border pt-4">
                <span className="flex h-8 w-8 items-center justify-center border border-border bg-muted text-xs font-medium text-muted-foreground">{t.initials}</span>
                <div>
                  <div className="text-sm font-medium text-foreground">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
