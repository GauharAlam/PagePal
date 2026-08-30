import { useState, useEffect } from 'react';

const MODELS = [
  { id: 'claude-sonnet-4-6', name: 'Claude 4', provider: 'Anthropic', icon: '🧠', tag: 'Pro Default' },
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI', icon: '⚡', tag: 'Fast' },
  { id: 'google/gemini-flash-1.5', name: 'Gemini Flash', provider: 'Google', icon: '✦', tag: '1M Context' },
  { id: 'deepseek/deepseek-chat', name: 'DeepSeek', provider: 'DeepSeek', icon: '🔍', tag: 'Code & Logic' },
  { id: 'z-ai/glm-4.5', name: 'GLM 4.5', provider: 'Zhipu', icon: '🤖', tag: 'OpenRouter' },
];

export default function ModelSelector({ currentModel, onSelectModel }) {
  const [open, setOpen] = useState(false);
  const selected = MODELS.find((m) => m.id === currentModel) || MODELS[0];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-xs font-semibold shadow-xs transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        aria-label="Select AI Model"
        aria-expanded={open}
      >
        <span className="text-xs" aria-hidden>{selected.icon}</span>
        <span className="font-bold text-foreground">{selected.name}</span>
        <span className="text-[10px] text-muted-foreground">▾</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-9 z-50 w-52 animate-fade-in rounded-xl border-2 border-border bg-card p-1.5 shadow-hard">
            <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Select AI Model
            </div>
            <div className="flex flex-col gap-1 mt-1">
              {MODELS.map((m) => {
                const isSelected = m.id === selected.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => {
                      onSelectModel(m.id);
                      setOpen(false);
                    }}
                    className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors ${
                      isSelected
                        ? 'bg-primary/20 font-bold text-foreground border border-primary/40'
                        : 'hover:bg-accent text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span aria-hidden>{m.icon}</span>
                      <div>
                        <div className="font-bold leading-none">{m.name}</div>
                        <span className="text-[9px] text-muted-foreground">{m.provider}</span>
                      </div>
                    </div>
                    <span className="text-[9px] font-medium rounded-full bg-muted px-1.5 py-0.5">
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
