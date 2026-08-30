import { useState } from 'react';

export const OPENROUTER_FREE_MODELS = [
  { id: 'openrouter/free', name: 'Auto (Best Free)', provider: 'OpenRouter', icon: '✨', tag: '⚡ Smart Auto-Route', default: true },
  { id: 'google/gemma-4-31b-it:free', name: 'Gemma 4 31B', provider: 'Google', icon: '✦', tag: '🔥 Flagship 31B' },
  { id: 'google/gemma-4-26b-a4b-it:free', name: 'Gemma 4 26B', provider: 'Google', icon: '✦', tag: '⚡ Fast & Smart' },
  { id: 'z-ai/glm-5.2:free', name: 'GLM 5.2', provider: 'Z.ai', icon: '🤖', tag: '🧠 Logic & Coding' },
  { id: 'nvidia/nemotron-3.5-lightning:free', name: 'Nemotron 3.5', provider: 'NVIDIA', icon: '⚡', tag: '1M Context' },
  { id: 'nvidia/nemotron-3-ultra-550b-a55b:free', name: 'Nemotron 3 Ultra', provider: 'NVIDIA', icon: '⚡', tag: '550B Ultra MoE' },
  { id: 'minimax/minimax-m3:free', name: 'MiniMax M3', provider: 'MiniMax', icon: '🧠', tag: '1M Context' },
  { id: 'cohere/north-mini-code:free', name: 'Cohere North', provider: 'Cohere', icon: '💻', tag: '💻 Code & Tech' },
  { id: 'thinkingmachines/inkling:free', name: 'Inkling Reasoning', provider: 'ThinkingMachines', icon: '💭', tag: '🧠 Deep Reasoning' },
  { id: 'liquid/lfm-2.5-2.6b:free', name: 'Liquid LFM 2.5', provider: 'LiquidAI', icon: '⏱️', tag: '⚡ Low Latency' },
  { id: 'dots-studio/dots-3-note-preview:free', name: 'Dots 3 Note', provider: 'DotsStudio', icon: '📝', tag: '📄 Long Notes' },
];

export const DEFAULT_MODEL_ID = 'openrouter/free';

export default function ModelSelector({ currentModel, onSelectModel }) {
  const [open, setOpen] = useState(false);
  const selected = OPENROUTER_FREE_MODELS.find((m) => m.id === currentModel) || OPENROUTER_FREE_MODELS[0];

  return (
    <div className="relative z-50">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-full border border-black/10 dark:border-white/15 bg-white/40 dark:bg-white/10 px-2.5 py-1 text-xs font-semibold shadow-xs backdrop-blur-md transition-colors hover:bg-accent/80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        aria-label="Select AI Model"
        aria-expanded={open}
      >
        <span className="text-xs" aria-hidden>{selected.icon}</span>
        <span className="font-bold text-foreground max-w-[90px] truncate">{selected.name}</span>
        <span className="rounded bg-emerald-500/15 px-1 py-0.2 text-[9px] font-bold text-emerald-600 dark:text-emerald-400">FREE</span>
        <span className="text-[10px] text-muted-foreground">▾</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-50 bg-black/10 dark:bg-black/40 backdrop-blur-xs" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-9 z-50 w-64 max-h-80 overflow-y-auto animate-fade-in rounded-2xl border border-border/80 bg-card/95 p-2 shadow-2xl backdrop-blur-2xl">
            <div className="flex items-center justify-between px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border/40 pb-1">
              <span>OpenRouter Free Models</span>
              <span className="text-[9px] text-emerald-500 font-bold">100% Free</span>
            </div>
            <div className="flex flex-col gap-1 mt-1">
              {OPENROUTER_FREE_MODELS.map((m) => {
                const isSelected = m.id === selected.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => {
                      onSelectModel(m.id);
                      setOpen(false);
                    }}
                    className={`flex items-center justify-between rounded-xl px-2.5 py-2 text-left text-xs transition-colors ${
                      isSelected
                        ? 'bg-primary/20 font-bold text-foreground border border-primary/50'
                        : 'hover:bg-accent/70 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm shrink-0" aria-hidden>{m.icon}</span>
                      <div className="min-w-0">
                        <div className="font-bold leading-tight text-foreground truncate">{m.name}</div>
                        <span className="text-[9px] text-muted-foreground">{m.provider}</span>
                      </div>
                    </div>
                    <span className="text-[9px] font-medium rounded-full bg-muted/80 px-1.5 py-0.5 shrink-0 ml-1 text-muted-foreground">
                      {m.tag}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
