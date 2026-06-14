const PAGE_TYPE_CONFIG = {
  youtube: {
    icon: '📺',
    label: 'YouTube Video',
    color: 'from-red-500/20 to-red-600/10',
    textColor: 'text-red-400',
    borderColor: 'border-red-500/30',
    dotColor: 'bg-red-500',
  },
  article: {
    icon: '📰',
    label: 'Article',
    color: 'from-blue-500/20 to-blue-600/10',
    textColor: 'text-blue-400',
    borderColor: 'border-blue-500/30',
    dotColor: 'bg-blue-500',
  },
  pdf: {
    icon: '📄',
    label: 'PDF Document',
    color: 'from-orange-500/20 to-orange-600/10',
    textColor: 'text-orange-400',
    borderColor: 'border-orange-500/30',
    dotColor: 'bg-orange-500',
  },
  general: {
    icon: '🌐',
    label: 'Web Page',
    color: 'from-purple-500/20 to-purple-600/10',
    textColor: 'text-purple-400',
    borderColor: 'border-purple-500/30',
    dotColor: 'bg-purple-500',
  },
  selection: {
    icon: '✂️',
    label: 'Selection',
    color: 'from-green-500/20 to-green-600/10',
    textColor: 'text-green-400',
    borderColor: 'border-green-500/30',
    dotColor: 'bg-green-500',
  }
};

export default function ContextBar({ pageType, title }) {
  const config = PAGE_TYPE_CONFIG[pageType] || PAGE_TYPE_CONFIG.general;

  return (
    <div className="px-4 py-2.5">
      <div className={`flex items-center gap-3 px-3 py-2 rounded-xl bg-gradient-to-r ${config.color} border ${config.borderColor} transition-all animate-fade-in`}>
        {/* Type Badge */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className={`w-2 h-2 rounded-full ${config.dotColor} animate-pulse-soft`} />
          <span className={`text-[10px] font-bold uppercase tracking-wider ${config.textColor}`}>
            {config.label}
          </span>
        </div>

        {/* Separator */}
        <div className="w-px h-4 bg-dark-500/50" />

        {/* Title */}
        <p className="text-xs text-gray-400 truncate flex-1" title={title}>
          {title || 'Detecting page...'}
        </p>
      </div>
    </div>
  );
}
