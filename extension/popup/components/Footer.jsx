const ACTIONS = [
  { label: 'Summarize', action: 'summarize' },
  { label: 'Ask', action: 'qa' },
  { label: 'Keys', action: 'keys' },
  { label: 'Export', action: 'export' },
];

const ACTION_ICONS = { summarize: '◧', qa: '◨', keys: '⚿', export: '⬆' };

export default function Footer({ onQuickAction, activeTab }) {
  return (
    <footer className="border-t border-border bg-card px-2 py-2">
      <div className="flex gap-1">
        {ACTIONS.map((a) => {
          const isActive = (a.action === 'summarize' && activeTab === 'summary') || (a.action === 'qa' && activeTab === 'chat') || (a.action === 'keys' && activeTab === 'keys') || (a.action === 'export' && activeTab === 'tools');
          return (
            <button
              key={a.action}
              onClick={() => onQuickAction(a.action)}
              className={`flex flex-1 items-center justify-center gap-1 rounded-full border px-2 py-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${
                isActive ? 'border-foreground bg-foreground text-background' : 'border-transparent text-muted-foreground hover:bg-accent hover:text-foreground'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <span aria-hidden className="text-[10px]">{ACTION_ICONS[a.action]}</span>
              {a.label}
            </button>
          );
        })}
      </div>
      <div className="mt-2 flex justify-center gap-2 border-t border-border/50 pt-2 text-[11px] text-muted-foreground">
        <span>PagePal v1.0.0</span>
        <span className="h-3 w-px bg-border" aria-hidden />
        <span>5 models • Pro or BYOK</span>
      </div>
    </footer>
  );
}
