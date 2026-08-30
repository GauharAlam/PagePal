import { useState, useRef, useEffect } from 'react';
import { supabase, isDemoMode, demoSession } from '../lib/supabase';
import { Button } from './ui/button';
import MarkdownView from './ui/MarkdownView';

const PROMPTS = ['Summarize in 3 bullets', 'Main arguments?', 'Quiz me', 'Explain simply', 'Key takeaways'];

export default function ChatTab({ pageContext, summaryData, user }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: `Analyzed ${pageContext.pageType || 'page'}. Ask anything about this page.`, timestamp: new Date() },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedIdx, setCopiedIdx] = useState(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Load chat history from Supabase when pageContext.url changes
  useEffect(() => {
    async function loadChatHistory() {
      if (isDemoMode || !user || !pageContext.url) return;
      try {
        const { data, error: dbErr } = await supabase
          .from('chat_history')
          .select('messages')
          .eq('user_id', user.id)
          .eq('page_url', pageContext.url)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (data?.messages && Array.isArray(data.messages) && data.messages.length > 0) {
          setMessages(data.messages);
        } else {
          setMessages([
            { role: 'assistant', content: `Analyzed ${pageContext.pageType || 'page'}. Ask anything about this page.`, timestamp: new Date() },
          ]);
        }
      } catch (err) {
        console.warn('Could not load chat history', err);
      }
    }
    loadChatHistory();
  }, [pageContext.url, user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function getToken() {
    if (isDemoMode) return demoSession.access_token;
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token;
  }

  // Save chat history to Supabase
  async function persistChat(newMessages) {
    if (isDemoMode || !user || !pageContext.url) return;
    try {
      await supabase.from('chat_history').upsert({
        user_id: user.id,
        page_url: pageContext.url,
        page_title: pageContext.title,
        messages: newMessages,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,page_url' });
    } catch (err) {
      console.warn('Failed to persist chat history', err);
    }
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
        const upgradeMsg = { role: 'assistant', content: `⚠️ ${data.error}: ${data.message}`, timestamp: new Date() };
        const updated = [...next, upgradeMsg];
        setMessages(updated);
        persistChat(updated);
        return;
      }
      if (!res.ok) throw new Error(data.error || 'Request failed');

      const assistantMsg = { role: 'assistant', content: data.reply, timestamp: new Date() };
      const updated = [...next, assistantMsg];
      setMessages(updated);
      persistChat(updated);
    } catch (err) {
      const errorMsg = { role: 'assistant', content: `Error: ${err.message}`, timestamp: new Date() };
      const updated = [...next, errorMsg];
      setMessages(updated);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleClearChat() {
    const initial = [{ role: 'assistant', content: `Analyzed ${pageContext.pageType || 'page'}. Ask anything about this page.`, timestamp: new Date() }];
    setMessages(initial);
    persistChat(initial);
  }

  function copyMessage(text, idx) {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header controls with quick prompts and clear button */}
      <div className="flex items-center justify-between border-b border-border bg-muted/20 px-2 py-1.5">
        <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
          {PROMPTS.map((p) => (
            <Button
              key={p}
              variant="outline"
              size="sm"
              onClick={() => sendMessage(p)}
              disabled={loading}
              className="shrink-0 rounded-full text-[11px] h-6 px-2.5"
            >
              {p}
            </Button>
          ))}
        </div>
        {messages.length > 1 && (
          <button
            onClick={handleClearChat}
            className="shrink-0 text-[10px] text-muted-foreground hover:text-foreground underline pl-2"
            title="Clear chat history"
          >
            Clear
          </button>
        )}
      </div>

      {/* Messages list */}
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in group`}>
            <div
              className={`relative max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-5 shadow-sm ${
                m.role === 'user'
                  ? 'rounded-br-sm bg-foreground text-background'
                  : 'rounded-bl-sm border border-border bg-card text-foreground'
              }`}
            >
              {m.role === 'assistant' ? (
                <div>
                  <MarkdownView content={m.content} />
                  <div className="mt-1 flex items-center justify-end gap-2 pt-1 border-t border-border/40 text-[10px] text-muted-foreground">
                    <button
                      onClick={() => copyMessage(m.content, i)}
                      className="hover:text-foreground transition-colors"
                    >
                      {copiedIdx === i ? 'Copied ✓' : 'Copy'}
                    </button>
                  </div>
                </div>
              ) : (
                m.content
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start animate-fade-in">
            <div className="flex items-center gap-2 rounded-2xl rounded-bl-sm border border-border bg-card px-3.5 py-2.5 text-xs text-muted-foreground shadow-sm">
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-foreground" aria-hidden />
              PagePal is thinking…
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input container */}
      <div className="border-t border-border bg-card p-3">
        <label htmlFor="chat-input" className="mb-1.5 block text-xs font-semibold">
          Ask about this page
        </label>
        <div className="flex gap-2">
          <input
            id="chat-input"
            ref={inputRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              if (error) setError('');
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Type a question or select a prompt…"
            disabled={loading}
            className="flex h-9 w-full rounded-xl border border-input bg-background px-3 text-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
            aria-describedby={error ? 'chat-error' : 'chat-hint'}
          />
          <Button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            aria-label="Send"
            className="rounded-xl px-4 text-xs font-bold shadow-hard-sm"
          >
            {loading ? <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" /> : 'Send'}
          </Button>
        </div>
        {error ? (
          <p id="chat-error" className="mt-1.5 text-xs font-medium text-destructive" role="alert">
            {error}
          </p>
        ) : (
          <p id="chat-hint" className="mt-1.5 text-[10px] text-muted-foreground">
            {loading ? 'Generating answer…' : 'Enter to send • Shift+Enter for new line'}
          </p>
        )}
      </div>
    </div>
  );
}
