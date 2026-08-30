import React, { useState } from 'react';
import { MODELS } from '../utils/constants';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

export default function Models() {
  const [active, setActive] = useState(MODELS[0].name);
  const current = MODELS.find((m) => m.name === active) || MODELS[0];

  return (
    <section id="models" className="border-b border-border bg-background py-12 sm:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="outline" className="mb-4">5 Models • Subscription or BYOK</Badge>
          <h2 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">The right model for every task</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Use <span className="font-medium text-foreground">Pro</span> — all models included — or{' '}
            <span className="font-medium text-foreground">bring your own API key</span>. Router picks the best fit, or choose manually.
          </p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <div className="flex flex-col gap-2">
            {MODELS.map((m) => {
              const isActive = m.name === active;
              return (
                <button
                  key={m.name}
                  onClick={() => setActive(m.name)}
                  className={`flex flex-col gap-2 border p-4 text-left ${isActive ? 'border-foreground bg-foreground text-background' : 'border-border bg-card hover:bg-accent'}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className={`flex h-8 w-8 items-center justify-center border text-sm ${isActive ? 'border-background/20 bg-background/10' : 'border-border bg-background'}`}>{m.icon}</span>
                      <div>
                        <div className={`text-sm font-medium ${isActive ? 'text-background' : 'text-foreground'}`}>{m.name}</div>
                        <div className={`text-xs ${isActive ? 'text-background/70' : 'text-muted-foreground'}`}>{m.provider}</div>
                      </div>
                    </div>
                    <Badge variant={isActive ? 'secondary' : 'outline'}>{m.badge}</Badge>
                  </div>
                  {isActive && <p className="text-sm leading-6 text-background/80">{m.usedFor}</p>}
                </button>
              );
            })}
          </div>

          <Card className="flex flex-col gap-6 p-6">
            <div>
              <div className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Smart Router</div>
              <div className="mt-4 flex flex-col gap-3">
                <div className="flex items-center gap-3 border border-border bg-background px-3 py-3">
                  <span className="text-sm">◩</span>
                  <div>
                    <div className="text-sm font-medium">Page content</div>
                    <div className="text-xs text-muted-foreground">Classified by length & type</div>
                  </div>
                </div>
                <div className="flex justify-center py-1 text-xs text-muted-foreground">↓ PagePal Router</div>
                <div className="flex items-center gap-3 border border-foreground bg-foreground px-3 py-3 text-background">
                  <span className="text-sm">{current.icon}</span>
                  <div>
                    <div className="text-sm font-medium">{current.name}</div>
                    <div className="text-xs opacity-70">{current.tag}</div>
                  </div>
                  <span className="ml-auto h-2 w-2 bg-success" aria-hidden />
                </div>
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <div className="mb-3 text-xs font-medium uppercase tracking-widest text-muted-foreground">How BYOK compares</div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="border border-border bg-background p-3">
                  <div className="font-medium">Pro</div>
                  <div className="mt-1 text-xs leading-5 text-muted-foreground">Keys included. Unlimited use. We handle billing and rotation.</div>
                </div>
                <div className="border border-border bg-background p-3">
                  <div className="font-medium">BYOK</div>
                  <div className="mt-1 text-xs leading-5 text-muted-foreground">Your keys, your quota. Pay provider directly. Switch anytime.</div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
