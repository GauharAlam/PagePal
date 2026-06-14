export default function SummaryTab({ data, loading, pageContext }) {
  if (loading) {
    return (
      <div className="overflow-y-auto h-full p-4 flex flex-col gap-4">
        {/* Skeleton Summary */}
        <div className="space-y-3 animate-fade-in">
          <div className="h-4 w-24 shimmer-bg rounded-lg" />
          <div className="space-y-2">
            <div className="h-3 w-full shimmer-bg rounded-lg" />
            <div className="h-3 w-5/6 shimmer-bg rounded-lg" />
            <div className="h-3 w-4/6 shimmer-bg rounded-lg" />
          </div>
        </div>

        {/* Skeleton Key Points */}
        <div className="space-y-3">
          <div className="h-4 w-28 shimmer-bg rounded-lg" />
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex gap-2 items-start">
              <div className="w-5 h-5 shimmer-bg rounded-full shrink-0 mt-0.5" />
              <div className="h-3 shimmer-bg rounded-lg flex-1" />
            </div>
          ))}
        </div>

        {/* Skeleton Stats */}
        <div className="flex gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex-1 h-16 shimmer-bg rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 gap-4 animate-fade-in">
        <div className="text-5xl animate-float">📋</div>
        <div>
          <p className="text-white font-bold text-base">Ready to Analyze</p>
          <p className="text-gray-500 text-xs mt-1.5 leading-relaxed max-w-[240px]">
            Sign in and navigate to any page to get an AI-powered summary with key insights.
          </p>
        </div>
        <div className="flex gap-2 mt-2">
          {['YouTube', 'Articles', 'PDFs'].map(type => (
            <span key={type} className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-dark-700 border border-dark-500 text-gray-400">
              {type}
            </span>
          ))}
        </div>
      </div>
    );
  }

  const sentimentConfig = {
    positive: { emoji: '😊', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30' },
    neutral: { emoji: '😐', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' },
    negative: { emoji: '😟', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' },
  };

  const sentiment = sentimentConfig[data.sentiment] || sentimentConfig.neutral;

  return (
    <div className="overflow-y-auto h-full p-4 flex flex-col gap-4 animate-fade-in">
      {/* Summary Card */}
      <div className="glass rounded-xl p-4 glow-purple">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse-soft" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-purple-400">Summary</h3>
        </div>
        <p className="text-sm text-gray-200 leading-relaxed">{data.summary}</p>
      </div>

      {/* Key Points */}
      {data.keyPoints?.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm">🎯</span>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Key Points</h3>
          </div>
          <div className="space-y-2">
            {data.keyPoints.map((point, i) => (
              <div
                key={i}
                className="flex gap-3 items-start p-2.5 rounded-xl bg-dark-700/50 border border-dark-500/30 hover:border-purple-700/50 transition-all animate-slide-up"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[9px] font-bold text-white">{i + 1}</span>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed flex-1">{point}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-2">
        <StatCard
          icon={sentiment.emoji}
          label="Sentiment"
          value={data.sentiment}
          className={`${sentiment.bg} ${sentiment.border}`}
          textColor={sentiment.color}
        />
        <StatCard
          icon="⏱"
          label="Read Time"
          value={data.readingTime || 'N/A'}
          className="bg-blue-500/10 border-blue-500/30"
          textColor="text-blue-400"
        />
        <StatCard
          icon="🌍"
          label="Language"
          value={data.language || 'EN'}
          className="bg-purple-500/10 border-purple-500/30"
          textColor="text-purple-400"
        />
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, className, textColor }) {
  return (
    <div className={`rounded-xl p-2.5 border text-center ${className} transition-all hover:scale-[1.02]`}>
      <div className="text-lg mb-0.5">{icon}</div>
      <p className={`text-[10px] font-bold uppercase tracking-wider ${textColor}`}>{value}</p>
      <p className="text-[9px] text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}
