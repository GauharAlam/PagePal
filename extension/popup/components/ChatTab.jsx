import { useState, useRef, useEffect } from 'react';
import { supabase, isDemoMode, demoSession } from '../lib/supabase';
import { Button } from './ui/button';
import MarkdownView from './ui/MarkdownView';

const PROMPTS = ['3 key bullets', 'Main arguments?', 'Quiz me', 'Explain simply', 'Key takeaways'];

export default function ChatTab({ pageContext, summaryData, user, onExtractContent, currentModel }) {
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
        const { data } = await supabase
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
  }, [pageContext.url, user, pageContext.pageType]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function getToken() {
    if (isDemoMode) return demoSession.access_token;
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token;
  }

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
      let contextContent = pageContext.content;
      if (!contextContent && typeof onExtractContent === 'function') {
        const extracted = await onExtractContent();
        contextContent = extracted?.content || '';
      }
      if (!contextContent && summaryData) {
        contextContent = JSON.stringify(summaryData);
      }

      const token = await getToken();
      const res = await fetch(`${import.meta.env.VITE_PROXY_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          messages: next.filter((m) => m.role !== 'system').map((m) => ({ role: m.role, content: m.content })),
          context: contextContent || '',
          pageType: pageContext.pageType,
          title: pageContext.title,
          model: currentModel,
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
    <div className="flex h-full flex-col justify-between">
      {/* Messages list (takes 75%+ height) */}
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
            <div
              className={`relative max-w-[88%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-sm ${
                m.role === 'user'
                  ? 'rounded-br-sm bg-foreground text-background font-medium'
                  : 'rounded-bl-sm border border-border/60 bg-card text-foreground'
              }`}
            >
              {m.role === 'assistant' ? (
                <div>
                  <MarkdownView content={m.content} />
                  <div className="mt-1 flex items-center justify-between pt-1 border-t border-border/30 text-[10px] text-muted-foreground">
                    <span>PagePal</span>
                    <button
                      onClick={() => copyMessage(m.content, i)}
                      className="hover:text-foreground transition-colors font-medium"
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

      {/* Floating Input Card with integrated Prompt Chips */}
      <div className="border-t border-border/50 bg-card/60 p-2.5 backdrop-blur-sm">
        {/* Quick prompt chips */}
        <div className="mb-2 flex items-center justify-between gap-1 overflow-x-auto scrollbar-none pb-0.5">
          <div className="flex gap-1.5">
            {PROMPTS.map((p) => (
              <button
                key={p}
                onClick={() => sendMessage(p)}
                disabled={loading}
                className="shrink-0 rounded-full border border-border bg-background px-2.5 py-1 text-[10px] font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50"
              >
                {p}
              </button>
            ))}
          </div>
          {messages.length > 1 && (
            <button
              onClick={handleClearChat}
              className="shrink-0 pl-1 text-[10px] text-muted-foreground hover:text-foreground font-semibold"
              title="Clear chat history"
            >
              Clear
            </button>
          )}
        </div>

        {/* Input box with embedded send button */}
        <div className="relative flex items-center">
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
            placeholder="Ask anything about this page…"
            disabled={loading}
            className="flex h-10 w-full rounded-xl border border-input bg-background pl-3 pr-16 text-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
            aria-describedby={error ? 'chat-error' : undefined}
          />
          <button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            aria-label="Send message"
            className="absolute right-1.5 flex h-7 items-center justify-center rounded-lg bg-primary px-3 text-xs font-black text-black shadow-xs transition-transform hover:translate-y-px disabled:opacity-40"
          >
            {loading ? <span className="h-3 w-3 animate-spin rounded-full border-2 border-black border-t-transparent" /> : 'Send'}
          </button>
        </div>

        {error && (
          <p id="chat-error" className="mt-1 text-center text-[10px] font-semibold text-destructive" role="alert">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
