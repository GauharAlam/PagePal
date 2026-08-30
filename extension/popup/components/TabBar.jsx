const TABS = [
  { id: 'summary', label: 'Summary', icon: '◧' },
  { id: 'chat', label: 'Chat', icon: '💬' },
  { id: 'timeline', label: 'Chapters', icon: '⏱' },
  { id: 'tools', label: 'Tools', icon: '🛠' },
  { id: 'keys', label: 'API Keys', icon: '🔑' },
];

export default function TabBar({ activeTab, onChange }) {
  return (
    <div className="border-b border-border/40 bg-muted/20 px-2 py-1.5">
      <div role="tablist" aria-label="Sections" className="flex items-center gap-1 rounded-xl bg-muted/50 p-1">
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
              className={`flex flex-1 items-center justify-center gap-1 rounded-lg py-1.5 text-[11px] font-bold transition-all ${
                isActive
                  ? 'bg-card text-foreground shadow-sm border border-border/40'
                  : 'text-muted-foreground hover:text-foreground hover:bg-card/40'
              }`}
            >
              <span className="text-[10px]">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
