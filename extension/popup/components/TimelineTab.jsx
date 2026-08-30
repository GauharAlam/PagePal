import { Button } from './ui/button';

export default function TimelineTab({ timestamps, pageContext }) {
  async function jumpTo(timeStr) {
    if (pageContext.pageType !== 'youtube') return;
    const parts = timeStr.split(':').map(Number);
    let seconds = 0;
    if (parts.length === 2) seconds = parts[0] * 60 + parts[1];
    else if (parts.length === 3) seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      chrome.tabs.sendMessage(tab.id, { action: 'jumpToTime', seconds });
    } catch {}
  }

  if (!timestamps?.length) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center animate-fade-in">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-muted text-lg">◫</div>
        <h3 className="font-heading text-sm font-bold">No chapters yet</h3>
        <p className="max-w-[240px] text-xs leading-5 text-muted-foreground">
          {pageContext.pageType === 'youtube' ? 'Summarize this YouTube video to generate chapters.' : 'Chapters are available for YouTube videos.'}
        </p>
        {pageContext.pageType !== 'youtube' && <span className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">Works with YouTube</span>}
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto p-3 animate-fade-in">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Chapters</span>
        <span className="rounded-full bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">{timestamps.length} items</span>
      </div>
      <div className="flex flex-col gap-2">
        {timestamps.map((ts, i) => (
          <button
            key={i}
            onClick={() => jumpTo(ts.time)}
            aria-label={`Jump to ${ts.time} ${ts.label}`}
            className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 text-left shadow-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <span className="rounded-full border border-border bg-background px-2.5 py-1 font-mono text-xs font-semibold">{ts.time}</span>
            <span className="flex-1 text-xs font-medium leading-5">{ts.label}</span>
            <span className="rounded-full bg-foreground px-2.5 py-1 text-xs font-semibold text-background">Jump</span>
          </button>
        ))}
      </div>
    </div>
  );
}
