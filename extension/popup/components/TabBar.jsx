const TABS = [
  { id: 'summary', label: 'Summary', icon: '📋' },
  { id: 'chat', label: 'Chat', icon: '💬' },
  { id: 'timeline', label: 'Timeline', icon: '⏱' },
  { id: 'tools', label: 'Tools', icon: '🛠' },
];

export default function TabBar({ activeTab, onChange }) {
  return (
    <div className="px-4 pb-2">
      <div className="flex bg-dark-700/50 rounded-xl p-1 border border-dark-500/30">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-purple-600/80 to-indigo-600/80 text-white shadow-lg glow-purple'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-dark-600/50'
              }`}
            >
              <span className="text-sm">{tab.icon}</span>
              <span className={isActive ? 'font-semibold' : ''}>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
