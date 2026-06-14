import { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const QUICK_PROMPTS = [
  { text: 'Summarize in 3 bullets', icon: '📝' },
  { text: 'What are the main arguments?', icon: '🎯' },
  { text: 'Quiz me on this', icon: '🧩' },
  { text: 'Explain like I\'m 5', icon: '👶' },
  { text: 'What did I miss?', icon: '🔍' },
  { text: 'Key takeaways', icon: '💡' },
];

export default function ChatTab({ pageContext, summaryData, user }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hi! I've analyzed this ${pageContext.pageType}. Ask me anything about it! 🧠`,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage(text = input) {
    if (!text.trim() || loading) return;

    const userMsg = { role: 'user', content: text, timestamp: new Date() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.VITE_PROXY_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          messages: newMessages
            .filter(m => m.role !== 'system')
            .map(m => ({ role: m.role, content: m.content })),
          context: summaryData ? JSON.stringify(summaryData) : '',
          pageType: pageContext.pageType,
          title: pageContext.title
        })
      });

      const data = await res.json();
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.reply || 'I couldn\'t generate a response. Please try again.',
        timestamp: new Date()
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '⚠️ Sorry, something went wrong. Please check your connection and try again.',
        timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Quick Prompts */}
      <div className="flex gap-1.5 px-3 py-2.5 overflow-x-auto border-b border-dark-500/30 no-scrollbar">
        {QUICK_PROMPTS.map(p => (
          <button
            key={p.text}
            onClick={() => sendMessage(p.text)}
            disabled={loading}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[10px] font-medium bg-dark-700 border border-dark-500/50 text-purple-300 hover:bg-dark-600 hover:border-purple-600/50 transition-all whitespace-nowrap shrink-0 btn-hover-lift disabled:opacity-50"
          >
            <span>{p.icon}</span>
            {p.text}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-3">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}
          >
            {msg.role === 'assistant' && (
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-[10px] mr-2 mt-1 shrink-0">
                🧠
              </div>
            )}
            <div className={`max-w-[78%] px-3 py-2.5 rounded-2xl text-[13px] leading-relaxed ${
              msg.role === 'user'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-br-md'
                : 'bg-dark-700 border border-dark-500/50 text-gray-200 rounded-bl-md'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}

        {/* Typing Indicator */}
        {loading && (
          <div className="flex justify-start animate-fade-in">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-[10px] mr-2 mt-1 shrink-0">
              🧠
            </div>
            <div className="bg-dark-700 border border-dark-500/50 px-4 py-3 rounded-2xl rounded-bl-md">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input Bar */}
      <div className="p-3 border-t border-dark-500/30">
        <div className="flex gap-2 items-end">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder="Ask anything about this page..."
              disabled={loading}
              className="w-full bg-dark-700 border border-dark-500/50 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none focus:border-purple-500/70 focus:ring-1 focus:ring-purple-500/20 placeholder-gray-600 transition-all disabled:opacity-50"
            />
          </div>
          <button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white flex items-center justify-center hover:opacity-85 transition-all btn-hover-lift disabled:opacity-40 disabled:hover:transform-none glow-purple"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 2L11 13" />
              <path d="M22 2L15 22L11 13L2 9L22 2Z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
