const QUICK_ACTIONS = [
  { icon: '📝', label: 'Summarize', action: 'summarize' },
  { icon: '❓', label: 'Q&A', action: 'qa' },
  { icon: '🌐', label: 'Translate', action: 'translate' },
  { icon: '📤', label: 'Export', action: 'export' },
];

export default function Footer({ onQuickAction }) {
  return (
    <footer className="border-t border-dark-500/30 px-3 py-2">
      {/* Quick Actions */}
      <div className="flex justify-center gap-1 mb-2">
        {QUICK_ACTIONS.map(action => (
          <button
            key={action.action}
            onClick={() => onQuickAction(action.action)}
            className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-gray-500 hover:text-purple-400 hover:bg-dark-700/50 transition-all"
            title={action.label}
          >
            <span className="text-sm">{action.icon}</span>
            <span className="text-[9px] font-medium">{action.label}</span>
          </button>
        ))}
      </div>

      {/* Branding */}
      <div className="flex items-center justify-center gap-1.5">
        <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse-soft" />
        <p className="text-[9px] text-gray-600">
          Powered by <span className="gradient-text font-semibold">PagePal AI</span> · v1.0.0
        </p>
      </div>
    </footer>
  );
}
