import { useState, useRef, useEffect } from 'react';
import { supabase, isDemoMode, demoSession } from '../lib/supabase';
import { Button } from './ui/button';

const PROMPTS = ['Summarize in 3 bullets', 'Main arguments?', 'Quiz me', 'Explain simply', 'Key takeaways'];

export default function ChatTab({ pageContext, summaryData }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: `Analyzed ${pageContext.pageType || 'page'}. Ask anything about this page.`, timestamp: new Date() },
  ]);

  // keep greeting in sync when page changes without remount
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].role === 'assistant') {
        return [{ role: 'assistant', content: `Analyzed ${pageContext.pageType || 'page'}. Ask anything about this page.`, timestamp: new Date() }];
      }
      return prev;
    });
  }, [pageContext.pageType]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  async function getToken() {
    if (isDemoMode) return demoSession.access_token;
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token;
  }

  async function sendMessage(text = input) {
    if (!text.trim() || loading) {
      if (!text.trim()) setError('Enter a question');
      return;
    }
    setError('');
    const userMsg = { role: 'user', content: text, timestamp: new Date() };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput('');
    setLoading(true);
    try {
      const token = await getToken();
      const res = await fetch(`${import.meta.env.VITE_PROXY_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          messages: next.filter((m) => m.role !== 'system').map((m) => ({ role: m.role, content: m.content })),
          context: pageContext.content || (summaryData ? JSON.stringify(summaryData) : ''),
          pageType: pageContext.pageType,
          title: pageContext.title,
        }),
      });
      const data = await res.json();
      if (!res.ok && data.upgrade) {
        setMessages((prev) => [...prev, { role: 'assistant', content: `${data.error}: ${data.message}`, timestamp: new Date() }]);
        return;
      }
      if (!res.ok) throw new Error(data.error || 'Request failed');
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply, timestamp: new Date() }]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: 'assistant', content: `Error: ${err.message}`, timestamp: new Date() }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex gap-1.5 overflow-x-auto border-b border-border bg-muted/20 px-2 py-2 scrollbar-none">
        {PROMPTS.map((p) => (
          <Button key={p} variant="outline" size="sm" onClick={() => sendMessage(p)} disabled={loading} className="shrink-0 rounded-full text-xs">
            {p}
          </Button>
        ))}
      </div>

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
            <div className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-xs leading-5 shadow-sm ${m.role === 'user' ? 'rounded-br-sm bg-foreground text-background' : 'rounded-bl-sm border border-border bg-card text-foreground'}`}>
              {m.content.startsWith('Error:') ? <span className="font-medium text-destructive">{m.content}</span> : m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start animate-fade-in">
            <div className="flex items-center gap-2 rounded-2xl rounded-bl-sm border border-border bg-card px-3 py-2.5 text-xs text-muted-foreground shadow-sm">
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-foreground" aria-hidden />
              Generating response…
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-border bg-card p-3">
        <label htmlFor="chat-input" className="mb-1.5 block text-xs font-semibold">
          Ask about this page
        </label>
        <div className="flex gap-2">
          <input
            id="chat-input"
            ref={inputRef}
            value={input}
            onChange={(e) => { setInput(e.target.value); if (error) setError(''); }}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder="Type a question…"
            disabled={loading}
            className="flex h-9 w-full rounded-xl border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
            aria-describedby={error ? 'chat-error' : 'chat-hint'}
          />
          <Button onClick={() => sendMessage()} disabled={loading || !input.trim()} aria-label="Send" className="rounded-xl px-4 shadow-hard-sm">
            {loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> : 'Send'}
          </Button>
        </div>
        {error ? <p id="chat-error" className="mt-1.5 text-xs font-medium text-destructive" role="alert">{error}</p> : <p id="chat-hint" className="mt-1.5 text-xs text-muted-foreground">{loading ? 'Please wait…' : 'Press Enter to send • Shift+Enter for new line'}</p>}
      </div>
    </div>
  );
}
