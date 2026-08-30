import { useState } from 'react';
import { supabase, isDemoMode, demoSession } from '../lib/supabase';
import { Button } from './ui/button';
import { Card } from './ui/card';

const TOOLS = [
  { title: 'Export notes', desc: 'Save summary as Markdown', action: 'export', pro: false },
  { title: 'Translate', desc: 'Translate to 50+ languages', action: 'translate', pro: true },
  { title: 'Quiz', desc: '5 MCQs from this page', action: 'quiz', pro: true },
  { title: 'Mind map', desc: 'Visualize concepts (soon)', action: 'mindmap', pro: true },
  { title: 'Explain selection', desc: 'Explain highlighted text', action: 'selection', pro: false },
  { title: 'Share', desc: 'Shareable link (soon)', action: 'share', pro: true },
];

const LANGUAGES = ['Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Chinese', 'Japanese', 'Korean', 'Hindi', 'Arabic', 'Russian', 'Turkish', 'Dutch', 'Swedish', 'Polish'];

export default function ToolsTab({ summaryData, pageContext, userPlan, rawContent }) {
  const isPro = userPlan?.plan === 'pro';
  const [active, setActive] = useState(null);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [selectedLang, setSelectedLang] = useState('');

  async function getToken() {
    if (isDemoMode) return demoSession.access_token;
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token;
  }

  async function handleTool(action) {
    if (!summaryData && action !== 'selection' && action !== 'export') {
      setResult({ type: 'empty' });
      return;
    }
    const proActions = ['translate', 'quiz', 'mindmap', 'share'];
    if (proActions.includes(action) && !isPro && !isDemoMode) {
      setResult({ type: 'upgrade-required', action });
      return;
    }
    const token = await getToken();

    if (action === 'export') {
      const content = `# ${pageContext.title}\n\n## Summary\n${summaryData?.summary || 'No summary'}\n\n## Key points\n${summaryData?.keyPoints?.map((p) => `- ${p}`).join('\n') || '- none'}\n\n---\n*PagePal AI*`;
      const blob = new Blob([content], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(pageContext.title || 'pagepal').slice(0, 40).replace(/[^a-zA-Z0-9]/g, '_')}.md`;
      a.click();
      URL.revokeObjectURL(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      return;
    }

    if (action === 'selection') {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const results = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: () => window.getSelection()?.toString() || '' });
        const text = results[0]?.result;
        setResult({ type: 'selection', data: text || null });
      } catch {
        setResult({ type: 'selection', data: null });
      }
      return;
    }

    if (action === 'translate') {
      setResult({ type: 'translate-picker' });
      return;
    }

    if (action === 'quiz') {
      setActive('quiz');
      try {
        const effectiveContent = rawContent || JSON.stringify(summaryData);
        const res = await fetch(`${import.meta.env.VITE_PROXY_URL}/api/quiz`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ content: effectiveContent, title: pageContext.title }),
        });
        const data = await res.json();
        if (!res.ok && data.upgrade) { setResult({ type: 'upgrade-required', action: 'quiz', message: data.message }); return; }
        setResult({ type: 'quiz', data: data.questions });
      } catch {
        setResult({ type: 'quiz', data: [] });
      } finally {
        setActive(null);
      }
      return;
    }

    setResult({ type: 'coming-soon', action });
  }

  async function handleTranslate(lang) {
    setSelectedLang(lang);
    setTranslating(true);
    try {
      const token = await getToken();
      const res = await fetch(`${import.meta.env.VITE_PROXY_URL}/api/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ text: `Summary: ${summaryData?.summary}\n\nKey points:\n${summaryData?.keyPoints?.join('\n')}`, targetLanguage: lang }),
      });
      const data = await res.json();
      if (!res.ok && data.upgrade) { setResult({ type: 'upgrade-required', action: 'translate', message: data.message }); return; }
      if (data.error) throw new Error(data.error);
      setResult({ type: 'translation', data: data.translation, lang });
    } catch (err) {
      setResult({ type: 'translation', data: `Failed: ${err.message}`, lang });
    } finally {
      setTranslating(false);
    }
  }

  if (result?.type === 'quiz') return <QuizView questions={result.data} onBack={() => setResult(null)} />;
  if (result?.type === 'empty') {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-sm font-medium">No summary yet</p>
        <p className="text-xs leading-5 text-muted-foreground">Summarize the page first. Open an article, then click Summarize.</p>
        <Button variant="outline" size="sm" onClick={() => setResult(null)}>Back</Button>
      </div>
    );
  }
  if (result?.type === 'translate-picker') {
    return (
      <div className="flex h-full flex-col gap-3 overflow-y-auto p-3 animate-fade-in">
        <Button variant="ghost" size="sm" onClick={() => setResult(null)} className="self-start rounded-full">← Back</Button>
        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Select language</span>
        {translating && <span className="flex items-center gap-2 text-xs text-muted-foreground"><span className="h-3 w-3 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-foreground" /> Translating to {selectedLang}…</span>}
        <div className="grid grid-cols-2 gap-2">
          {LANGUAGES.map((lang) => (
            <button
              key={lang}
              onClick={() => handleTranslate(lang)}
              disabled={translating}
              className={`rounded-xl border p-3 text-left text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${selectedLang === lang && translating ? 'border-foreground bg-foreground text-background' : 'border-border bg-card hover:bg-accent hover:text-foreground'}`}
            >
              {lang}
            </button>
          ))}
        </div>
      </div>
    );
  }
  if (result?.type === 'translation') {
    return (
      <div className="flex h-full flex-col gap-3 overflow-y-auto p-3 animate-fade-in">
        <Button variant="ghost" size="sm" onClick={() => setResult(null)} className="self-start rounded-full">← Back</Button>
        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Translated to {result.lang}</span>
        <Card className="rounded-xl p-4 shadow-sm"><p className="whitespace-pre-wrap text-sm leading-6">{result.data}</p></Card>
      </div>
    );
  }
  if (result?.type === 'selection') {
    return (
      <div className="flex h-full flex-col gap-3 overflow-y-auto p-3 animate-fade-in">
        <Button variant="ghost" size="sm" onClick={() => setResult(null)} className="self-start rounded-full">← Back</Button>
        <Card className="rounded-xl p-4">
          {result.data ? <p className="text-sm leading-6">{result.data}</p> : <p className="text-sm text-muted-foreground">No text selected. Highlight text on the page, then try again.</p>}
        </Card>
      </div>
    );
  }
  if (result?.type === 'upgrade-required') {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center animate-fade-in">
        <span className="rounded-full border border-warning bg-warning/10 px-3 py-1 text-xs font-semibold text-warning">Pro required</span>
        <p className="max-w-[260px] text-sm font-medium leading-5">{result.message || 'Upgrade to Pro to use this tool.'}</p>
        <Button
          className="rounded-full shadow-hard-sm"
          onClick={async () => {
            const token = await getToken();
            const r = await fetch(`${import.meta.env.VITE_PROXY_URL}/api/billing/create-checkout`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
            const d = await r.json();
            if (d.url) window.open(d.url, '_blank');
          }}
        >
          Upgrade — $9/mo
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setResult(null)} className="rounded-full">Back</Button>
      </div>
    );
  }
  if (result?.type === 'coming-soon') {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center animate-fade-in">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-muted text-lg">⬔</div>
        <p className="text-sm font-semibold">Coming soon</p>
        <p className="text-xs leading-5 text-muted-foreground">This tool will be available soon. Stay tuned!</p>
        <Button variant="outline" size="sm" onClick={() => setResult(null)} className="rounded-full">Back</Button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto p-3 animate-fade-in">
      <div className="flex flex-col gap-2">
        {TOOLS.map((t) => {
          const isDisabled = (!summaryData && t.action !== 'selection' && t.action !== 'export') || active === t.action;
          const proDisabled = t.pro && !isPro && !isDemoMode;
          return (
            <div key={t.action} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-sm transition-colors hover:bg-accent/30">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold">{t.title}</span>
                  {t.pro && <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">Pro</span>}
                </div>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">{t.desc}</p>
                {isDisabled && !summaryData && t.action !== 'selection' && t.action !== 'export' && <p className="mt-1 text-xs font-medium text-destructive">Summarize first</p>}
              </div>
              <Button
                variant={proDisabled ? 'outline' : 'secondary'}
                size="sm"
                disabled={!!active}
                onClick={() => handleTool(t.action)}
                className="shrink-0 rounded-full"
              >
                {active === t.action ? <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden /> : proDisabled ? 'Pro' : 'Open'}
              </Button>
            </div>
          );
        })}
      </div>
      {copied && <div className="rounded-full border border-success bg-success/10 px-3 py-2 text-center text-xs font-semibold text-success animate-fade-in">Notes exported ✓</div>}
    </div>
  );
}

function QuizView({ questions, onBack }) {
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  if (!questions?.length) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="text-sm font-medium">Quiz failed</p>
        <p className="text-xs text-muted-foreground">Could not generate questions. Try different content.</p>
        <Button variant="outline" size="sm" onClick={onBack}>Back</Button>
      </div>
    );
  }

  function choose(opt) {
    if (selected !== null) return;
    setSelected(opt);
    if (opt === questions[current].answer) setScore((s) => s + 1);
    // auto-advance after 1.2s so user can read explanation; manual Next also available
    setTimeout(() => {
      if (current + 1 < questions.length) { setCurrent((c) => c + 1); setSelected(null); }
      else setDone(true);
    }, 1200);
  }

    const q = questions[current];

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-3 animate-fade-in">
      <Button variant="ghost" size="sm" onClick={onBack} className="self-start rounded-full">← Back</Button>
      {!done ? (
        <>
          <div className="flex items-center gap-3">
            <div className="h-2 flex-1 overflow-hidden rounded-full border border-border bg-muted">
              <div className="h-full bg-foreground transition-all duration-300" style={{ width: `${((current + 1) / questions.length) * 100}%` }} />
            </div>
            <span className="rounded-full bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">{current + 1}/{questions.length}</span>
          </div>
          <p className="text-sm font-semibold leading-6">{q.q}</p>
          <div className="flex flex-col gap-2">
            {q.options.map((opt, idx) => {
              let cls = 'border-border bg-card hover:bg-accent hover:text-foreground';
              if (selected !== null) {
                if (opt === q.answer) cls = 'border-success bg-success/10 text-success';
                else if (opt === selected) cls = 'border-destructive bg-destructive/10 text-destructive';
                else cls = 'border-border bg-card opacity-60';
              }
              return (
                <button key={idx} onClick={() => choose(opt)} disabled={selected !== null} className={`rounded-xl border p-3 text-left text-xs leading-5 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${cls}`}>
                  <span className="mr-2 font-bold">{String.fromCharCode(65 + idx)}.</span>{opt}
                </button>
              );
            })}
          </div>
          {selected !== null && q.explanation && (
            <Card className="rounded-xl p-3 animate-fade-in">
              <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Explanation</div>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">{q.explanation}</p>
              <Button variant="outline" size="sm" className="mt-3 w-full rounded-full" onClick={() => { if (current + 1 < questions.length) { setCurrent((c) => c + 1); setSelected(null); } else setDone(true); }}>
                {current + 1 < questions.length ? 'Next question →' : 'See results'}
              </Button>
            </Card>
          )}
          {selected === null && (
            <p className="text-center text-xs text-muted-foreground">Select an answer • Auto-advances after 1.2s or tap Next</p>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center gap-4 py-8 text-center animate-fade-in">
          <span className={`rounded-full border px-4 py-1.5 text-sm font-bold ${score >= 4 ? 'border-success bg-success/10 text-success' : score >= 2 ? 'border-warning bg-warning/10 text-warning' : 'border-destructive bg-destructive/10 text-destructive'}`}>
            {score} / {questions.length}
          </span>
          <p className="text-xs font-medium text-muted-foreground">{score >= 4 ? 'Excellent work! 🎉' : score >= 2 ? 'Good effort — keep going!' : 'Keep studying — you got this'}</p>
          <div className="flex gap-2">
            <Button onClick={() => { setCurrent(0); setSelected(null); setScore(0); setDone(false); }} className="rounded-full">Try again</Button>
            <Button variant="outline" onClick={onBack} className="rounded-full">Back to tools</Button>
          </div>
        </div>
      )}
    </div>
  );
}
