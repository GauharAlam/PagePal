export default function TimelineTab({ timestamps, pageContext }) {
  async function jumpToTimestamp(timeStr) {
    if (pageContext.pageType !== 'youtube') return;

    const parts = timeStr.split(':').map(Number);
    let seconds = 0;
    if (parts.length === 2) seconds = parts[0] * 60 + parts[1];
    else if (parts.length === 3) seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      chrome.tabs.sendMessage(tab.id, { action: 'jumpToTime', seconds });
    } catch (err) {
      console.error('Failed to jump to timestamp:', err);
    }
  }

  if (!timestamps?.length) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 gap-4 animate-fade-in">
        <div className="text-5xl animate-float">⏱</div>
        <div>
          <p className="text-white font-bold text-base">No Timestamps Yet</p>
          <p className="text-gray-500 text-xs mt-1.5 leading-relaxed max-w-[240px]">
            {pageContext.pageType === 'youtube'
              ? 'Click Summarize on a YouTube video to auto-generate chapter timestamps.'
              : 'Timestamps are available for YouTube videos. Navigate to a video to see chapters.'}
          </p>
        </div>
        {pageContext.pageType !== 'youtube' && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-dark-700/50 border border-dark-500/30">
            <span className="text-sm">📺</span>
            <span className="text-[10px] text-gray-400">Works with YouTube videos</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="overflow-y-auto h-full p-3 flex flex-col gap-2 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="text-sm">📑</span>
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Chapters & Timestamps</h3>
        </div>
        <span className="text-[10px] text-gray-600">{timestamps.length} chapters</span>
      </div>

      {/* Timeline Line */}
      <div className="relative">
        <div className="absolute left-[19px] top-0 bottom-0 w-px bg-gradient-to-b from-purple-600/50 via-indigo-500/30 to-transparent" />

        {timestamps.map((ts, i) => (
          <button
            key={i}
            onClick={() => jumpToTimestamp(ts.time)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-dark-700/30 border border-dark-500/20 hover:bg-dark-600/50 hover:border-purple-700/50 transition-all text-left w-full group relative mb-2 btn-hover-lift animate-slide-up"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            {/* Timeline Dot */}
            <div className="w-2.5 h-2.5 rounded-full bg-purple-600 border-2 border-dark-900 z-10 shrink-0 group-hover:bg-purple-400 group-hover:shadow-[0_0_8px_rgba(124,58,237,0.5)] transition-all" />

            {/* Time Badge */}
            <span className="text-purple-400 font-bold text-xs min-w-[44px] font-mono bg-purple-500/10 px-1.5 py-0.5 rounded-md text-center group-hover:bg-purple-500/20 transition-all">
              {ts.time}
            </span>

            {/* Label */}
            <span className="text-gray-300 text-sm flex-1 group-hover:text-white transition-colors">
              {ts.label}
            </span>

            {/* Play Icon */}
            <span className="text-gray-600 text-xs group-hover:text-purple-400 transition-all opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0">
              ▶
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
