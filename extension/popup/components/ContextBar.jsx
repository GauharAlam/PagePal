const LABELS = {
  youtube: 'YouTube',
  article: 'Article',
  pdf: 'PDF',
  general: 'Page',
  selection: 'Selection',
};

export default function ContextBar({ pageType, title }) {
  const label = LABELS[pageType] || LABELS.general;
  return (
    <div className="border-b border-border bg-muted/30 px-3 py-2">
      <div className="flex items-center gap-2.5">
        <span className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-semibold uppercase tracking-widest shadow-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
          {label}
        </span>
        <span className="h-3 w-px bg-border/60" aria-hidden />
        <span className="flex-1 truncate text-xs font-medium text-muted-foreground" title={title}>
          {title || 'Detecting page…'}
        </span>
      </div>
    </div>
  );
}
