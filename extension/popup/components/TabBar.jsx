const TABS = [
  { id: 'summary', label: 'Summary', icon: '◧' },
  { id: 'chat', label: 'Chat', icon: '◨' },
  { id: 'timeline', label: 'Timeline', icon: '◫' },
  { id: 'tools', label: 'Tools', icon: '⬔' },
  { id: 'keys', label: 'Keys', icon: '⚿' },
];

export default function TabBar({ activeTab, onChange }) {
  return (
    <div className="border-b border-border/50 bg-background px-3 py-2.5">
      <div role="tablist" aria-label="Sections" className="flex gap-1.5 overflow-x-auto scrollbar-none">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              aria-controls={`panel-${tab.id}`}
              id={`tab-${tab.id}`}
              onClick={() => onChange(tab.id)}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 ${
                isActive
                  ? 'border-foreground bg-foreground text-background shadow-hard-sm'
                  : 'border-border bg-card text-muted-foreground hover:border-foreground/20 hover:bg-accent hover:text-foreground'
              }`}
            >
              <span aria-hidden className="text-[10px] opacity-70">{tab.icon}</span>
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
