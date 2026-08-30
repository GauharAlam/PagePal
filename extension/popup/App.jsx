import { useState, useEffect, useCallback, useRef } from 'react';
import Header from './components/Header';
import ContextBar from './components/ContextBar';
import TabBar from './components/TabBar';
import SummaryTab from './components/SummaryTab';
import ChatTab from './components/ChatTab';
import TimelineTab from './components/TimelineTab';
import ToolsTab from './components/ToolsTab';
import ApiKeysTab from './components/ApiKeysTab';
import LoginModal from './components/LoginModal';
import Footer from './components/Footer';
import { supabase, isDemoMode, demoUser, demoSession } from './lib/supabase';

export default function App() {
  const [user, setUser] = useState(null);
  const [userPlan, setUserPlan] = useState(null);
  const [activeTab, setActiveTab] = useState('summary');
  const [loginOpen, setLoginOpen] = useState(false);
  const [pageContext, setPageContext] = useState({ pageType: 'general', title: '', url: '' });
  const [pageContent, setPageContent] = useState('');
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem('pagepal-theme') || 'light'; } catch { return 'light'; }
  });
  const lastSummarizedUrlRef = useRef('');
  const autoSummarizeRef = useRef(null);

  // Persist theme to storage & apply dark class
  useEffect(() => {
    try { localStorage.setItem('pagepal-theme', theme); } catch {}
  }, [theme]);

  // Init auth & page context — demo bypass
  useEffect(() => {
    let sub;
    if (isDemoMode) {
      setUser(demoUser);
      setUserPlan({ plan: 'free', daily_summaries: 0, daily_chats: 0 });
    } else {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setUser(session?.user ?? null);
        if (session?.user) fetchPlan(session.access_token);
      });
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
        if (session?.access_token) fetchPlan(session.access_token);
        else setUserPlan(null);
      });
      sub = subscription;
    }

    // Prefer session, fallback to local (persisted), then tabs.query
    const loadContext = async () => {
      try {
        const tryGet = async (area) => {
          if (!chrome?.storage?.[area]) return null;
          return await chrome.storage[area].get(['pageType', 'tabUrl', 'tabTitle']);
        };
        let result = await tryGet('session');
        if (!result?.tabUrl) result = await tryGet('local');
        if (result?.tabUrl) {
          setPageContext({ pageType: result.pageType || 'general', url: result.tabUrl || '', title: result.tabTitle || 'Current Page' });
          return;
        }
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab?.url) setPageContext({ pageType: detectType(tab.url), url: tab.url, title: tab.title || 'Current Page' });
      } catch {}
    };
    loadContext();
    return () => sub?.unsubscribe();
  }, []);

  function detectType(url) {
    if (!url) return 'general';
    try {
      const u = new URL(url);
      const host = u.hostname.replace(/^www\./, '');
      const path = u.pathname + u.search;
      if ((host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtu.be') && (path.includes('/watch') || host === 'youtu.be' || path.includes('/embed'))) return 'youtube';
      if (u.pathname.toLowerCase().endsWith('.pdf') || u.search.toLowerCase().includes('.pdf')) return 'pdf';
      if (u.pathname.includes('/pdf/')) return 'pdf';
    } catch {}
    if (url.includes('youtube.com/watch') || url.includes('youtu.be/')) return 'youtube';
    if (url.toLowerCase().endsWith('.pdf') || url.toLowerCase().includes('.pdf')) return 'pdf';
    return 'article';
  }

  async function fetchPlan(token) {
    try {
      const res = await fetch(`${import.meta.env.VITE_PROXY_URL}/api/billing/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setUserPlan(await res.json());
    } catch {}
  }

  // Extract page content via content_script messaging (fallback to executeScript)
  async function extractPageContent() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) throw new Error('No active tab');
    // Try messaging content_script first
    try {
      const resp = await chrome.tabs.sendMessage(tab.id, { action: 'getPageContent' });
      if (resp?.content) return resp;
    } catch {}
    // Fallback: inject
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const url = window.location.href;
        const title = document.title;
        if (url.includes('youtube.com/watch')) {
          const videoId = new URLSearchParams(window.location.search).get('v');
          const desc = document.querySelector('#description-inline-expander, #description');
          return { type: 'youtube', videoId, title: title.replace(' - YouTube', '').trim(), content: desc?.innerText?.trim()?.slice(0, 10000) || `YouTube video: ${title}` };
        }
        const selectors = ['article', 'main', '[role="main"]', '.post-content', '.article-content', '.entry-content', '.content', '#content', 'body'];
        let content = '';
        for (const sel of selectors) {
          const el = document.querySelector(sel);
          if (el && el.innerText.length > 200) { content = el.innerText.slice(0, 15000); break; }
        }
        if (!content) content = (document.body.innerText || '').slice(0, 15000);
        return { type: 'article', title, content };
      },
    });
    return results[0]?.result;
  }

  const autoSummarize = useCallback(async () => {
    const url = pageContext.url;
    if (!url || url === lastSummarizedUrlRef.current) return;
    if (!user) return;
    if (autoSummarizeRef.current) return; // prevent concurrent
    autoSummarizeRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const pageData = await extractPageContent();
      if (!pageData?.content) throw new Error('Could not extract page content. Try refreshing the page.');
      setPageContent(pageData.content);
      setPageContext(prev => ({ ...prev, pageType: pageData.type || prev.pageType, title: pageData.title || prev.title }));

      let token = demoSession?.access_token;
      if (!isDemoMode) {
        const { data: { session } } = await supabase.auth.getSession();
        token = session?.access_token;
        if (!token) { setLoading(false); autoSummarizeRef.current = null; return; }
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);
      const res = await fetch(`${import.meta.env.VITE_PROXY_URL}/api/summarize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          content: pageData.content || `YouTube video ID: ${pageData.videoId}`,
          pageType: pageData.type,
          title: pageData.title,
          url,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 429 || data.upgrade) { setError(data); return; }
        throw new Error(data.error || `API ${res.status}`);
      }
      setSummaryData(data);
      lastSummarizedUrlRef.current = url;
      fetchPlan(token);
    } catch (err) {
      console.error('Auto-summarize failed:', err);
      const msg = err.name === 'AbortError' ? 'Request timed out. Try again.' : err.message || 'Failed to summarize';
      setError({ error: msg });
    } finally {
      setLoading(false);
      autoSummarizeRef.current = null;
    }
  }, [pageContext.url, user]);

  // Debounced auto-summarize — stable deps, no loading race
  useEffect(() => {
    if (!user || !pageContext.url) return;
    if (pageContext.url === lastSummarizedUrlRef.current) return;
    const t = setTimeout(() => { autoSummarize(); }, 500);
    return () => clearTimeout(t);
  }, [user, pageContext.url, autoSummarize]);

  function handleQuickAction(action) {
    if (action === 'summarize') {
      setActiveTab('summary');
      if (pageContext.url !== lastSummarizedUrlRef.current) autoSummarize();
    } else if (action === 'qa') setActiveTab('chat');
    else if (action === 'translate' || action === 'export') setActiveTab('tools');
    else if (action === 'keys') setActiveTab('keys');
  }

  return (
    <div className={`${theme === 'dark' ? 'dark' : ''} flex h-[600px] w-[380px] flex-col overflow-hidden bg-background`}>
      <div className="flex h-full w-full flex-col border border-border bg-background text-foreground overflow-hidden">
        <Header
          user={user}
          userPlan={userPlan}
          theme={theme}
          onThemeToggle={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
          onLoginClick={() => setLoginOpen(true)}
          onLogout={async () => { if (!isDemoMode) await supabase.auth.signOut(); setUser(isDemoMode ? demoUser : null); setUserPlan(isDemoMode ? { plan: 'free', daily_summaries: 0, daily_chats: 0 } : null); setSummaryData(null); setError(null); lastSummarizedUrlRef.current=''; }}
        />
        <ContextBar pageType={pageContext.pageType} title={pageContext.title} />
        <TabBar activeTab={activeTab} onChange={setActiveTab} />
        <div className="flex-1 overflow-hidden bg-background">
          <div className={activeTab === 'summary' ? 'h-full' : 'hidden h-full'} id="panel-summary" role="tabpanel" aria-labelledby="tab-summary">
            <SummaryTab data={summaryData} loading={loading} error={error} pageContext={pageContext} onRetry={autoSummarize} />
          </div>
          <div className={activeTab === 'chat' ? 'h-full' : 'hidden h-full'} id="panel-chat" role="tabpanel" aria-labelledby="tab-chat">
            <ChatTab pageContext={{...pageContext, content: pageContent}} summaryData={summaryData} user={user} />
          </div>
          <div className={activeTab === 'timeline' ? 'h-full' : 'hidden h-full'} id="panel-timeline" role="tabpanel" aria-labelledby="tab-timeline">
            <TimelineTab timestamps={summaryData?.timestamps} pageContext={pageContext} />
          </div>
          <div className={activeTab === 'tools' ? 'h-full' : 'hidden h-full'} id="panel-tools" role="tabpanel" aria-labelledby="tab-tools">
            <ToolsTab summaryData={summaryData} pageContext={pageContext} user={user} userPlan={userPlan} rawContent={pageContent} />
          </div>
          <div className={activeTab === 'keys' ? 'h-full' : 'hidden h-full'} id="panel-keys" role="tabpanel" aria-labelledby="tab-keys">
            <ApiKeysTab />
          </div>
        </div>
        <Footer onQuickAction={handleQuickAction} activeTab={activeTab} />
        <LoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} onSuccess={(u) => { setUser(u); setLoginOpen(false); }} />
      </div>
    </div>
  );
}
