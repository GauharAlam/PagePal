import { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { supabase, isDemoMode, demoSession } from '../lib/supabase';
import { apiRequest } from '../lib/api';
import MarkdownView from './ui/MarkdownView';

const SUGGESTED_FOLLOWUPS = [
  '🔍 Explain key takeaway #1 deeper',
  '⚖️ What are the main criticisms / counterpoints?',
  '💡 Provide real-world practical examples',
  '🚀 What are the future implications?',
];

export default function SummaryTab({
  data,
  loading,
  error,
  pageContext,
  rawContent,
  currentModel,
  onRetry,
  onNavigateToChat,
}) {
  const [copied, setCopied] = useState(false);
  const [copiedFollowupIdx, setCopiedFollowupIdx] = useState(null);

  // Follow-up conversation state
  const [followups, setFollowups] = useState([]);
  const [questionInput, setQuestionInput] = useState('');
  const [asking, setAsking] = useState(false);
  const followupsEndRef = useRef(null);

  async function getToken() {
    if (isDemoMode) return demoSession.access_token;
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token;
  }

  function copySummary() {
    if (!data) return;
    const text = `# ${pageContext.title || 'Page Summary'}\n\n${data.summary}\n\nKey Takeaways:\n${data.keyPoints?.map((p, i) => `${i + 1}. ${p}`).join('\n')}\n\n*Model: ${currentModel}*`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function copyFollowupAnswer(text, idx) {
    navigator.clipboard.writeText(text);
    setCopiedFollowupIdx(idx);
    setTimeout(() => setCopiedFollowupIdx(null), 2000);
  }

  async function handleAskFollowup(questionText = questionInput) {
    const q = questionText.trim();
    if (!q || asking) return;

    const newFollowup = { question: q, answer: '', loading: true, timestamp: new Date() };
    setFollowups((prev) => [...prev, newFollowup]);
    setQuestionInput('');
    setAsking(true);

    try {
      const token = await getToken();
      const summaryContext = data ? `Summary:\n${data.summary}\n\nKey Takeaways:\n${data.keyPoints?.join('\n')}` : '';
      const fullContext = `${summaryContext}\n\nPage Text:\n${rawContent?.slice(0, 10000) || ''}`;

      const res = await apiRequest(
        '/api/chat',
        {
          method: 'POST',
          body: JSON.stringify({
            messages: [
              ...followups.map((f) => ({ role: 'user', content: f.question })),
              { role: 'user', content: q },
            ],
            context: fullContext,
            pageType: pageContext?.pageType || 'general',
            title: pageContext?.title,
            model: currentModel,
          }),
        },
        token
      );

      setFollowups((prev) =>
        prev.map((item, idx) => (idx === prev.length - 1 ? { ...item, answer: res.reply, loading: false } : item))
      );
    } catch (err) {
      setFollowups((prev) =>
        prev.map((item, idx) =>
          idx === prev.length - 1 ? { ...item, answer: `⚠️ Failed to get answer: ${err.message}`, loading: false } : item
        )
      );
    } finally {
      setAsking(false);
      setTimeout(() => followupsEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }

  const modelDisplayName = currentModel?.split('/')[1]?.split(':')[0]?.toUpperCase() || 'AI';

  if (loading) {
    return (
      <div className="flex h-full flex-col gap-4 overflow-y-auto p-4 animate-fade-in">
        <div className="flex items-center gap-2.5">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-foreground" aria-hidden />
          <span className="text-xs font-bold">Analyzing page with {modelDisplayName}…</span>
          <span className="ml-auto h-2 w-16 animate-pulse rounded-full bg-muted" />
        </div>
        <Card className="overflow-hidden p-4">
          <div className="space-y-2">
            <div className="h-3 w-full animate-pulse rounded bg-muted" />
            <div className="h-3 w-5/6 animate-pulse rounded bg-muted" />
            <div className="h-3 w-4/6 animate-pulse rounded bg-muted" />
          </div>
        </Card>
        <div className="flex flex-col gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex gap-3 rounded-xl border border-border bg-card p-3">
              <span className="h-5 w-5 shrink-0 animate-pulse rounded-full border border-border bg-muted" />
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
        <div className="rounded-full border border-warning bg-warning/10 px-3 py-1.5 text-xs font-bold text-warning">
          Daily Limit Reached
        </div>
        <h3 className="text-sm font-bold">{error.error}</h3>
        <p className="max-w-[260px] text-xs leading-5 text-muted-foreground">
          {error.message || 'Free plan limit reached. Upgrade for unlimited access or add your own key.'}
        </p>
        <Button
          className="rounded-full shadow-hard-sm font-bold"
          onClick={async () => {
            let token = demoSession?.access_token;
            if (!isDemoMode) {
              const { data: { session } } = await supabase.auth.getSession();
              token = session?.access_token;
            }
            const d = await apiRequest('/api/billing/create-checkout', { method: 'POST' }, token);
            if (d.url) window.open(d.url, '_blank');
          }}
        >
          Upgrade to Pro — $9/mo
        </Button>
        <Button variant="ghost" size="sm" onClick={onRetry} className="rounded-full text-xs">
          Try again
        </Button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center animate-fade-in">
        <div className="rounded-full border border-destructive bg-destructive/10 px-3 py-1.5 text-xs font-bold text-destructive">
          Analysis Error
        </div>
        <p className="max-w-[280px] text-xs font-semibold leading-5 text-foreground">{error.error || 'Something went wrong'}</p>
        <p className="max-w-[260px] text-[11px] text-muted-foreground">Ensure the proxy server is running and the page is accessible.</p>
        <Button size="sm" onClick={onRetry} className="rounded-full font-bold px-5">
          Retry Analysis
        </Button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center animate-fade-in">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-black bg-primary shadow-hard text-lg font-black text-black">
          ◈
        </div>
        <div>
          <h3 className="font-heading text-sm font-bold">Ready to analyze</h3>
          <p className="mt-1 max-w-[240px] text-xs leading-5 text-muted-foreground">
            Generate an AI summary, key insights, and chapters in seconds.
          </p>
        </div>
        <div className="flex gap-2">
          {['YouTube', 'Article', 'PDF', 'Docs'].map((t) => {
            const isMatch =
              (pageContext.pageType === 'youtube' && t === 'YouTube') ||
              (pageContext.pageType === 'pdf' && t === 'PDF') ||
              (pageContext.pageType === 'article' && t === 'Article');
            return (
              <span
                key={t}
                className={`rounded-full border px-2.5 py-1 text-[11px] font-bold transition-colors ${
                  isMatch
                    ? 'border-primary bg-primary/20 text-foreground font-black'
                    : 'border-border bg-card text-muted-foreground'
                }`}
              >
                {t}
              </span>
            );
          })}
        </div>
        <Button size="default" onClick={onRetry} className="mt-2 rounded-full px-6 shadow-hard-sm font-black">
          ✨ Summarize Page
        </Button>
      </div>
    );
  }

  const sentimentColor =
    data.sentiment === 'positive' ? 'text-emerald-500' : data.sentiment === 'negative' ? 'text-red-500' : 'text-amber-500';
  const sentimentBg =
    data.sentiment === 'positive'
      ? 'bg-emerald-500/10 border-emerald-500/20'
      : data.sentiment === 'negative'
      ? 'bg-red-500/10 border-red-500/20'
      : 'bg-amber-500/10 border-amber-500/20';

  return (
    <div className="flex h-full flex-col gap-3.5 overflow-y-auto p-3 animate-fade-in">
      {/* Top action bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Page Summary</span>
          {data.cached && (
            <span className="rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-semibold text-muted-foreground" title="Loaded from cache">
              Cached
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={copySummary}
            className="rounded-lg border border-border bg-card px-2.5 py-1 text-[11px] font-semibold transition-colors hover:bg-accent"
          >
            {copied ? 'Copied ✓' : 'Copy'}
          </button>
          <button
            onClick={onRetry}
            className="rounded-lg border border-border bg-card px-2.5 py-1 text-[11px] font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            title="Re-analyze page"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Summary Card */}
      <Card className="rounded-xl p-4 shadow-sm">
        <p className="text-xs leading-6 text-foreground font-normal">{data.summary}</p>
      </Card>

      {/* Key Takeaways */}
      {data.keyPoints?.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Key Takeaways</div>
          <div className="flex flex-col gap-1.5">
            {data.keyPoints.map((point, i) => (
              <div key={i} className="flex gap-2.5 rounded-xl border border-border bg-card p-3 transition-colors hover:bg-accent/40">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border bg-background text-[11px] font-bold shadow-xs">
                  {i + 1}
                </span>
                <span className="flex-1 text-xs leading-5 text-foreground">{point}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Metadata pills */}
      <div className="grid grid-cols-3 gap-2 pt-1">
        <div className={`rounded-xl border p-2.5 text-center ${sentimentBg}`}>
          <div className={`text-xs font-bold uppercase tracking-wider ${sentimentColor}`}>{data.sentiment || 'neutral'}</div>
          <div className="mt-0.5 text-[10px] font-medium text-muted-foreground">Sentiment</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-2.5 text-center">
          <div className="text-xs font-bold">{data.readingTime || '2 min'}</div>
          <div className="mt-0.5 text-[10px] font-medium text-muted-foreground">Read time</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-2.5 text-center">
          <div className="text-xs font-bold">{data.language || 'English'}</div>
          <div className="mt-0.5 text-[10px] font-medium text-muted-foreground">Language</div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 💬 TALK LONGER / ASK FOLLOW-UP SECTION                                    */}
      {/* ========================================================================= */}
      <div className="mt-2 flex flex-col gap-2.5 border-t border-border/40 pt-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-xs">💬</span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Ask Follow-Up / Deep Dive
            </span>
          </div>
          {onNavigateToChat && (
            <button
              onClick={() => onNavigateToChat()}
              className="text-[10px] font-bold text-primary hover:underline"
            >
              Full Chat Tab →
            </button>
          )}
        </div>

        {/* 1-Click Suggestion Chips */}
        <div className="flex flex-wrap gap-1.5">
          {SUGGESTED_FOLLOWUPS.map((suggestion, idx) => (
            <button
              key={idx}
              disabled={asking}
              onClick={() => handleAskFollowup(suggestion)}
              className="rounded-full border border-border/70 bg-card/80 px-2.5 py-1 text-left text-[10px] font-semibold text-muted-foreground transition-colors hover:border-primary hover:bg-primary/10 hover:text-foreground"
            >
              {suggestion}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="flex items-center gap-1.5 rounded-xl border border-border bg-card p-1 shadow-xs focus-within:ring-1 focus-within:ring-ring">
          <input
            type="text"
            value={questionInput}
            onChange={(e) => setQuestionInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleAskFollowup();
              }
            }}
            placeholder="Ask anything about this summary…"
            className="flex-1 bg-transparent px-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
            disabled={asking}
          />
          <Button
            size="sm"
            disabled={asking || !questionInput.trim()}
            onClick={() => handleAskFollowup()}
            className="h-7 rounded-lg px-3 text-xs font-bold shadow-hard-sm shrink-0"
          >
            {asking ? <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" /> : 'Ask'}
          </Button>
        </div>

        {/* Inline Follow-Up Q&A Stream */}
        {followups.length > 0 && (
          <div className="flex flex-col gap-3 pt-1">
            {followups.map((item, idx) => (
              <Card key={idx} className="rounded-xl p-3 shadow-sm animate-fade-in border border-border/70">
                <div className="flex items-start justify-between gap-2 border-b border-border/30 pb-1.5 mb-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                    <span className="text-primary font-black">Q:</span>
                    <span className="leading-snug">{item.question}</span>
                  </div>
                  {!item.loading && (
                    <button
                      onClick={() => copyFollowupAnswer(item.answer, idx)}
                      className="text-[10px] text-muted-foreground hover:text-foreground shrink-0"
                    >
                      {copiedFollowupIdx === idx ? '✓ Copied' : '📋 Copy'}
                    </button>
                  )}
                </div>

                {item.loading ? (
                  <div className="flex items-center gap-2 py-2 text-xs text-muted-foreground">
                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-foreground" />
                    <span>Thinking…</span>
                  </div>
                ) : (
                  <div className="text-xs leading-relaxed text-foreground">
                    <MarkdownView content={item.answer} />
                  </div>
                )}
              </Card>
            ))}
            <div ref={followupsEndRef} />
          </div>
        )}
      </div>
    </div>
  );
}
