import { Button } from './ui/button';
import { Card } from './ui/card';

export default function SummaryTab({ data, loading, error, pageContext, onRetry }) {
  if (loading) {
    return (
      <div className="flex h-full flex-col gap-4 overflow-y-auto p-4">
        <div className="flex items-center gap-2.5">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-foreground" aria-hidden />
          <span className="text-sm font-medium">Summarizing…</span>
          <span className="ml-auto h-1.5 w-20 animate-pulse rounded-full bg-muted" />
        </div>
        <Card className="overflow-hidden p-4">
          <div className="space-y-2">
            <div className="h-3 w-full animate-pulse rounded bg-muted" />
            <div className="h-3 w-5/6 animate-pulse rounded bg-muted" />
            <div className="h-3 w-4/6 animate-pulse rounded bg-muted" />
          </div>
        </Card>
        <div className="flex flex-col gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3 rounded-xl border border-border bg-card p-3">
              <span className="h-6 w-6 shrink-0 animate-pulse rounded-full border border-border bg-muted" />
              <span className="h-3 flex-1 animate-pulse rounded bg-muted self-center" style={{ animationDelay: `${i * 120}ms` }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error?.upgrade) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center animate-fade-in">
        <div className="rounded-full border border-warning bg-warning/10 px-3 py-1.5 text-xs font-semibold text-warning">Limit reached</div>
        <h3 className="text-sm font-semibold">{error.error}</h3>
        <p className="max-w-[260px] text-xs leading-5 text-muted-foreground">{error.message || 'You hit the free limit. Upgrade for unlimited access.'}</p>
        <Button
          className="rounded-full shadow-hard-sm"
          onClick={async () => {
            const { supabase } = await import('../lib/supabase');
            const { data: { session } } = await supabase.auth.getSession();
            const r = await fetch(`${import.meta.env.VITE_PROXY_URL}/api/billing/create-checkout`, { method: 'POST', headers: { Authorization: `Bearer ${session?.access_token}` } });
            const d = await r.json();
            if (d.url) window.open(d.url, '_blank');
          }}
        >
          Upgrade to Pro — $9/mo
        </Button>
        <Button variant="ghost" size="sm" onClick={onRetry} className="rounded-full">Try again</Button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center animate-fade-in">
        <div className="rounded-full border border-destructive bg-destructive/10 px-3 py-1.5 text-xs font-semibold text-destructive">Error</div>
        <p className="max-w-[280px] text-sm font-medium leading-5">{error.error || 'Something went wrong'}</p>
        <p className="max-w-[260px] text-xs text-muted-foreground">Check your connection and try again.</p>
        <Button size="sm" onClick={onRetry} className="rounded-full">Retry</Button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center animate-fade-in">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-primary shadow-hard-sm text-lg">◈</div>
        <h3 className="font-heading text-sm font-bold">Ready to analyze</h3>
        <p className="max-w-[240px] text-xs leading-5 text-muted-foreground">Navigate to any page, then click Summarize to get key insights in seconds.</p>
        <div className="flex gap-2">
          {['YouTube', 'Article', 'PDF'].map((t) => (
            <span key={t} className="rounded-full border border-border bg-card px-2.5 py-1 text-xs font-medium text-muted-foreground">{t}</span>
          ))}
        </div>
        <Button size="sm" onClick={onRetry} className="mt-2 rounded-full">Summarize current page</Button>
      </div>
    );
  }

  const sentimentColor =
    data.sentiment === 'positive' ? 'text-success' : data.sentiment === 'negative' ? 'text-destructive' : 'text-warning';
  const sentimentBg = data.sentiment === 'positive' ? 'bg-success/10 border-success/20' : data.sentiment === 'negative' ? 'bg-destructive/10 border-destructive/20' : 'bg-warning/10 border-warning/20';

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-3 animate-fade-in">
      <Card className="rounded-xl p-4 shadow-sm">
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Summary
        </div>
        <p className="text-sm leading-6">{data.summary}</p>
      </Card>

      {data.keyPoints?.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Key points</div>
          <div className="flex flex-col gap-2">
            {data.keyPoints.map((point, i) => (
              <div key={i} className="flex gap-3 rounded-xl border border-border bg-card p-3 transition-colors hover:bg-accent/50">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border bg-background text-xs font-bold shadow-sm">{i + 1}</span>
                <span className="flex-1 text-xs leading-5">{point}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-2">
        <div className={`rounded-xl border p-3 text-center ${sentimentBg}`}>
          <div className={`text-xs font-bold uppercase tracking-widest ${sentimentColor}`}>{data.sentiment || 'neutral'}</div>
          <div className="mt-1 text-[11px] font-medium text-muted-foreground">Sentiment</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-3 text-center">
          <div className="text-xs font-bold">{data.readingTime || '—'}</div>
          <div className="mt-1 text-[11px] font-medium text-muted-foreground">Read time</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-3 text-center">
          <div className="text-xs font-bold">{data.language || 'EN'}</div>
          <div className="mt-1 text-[11px] font-medium text-muted-foreground">Language</div>
        </div>
      </div>
    </div>
  );
}
