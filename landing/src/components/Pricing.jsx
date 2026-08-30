import React from 'react';
import { CHROME_STORE_URL } from '../utils/constants';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

const proFeatures = [
  'All 5 models: Claude, GPT-4o, Gemini, DeepSeek, Grok',
  'No API key needed — keys included',
  'Unlimited summaries & chats, 50+ languages',
  'Quiz, history, priority support',
  'Cancel via Stripe portal',
];
const byokFeatures = [
  'Add keys in extension: Settings → API Keys',
  'OpenAI, Anthropic, Google, DeepSeek, xAI',
  'Pay providers directly — often <$2/mo',
  'Same router + manual picker',
  'Switch to Pro anytime',
];

export default function Pricing() {
  return (
    <section id="pricing" className="scroll-mt-14 border-y-2 border-black bg-[#FFFDf5] py-12 sm:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="outline" className="mb-4">Two ways to use PagePal</Badge>
          <h2 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">Pro or bring your own key</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Same extension. Choose convenience or control. Change in <span className="font-medium text-foreground">Settings → API Keys</span> anytime.
          </p>
        </div>

        <div className="mx-auto mt-10 grid max-w-4xl gap-4 md:grid-cols-2">
          <Card className="flex flex-col p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold">Pro</div>
                <div className="text-xs text-muted-foreground">Keys included</div>
              </div>
              <Badge>Popular</Badge>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-semibold tracking-tight">$9</span>
              <span className="text-sm text-muted-foreground">/month</span>
            </div>
            <ul className="mt-6 flex flex-1 flex-col gap-3">
              {proFeatures.map((f) => (
                <li key={f} className="flex gap-3 text-sm leading-6">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 bg-success" aria-hidden />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <a href={CHROME_STORE_URL} target="_blank" rel="noopener noreferrer" className="mt-6">
              <Button className="w-full">Start Pro — 7 day free</Button>
            </a>
            <p className="mt-3 text-center text-xs text-muted-foreground">5 free/day before upgrade</p>
          </Card>

          <Card className="flex flex-col p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold">BYOK</div>
                <div className="text-xs text-muted-foreground">Your keys, your quota</div>
              </div>
              <Badge variant="outline">Free</Badge>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-semibold tracking-tight">$0</span>
              <span className="text-sm text-muted-foreground">+ provider usage</span>
            </div>
            <ul className="mt-6 flex flex-1 flex-col gap-3">
              {byokFeatures.map((f) => (
                <li key={f} className="flex gap-3 text-sm leading-6">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 bg-border" aria-hidden />
                  <span className="text-muted-foreground">{f}</span>
                </li>
              ))}
            </ul>
            <a href="#how-it-works" onClick={(e) => { e.preventDefault(); document.querySelector('#how-it-works')?.scrollIntoView({ behavior: 'smooth' }); }}>
              <Button variant="outline" className="mt-6 w-full">How BYOK works</Button>
            </a>
            <p className="mt-3 text-center text-xs text-muted-foreground">Keys encrypted, never shared</p>
          </Card>
        </div>

        <div className="mx-auto mt-6 max-w-3xl border border-border bg-card p-4 text-sm leading-6 text-muted-foreground">
          <span className="font-medium text-foreground">Not sure?</span> Start free (5/day), add a key when needed, or upgrade to Pro when you want keys managed. No lock-in — summaries stay.
        </div>
      </div>
    </section>
  );
}
